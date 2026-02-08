import React, { useState, useEffect, useMemo } from 'react';
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line, ComposedChart,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
    PieChart, Pie
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutGrid, BarChart2, FileText, Zap, Target, Users,
    TrendingUp, Shield, MoreHorizontal,
    BookOpen, Clock, CheckCircle, Award,
    Search, RefreshCw, Bell, UserPlus,
    FileCheck, LogOut, Menu, X as XIcon, Settings, ChevronRight,
    Download, ArrowUpRight, ArrowDownRight, ArrowRight, Activity,
    Sun, Cloud, CloudRain, CloudSnow
} from 'lucide-react';
import AdminSidebar from '@/Components/Admin/AdminSidebar';

// Inertia Link (use real SPA navigation)
import { Link } from '@inertiajs/react';

// --- Wondr Style System (Memoized - no Google Fonts import) ---
const WondrStyles = React.memo(() => (
    <style>{`
        .glass-panel { background: rgba(255,255,255,0.95); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.6); box-shadow: 0 10px 40px -10px rgba(0, 40, 36, 0.05); }
        .activity-card { transition: all 0.2s ease; border-left: 3px solid transparent; }
        .activity-card:hover { transform: translateX(4px); background-color: #F0FDF4; border-left-color: #005E54; }
        .timeline-line { position: absolute; left: 24px; top: 40px; bottom: -20px; width: 2px; background-color: #E2E8F0; z-index: 0; }
        .last-item .timeline-line { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
        .animate-enter { animation: enter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        @keyframes enter { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    `}</style>
));

// --- Weather helper (Open-Meteo mapping)
const mapWeatherCode = (code) => {
    if (code === 0) return { desc: 'Cerah', icon: Sun };
    if (code >= 1 && code <= 3) return { desc: 'Cerah berawan', icon: Cloud };
    if (code >= 45 && code <= 48) return { desc: 'Kabut', icon: Cloud };
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { desc: 'Hujan', icon: CloudRain };
    if (code >= 71 && code <= 77) return { desc: 'Bersalju', icon: CloudSnow };
    if (code >= 95) return { desc: 'Badai petir', icon: Zap };
    return { desc: 'Tidak diketahui', icon: Cloud };
};

// --- KOMPONEN UI DASAR ---

const GlassCard = React.memo(({ children, className = "", delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: delay * 0.05 }}
        className={`glass-panel rounded-[20px] overflow-hidden ${className}`}
    >
        {children}
    </motion.div>
));

const CustomTooltip = React.memo(({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-md p-4 border border-slate-200 shadow-xl rounded-xl z-50">
                <p className="text-xs font-bold text-slate-500 mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm font-bold text-slate-800 my-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="capitalize">
                            {entry.name}: {typeof entry.value === 'object' ? JSON.stringify(entry.value) : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
});

const ChartHeader = React.memo(({ title, subtitle, action, onViewAll }) => {
    return (
        <div className="flex justify-between items-center mb-6 px-2">
            <div>
                <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
                {onViewAll && (
                    <button onClick={onViewAll} className="text-xs font-bold text-[#005E54] hover:text-[#002824] transition flex items-center gap-1">
                        Lihat Detail <ArrowRight size={14} />
                    </button>
                )}
                {action && (
                    <button className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition">
                        <MoreHorizontal size={20} />
                    </button>
                )}
            </div>
        </div>
    );
});

// --- ISI KONTEN TAB ---

// === OPTIMIZED DASHBOARD HEADER (Memoized) ===
const DashboardHeader = React.memo(({ user, mapWeatherCode }) => {
    const [now, setNow] = useState(new Date());
    const [weather, setWeather] = useState({ temp: null, desc: null, icon: null });

    // Update waktu setiap detik (hanya di komponen ini)
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    // Fetch cuaca
    useEffect(() => {
        let mounted = true;
        const fetchWeather = async (lat, lon) => {
            try {
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=celsius`);
                const data = await res.json();
                if (!mounted || !data?.current_weather) return;
                const cw = data.current_weather;
                const { desc, icon } = mapWeatherCode(cw.weathercode || cw.weather_code || 0);
                setWeather({ temp: cw.temperature ?? null, desc, icon });
            } catch (e) {
                // ignore network errors
            }
        };

        if (navigator && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
                (err) => {
                    console.debug('Geolocation failed, using fallback location');
                    fetchWeather(-6.2, 106.816666);
                },
                { maximumAge: 600000, timeout: 5000 }
            );
        } else {
            fetchWeather(-6.2, 106.816666);
        }

        return () => { mounted = false; };
    }, [mapWeatherCode]);

    // Greeting logic
    const hour = now.getHours();
    let greeting = 'Selamat Pagi';
    let bgColor = 'from-blue-50 to-blue-100';
    let borderColor = 'border-blue-200';
    let textColor = 'text-blue-900';
    
    if (hour >= 12 && hour < 15) {
        greeting = 'Selamat Siang';
        bgColor = 'from-yellow-50 to-yellow-100';
        borderColor = 'border-yellow-200';
        textColor = 'text-yellow-900';
    } else if (hour >= 15 && hour < 18) {
        greeting = 'Selamat Sore';
        bgColor = 'from-orange-50 to-orange-100';
        borderColor = 'border-orange-200';
        textColor = 'text-orange-900';
    } else if (hour >= 18 || hour < 6) {
        greeting = 'Selamat Malam';
        bgColor = 'from-indigo-50 to-indigo-100';
        borderColor = 'border-indigo-200';
        textColor = 'text-indigo-900';
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="glass-panel rounded-2xl p-6 shadow-sm mb-8"
        >
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 mb-2">
                        {greeting}, <span className="text-[#005E54]">{user?.name || 'Admin'}</span> 👋
                    </h2>
                    <p className="text-slate-600 font-medium">
                        Selamat datang di Dashboard Admin. Berikut adalah ringkasan data dan metrics terbaru dari sistem pembelajaran kami.
                    </p>

                    <div className="mt-3 flex items-center gap-6 text-sm text-slate-700">
                        <div className="flex items-center gap-2">
                            <Clock size={14} />
                            <span className="font-medium">{now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="text-slate-500">
                            {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                    <div className="text-4xl opacity-90 flex-shrink-0">
                        {weather.icon ? React.createElement(weather.icon, { size: 28 }) : (hour >= 6 && hour < 12 ? '🌅' : hour >= 12 && hour < 15 ? '☀️' : hour >= 15 && hour < 18 ? '🌅' : '🌙')}
                    </div>
                    <div className="text-sm text-slate-700">
                        <div className="font-bold">{weather.temp !== null ? `${Math.round(weather.temp)}°C` : '--'}</div>
                        <div className="text-xs text-slate-500">{weather.desc || 'Cuaca tidak diketahui'}</div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
});

// 1. OVERVIEW TAB
const OverviewTab = React.memo(({ stats, trend, enrollmentTrend, recentActivities }) => {
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
                    { title: 'Total Siswa', val: stats?.total_users || 0, icon: Users, color: 'text-[#005E54]', bg: 'bg-[#F0FDF4]' },
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
                    <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={300}>
                        <ComposedChart data={mixedData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                            <defs>
                                <linearGradient id="enrollmentsGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                                </linearGradient>
                                <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                                </linearGradient>
                                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
                                </filter>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} label={{ value: 'Pendaftaran', angle: -90, position: 'insideLeft', offset: 10 }} />
                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} label={{ value: 'Tingkat Penyelesaian (%)', angle: 90, position: 'insideRight', offset: 10 }} />
                            <Tooltip 
                                content={<CustomTooltip />}
                                cursor={{ strokeDasharray: '3 3', stroke: '#CBD5E0' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '10px' }} />
                            <Bar 
                                yAxisId="left" 
                                dataKey="enrollments" 
                                barSize={28}
                                fill="url(#enrollmentsGradient)" 
                                radius={[8, 8, 0, 0]} 
                                name="Pendaftaran"
                                filter="url(#shadow)"
                            />
                            <Line 
                                yAxisId="right" 
                                type="natural" 
                                dataKey="rate" 
                                stroke="#F59E0B" 
                                strokeWidth={3}
                                name="Tingkat Penyelesaian" 
                                dot={(props) => {
                                    const { cx, cy, payload } = props;
                                    return (
                                        <circle 
                                            cx={cx} 
                                            cy={cy} 
                                            r={5} 
                                            fill="#F59E0B" 
                                            stroke="#fff" 
                                            strokeWidth={2}
                                            style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.2))' }}
                                        />
                                    );
                                }}
                                activeDot={{ r: 7, fill: '#F59E0B', stroke: '#fff', strokeWidth: 2 }}
                                isAnimationActive={true}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </GlassCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Engagement (Dipertahankan) */}
                <GlassCard className="p-6" delay={0.3}>
                    <ChartHeader title="Weekly Engagement" subtitle="Pengguna aktif 7 hari terakhir" />
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={250} minHeight={250}>
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
                    <Link href="/admin/recent-activity" className="w-full mt-4 py-2 text-sm font-semibold text-[#005E54] hover:bg-[#F0FDF4] rounded-lg transition"> 
                        Lihat Semua Aktivitas
                    </Link>
                </GlassCard>
            </div>
        </div>
    );
});

// 2. DEEP ANALYTICS TAB
const AnalyticsTab = React.memo(({ modules, stats, topLearners }) => {
    // Data Grafik: Radar - Use real skills gap data from backend
    const radarData = stats?.skills_gap || [];
    
    // Enhanced skill gap processing from backend data
    const processSkillGapData = (data) => {
        if (!data || data.length === 0) {
            return [
                { subject: 'Teknis', A: 80, B: 90, fullMark: 150 },
                { subject: 'Komunikasi', A: 50, B: 80, fullMark: 150 },
                { subject: 'Leadership', A: 30, B: 70, fullMark: 150 },
                { subject: 'Problem Solving', A: 40, B: 80, fullMark: 150 },
                { subject: 'Kepatuhan', A: 100, B: 100, fullMark: 150 },
                { subject: 'Manajemen', A: 20, B: 60, fullMark: 150 },
            ];
        }
        
        // Process real data with flexible field mapping
        return data.map(skill => ({
            subject: skill.subject || skill.name || 'Unknown',
            A: skill.current || skill.A || 0,
            B: skill.target || skill.B || 0,
            fullMark: 150
        }));
    };
    
    const skillGapProcessed = processSkillGapData(radarData);
    const departmentComplianceData = stats?.department_compliance || [];
    
    // Enhanced data processing for department compliance
    const processDepartmentCompliance = (data) => {
        if (!data || data.length === 0) {
            return [
                { name: 'HR', compliance: 85, total_users: 24, compliant_users: 20, color: '#3B82F6' },
                { name: 'IT', compliance: 92, total_users: 18, compliant_users: 16, color: '#10B981' },
                { name: 'Sales', compliance: 78, total_users: 32, compliant_users: 25, color: '#F59E0B' },
                { name: 'Marketing', compliance: 88, total_users: 15, compliant_users: 13, color: '#8B5CF6' },
                { name: 'Operations', compliance: 81, total_users: 22, compliant_users: 18, color: '#EC4899' },
                { name: 'Finance', compliance: 95, total_users: 11, compliant_users: 10, color: '#14B8A6' },
            ];
        }
        
        // Process incoming data with proper calculations
        return data.map((dept, idx) => ({
            name: dept.name || dept.department || `Dept ${idx + 1}`,
            compliance: dept.compliance_rate || dept.compliance || 0,
            total_users: dept.total_users || 0,
            compliant_users: dept.compliant_users || 0,
            color: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#06B6D4', '#EF4444'][idx % 8]
        })).sort((a, b) => b.compliance - a.compliance);
    };

    const deptCompliance = processDepartmentCompliance(departmentComplianceData);

    // Summary metrics for the skill gap card
    const _gaps = skillGapProcessed.map(d => ({ ...d, gap: Math.abs((d.B || 0) - (d.A || 0)) }));
    const largestGap = _gaps.length ? _gaps.reduce((a, b) => (a.gap > b.gap ? a : b)) : { subject: null, gap: 0 };
    const avgCurrent = skillGapProcessed.length ? Math.round((skillGapProcessed.reduce((s, d) => s + (d.A || 0), 0) / skillGapProcessed.length) * 10) / 10 : 0;
    const avgTarget = skillGapProcessed.length ? Math.round((skillGapProcessed.reduce((s, d) => s + (d.B || 0), 0) / skillGapProcessed.length) * 10) / 10 : 0;

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
        points: performer.points || performer.total_points || performer.xp_earned || 0,
        modules: performer.modules || performer.completed_trainings || 0,
        certifications: performer.certifications || 0,
        avgScore: performer.avgScore || performer.avg_exam_score || 0,
        badge: performer.badge || (performer.certifications > 5 ? 'Gold' : performer.certifications > 2 ? 'Silver' : 'Bronze')
    })) || [];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* SECTION 1: Full-Width Skill Gap Analysis */}
            <GlassCard className="p-6" delay={0.1}>
                <ChartHeader title="Skill Gap Analysis" subtitle="Kompetensi Saat Ini vs Target" />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
                    {/* Radar Chart */}
                    <div className="lg:col-span-7">
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%" minWidth={280} minHeight={280}>
                                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={skillGapProcessed}>
                                    <PolarGrid stroke="#E2E8F0" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 12 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                    <Radar name="Skill Saat Ini" dataKey="A" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.25} />
                                    <Radar name="Target Skill" dataKey="B" stroke="#10B981" fill="#10B981" fillOpacity={0.25} />
                                    <Legend verticalAlign="bottom" align="center" iconSize={10} wrapperStyle={{ paddingTop: '10px' }} />
                                    <Tooltip content={<CustomTooltip />} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="lg:col-span-5 flex flex-col gap-4 justify-between">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                                <div className="text-[11px] text-blue-600 font-bold uppercase tracking-wide mb-2">Rata-rata Saat Ini</div>
                                <div className="text-3xl font-black text-blue-700">{avgCurrent}</div>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                                <div className="text-[11px] text-emerald-600 font-bold uppercase tracking-wide mb-2">Target</div>
                                <div className="text-3xl font-black text-emerald-700">{avgTarget}</div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                            <div className="text-[11px] text-amber-600 font-bold uppercase tracking-wide mb-2">Gap Terbesar</div>
                            <div className="text-2xl font-black text-amber-700 mb-1">
                                {largestGap.subject || 'N/A'}
                            </div>
                            <div className="text-sm text-amber-600 font-bold">
                                {largestGap.gap} poin ({largestGap.A} → {largestGap.B})
                            </div>
                        </div>

                        <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                            <div className="text-xs font-bold text-[#005E54] mb-2">💡 Rekomendasi</div>
                            <div className="text-xs text-indigo-700 leading-relaxed">
                                Prioritaskan pelatihan untuk <span className="font-bold">{largestGap.subject}</span> untuk hasil maksimal.
                            </div>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* SECTION 2: Three-Column Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Content Effectiveness - Left Column (Full Height) */}
                <GlassCard className="p-6 lg:row-span-2" delay={0.2}>
                    <ChartHeader title="Efektivitas Konten" subtitle="Pendaftar vs Kelulusan" />
                    <div className="h-[380px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%" minWidth={380} minHeight={380}>
                            <BarChart data={contentEffectiveness} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fill: '#64748B', fontSize: 10 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                <Bar dataKey="pendaftar" name="Pendaftar" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="lulus" name="Lulus" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                {/* 2. Top Learners Leaderboard - Right Column (Top) */}
                <GlassCard className="p-6" delay={0.3}>
                    <ChartHeader title="Top Learners" subtitle="Performa Terbaik" onViewAll={() => router.visit('/admin/leaderboard')} />
                    <div className="space-y-3 mt-4 max-h-[380px] overflow-y-auto custom-scrollbar">
                        {learners.slice(0, 5).map((learner, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-300 hover:shadow-md transition">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-md flex-shrink-0
                                            ${learner.badge === 'Gold' ? 'bg-yellow-500' : learner.badge === 'Silver' ? 'bg-slate-400' : 'bg-amber-700'}
                                        `}>
                                            {i + 1}
                                        </div>
                                        <div className="min-w-0">
                                            <h5 className="font-bold text-slate-800 text-sm truncate">{learner.name}</h5>
                                            <p className="text-xs text-slate-500 truncate">{learner.modules} Modul • {learner.certifications} Sertifikat</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div className="font-black text-[#005E54] text-sm">{learner.points}</div>
                                        <div className="text-[10px] text-slate-400">poin</div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {learners.length === 0 && (
                            <div className="text-center py-8 text-slate-400">
                                <Award size={40} className="mx-auto mb-3 opacity-50" />
                                <p className="text-xs">Belum ada data</p>
                            </div>
                        )}
                    </div>
                </GlassCard>

                {/* 3. Department Compliance - Right Column (Bottom) */}
                <GlassCard className="p-6" delay={0.4}>
                    <ChartHeader title="Dept Compliance" subtitle="Kepatuhan Pelatihan" />
                    <div className="space-y-4 mt-4">
                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-3 border border-emerald-200">
                                <div className="text-[10px] text-emerald-600 font-bold uppercase mb-1">Rata-rata</div>
                                <div className="text-2xl font-black text-emerald-700">
                                    {deptCompliance.length > 0 
                                    ? Math.round(deptCompliance.reduce((sum, d) => sum + d.compliance, 0) / deptCompliance.length) 
                                    : 0}%
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-3 border border-indigo-200">
                                <div className="text-[10px] text-[#005E54] font-bold uppercase mb-1">Tertinggi</div>
                                <div className="text-lg font-black text-indigo-700">
                                    {deptCompliance.length > 0 ? deptCompliance[0].compliance : 0}%
                                </div>
                            </div>
                        </div>

                        {/* Top 3 Departments */}
                        <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                            {deptCompliance.slice(0, 3).map((dept, idx) => (
                                <motion.div key={idx} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.08 }}>
                                    <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 hover:border-slate-300 transition">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: dept.color }}></div>
                                                <span className="font-bold text-xs text-slate-900 truncate">{dept.name}</span>
                                            </div>
                                            <span className="text-xs font-bold text-slate-600 flex-shrink-0 ml-2">{dept.compliance}%</span>
                                        </div>
                                        <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full rounded-full transition-all" 
                                                style={{ 
                                                    width: `${dept.compliance}%`,
                                                    backgroundColor: dept.color
                                                }}
                                            ></div>
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-1">{dept.compliant_users}/{dept.total_users}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
});

// 3. REPORTS TAB
const ReportsTab = React.memo(({ reports, stats, complianceDistribution }) => {
    // Download helper for Excel export — submit a hidden form so the browser handles redirects/downloads
    // Download all reports (global)
    const downloadExcel = (e) => {
        e && e.preventDefault();
        try {
            const url = '/admin/dashboard/reports/excel/download';
            const form = document.createElement('form');
            form.method = 'GET';
            form.action = url;
            form.style.display = 'none';
            const ts = document.createElement('input');
            ts.type = 'hidden';
            ts.name = '_';
            ts.value = Date.now();
            form.appendChild(ts);
            document.body.appendChild(form);
            form.submit();
            setTimeout(() => { try { form.remove(); } catch (e) {} }, 1500);
        } catch (err) {
            alert('Terjadi kesalahan saat mencoba mengunduh: ' + err.message);
        }
    };

    // Download single report by id
    const downloadSingleReport = (id) => {
        try {
            const url = `/admin/dashboard/reports/excel/download?id=${encodeURIComponent(id)}&_=${Date.now()}`;
            const form = document.createElement('form');
            form.method = 'GET';
            form.action = url;
            form.style.display = 'none';
            document.body.appendChild(form);
            form.submit();
            setTimeout(() => { try { form.remove(); } catch (e) {} }, 1500);
        } catch (err) {
            alert('Terjadi kesalahan saat mencoba mengunduh: ' + err.message);
        }
    };

    // Data Grafik: Stacked Bar - Use real department reports data
    const processedReports = (() => {
        if (!Array.isArray(stats?.department_reports) || stats.department_reports.length === 0) {
            return [];
        }
        return stats.department_reports.map(dept => ({
            name: dept.name || 'Unknown',
            generated: dept.generated ?? 0,
            pending: dept.pending ?? 0,
            failed: dept.failed ?? 0,
        }));
    })();

    const stackedData = processedReports.length > 0 ? processedReports : [
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
                        <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={300}>
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
                        <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={300}>
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
                     <div className="flex items-center gap-3">
                        <button
                            onClick={downloadExcel}
                            className="flex items-center gap-2 text-sm font-bold text-white bg-yellow-600 px-4 py-2 rounded-xl hover:bg-yellow-700 transition shadow-lg shadow-yellow-200"
                        >
                            <Download size={16} /> Export Excel (Tabel Berwarna)
                        </button>
                     </div>
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
                                        <button
                                            className="text-slate-400 hover:text-[#005E54] p-2 hover:bg-[#F0FDF4] rounded-lg transition"
                                            title="Download laporan ini"
                                            onClick={() => downloadSingleReport(item.id)}
                                        >
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
});

// --- MAIN LAYOUT & APP ---

export default function AdminDashboard({ 
    auth, 
    statistics, 
    recent_enrollments, 
    recent_completions, 
    recent_activity_logs = [],
    modules_stats, 
    top_performers, 
    compliance_trend, 
    enrollment_trend, 
    alerts, 
    reports, 
    compliance_distribution
}) {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutGrid },
        { id: 'analytics', label: 'Deep Analytics', icon: BarChart2 },
        { id: 'reports', label: 'Reports', icon: FileCheck },
    ];

    // ===== DATA MAPPING FROM BACKEND (Optimized with useMemo) =====
    // Validate and prepare statistics
    const stats = useMemo(() => {
        const data = statistics || {};
        return {
            total_users: data.total_users ?? 0,
            completion_rate: data.completion_rate ?? 0,
            average_score: data.average_score ?? 0,
            overall_compliance_rate: data.overall_compliance_rate ?? 0,
            total_programs: data.total_programs ?? 0,
            active_programs: data.active_programs ?? 0,
            weekly_engagement: Array.isArray(data.weekly_engagement) ? data.weekly_engagement : [],
            skills_gap: Array.isArray(data.skills_gap) ? data.skills_gap : [],
            department_compliance: Array.isArray(data.department_compliance) ? data.department_compliance : [],
        };
    }, [statistics]);

    // Compliance trend data
    const trend = useMemo(() => {
        if (!Array.isArray(compliance_trend)) return [];
        return compliance_trend.map(t => ({
            month: t.month || t.date || '',
            completed: t.completed ?? t.certified ?? 0,
            total: t.total ?? 0,
        }));
    }, [compliance_trend]);

    // Enrollment trend data
    const enrollmentTrend = useMemo(() => {
        if (!Array.isArray(enrollment_trend)) return [];
        return enrollment_trend.map(e => ({
            month: e.month || e.date || '',
            enrollments: e.enrollments ?? 0,
        }));
    }, [enrollment_trend]);

    // Modules statistics
    const modules = useMemo(() => {
        if (!Array.isArray(modules_stats)) return [];
        return modules_stats.map(m => ({
            id: m.id,
            title: m.title || 'Unknown Module',
            description: m.description || '',
            total_enrollments: m.total_enrollments ?? 0,
            completed_count: m.completed_count ?? 0,
            completion_rate: m.completion_rate ?? 0,
        }));
    }, [modules_stats]);

    // Top performers/learners
    const topLearners = useMemo(() => {
        if (!Array.isArray(top_performers)) return [];
        return top_performers.map(p => ({
            id: p.id,
            name: p.name || 'Unknown',
            nip: p.nip,
            dept: p.dept || 'Unassigned',
            points: p.total_points ?? 0,
            modules: p.modules ?? 0,
            certifications: p.certifications ?? 0,
            avgScore: p.avg_exam_score ?? 0,
            badge: p.certifications > 5 ? 'Gold' : p.certifications > 2 ? 'Silver' : 'Bronze'
        }));
    }, [top_performers]);

    // Recent activities (merge enrollments, completions, and audit logs) - show up to 10 most recent
    const recentActivities = useMemo(() => {
        const enroll = (Array.isArray(recent_enrollments) ? recent_enrollments : []).map(e => ({
            type: 'enroll',
            user: e.user || e.user_name || 'Unknown User',
            action_label: 'mendaftar di',
            module: e.module || e.module_title || 'Unknown Module',
            time_label: e.time || (e.enrolled_at ? new Date(e.enrolled_at).toLocaleString('id-ID') : 'Baru saja'),
            icon: UserPlus,
            color: 'text-blue-500',
            bg: 'bg-blue-50',
            timestamp: e.timestamp || (e.enrolled_at ? new Date(e.enrolled_at).getTime()/1000 : 0)
        }));

        const complete = (Array.isArray(recent_completions) ? recent_completions : []).map(c => ({
            type: 'complete',
            user: c.user || c.user_name || 'Unknown User',
            action_label: 'menyelesaikan',
            module: c.module || c.module_title || 'Unknown Module',
            time_label: c.time || (c.completed_at ? new Date(c.completed_at).toLocaleString('id-ID') : 'Baru saja'),
            icon: CheckCircle,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50',
            timestamp: c.timestamp || (c.completed_at ? new Date(c.completed_at).getTime()/1000 : 0)
        }));

        // Safety guard: recent_activity_logs may not be defined in some dev builds; default to empty array
        const recentLogs = (typeof recent_activity_logs !== 'undefined') ? recent_activity_logs : [];
        const logs = (Array.isArray(recentLogs) ? recentLogs : []).map(l => {
            let icon = Activity;
            let color = 'text-slate-600';
            let bg = 'bg-slate-50';
            
            // Tentukan icon berdasarkan TYPE field dari backend (lebih reliable)
            const activityType = String(l.type || '').toLowerCase();
            const actionLower = String(l.action || '').toLowerCase();
            
            // Prioritas 1: Gunakan type field dari backend
            if (activityType === 'login') {
                icon = LogIn;
                color = 'text-indigo-500';
                bg = 'bg-indigo-50';
            } else if (activityType === 'enrollment' || activityType === 'enroll') {
                icon = UserPlus;
                color = 'text-blue-500';
                bg = 'bg-blue-50';
            } else if (activityType === 'completion' || activityType === 'complete') {
                icon = CheckCircle;
                color = 'text-emerald-500';
                bg = 'bg-emerald-50';
            } else if (activityType === 'exam') {
                icon = FileText;
                color = 'text-purple-500';
                bg = 'bg-purple-50';
            }
            // Fallback: Cek action text jika type tidak jelas
            else if (actionLower.includes('login') || actionLower.includes('masuk')) {
                icon = LogIn;
                color = 'text-indigo-500';
                bg = 'bg-indigo-50';
            } else if (actionLower.includes('enroll') || actionLower.includes('enrolled') || actionLower.includes('mendaftar')) {
                icon = UserPlus;
                color = 'text-blue-500';
                bg = 'bg-blue-50';
            } else if (actionLower.includes('complet') || actionLower.includes('selesai') || actionLower.includes('finish')) {
                icon = CheckCircle;
                color = 'text-emerald-500';
                bg = 'bg-emerald-50';
            } else if (actionLower.includes('attempt') || actionLower.includes('exam') || actionLower.includes('kuis') || actionLower.includes('score')) {
                icon = FileText;
                color = 'text-purple-500';
                bg = 'bg-purple-50';
            }

            return {
                type: 'log',
                user: l.user || 'System',
                action_label: (l.action || 'melakukan aktivitas'),
                module: l.module || 'System',  // Gunakan module field untuk module name, bukan type
                time_label: l.time || 'Baru saja',
                icon: icon,
                color: color,
                bg: bg,
                timestamp: l.timestamp || 0
            };
        });

        const merged = [...enroll, ...complete, ...logs].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        return merged.slice(0, 10).map(item => ({
            user: item.user,
            action: item.action_label,
            module: item.module,
            time: item.time_label,
            icon: item.icon,
            color: item.color,
            bg: item.bg,
            type: item.type
        }));
    }, [recent_enrollments, recent_completions, recent_activity_logs]);

    // Reports data
    const reportsData = useMemo(() => Array.isArray(reports) ? reports : [], [reports]);

    // Compliance distribution
    const complianceDistData = useMemo(() => Array.isArray(compliance_distribution) ? compliance_distribution : [], [compliance_distribution]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 font-sans text-slate-800">
            <WondrStyles />
            {/* Admin Sidebar */}
            <AdminSidebar user={auth?.user} />

            {/* Main Content */}
            <div className="md:ml-[280px] min-h-screen flex flex-col">
                {/* Content Area */}
                <main className="p-6 md:p-8 flex-1 overflow-y-auto">
                    <div className="max-w-7xl mx-auto w-full">
                        <DashboardHeader user={auth?.user} mapWeatherCode={mapWeatherCode} />
                    </div>

                    {/* Navigasi Tab - Floating/Standalone */}
                    <div className="flex flex-col items-center mb-8 gap-6">
                        <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                                        activeTab === tab.id 
                                        ? 'bg-[#005E54] text-white shadow-md' 
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
                                {activeTab === 'reports' && <ReportsTab reports={reportsData} stats={stats} complianceDistribution={complianceDistData} />}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>
            </div>
        </div>
    );
}
