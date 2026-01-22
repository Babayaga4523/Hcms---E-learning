import React, { useState } from 'react';
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line, ComposedChart,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    Treemap, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
    PieChart, Pie
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutGrid, BarChart2, FileText, Zap, Target, Users,
    TrendingUp, Shield, Calendar, Download, MoreHorizontal,
    User, BookOpen, Clock, CheckCircle, AlertCircle, Award
} from 'lucide-react';
import AdminSidebar from '@/Components/Admin/AdminSidebar';

// --- KOMPONEN UI DASAR ---
// --- KOMPONEN UI DASAR ---

const GlassCard = ({ children, className = "", delay = 0 }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        className={`bg-white border border-slate-200 shadow-sm rounded-[24px] overflow-hidden ${className}`}
    >
        {children}
    </motion.div>
);

const ChartHeader = ({ title, subtitle, action }) => (
    <div className="flex justify-between items-center mb-6 px-2">
        <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
        </div>
        {action && (
            <button className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition">
                <MoreHorizontal size={20} />
            </button>
        )}
    </div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 backdrop-blur-md p-4 border border-slate-200 shadow-xl rounded-xl">
                <p className="text-xs font-bold text-slate-500 mb-1">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm font-bold text-slate-800">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span>
                            {entry.name}: {typeof entry.value === 'object' ? JSON.stringify(entry.value) : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// --- ISI KONTEN TAB ---

// 1. OVERVIEW TAB
const OverviewTab = ({ stats, trend, enrollmentTrend, recentActivities }) => {
    // Data Grafik: Performance Overview - Use real trend data
    const mixedData = trend.map((t, index) => ({
        name: t.month,
        enrollments: enrollmentTrend[index]?.enrollments || 0,
        rate: t.completed
    })) || [];

    // Data Grafik: Weekly Engagement - Use real weekly engagement data
    const areaData = stats?.weekly_engagement || [
        { day: 'Sen', active: 31 },
        { day: 'Sel', active: 40 },
        { day: 'Rab', active: 28 },
        { day: 'Kam', active: 51 },
        { day: 'Jum', active: 42 },
        { day: 'Sab', active: 109 },
        { day: 'Min', active: 100 },
    ];

    // Use real recent activities data
    const activities = recentActivities || [];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { title: 'Total Siswa', val: stats?.total_users || 0, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { title: 'Tingkat Kelulusan', val: `${stats?.completion_rate || 0}%`, icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { title: 'Rata-rata Skor', val: stats?.average_score || 0, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { title: 'Kepatuhan', val: `${stats?.overall_compliance_rate || 0}%`, icon: Shield, color: 'text-pink-600', bg: 'bg-pink-50' }
                ].map((item, i) => (
                    <GlassCard key={i} className="p-5 flex items-center justify-between hover:shadow-md transition">
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{item.title}</p>
                            <h3 className="text-2xl font-black text-slate-800">{item.val}</h3>
                        </div>
                        <div className={`p-3 rounded-2xl ${item.bg} ${item.color}`}>
                            <item.icon size={24} />
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Performance Overview (Dipertahankan) */}
            <GlassCard className="p-6" delay={0.2}>
                <ChartHeader title="Performance Overview" subtitle="Pendaftaran vs Tingkat Penyelesaian (Tahunan)" action={true} />
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={mixedData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar yAxisId="left" dataKey="enrollments" barSize={30} fill="#3B82F6" radius={[6, 6, 0, 0]} />
                            <Line yAxisId="right" type="monotone" dataKey="rate" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, fill: '#F59E0B', strokeWidth: 2, stroke: '#fff' }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </GlassCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Engagement (Dipertahankan) */}
                <GlassCard className="p-6" delay={0.3}>
                    <ChartHeader title="Weekly Engagement" subtitle="Pengguna aktif 7 hari terakhir" />
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={areaData}>
                                <defs>
                                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="active" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorActive)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                {/* Aktivitas Terbaru (Konten Non-Grafik) */}
                <GlassCard className="p-6" delay={0.4}>
                    <ChartHeader title="Aktivitas Terbaru" subtitle="Log real-time pengguna" />
                    <div className="space-y-4">
                        {activities.map((act, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition">
                                <div className={`p-2 rounded-full shrink-0 ${act.bg} ${act.color}`}>
                                    <act.icon size={16} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-slate-800">
                                        <span className="font-bold">{act.user}</span> {act.action} <span className="font-semibold text-slate-600">{act.module}</span>
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                        <Clock size={12} /> {act.time}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                        Lihat Semua Aktivitas
                    </button>
                </GlassCard>
            </div>
        </div>
    );
};

// 2. DEEP ANALYTICS TAB
const AnalyticsTab = ({ modules, stats, topLearners }) => {
    // Data Grafik: Radar (Dipertahankan)
    const radarData = stats?.skills_gap || [
        { subject: 'Teknis', A: 80, B: 90, fullMark: 150 },
        { subject: 'Komunikasi', A: 50, B: 80, fullMark: 150 },
        { subject: 'Leadership', A: 30, B: 70, fullMark: 150 },
        { subject: 'Problem Solving', A: 40, B: 80, fullMark: 150 },
        { subject: 'Kepatuhan', A: 100, B: 100, fullMark: 150 },
        { subject: 'Manajemen', A: 20, B: 60, fullMark: 150 },
    ];

    // Summary metrics for the skill gap card
    const _gaps = radarData.map(d => ({ ...d, gap: Math.abs((d.B || 0) - (d.A || 0)) }));
    const largestGap = _gaps.length ? _gaps.reduce((a, b) => (a.gap > b.gap ? a : b)) : { subject: null, gap: 0 };
    const avgCurrent = radarData.length ? Math.round((radarData.reduce((s, d) => s + (d.A || 0), 0) / radarData.length) * 10) / 10 : 0;
    const avgTarget = radarData.length ? Math.round((radarData.reduce((s, d) => s + (d.B || 0), 0) / radarData.length) * 10) / 10 : 0;

    // Data Grafik: Bar Chart - Use real modules data
    const contentEffectiveness = modules?.map(m => ({
        name: m.title || 'Unknown',
        pendaftar: m.total_enrollments || 0,
        lulus: m.completed_count || 0
    })) || [];

    // Use real top performers data with enhanced calculation
    const learners = topLearners?.map(performer => ({
        name: performer.name,
        dept: performer.dept || (performer.nip ? `NIP: ${performer.nip}` : `ID: ${performer.id}`) || 'N/A',
        points: performer.points || performer.total_points || 0,
        modules: performer.modules || performer.completed_trainings || 0,
        certifications: performer.certifications || 0,
        avgScore: performer.avgScore || performer.avg_exam_score || 0,
        badge: performer.badge || (performer.certifications > 5 ? 'Gold' : performer.certifications > 2 ? 'Silver' : 'Bronze')
    })) || [];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Skill Gap Analysis (Compact + Summary) */}
                <GlassCard className="p-6" delay={0.1}>
                    <ChartHeader title="Skill Gap Analysis" subtitle="Kompetensi Saat Ini vs Target" />

                    <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                        <div className="md:col-span-2">
                            <div className="w-full" style={{ minHeight: 180 }}>
                                <ResponsiveContainer width="100%" height={200}>
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                        <PolarGrid stroke="#E2E8F0" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 11 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                        <Radar name="Skill Saat Ini" dataKey="A" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                                        <Radar name="Target Skill" dataKey="B" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                                        <Legend verticalAlign="bottom" align="center" iconSize={8} />
                                        <Tooltip content={<CustomTooltip />} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-700">
                                <div className="text-[11px] text-slate-500 mb-1">Ringkasan Skill</div>
                                <div className="text-sm font-bold">Rata-rata Saat Ini: {avgCurrent}</div>
                                <div className="text-sm font-bold">Rata-rata Target: {avgTarget}</div>
                                <div className="text-xs mt-2">Gap Terbesar: {largestGap.subject ? `${largestGap.subject} (${largestGap.gap})` : 'Tidak tersedia'}</div>
                            </div>
                            <div className="bg-indigo-50/60 rounded-xl p-3 text-xs text-slate-700">
                                <div className="font-bold text-indigo-600">Tips:</div>
                                <div className="mt-1">Fokus pada gap terbesar untuk peningkatan cepat. Gunakan rekomendasi pelatihan untuk skill tersebut.</div>
                            </div>
                        </div>
                    </div>

                </GlassCard>

                {/* Top Learners Leaderboard (Konten Non-Grafik) */}
                <GlassCard className="p-6" delay={0.2}>
                    <ChartHeader title="Top Learners Leaderboard" subtitle="Siswa berprestasi berdasarkan performa keseluruhan" />
                    <div className="space-y-4">
                        {learners.map((learner, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md
                                        ${learner.badge === 'Gold' ? 'bg-yellow-500' : learner.badge === 'Silver' ? 'bg-slate-400' : 'bg-amber-700'}
                                    `}>
                                        {i + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800">{learner.name}</h4>
                                        <p className="text-xs text-slate-500">
                                            {learner.dept}{learner.location ? ` • ${learner.location}` : ''} • {learner.modules} Modul • {learner.certifications} Sertifikat
                                        </p>
                                        {learner.avgScore > 0 && (
                                            <p className="text-xs text-emerald-600 font-semibold">
                                                Rata-rata Skor: {learner.avgScore}%
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-black text-indigo-600">{learner.points.toLocaleString()}</div>
                                    <div className="text-[10px] font-bold uppercase text-slate-400">Total Points</div>
                                </div>
                            </div>
                        ))}
                        {learners.length === 0 && (
                            <div className="text-center py-8 text-slate-400">
                                <Award size={48} className="mx-auto mb-4 opacity-50" />
                                <p className="text-sm">Belum ada data performa siswa</p>
                            </div>
                        )}
                    </div>
                </GlassCard>
            </div>

            {/* Analisis Efektivitas Konten (Pengganti Treemap) */}
            <GlassCard className="p-6" delay={0.3}>
                <ChartHeader title="Analisis Efektivitas Konten" subtitle="Perbandingan Jumlah Pendaftar vs Kelulusan per Modul" />
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={contentEffectiveness} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar dataKey="pendaftar" name="Pendaftar" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={30} />
                            <Bar dataKey="lulus" name="Lulus" fill="#10B981" radius={[4, 4, 0, 0]} barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </GlassCard>
        </div>
    );
};

// 3. REPORTS TAB
const ReportsTab = ({ reports, stats, complianceDistribution }) => {
    // Data Grafik: Stacked Bar (Dipertahankan)
    const stackedData = stats?.department_reports || [
        { name: 'HR', generated: 44, pending: 13, failed: 11 },
        { name: 'IT', generated: 55, pending: 23, failed: 17 },
        { name: 'Sales', generated: 41, pending: 20, failed: 15 },
        { name: 'Marketing', generated: 67, pending: 8, failed: 15 },
        { name: 'Ops', generated: 22, pending: 13, failed: 21 },
        { name: 'Finance', generated: 43, pending: 27, failed: 14 },
    ];

    // Use real reports data if available, otherwise empty array
    const detailedReports = reports || [];

    // Compliance distribution pie chart data
    const pieData = complianceDistribution || [
        { name: 'Compliant', value: 0 },
        { name: 'Pending', value: 0 },
        { name: 'Non-Compliant', value: 0 },
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Compliance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Departmental Status */}
                <GlassCard className="p-6" delay={0.1}>
                    <ChartHeader title="Departmental Status" subtitle="Status Pembuatan Laporan per Departemen" />
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stackedData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontWeight: 600 }} width={80} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar dataKey="generated" stackId="a" fill="#10B981" radius={[0, 4, 4, 0]} name="Selesai" />
                                <Bar dataKey="pending" stackId="a" fill="#F59E0B" name="Pending" />
                                <Bar dataKey="failed" stackId="a" fill="#EF4444" radius={[4, 0, 0, 4]} name="Gagal" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                {/* Compliance Distribution */}
                <GlassCard className="p-6" delay={0.2}>
                    <ChartHeader title="Compliance Distribution" subtitle="Distribusi Status Kepatuhan" />
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#10B981', '#F59E0B', '#EF4444'][index % 3]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>
            </div>
            
            {/* Daftar Laporan Lengkap */}
            <GlassCard className="p-0" delay={0.3}>
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                     <ChartHeader title="Arsip Laporan Lengkap" subtitle="Semua laporan yang dihasilkan sistem" />
                     <button className="flex items-center gap-2 text-sm font-bold text-white bg-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
                        <Download size={16} /> Export CSV
                     </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-white text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">ID Laporan</th>
                                <th className="px-6 py-4">Nama Laporan</th>
                                <th className="px-6 py-4">Departemen</th>
                                <th className="px-6 py-4">Tanggal</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {detailedReports.length > 0 ? detailedReports.map((item, i) => (
                                <tr key={i} className="hover:bg-slate-50 transition cursor-pointer">
                                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{item.id}</td>
                                    <td className="px-6 py-4 font-bold text-slate-800">{item.name}</td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 rounded text-xs font-semibold text-slate-600">{item.dept}</span></td>
                                    <td className="px-6 py-4 text-slate-500">{item.date}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1
                                            ${item.status === 'Selesai' ? 'bg-emerald-50 text-emerald-600' : item.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}
                                        `}>
                                            <div className={`w-1.5 h-1.5 rounded-full 
                                                ${item.status === 'Selesai' ? 'bg-emerald-500' : item.status === 'Pending' ? 'bg-amber-500' : 'bg-red-500'}
                                            `}></div>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-slate-400 hover:text-indigo-600 p-2 hover:bg-indigo-50 rounded-lg transition">
                                            <Download size={16} />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                                        Belum ada laporan yang dihasilkan
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
};

// --- MAIN LAYOUT & APP ---

export default function AdminDashboard({ auth, statistics, recent_enrollments, recent_completions, modules_stats, top_performers, compliance_trend, enrollment_trend, alerts, reports, compliance_distribution }) {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutGrid },
        { id: 'analytics', label: 'Deep Analytics', icon: BarChart2 },
        { id: 'reports', label: 'Reports', icon: FileText },
    ];

    // Map data from backend to component props
    const stats = statistics || {};
    const trend = compliance_trend || [];
    const enrollmentTrend = enrollment_trend || [];
    const modules = modules_stats || [];
    const recentActivities = [
        ...(recent_enrollments || []).slice(0, 2).map(enrollment => ({
            user: enrollment.user_name,
            action: 'mendaftar di',
            module: enrollment.module_title,
            time: enrollment.enrolled_at ? new Date(enrollment.enrolled_at).toLocaleString('id-ID') : 'Baru saja',
            icon: User,
            color: 'text-blue-500',
            bg: 'bg-blue-50'
        })),
        ...(recent_completions || []).slice(0, 2).map(completion => ({
            user: completion.user_name,
            action: 'menyelesaikan modul',
            module: completion.module_title,
            time: completion.completed_at ? new Date(completion.completed_at).toLocaleString('id-ID') : 'Baru saja',
            icon: CheckCircle,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50'
        }))
    ];
    const topLearners = (top_performers || []).map(performer => ({
        id: performer.id,
        nip: performer.nip,
        name: performer.name,
        dept: performer.department || (performer.nip ? `NIP: ${performer.nip}` : `ID: ${performer.id}`) || 'N/A',
        location: performer.location || '',
        points: performer.total_points || 0,
        modules: performer.completed_trainings || 0,
        certifications: performer.certifications || 0,
        avgScore: performer.avg_exam_score || 0,
        badge: performer.certifications > 5 ? 'Gold' : performer.certifications > 2 ? 'Silver' : 'Bronze'
    }));

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800">
            {/* Admin Sidebar */}
            <AdminSidebar user={auth?.user} />

            {/* Main Content */}
            <div className="md:ml-[280px]">
                {/* Content Area */}
                <main className="p-6 md:p-8">
                    {/* Navigasi Tab - Floating/Standalone */}
                    <div className="flex flex-col items-center mb-8 gap-6">
                        <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                                        activeTab === tab.id 
                                        ? 'bg-indigo-600 text-white shadow-md' 
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    <tab.icon size={18} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Konten Utama */}
                    <div className="max-w-7xl mx-auto">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                            >
                                {activeTab === 'overview' && <OverviewTab stats={stats} trend={trend} enrollmentTrend={enrollmentTrend} recentActivities={recentActivities} />}
                                {activeTab === 'analytics' && <AnalyticsTab modules={modules} stats={stats} topLearners={topLearners} />}
                                {activeTab === 'reports' && <ReportsTab reports={reports} stats={stats} complianceDistribution={compliance_distribution} />}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>
            </div>
        </div>
    );
}
