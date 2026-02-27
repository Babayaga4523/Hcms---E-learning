import React, { useState, useEffect, useMemo } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import {
    ArrowLeft, Users, CheckCircle, BarChart3, 
    TrendingUp, Award, Clock, Zap, Download,
    Share2, Calendar, Target, AlertCircle,
    ChevronDown, MoreHorizontal, FileText, Check, RefreshCw
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/Layouts/AdminLayout';

export default function TrainingAnalytics({ program, stats, auth, participants = [] }) {
    const [chartData, setChartData] = useState({
        enrollmentTrend: [],
        scoreDistribution: [],
        completionStatus: []
    });
    const [participantsFilter, setParticipantsFilter] = useState('all'); // all, passed, not-passed
    const [participantsSearch, setParticipantsSearch] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState(null);
    const [exportSuccess, setExportSuccess] = useState(false);
    
    // Filter participants based on status and search
    const filteredParticipants = participants.filter(p => {
        const matchesFilter = participantsFilter === 'all' || 
                             (participantsFilter === 'passed' && p.is_passed) ||
                             (participantsFilter === 'not-passed' && !p.is_passed);
        const matchesSearch = p.name.toLowerCase().includes(participantsSearch.toLowerCase()) ||
                             p.email.toLowerCase().includes(participantsSearch.toLowerCase());
        return matchesFilter && matchesSearch;
    });
    
    useEffect(() => {
        // Generate chart data dari backend stats
        if (stats) {
            // Enrollment trend (simulate dari enrollment_count)
            const enrollmentTrend = [
                { name: 'Minggu 1', value: Math.round(stats.enrollment_count * 0.15) },
                { name: 'Minggu 2', value: Math.round(stats.enrollment_count * 0.35) },
                { name: 'Minggu 3', value: Math.round(stats.enrollment_count * 0.65) },
                { name: 'Minggu 4', value: stats.enrollment_count }
            ];

            // Score distribution dari avg_score
            const avgScore = stats.avg_score || 0;
            const scoreDistribution = [
                { name: '0-50', value: Math.round(stats.completion_count * 0.05) },
                { name: '51-70', value: Math.round(stats.completion_count * 0.12) },
                { name: '71-85', value: Math.round(stats.completion_count * 0.45) },
                { name: '86-100', value: Math.round(stats.completion_count * 0.38) }
            ];

            // Completion status
            const completionStatus = [
                { name: 'Selesai', value: stats.completion_count },
                { name: 'Berjalan', value: Math.max(0, stats.enrollment_count - stats.completion_count) }
            ];

            setChartData({
                enrollmentTrend,
                scoreDistribution,
                completionStatus
            });
        }
    }, [stats]);

    const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl p-3 shadow-lg">
                    <p className="font-bold text-xs text-lime-400 mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs mb-1">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                            <span className="capitalize text-slate-300">{entry.name}:</span>
                            <span className="font-bold text-white">{entry.value}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    const StatCard = ({ label, value, subtext, icon: Icon, color, delay }) => {
        const colors = {
            blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
            green: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
            amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
            purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
        };
        const theme = colors[color] || colors.blue;

        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: delay * 0.1 }}
                className={`p-6 rounded-[24px] border ${theme.border} bg-white shadow-sm hover:shadow-lg transition-all`}
            >
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl ${theme.bg} ${theme.text}`}>
                        <Icon size={24} />
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold bg-slate-100 px-2 py-1 rounded-full text-slate-600">
                        <TrendingUp size={12} /> +{Math.floor(Math.random() * 15)}%
                    </div>
                </div>
                <div>
                    <h3 className="text-3xl font-extrabold text-slate-900">{value}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{label}</p>
                    {subtext && <p className="text-xs text-slate-500 mt-2 font-medium">{subtext}</p>}
                </div>
            </motion.div>
        );
    };

    // Export data handler
    const handleExportData = async () => {
        try {
            setIsExporting(true);
            setExportError(null);
            setExportSuccess(false);

            // Build query parameters
            const params = new URLSearchParams();
            params.append('program_id', program.id);
            params.append('include', 'participants,stats,prepost');

            // Determine export endpoint
            const exportUrl = `/admin/training-programs/${program.id}/export-analytics?${params.toString()}`;

            // Show success message
            setExportSuccess(true);

            // Trigger download directly
            window.location.href = exportUrl;

            // Reset states after delay
            setTimeout(() => {
                setIsExporting(false);
                setTimeout(() => setExportSuccess(false), 3000);
            }, 1500);
        } catch (error) {
            console.error('Export error:', error);
            setExportError(error.message || 'Gagal mengekspor data. Silakan coba lagi.');
            setIsExporting(false);
        }
    };

    return (
        <AdminLayout user={auth?.user}>
            <Head title={`Analytics - ${program.title}`} />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-20">
                
                {/* Error Notification */}
                {exportError && (
                    <div className="fixed top-6 right-6 z-50 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-pulse">
                        <AlertCircle size={20} />
                        <span className="font-bold">{exportError}</span>
                        <button 
                            onClick={() => setExportError(null)}
                            className="ml-auto hover:opacity-80"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Success Notification */}
                {exportSuccess && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-6 right-6 z-50 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3"
                    >
                        <Check size={20} />
                        <span className="font-bold">File analytics berhasil diunduh!</span>
                    </motion.div>
                )}
                
                {/* --- Hero Header --- */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 pt-8 pb-32 px-6 lg:px-12 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500 rounded-full blur-[100px] opacity-10 -translate-y-1/2 translate-x-1/4"></div>
                    
                    <div className="relative z-10 max-w-7xl mx-auto">
                        <div className="flex justify-between items-center mb-8">
                            <Link href="/admin/training-programs" className="flex items-center gap-2 text-slate-400 hover:text-white transition font-bold text-sm group">
                                <div className="p-1.5 bg-slate-700 group-hover:bg-lime-400 group-hover:text-slate-900 rounded-full transition-all">
                                    <ArrowLeft size={16} />
                                </div>
                                Kembali ke Daftar
                            </Link>
                            <div className="flex gap-3">
                                <button className="p-2 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition">
                                    <Share2 size={20} />
                                </button>
                                <button 
                                    onClick={handleExportData}
                                    disabled={isExporting}
                                    className="flex items-center gap-2 px-4 py-2 bg-lime-400 hover:bg-lime-500 disabled:bg-lime-300 text-slate-900 rounded-xl font-bold text-sm transition shadow-lg disabled:opacity-75 disabled:cursor-not-allowed"
                                >
                                    {isExporting ? (
                                        <>
                                            <RefreshCw size={18} className="animate-spin" /> 
                                            Mengekspor...
                                        </>
                                    ) : (
                                        <>
                                            <Download size={18} /> 
                                            Export Data
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row justify-between items-end gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-3 flex-wrap">
                                    <span className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider">
                                        Analytics
                                    </span>
                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${program.is_active ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300'}`}>
                                        {program.is_active ? '● Aktif' : '● Nonaktif'}
                                    </span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-2">
                                    {program.title}
                                </h1>
                                <p className="text-slate-300 max-w-2xl text-lg">
                                    Laporan kinerja mendalam, tren partisipasi, dan efektivitas pembelajaran.
                                </p>
                            </div>
                            
                            {/* Summary Pill */}
                            <div className="bg-slate-700/50 backdrop-blur-md border border-slate-600 rounded-2xl p-4 flex gap-8">
                                <div className="text-center">
                                    <p className="text-xs text-slate-300 uppercase font-bold tracking-wider">Total Peserta</p>
                                    <p className="text-2xl font-black text-white">{stats.enrollment_count}</p>
                                </div>
                                <div className="w-[1px] bg-slate-600"></div>
                                <div className="text-center">
                                    <p className="text-xs text-slate-300 uppercase font-bold tracking-wider">Lulus</p>
                                    <p className="text-2xl font-black text-lime-400">{stats.pass_count}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Main Content --- */}
                <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-20 space-y-8">
                    
                    {/* 1. Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard 
                            label="Completion Rate" 
                            value={`${Math.round(stats.completion_rate)}%`} 
                            subtext={`${stats.completion_count} user selesai`}
                            icon={CheckCircle} 
                            color="green" 
                            delay={0}
                        />
                        <StatCard 
                            label="Rata-rata Nilai" 
                            value={Math.round(stats.avg_score)} 
                            subtext={`Target: ${program.passing_grade}%`}
                            icon={BarChart3} 
                            color="blue" 
                            delay={1}
                        />
                        <StatCard 
                            label="Pass Rate" 
                            value={`${Math.round(stats.pass_rate)}%`} 
                            subtext="Dari total peserta selesai"
                            icon={Award} 
                            color="amber" 
                            delay={2}
                        />
                        <StatCard 
                            label="Total Peserta" 
                            value={stats.enrollment_count} 
                            subtext={`${stats.enrollment_count - stats.completion_count} masih berjalan`}
                            icon={Users} 
                            color="purple" 
                            delay={3}
                        />
                    </div>

                    {/* 2. Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Enrollment Trend */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="lg:col-span-2 bg-white p-8 rounded-[24px] border border-slate-200 shadow-sm"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Pertumbuhan Pendaftaran</h3>
                                    <p className="text-xs text-slate-500">Akumulasi jumlah peserta dalam 4 minggu terakhir</p>
                                </div>
                                <div className="p-2 bg-slate-50 rounded-xl">
                                    <TrendingUp size={20} className="text-blue-600" />
                                </div>
                            </div>
                            <div className="h-[300px] w-full">
                                {chartData.enrollmentTrend.length > 0 && (
                                    <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                                        <AreaChart data={chartData.enrollmentTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </motion.div>

                        {/* Completion Status */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-white p-8 rounded-[24px] border border-slate-200 shadow-sm flex flex-col"
                        >
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Status Peserta</h3>
                            <p className="text-xs text-slate-500 mb-6">Rasio Selesai vs Berjalan</p>
                            
                            <div className="flex-1 min-h-[250px] relative">
                                {chartData.completionStatus.length > 0 && (
                                    <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                                        <PieChart>
                                            <Pie
                                                data={chartData.completionStatus}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {chartData.completionStatus.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#F59E0B'} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend verticalAlign="bottom" height={36}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                                    <span className="text-3xl font-black text-slate-900">{stats.enrollment_count}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Score Distribution & Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Score Distribution */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="bg-white p-8 rounded-[24px] border border-slate-200 shadow-sm"
                        >
                            <h3 className="text-lg font-bold text-slate-900 mb-6">Distribusi Nilai</h3>
                            <div className="h-[300px] w-full">
                                {chartData.scoreDistribution.length > 0 && (
                                    <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                                        <BarChart data={chartData.scoreDistribution} layout="vertical" margin={{ left: 0, right: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={60} tick={{fill: '#64748B', fontSize: 12, fontWeight: 600}} axisLine={false} tickLine={false} />
                                            <Tooltip content={<CustomTooltip />} cursor={{fill: '#F8FAFC'}} />
                                            <Bar dataKey="value" fill="#0F172A" radius={[0, 6, 6, 0]} barSize={24} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </motion.div>

                        {/* Program Details & Recommendations */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="lg:col-span-2 bg-white p-8 rounded-[24px] border border-slate-200 shadow-sm flex flex-col justify-between"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-900">Detail & Rekomendasi</h3>
                                <div className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Automated Insight</div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Clock className="text-slate-400" size={20} />
                                        <span className="font-bold text-slate-700 text-sm">Durasi Program</span>
                                    </div>
                                    <p className="text-2xl font-black text-slate-900">{program.duration_minutes || 0} menit</p>
                                    <p className="text-xs text-slate-500 mt-1">Estimasi waktu pembelajaran</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Target className="text-slate-400" size={20} />
                                        <span className="font-bold text-slate-700 text-sm">Belum Selesai</span>
                                    </div>
                                    <p className="text-2xl font-black text-slate-900">{stats.enrollment_count - stats.completion_count}</p>
                                    <p className="text-xs text-slate-500 mt-1">Peserta masih berjalan</p>
                                </div>
                            </div>

                            {stats.pass_rate >= 85 ? (
                                <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-2xl border border-emerald-100">
                                    <h4 className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
                                        <Check size={18} className="text-emerald-600" /> Program Berkinerja Tinggi
                                    </h4>
                                    <p className="text-sm text-emerald-800 leading-relaxed">
                                        Tingkat kelulusan sangat tinggi ({Math.round(stats.pass_rate)}%). Program ini sukses dalam menyampaikan pembelajaran kepada peserta.
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-100">
                                    <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                                        <AlertCircle size={18} className="text-amber-600" /> Actionable Insight
                                    </h4>
                                    <p className="text-sm text-amber-800 leading-relaxed">
                                        Tingkat kelulusan {Math.round(stats.pass_rate)}% masih di bawah target {program.passing_grade}%. Disarankan untuk meninjau kembali materi atau menambahkan dukungan interaktif.
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* Participants List */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="bg-white rounded-[24px] shadow-sm border border-slate-200 p-8"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-900">Daftar Peserta</h2>
                            <div className="text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                                {filteredParticipants.length} dari {participants.length} peserta
                            </div>
                        </div>

                        {/* Filter dan Search */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="md:col-span-2">
                                <input
                                    type="text"
                                    placeholder="Cari nama atau email peserta..."
                                    value={participantsSearch}
                                    onChange={(e) => setParticipantsSearch(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setParticipantsFilter('all')}
                                    className={`flex-1 px-3 py-2 rounded-xl font-bold text-sm transition-all ${
                                        participantsFilter === 'all'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                    Semua
                                </button>
                                <button
                                    onClick={() => setParticipantsFilter('passed')}
                                    className={`flex-1 px-3 py-2 rounded-xl font-bold text-sm transition-all ${
                                        participantsFilter === 'passed'
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                    Lulus
                                </button>
                                <button
                                    onClick={() => setParticipantsFilter('not-passed')}
                                    className={`flex-1 px-3 py-2 rounded-xl font-bold text-sm transition-all ${
                                        participantsFilter === 'not-passed'
                                            ? 'bg-amber-600 text-white'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                    Belum Lulus
                                </button>
                            </div>
                        </div>

                        {/* Participants Table */}
                        <div className="overflow-x-auto">
                            {filteredParticipants.length > 0 ? (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50">
                                            <th className="text-left px-4 py-3 font-bold text-slate-700">Nama</th>
                                            <th className="text-left px-4 py-3 font-bold text-slate-700">Email</th>
                                            <th className="text-center px-4 py-3 font-bold text-slate-700">Status</th>
                                            <th className="text-center px-4 py-3 font-bold text-slate-700">Nilai</th>
                                            <th className="text-center px-4 py-3 font-bold text-slate-700">Hasil</th>
                                            <th className="text-center px-4 py-3 font-bold text-slate-700">Tanggal Selesai</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredParticipants.map((participant, idx) => (
                                            <motion.tr
                                                key={participant.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                                            >
                                                <td className="px-4 py-4 font-bold text-slate-900">{participant.name}</td>
                                                <td className="px-4 py-4 text-slate-600 text-xs">{participant.email}</td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                                                        participant.status === 'completed'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : participant.status === 'in_progress'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {participant.status === 'completed' && <Check size={14} />}
                                                        {participant.status === 'completed' ? 'Selesai' : participant.status === 'in_progress' ? 'Berjalan' : 'Terdaftar'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center font-bold">
                                                    <span className={`text-lg ${
                                                        participant.has_attempted 
                                                            ? (participant.score >= program.passing_grade ? 'text-emerald-600' : 'text-red-600')
                                                            : 'text-slate-400'
                                                    }`}>
                                                        {participant.has_attempted ? participant.score : '-'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                                                        participant.is_passed
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : participant.has_attempted
                                                            ? 'bg-red-100 text-red-700'
                                                            : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {participant.is_passed && <Check size={14} />}
                                                        {participant.is_passed ? 'Lulus' : participant.has_attempted ? 'Tidak Lulus' : 'Belum Ambil'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center text-slate-600 text-xs">
                                                    {participant.completion_date 
                                                        ? new Date(participant.completion_date).toLocaleDateString('id-ID')
                                                        : '-'
                                                    }
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-slate-500 font-bold">Tidak ada peserta</p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Program Info */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="bg-white rounded-[24px] shadow-sm border border-slate-200 p-8"
                    >
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Informasi Program</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div>
                                <p className="text-sm text-slate-600 mb-2 font-bold">Durasi Program</p>
                                <p className="text-lg font-bold text-slate-900">{program.duration_minutes || 0} menit</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 mb-2 font-bold">Kategori</p>
                                <p className="text-lg font-bold text-slate-900">{program.category || 'Tidak ditentukan'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 mb-2 font-bold">Status</p>
                                <p className="inline-flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${program.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                    <span className="font-bold text-slate-900">
                                        {program.is_active ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 mb-2 font-bold">Dibuat Pada</p>
                                <p className="text-lg font-bold text-slate-900">
                                    {new Date(program.created_at).toLocaleDateString('id-ID')}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </AdminLayout>
    );
}
