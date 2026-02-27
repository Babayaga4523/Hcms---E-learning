import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    BarChart3, Users, Award, TrendingUp, Download, RefreshCw,
    Calendar, Search, CheckCircle, AlertCircle, Clock, Zap,
    BookOpen, Target, Activity, PieChart as PieIcon, LineChart as LineIcon,
    ArrowUp, ArrowDown, Eye, Filter, X, Printer, Share2
} from 'lucide-react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, Area, AreaChart, ScatterChart, Scatter, ComposedChart
} from 'recharts';
import axios from 'axios';

const ComprehensiveAdminReports = ({
    stats = {},
    moduleStats = [],
    learnerProgress = [],
    examPerformance = [],
    questionPerformance = [],
    trendData = [],
    usersByDepartment = [],
    usersByStatus = [],
    topPerformers = [],
    strugglers = [],
    lastWeekEnrollments = 0,
    lastWeekCompletions = 0,
    departments = []
}) => {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [filters, setFilters] = useState({
        search: '',
        department: 'all',
        status: 'all'
    });
    const [expandedSections, setExpandedSections] = useState({
        overview: true,
        programs: true,
        learners: true,
        assessment: true
    });

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleExport = async () => {
        try {
            // Get CSRF token from meta tag
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            
            // Create a form for secure POST submission
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/api/admin/reports/export';
            form.style.display = 'none';
            
            // Add CSRF token
            const tokenInput = document.createElement('input');
            tokenInput.type = 'hidden';
            tokenInput.name = '_token';
            tokenInput.value = csrfToken || '';
            form.appendChild(tokenInput);
            
            // Add format parameter
            const formatInput = document.createElement('input');
            formatInput.type = 'hidden';
            formatInput.name = 'format';
            formatInput.value = 'excel';
            form.appendChild(formatInput);
            
            document.body.appendChild(form);
            form.submit();
            setTimeout(() => document.body.removeChild(form), 100);
        } catch (error) {
            console.error('Export error:', error);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // ===== STAT CARD COMPONENT =====
    const StatCard = ({ icon: Icon, title, value, subtitle, color = 'bg-blue-600', trend = null, comparison = null }) => (
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">{title}</p>
                    <p className="text-4xl font-bold text-gray-900 mt-3">{value}</p>
                    {subtitle && <p className="text-xs text-gray-400 mt-2">{subtitle}</p>}
                    {trend && (
                        <div className="flex items-center gap-2 mt-3">
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${trend > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {trend > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                                <span className="text-xs font-semibold">{Math.abs(trend)}%</span>
                            </div>
                            {comparison && <span className="text-xs text-gray-500">{comparison}</span>}
                        </div>
                    )}
                </div>
                <div className={`p-4 rounded-lg ${color} text-white group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );

    const TableHeader = ({ columns }) => (
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
            <tr>
                {columns.map((col) => (
                    <th key={col} className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        {col}
                    </th>
                ))}
            </tr>
        </thead>
    );

    // ===== ADVANCED CUSTOM TOOLTIP =====
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-900 text-white p-4 rounded-lg shadow-xl border border-gray-700">
                    <p className="font-semibold">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }} className="text-sm">
                            {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    // ===== SECTION: EMPLOYEE/LEARNER DATA =====
    const renderLearnerData = () => (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="px-6 py-5 border-b bg-gradient-to-r from-blue-50 to-blue-100 flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">Data Karyawan & Pembelajaran</h3>
                <span className="ml-auto text-sm text-gray-600">{learnerProgress.length} Karyawan</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <TableHeader columns={['No', 'Nama', 'Departemen', 'Status', 'Program Selesai', 'Progress', 'Terakhir Aktif']} />
                    <tbody className="divide-y">
                        {learnerProgress.slice(0, 15).map((learner, idx) => (
                            <tr key={idx} className="hover:bg-blue-50 transition-colors">
                                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{idx + 1}</td>
                                <td className="px-6 py-4 text-sm font-semibold text-gray-900">{learner.learner_name || learner.name || '-'}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{learner.department || '-'}</td>
                                <td className="px-6 py-4 text-sm">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        learner.status === 'completed' ? 'bg-green-100 text-green-700' :
                                        learner.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                        'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {learner.status === 'completed' ? '✓ Selesai' : learner.status === 'in_progress' ? '⟳ Berlangsung' : '⋯ Pending'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-gray-900">{learner.modules_completed || 0}/{learner.modules_enrolled || 0}</td>
                                <td className="px-6 py-4 text-sm">
                                    <div className="flex items-center gap-2 w-32">
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                                                style={{ width: `${learner.completion_percentage || 0}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-gray-700">{learner.completion_percentage || 0}%</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">{learner.last_activity || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {learnerProgress.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Tidak ada data pembelajaran</p>
                </div>
            )}
        </div>
    );

    // ===== SECTION: PROGRAM/MODULE ANALYSIS =====
    const renderProgramStats = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Program List dengan Progress */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-6">
                    <BookOpen className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-bold text-gray-900">Analisis Program/Modul</h3>
                    <span className="ml-auto text-sm text-gray-600">{moduleStats.length} Program</span>
                </div>
                <div className="space-y-4">
                    {moduleStats.slice(0, 10).map((prog, idx) => (
                        <div key={idx} className="border-b pb-4 last:border-b-0 hover:bg-gray-50 p-3 rounded-lg transition-colors">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-900 text-sm">{idx + 1}. {prog.title || prog.name}</h4>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {prog.completed || 0} selesai dari {prog.total_enrolled || 0} peserta
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-lg font-bold text-green-600">{prog.completion_rate || 0}%</span>
                                    <p className="text-xs text-gray-500">Tingkat Penyelesaian</p>
                                </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                                    style={{ width: `${prog.completion_rate || 0}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-2">
                                <span>⟳ {prog.in_progress || 0} Berlangsung</span>
                                <span>⋯ {prog.pending || 0} Pending</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Program Distribution Pie Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-6">
                    <PieIcon className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-bold text-gray-900">Distribusi Peserta</h3>
                </div>
                {moduleStats.length > 0 ? (
                    <div style={{ width: '100%', height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                            <Pie
                                data={moduleStats.slice(0, 8)}
                                dataKey="total_enrolled"
                                nameKey="title"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label={({ name, value }) => `${name.substring(0, 10)}: ${value}`}
                            >
                                {moduleStats.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'][index % 8]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value} peserta`} />
                        </PieChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-300 flex items-center justify-center text-gray-500">
                        <p>Tidak ada data program</p>
                    </div>
                )}
            </div>
        </div>
    );

    // ===== SECTION: EXAM & ASSESSMENT PERFORMANCE =====
    const renderAssessmentData = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-6">
                    <Award className="w-5 h-5 text-yellow-600" />
                    <h3 className="text-lg font-bold text-gray-900">Top Performers (Terbaik)</h3>
                </div>
                <div className="space-y-3">
                    {topPerformers.slice(0, 10).map((performer, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 hover:bg-yellow-50 rounded-lg transition-colors border-b last:border-b-0">
                            <div>
                                <p className="font-semibold text-gray-900">{idx + 1}. {performer.name}</p>
                                <p className="text-xs text-gray-500">{performer.department}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-bold text-yellow-600">{performer.completion_rate || 0}%</div>
                                <p className="text-xs text-gray-500">{performer.completed || 0} selesai</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Strugglers - Memerlukan Perhatian */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-6">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <h3 className="text-lg font-bold text-gray-900">Memerlukan Perhatian</h3>
                </div>
                <div className="space-y-3">
                    {strugglers.slice(0, 10).map((learner, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 hover:bg-red-50 rounded-lg transition-colors border-b last:border-b-0">
                            <div>
                                <p className="font-semibold text-gray-900">{idx + 1}. {learner.name}</p>
                                <p className="text-xs text-gray-500">{learner.department}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-bold text-red-600">{learner.completion_rate || 0}%</div>
                                <p className="text-xs text-gray-500">{learner.completed || 0}/{learner.total_modules || 0}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    // ===== SECTION: EXAM SCORES & QUESTION ANALYSIS =====
    const renderExamScores = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Exam Performance by Employee */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="px-6 py-5 border-b bg-gradient-to-r from-purple-50 to-purple-100 flex items-center gap-3">
                    <Target className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-bold text-gray-900">Nilai Ujian Karyawan</h3>
                    <span className="ml-auto text-sm text-gray-600">{examPerformance.length} Data</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <TableHeader columns={['Nama', 'Rata-rata', 'Tertinggi', 'Terendah', 'Percobaan']} />
                        <tbody className="divide-y">
                            {examPerformance.slice(0, 10).map((exam, idx) => (
                                <tr key={idx} className="hover:bg-purple-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{exam.name}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-purple-600">{exam.avg_score || 0}</td>
                                    <td className="px-6 py-4 text-sm text-green-600 font-semibold">{exam.highest_score || 0}</td>
                                    <td className="px-6 py-4 text-sm text-red-600 font-semibold">{exam.lowest_score || 0}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{exam.total_attempts || 0}x</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Question Difficulty Analysis */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-6">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-bold text-gray-900">Analisis Pertanyaan</h3>
                </div>
                {questionPerformance.length > 0 ? (
                    <div style={{ width: '100%', height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={questionPerformance.slice(0, 8)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="question" width={50} tick={{ fontSize: 11 }} />
                                <YAxis />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="correct" stackId="a" fill="#10b981" name="Benar" />
                                <Bar dataKey="incorrect" stackId="a" fill="#ef4444" name="Salah" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-300 flex items-center justify-center text-gray-500">
                        <p>Tidak ada data pertanyaan</p>
                    </div>
                )}
            </div>
        </div>
    );

    // ===== SECTION: TRENDS & ANALYTICS =====
    const renderTrends = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enrollment & Completion Trends */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-6">
                    <LineIcon className="w-5 h-5 text-cyan-600" />
                    <h3 className="text-lg font-bold text-gray-900">Tren Pembelajaran</h3>
                </div>
                {trendData.length > 0 ? (
                    <div style={{ width: '100%', height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                            <defs>
                                <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="name" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Area type="monotone" dataKey="completion" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCompletion)" name="Penyelesaian" />
                            <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" name="Skor Rata-rata" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-300 flex items-center justify-center text-gray-500">
                        <p>Tidak ada data tren</p>
                    </div>
                )}
            </div>

            {/* Department Statistics */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-6">
                    <Users className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-bold text-gray-900">Statistik Departemen</h3>
                </div>
                {usersByDepartment.length > 0 ? (
                    <div style={{ width: '100%', height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={usersByDepartment.slice(0, 8)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="name" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" fill="#f59e0b" name="Jumlah Karyawan" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-300 flex items-center justify-center text-gray-500">
                        <p>Tidak ada data departemen</p>
                    </div>
                )}
            </div>
        </div>
    );

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex flex-col items-center justify-center min-h-screen">
                    <div className="animate-spin mb-4">
                        <Zap className="w-12 h-12 text-blue-600" />
                    </div>
                    <p className="text-gray-600 font-medium">Memuat data laporan...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
                {/* ===== HEADER SECTION ===== */}
                <div className="mb-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900">📊 Laporan Komprehensif E-Learning</h1>
                            <p className="text-gray-600 mt-2">Analisis lengkap data pembelajaran, karyawan, dan performa program</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition border border-gray-300 font-medium"
                            >
                                <Printer className="w-5 h-5" />
                                Cetak
                            </button>
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition font-medium shadow-lg"
                            >
                                <Download className="w-5 h-5" />
                                Export Excel
                            </button>
                        </div>
                    </div>

                    {/* ===== KEY STATISTICS CARDS ===== */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <StatCard
                            icon={Users}
                            title="Total Karyawan"
                            value={stats?.total_users || 0}
                            color="bg-blue-600"
                            subtitle={`Aktif: ${stats?.active_users || 0}`}
                        />
                        <StatCard
                            icon={BookOpen}
                            title="Program Aktif"
                            value={stats?.total_modules || 0}
                            color="bg-green-600"
                            subtitle={`${stats?.active_modules || 0} aktif`}
                        />
                        <StatCard
                            icon={CheckCircle}
                            title="Training Selesai"
                            value={stats?.completed_assignments || 0}
                            color="bg-emerald-600"
                            subtitle={`Dari ${stats?.total_assignments || 0}`}
                        />
                        <StatCard
                            icon={Clock}
                            title="Sedang Berlangsung"
                            value={stats?.in_progress_assignments || 0}
                            color="bg-yellow-600"
                            subtitle={`Minggu ini: ${lastWeekCompletions || 0}`}
                        />
                        <StatCard
                            icon={TrendingUp}
                            title="Tingkat Penyelesaian"
                            value={`${stats?.avg_completion || 0}%`}
                            color="bg-purple-600"
                            subtitle={`Skor Ujian: ${stats?.avg_exam_score || 0}`}
                        />
                    </div>
                </div>

                {/* ===== FILTER SECTION ===== */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 min-w-64">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <Search className="w-4 h-4 inline mr-2" />Cari Nama/Email
                            </label>
                            <input
                                type="text"
                                placeholder="Cari karyawan..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex-1 min-w-48">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <Filter className="w-4 h-4 inline mr-2" />Departemen
                            </label>
                            <select
                                value={filters.department}
                                onChange={(e) => handleFilterChange('department', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">Semua Departemen</option>
                                {departments?.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 min-w-48">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">Semua Status</option>
                                <option value="active">Aktif</option>
                                <option value="inactive">Tidak Aktif</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* ===== TAB NAVIGATION ===== */}
                <div className="flex gap-2 mb-8 bg-white rounded-lg p-2 border border-gray-200 shadow-sm overflow-x-auto">
                    {[
                        { id: 'overview', label: '📈 Overview', icon: '📊' },
                        { id: 'programs', label: '📚 Program & Modul', icon: '📖' },
                        { id: 'learners', label: '👥 Karyawan & Pembelajaran', icon: '🎓' },
                        { id: 'assessment', label: '🎯 Penilaian', icon: '✅' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                                    : 'bg-transparent text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ===== CONTENT SECTIONS ===== */}
                <div className="space-y-8">
                    {/* TAB 1: OVERVIEW */}
                    {activeTab === 'overview' && (
                        <>
                            {renderTrends()}
                        </>
                    )}

                    {/* TAB 2: PROGRAMS */}
                    {activeTab === 'programs' && (
                        <>
                            {renderProgramStats()}
                        </>
                    )}

                    {/* TAB 3: LEARNERS */}
                    {activeTab === 'learners' && (
                        <>
                            {renderLearnerData()}
                            <div className="mt-8">
                                {renderAssessmentData()}
                            </div>
                        </>
                    )}

                    {/* TAB 4: ASSESSMENT */}
                    {activeTab === 'assessment' && (
                        <>
                            {renderExamScores()}
                        </>
                    )}
                </div>

                {/* ===== FOOTER ===== */}
                <div className="mt-12 p-6 bg-white rounded-xl border border-gray-200 text-center text-gray-600 text-sm">
                    <p>✓ Laporan diperbarui secara real-time • Data dari database {new Date().toLocaleDateString('id-ID')}</p>
                </div>
            </div>
        </AdminLayout>
    );
};

export default ComprehensiveAdminReports;
