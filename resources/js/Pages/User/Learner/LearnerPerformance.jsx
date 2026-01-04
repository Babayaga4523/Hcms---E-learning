import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { 
    TrendingUp, 
    BarChart3, 
    Award, 
    Clock, 
    Target,
    Activity,
    Filter,
    Download,
    ArrowUpRight,
    ArrowDownRight,
    Medal,
    Zap
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function LearnerPerformance() {
    const { auth } = usePage().props;
    const user = auth.user;
    const [loading, setLoading] = useState(true);
    const [performanceData, setPerformanceData] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState('all');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchPerformanceData();
    }, [selectedPeriod, filter]);

    const fetchPerformanceData = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `/api/learner/performance?period=${selectedPeriod}&filter=${filter}`,
                {
                    headers: {
                        'Accept': 'application/json',
                    },
                }
            );
            const data = await response.json();
            setPerformanceData(data);
        } catch (error) {
            console.error('Error fetching performance data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AppLayout user={user}>
                <Head title="Performa Pembelajaran" />
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </AppLayout>
        );
    }

    const data = performanceData || {};

    // Mock data for demonstration
    const scoresTrendData = data.scoresTrend || [
        { month: 'Jan', score: 75, target: 80 },
        { month: 'Feb', score: 78, target: 80 },
        { month: 'Mar', score: 82, target: 80 },
        { month: 'Apr', score: 85, target: 80 },
        { month: 'May', score: 88, target: 80 },
        { month: 'Jun', score: 90, target: 80 },
    ];

    const performanceByProgram = data.performanceByProgram || [
        { name: 'Program A', score: 92, completion: 100 },
        { name: 'Program B', score: 88, completion: 85 },
        { name: 'Program C', score: 85, completion: 90 },
        { name: 'Program D', score: 78, completion: 70 },
        { name: 'Program E', score: 95, completion: 100 },
    ];

    const engagementData = data.engagement || [
        { name: 'Sangat Aktif', value: 45 },
        { name: 'Aktif', value: 30 },
        { name: 'Cukup Aktif', value: 20 },
        { name: 'Kurang Aktif', value: 5 },
    ];

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

    const averageScore = data.averageScore || 86;
    const completionRate = data.completionRate || 87;
    const certifications = data.certifications || 5;
    const hoursSpent = data.hoursSpent || 142;
    const totalPrograms = data.totalPrograms || 12;
    const activitiesThisWeek = data.activitiesThisWeek || 24;

    // Calculate trend
    const scoreChange = data.scoreChange || 5;
    const completionChange = data.completionChange || 8;

    // Export report function
    const handleExportReport = () => {
        // Create CSV content
        const csvContent = [
            ['Metrik', 'Nilai'],
            ['Rata-rata Skor', `${averageScore}%`],
            ['Tingkat Penyelesaian', `${completionRate}%`],
            ['Sertifikasi Diperoleh', certifications],
            ['Waktu Pembelajaran (jam)', hoursSpent],
            ['Total Program', totalPrograms],
            ['Aktivitas Minggu Ini', activitiesThisWeek],
            [''],
            ['Program', 'Skor', 'Penyelesaian %'],
            ...performanceByProgram.map(p => [p.name, p.score, p.completion])
        ].map(row => row.join(',')).join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `laporan-performa-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AppLayout user={user}>
            <Head title="Performa Pembelajaran" />

            <div className="space-y-6">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-8 rounded-lg shadow-lg text-white">
                    <h1 className="text-3xl font-bold mb-2">Dashboard Performa Pembelajaran</h1>
                    <p className="text-indigo-100">Pantau progres dan performa pembelajaran Anda secara real-time</p>
                </div>

                {/* Filter Section */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex gap-2">
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">Semua Waktu</option>
                            <option value="month">Bulan Ini</option>
                            <option value="quarter">Kuartal Ini</option>
                            <option value="year">Tahun Ini</option>
                        </select>

                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">Semua Program</option>
                            <option value="completed">Selesai</option>
                            <option value="in-progress">Sedang Berlangsung</option>
                            <option value="certified">Tersertifikasi</option>
                        </select>
                    </div>

                    <button 
                        onClick={handleExportReport}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                        <Download size={18} />
                        Ekspor Laporan
                    </button>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Average Score */}
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Rata-rata Skor</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-2">{averageScore}%</h3>
                                <p className="text-sm text-gray-500 mt-1">Dari semua program</p>
                            </div>
                            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${scoreChange >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {scoreChange >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                {Math.abs(scoreChange)}%
                            </div>
                        </div>
                    </div>

                    {/* Completion Rate */}
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Tingkat Penyelesaian</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-2">{completionRate}%</h3>
                                <p className="text-sm text-gray-500 mt-1">Program selesai</p>
                            </div>
                            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${completionChange >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {completionChange >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                {Math.abs(completionChange)}%
                            </div>
                        </div>
                    </div>

                    {/* Certifications */}
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-yellow-500">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Sertifikasi Diperoleh</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-2">{certifications}</h3>
                                <p className="text-sm text-gray-500 mt-1">Sertifikat aktif</p>
                            </div>
                            <div className="bg-yellow-100 text-yellow-600 p-3 rounded-lg">
                                <Medal size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Time Spent */}
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Waktu Pembelajaran</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-2">{hoursSpent}h</h3>
                                <p className="text-sm text-gray-500 mt-1">Total jam</p>
                            </div>
                            <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
                                <Clock size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Score Trend Chart */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <TrendingUp size={20} className="text-indigo-600" />
                            Tren Skor Pembelajaran
                        </h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={scoresTrendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis domain={[0, 100]} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} name="Skor Anda" />
                                <Line type="monotone" dataKey="target" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name="Target" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Program Performance */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <BarChart3 size={20} className="text-indigo-600" />
                            Performa per Program
                        </h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={performanceByProgram}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis domain={[0, 100]} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="score" fill="#3b82f6" name="Skor" />
                                <Bar dataKey="completion" fill="#10b981" name="Penyelesaian %" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Engagement and Programs Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Engagement Level */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Zap size={20} className="text-indigo-600" />
                            Level Keterlibatan
                        </h2>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={engagementData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {engagementData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Statistics Summary */}
                    <div className="bg-white rounded-lg shadow-lg p-6 col-span-2">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Activity size={20} className="text-indigo-600" />
                            Ringkasan Statistik
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-4 border-b">
                                <div>
                                    <p className="text-gray-600 text-sm">Total Program</p>
                                    <p className="text-2xl font-bold text-gray-900">{totalPrograms}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">Tercatat</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pb-4 border-b">
                                <div>
                                    <p className="text-gray-600 text-sm">Aktivitas Minggu Ini</p>
                                    <p className="text-2xl font-bold text-gray-900">{activitiesThisWeek}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">Aksi pembelajaran</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Rating Rata-rata</p>
                                    <p className="text-2xl font-bold text-gray-900 flex items-center gap-1">
                                        4.5 <span className="text-lg">⭐</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">Dari kursus</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Activity size={20} className="text-indigo-600" />
                        Aktivitas Terbaru
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 pb-4 border-b">
                            <div className="bg-green-100 text-green-600 p-3 rounded-lg">
                                <Target size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900">Menyelesaikan Program "Advanced Analytics"</p>
                                <p className="text-sm text-gray-500">2 jam yang lalu</p>
                            </div>
                            <span className="text-green-600 font-semibold">+10 poin</span>
                        </div>

                        <div className="flex items-center gap-4 pb-4 border-b">
                            <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
                                <Award size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900">Mendapatkan Sertifikat "Data Analysis"</p>
                                <p className="text-sm text-gray-500">1 hari yang lalu</p>
                            </div>
                            <span className="text-blue-600 font-semibold">Sertifikat</span>
                        </div>

                        <div className="flex items-center gap-4 pb-4 border-b">
                            <div className="bg-yellow-100 text-yellow-600 p-3 rounded-lg">
                                <TrendingUp size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900">Meningkat ke Pencapaian "Learner Pro"</p>
                                <p className="text-sm text-gray-500">3 hari yang lalu</p>
                            </div>
                            <span className="text-yellow-600 font-semibold">Pencapaian</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
                                <Clock size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900">Menghabiskan 10 jam pembelajaran</p>
                                <p className="text-sm text-gray-500">1 minggu yang lalu</p>
                            </div>
                            <span className="text-purple-600 font-semibold">+50 jam</span>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
