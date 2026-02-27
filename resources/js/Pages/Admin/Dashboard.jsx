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
    Search, Bell, UserPlus,
    FileCheck, LogOut, Menu, X as XIcon, Settings, ChevronRight,
    Download, ArrowUpRight, ArrowDownRight, ArrowRight, Activity,
    Sun, Cloud, CloudRain, CloudSnow, GitBranch, AlertTriangle
} from 'lucide-react';
import AdminSidebar from '@/Components/Admin/AdminSidebar';
import ComplianceDashboard from '@/Pages/Admin/ComplianceDashboard';
import DepartmentHierarchyTree from '@/Components/Admin/DepartmentHierarchyTree';
import RoleAssignmentForm from '@/Components/Admin/RoleAssignmentForm';

// Inertia Link & usePage (untuk mendapatkan user dari Inertia props)
import { Link, usePage } from '@inertiajs/react';

// --- HELPER: Weather Icon Mapping ---
// NOTE: Weather feature currently not in use. Remove if not needed or connect to real weather API
const mapWeatherCode = (code) => {
    if (code === 0) return { desc: 'Cerah', icon: Sun };
    if (code >= 1 && code <= 3) return { desc: 'Cerah berawan', icon: Cloud };
    if (code >= 45 && code <= 48) return { desc: 'Kabut', icon: Cloud };
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { desc: 'Hujan', icon: CloudRain };
    if (code >= 71 && code <= 77) return { desc: 'Bersalju', icon: CloudSnow };
    if (code >= 95) return { desc: 'Badai petir', icon: Zap };
    return { desc: 'Cerah', icon: Sun }; // Default fallback
};

// --- HELPER: Sanitize Numeric Values ---
const sanitizeNumber = (val, defaultVal = 0) => {
    const num = Number(val);
    if (!isFinite(num) || isNaN(num)) {
        console.warn('Invalid numeric value:', val);
        return defaultVal;
    }
    return num;
};

// --- KOMPONEN UI DASAR ---

const GlassCard = React.memo(({ children, className = "", delay = 0 }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: delay * 0.1 }}
        className={`bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden ${className}`}
    >
        {children}
    </motion.div>
));

const ChartHeader = ({ title, subtitle, action, actionLink }) => {
    if (actionLink) {
        return (
            <div className="flex justify-between items-center mb-6 px-2">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                    <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
                </div>
                {action && (
                    <Link href={actionLink} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition">
                        <MoreHorizontal size={20} />
                    </Link>
                )}
            </div>
        );
    }
    
    return (
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
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-md p-4 border border-slate-200 shadow-xl rounded-xl z-50">
                <p className="text-xs font-bold text-slate-500 mb-2">{label}</p>
                {payload.map((entry, index) => {
                    // Format numeric values with proper locale and decimal precision
                    let displayValue = entry.value;
                    if (typeof entry.value === 'number') {
                        displayValue = entry.value.toLocaleString('id-ID', { maximumFractionDigits: 2 });
                    } else if (typeof entry.value === 'object') {
                        displayValue = JSON.stringify(entry.value);
                    }
                    
                    return (
                        <div key={index} className="flex items-center gap-2 text-sm font-bold text-slate-800 my-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="capitalize">
                                {entry.name}: {displayValue}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    }
    return null;
};

// --- KOMPONEN SIDEBAR (INTERNAL) ---
// REMOVED - Now using imported AdminSidebar component

// --- ISI KONTEN TAB ---

const OverviewTab = React.memo(({ stats, trend, enrollmentTrend, recentActivities }) => {
    // Build mixed data from real backend data with proper validation
    const mixedData = useMemo(() => {
        if (!trend || trend.length === 0 || !enrollmentTrend || enrollmentTrend.length === 0) {
            // Data is empty - no fallback mock data
            console.warn('[OverviewTab] No data available - blank chart will be shown');
            return [];
        }
        
        return trend.map((t, index) => {
            const enrollment = enrollmentTrend[index];
            return {
                name: t.month || `Month ${index + 1}`,
                enrollments: sanitizeNumber(enrollment?.enrollments || enrollment?.total || 0, 0),
                rate: sanitizeNumber(t.completed || t.completion_rate || t.rate || 0, 0)
            };
        });
    }, [trend, enrollmentTrend]);

    const areaData = useMemo(() => stats?.weekly_engagement || [
        { day: 'Sen', active: 31 }, { day: 'Sel', active: 40 }, { day: 'Rab', active: 28 },
        { day: 'Kam', active: 51 }, { day: 'Jum', active: 42 }, { day: 'Sab', active: 109 }, { day: 'Min', active: 100 },
    ], [stats]);

    return (
        <div className="space-y-4 sm:space-y-5 md:space-y-6 max-w-7xl mx-auto">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                {[
                    { title: 'Total Siswa', val: stats?.total_users || 0, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { title: 'Tingkat Kelulusan', val: `${stats?.completion_rate || 0}%`, icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { title: 'Rata-rata Skor', val: stats?.average_score || 0, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { title: 'Kepatuhan', val: `${stats?.overall_compliance_rate || 0}%`, icon: Shield, color: 'text-pink-600', bg: 'bg-pink-50' }
                ].map((item, i) => (
                    <GlassCard key={i} className="p-3 sm:p-4 md:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between hover:shadow-md transition" delay={i}>
                        <div className="min-w-0">
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1 truncate">{item.title}</p>
                            <h3 className="text-xl sm:text-2xl font-black text-slate-800 leading-tight">{item.val}</h3>
                        </div>
                        <div className={`p-2 sm:p-3 rounded-2xl ${item.bg} ${item.color} mt-2 sm:mt-0 flex-shrink-0`}>
                            <item.icon size={20} className="sm:w-6 sm:h-6" />
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Performance Overview */}
            <GlassCard className="p-4 sm:p-5 md:p-6" delay={0.5}>
                <ChartHeader title="Performance Overview" subtitle="Pendaftaran vs Tingkat Penyelesaian" action={true} />
                <div className="w-full" style={{ height: '320px' }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <ComposedChart data={mixedData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                            <defs>
                                <linearGradient id="enrollmentsGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} dy={10} />
                            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} />
                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} />
                            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#CBD5E0' }} />
                            <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                            <Bar yAxisId="left" dataKey="enrollments" barSize={20} fill="url(#enrollmentsGradient)" radius={[8, 8, 0, 0]} name="Pendaftaran" />
                            <Line yAxisId="right" type="natural" dataKey="rate" stroke="#F59E0B" strokeWidth={2} name="Penyelesaian" dot={{ stroke: '#F59E0B', strokeWidth: 2, r: 3, fill: '#fff' }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </GlassCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <GlassCard className="p-4 sm:p-5 md:p-6" delay={0.6}>
                    <ChartHeader title="Weekly Engagement" subtitle="Pengguna aktif 7 hari terakhir" />
                    <div className="w-full" style={{ height: '280px' }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <AreaChart data={areaData}>
                                <defs>
                                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="active" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorActive)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                <GlassCard className="p-4 sm:p-5 md:p-6" delay={0.7}>
                    <ChartHeader title="Aktivitas Terbaru" subtitle="Log real-time pengguna" action={true} actionLink="/admin/recent-activity" />
                    <div className="space-y-2 sm:space-y-3 max-h-80 overflow-y-auto pr-2">
                        {recentActivities.map((act, idx) => (
                            <div key={idx} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl hover:bg-slate-50 transition">
                                <div className={`p-1.5 sm:p-2 rounded-full shrink-0 ${act.bg} ${act.color}`}>
                                    <act.icon size={14} className="sm:w-4 sm:h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm text-slate-800 leading-tight">
                                        <span className="font-bold truncate">{act.user}</span> <span className="hidden sm:inline">{act.action}</span> <span className="font-semibold text-slate-600 truncate">{act.module}</span>
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 truncate">
                                        <Clock size={10} className="flex-shrink-0" /> {act.time}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
});

// 2. DEEP ANALYTICS TAB
const AnalyticsTab = React.memo(({ modules, stats, topLearners }) => {
    // Data Grafik: Radar - Use real skills gap data from backend
    const radarData = stats?.skills_gap || [];
    
    // Skill gap processing from REAL backend data only (no mock fallback)
    const processSkillGapData = (data) => {
        if (!data || data.length === 0) {
            console.warn('[SkillGapAnalysis] No skill gap data from backend - chart will be empty');
            return [];
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
    
    // Department compliance data processing from REAL backend data only
    const processDepartmentCompliance = (data) => {
        if (!data || data.length === 0) {
            console.warn('[DepartmentCompliance] No department compliance data from backend - chart will be empty');
            return [];
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
    const avgCurrent = skillGapProcessed.length ? sanitizeNumber(Math.round((skillGapProcessed.reduce((s, d) => s + (d.A || 0), 0) / skillGapProcessed.length) * 10) / 10, 0) : 0;
    const avgTarget = skillGapProcessed.length ? sanitizeNumber(Math.round((skillGapProcessed.reduce((s, d) => s + (d.B || 0), 0) / skillGapProcessed.length) * 10) / 10, 0) : 0;

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

                {/* Data Status Indicators */}
                {(!skillGapProcessed || skillGapProcessed.length === 0) && (
                    <div className="mt-4 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg flex items-start gap-3">
                        <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="font-bold text-amber-900 text-sm mb-1">Data Skill Gap Kosong</h3>
                            <p className="text-xs text-amber-800">
                                Grafik Skill Gap belum menampilkan data. Hal ini mungkin karena:
                                <br/>• Module belum memiliki final_score
                                <br/>• Jalankan: <code className="bg-amber-100 px-1 rounded">php artisan db:seed --class=DashboardTestDataSeeder</code>
                            </p>
                        </div>
                    </div>
                )}

                {skillGapProcessed && skillGapProcessed.length > 0 && (
                    <div className="mt-4 p-3 bg-green-50 border-l-4 border-green-600 rounded-lg flex items-center gap-2 text-xs text-green-800">
                        <CheckCircle size={16} className="flex-shrink-0" />
                        <span>Data real dari database ({skillGapProcessed.length} skills dari module performance)</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
                    {/* Radar Chart */}
                    <div className="lg:col-span-7">
                        <div className="w-full" style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
                    <div className="w-full" style={{ height: '360px', marginTop: '16px' }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
                    <ChartHeader title="Top Learners" subtitle="Performa Terbaik" />
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
                    
                    {/* Data Status Indicator */}
                    {(!deptCompliance || deptCompliance.length === 0) && (
                        <div className="mt-4 p-3 bg-amber-50 border-l-4 border-amber-500 rounded-lg flex items-start gap-3 text-xs">
                            <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-amber-900 mb-1">Data Department Kosong</p>
                                <p className="text-amber-800">Pastikan ada user dengan department yang terisi.</p>
                            </div>
                        </div>
                    )}

                    {deptCompliance && deptCompliance.length > 0 && (
                        <div className="mt-4 p-2 bg-green-50 border-l-4 border-green-600 rounded-lg flex items-center gap-2 text-xs text-green-800">
                            <CheckCircle size={14} className="flex-shrink-0" />
                            <span>Data real: {deptCompliance.length} department dari user_trainings</span>
                        </div>
                    )}

                    <div className="space-y-4 mt-4">
                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-3 border border-emerald-200">
                                <div className="text-[10px] text-emerald-600 font-bold uppercase mb-1">Rata-rata</div>
                                <div className="text-2xl font-black text-emerald-700">
                                    {deptCompliance.length > 0 
                                    ? sanitizeNumber(Math.round(deptCompliance.reduce((sum, d) => sum + (d.compliance || 0), 0) / deptCompliance.length), 0)
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
                    <div className="w-full" style={{ height: '320px' }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
                    <div className="w-full" style={{ height: '320px' }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
            <GlassCard className="p-0 overflow-hidden" delay={0.3}>
                <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between md:items-center gap-4 bg-slate-50/50">
                     <div>
                        <h3 className="text-lg font-bold text-slate-900">Arsip Laporan Lengkap</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">Semua laporan yang dihasilkan sistem</p>
                     </div>
                     <button
                        onClick={downloadExcel}
                        className="flex items-center gap-2 text-sm font-bold text-white bg-yellow-600 px-4 py-2 rounded-xl hover:bg-yellow-700 transition shadow-lg shadow-yellow-200 whitespace-nowrap"
                    >
                        <Download size={16} /> Export Excel
                    </button>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-white text-slate-400 font-bold uppercase text-xs tracking-wider border-b border-slate-100">
                            <tr>
                                <th className="px-4 md:px-6 py-4">ID</th>
                                <th className="px-4 md:px-6 py-4">Nama Laporan</th>
                                <th className="px-4 md:px-6 py-4 hidden sm:table-cell">Departemen</th>
                                <th className="px-4 md:px-6 py-4 hidden md:table-cell">Tanggal</th>
                                <th className="px-4 md:px-6 py-4">Status</th>
                                <th className="px-4 md:px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {detailedReports.length > 0 ? detailedReports.map((item, i) => (
                                <tr key={i} className="hover:bg-slate-50 transition">
                                    <td className="px-4 md:px-6 py-4 font-mono text-xs text-slate-400">{item.id.substring(0, 8)}...</td>
                                    <td className="px-4 md:px-6 py-4 font-bold text-slate-800 text-sm">{item.name}</td>
                                    <td className="px-4 md:px-6 py-4 hidden sm:table-cell"><span className="px-2 py-1 bg-slate-100 rounded text-xs font-semibold text-slate-600">{item.dept}</span></td>
                                    <td className="px-4 md:px-6 py-4 hidden md:table-cell text-slate-500 text-sm">{item.date}</td>
                                    <td className="px-4 md:px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1
                                            ${item.status === 'Selesai' ? 'bg-emerald-50 text-emerald-600' : item.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}
                                        `}>
                                            <div className={`w-1.5 h-1.5 rounded-full 
                                                ${item.status === 'Selesai' ? 'bg-emerald-500' : item.status === 'Pending' ? 'bg-amber-500' : 'bg-red-500'}
                                            `}></div>
                                            <span className="hidden sm:inline">{item.status}</span>
                                            <span className="sm:hidden">{item.status.charAt(0)}</span>
                                        </span>
                                    </td>
                                    <td className="px-4 md:px-6 py-4 text-right">
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
                                    <td colSpan="6" className="px-4 md:px-6 py-8 text-center text-slate-400">
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

// --- Organization Tab Component ---
const OrganizationTab = React.memo(() => {
    const [showRoleForm, setShowRoleForm] = useState(false);

    return (
        <div className="space-y-6">
            {/* Header with Actions */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Organization Management</h2>
                    <p className="text-slate-600 text-sm md:text-base mt-1">Kelola hirarki departemen dan penugasan peran</p>
                </div>
                <button
                    onClick={() => setShowRoleForm(!showRoleForm)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#005E54] text-white rounded-xl hover:bg-[#003d38] font-bold transition shrink-0"
                >
                    <UserPlus size={18} />
                    Assign Role
                </button>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Department Hierarchy - 2/3 width */}
                <div className="lg:col-span-2">
                    <GlassCard className="p-6">
                        <DepartmentHierarchyTree editable={true} />
                    </GlassCard>
                </div>

                {/* Role Assignment - 1/3 width */}
                <div className="lg:col-span-1">
                    {showRoleForm ? (
                        <GlassCard className="p-6">
                            <RoleAssignmentForm 
                                onSuccess={() => setShowRoleForm(false)}
                                onClose={() => setShowRoleForm(false)}
                            />
                        </GlassCard>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500">
                            <p className="text-sm">Klik "Assign Role" untuk tambah penugasan peran</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default function AdminDashboard({ auth, user, statistics, compliance_trend, enrollment_trend, recent_enrollments, recent_completions, recent_activity_logs, modules_stats, top_performers, reports, compliance_distribution }) {
    const { auth: inertiaAuth } = usePage().props;
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(false);
    const [weather, setWeather] = useState({ temp: null, desc: null, icon: null });
    const [now, setNow] = useState(new Date());

    // Get current user dari berbagai sumber dengan priority:
    // 1. user prop (dari controller)
    // 2. auth prop (dari controller)
    // 3. inertiaAuth.user (dari Inertia middleware)
    // 4. Fallback terakhir
    const currentUser = (() => {
        if (user?.name) {
            return { ...user, name: user.name || user.full_name || 'Pengguna' };
        }
        if (auth?.user?.name) {
            return { ...auth.user, name: auth.user.name || auth.user.full_name || 'Pengguna' };
        }
        if (inertiaAuth?.user?.name) {
            return { ...inertiaAuth.user, name: inertiaAuth.user.name || inertiaAuth.user.full_name || 'Pengguna' };
        }
        
        return { name: 'Pengguna', role: 'User' };
    })();

    // --- Weather & Time Effect ---
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        
        // Fetch real weather data from Open-Meteo API (free, no key needed)
        const fetchWeather = async () => {
            try {
                // Using Jakarta coordinates as default
                const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-6.2088&longitude=106.8456&current=weather_code,temperature_2m');
                const data = await response.json();
                if (data.current) {
                    const { desc, icon } = mapWeatherCode(data.current.weather_code);
                    setWeather({ temp: data.current.temperature_2m, desc, icon });
                }
            } catch (error) {
                // Fallback to default if API fails
                const { desc, icon } = mapWeatherCode(1);
                setWeather({ temp: 28, desc, icon });
            }
        };
        fetchWeather();
        return () => clearInterval(t);
    }, []);

    // --- Tab Switching Loading Effect ---
    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, [activeTab]);

    // --- Data Preparation (Real data from backend) ---
    // Debug: Check if backend data is received
    useEffect(() => {
        const hasComplianceData = Array.isArray(compliance_trend) && compliance_trend.length > 0;
        const hasEnrollmentData = Array.isArray(enrollment_trend) && enrollment_trend.length > 0;
        
        if (!hasComplianceData || !hasEnrollmentData) {
            console.warn('[Dashboard Data Issue]', {
                hasComplianceData,
                complianceTrendLength: compliance_trend?.length || 0,
                hasEnrollmentData, 
                enrollmentTrendLength: enrollment_trend?.length || 0,
                message: 'Backend trend data is empty - check DashboardMetricsController methods'
            });
        } else {
            console.log('[Dashboard Data OK]', {
                complianceTrendLength: compliance_trend.length,
                enrollmentTrendLength: enrollment_trend.length,
                latestCompliance: compliance_trend[compliance_trend.length - 1],
                latestEnrollment: enrollment_trend[enrollment_trend.length - 1]
            });
        }
    }, [compliance_trend, enrollment_trend]);

    const stats = statistics || {
        total_users: 0, completion_rate: 0, average_score: 0, overall_compliance_rate: 0,
        weekly_engagement: []
    };

    // Use real backend data, only use empty array if no data
    const trend = Array.isArray(compliance_trend) && compliance_trend.length > 0 ? compliance_trend : [];
    
    const enrollmentTrend = Array.isArray(enrollment_trend) && enrollment_trend.length > 0 ? enrollment_trend : [];

    // --- Process Real Activity Logs from Backend ---
    const recentActivities = (() => {
        if (!recent_activity_logs || recent_activity_logs.length === 0) {
            return [];
        }
        
        return recent_activity_logs.slice(0, 5).map(log => {
            // Get employee/karyawan name dari backend dengan prioritas field:
            // 1. user (dari backend DashboardMetricsController)
            // 2. user_name (alternative field)
            // 3. name (direct user name)
            // 4. full_name (full name fallback)
            // 5. Default: 'Karyawan'
            const employeeName = log.user || log.user_name || log.name || log.full_name || 'Karyawan';

            // Determine action type and icon berdasarkan action description
            let action = log.action || log.action_description || 'aktivitas';
            let icon = Activity;
            let bg = 'bg-blue-100';
            let color = 'text-blue-600';

            if (action.toLowerCase().includes('selesai') || action.toLowerCase().includes('completed')) {
                icon = CheckCircle;
                bg = 'bg-green-100';
                color = 'text-green-600';
            } else if (action.toLowerCase().includes('enrolled') || action.toLowerCase().includes('mendaftar') || action.toLowerCase().includes('enroll')) {
                icon = UserPlus;
                bg = 'bg-blue-100';
                color = 'text-blue-600';
            } else if (action.toLowerCase().includes('login')) {
                icon = Activity;
                bg = 'bg-purple-100';
                color = 'text-purple-600';
            } else if (action.toLowerCase().includes('lulus') || action.toLowerCase().includes('passed')) {
                icon = CheckCircle;
                bg = 'bg-emerald-100';
                color = 'text-emerald-600';
            } else if (action.toLowerCase().includes('gagal') || action.toLowerCase().includes('failed')) {
                icon = AlertTriangle;
                bg = 'bg-red-100';
                color = 'text-red-600';
            } else if (action.toLowerCase().includes('attempted') || action.toLowerCase().includes('coba') || action.toLowerCase().includes('exam') || action.toLowerCase().includes('score')) {
                icon = Target;
                bg = 'bg-amber-100';
                color = 'text-amber-600';
            }

            // Get module/content name
            const moduleName = log.module_name || log.course_name || log.training_name || log.content_title || log.module || 'System';

            // Calculate relative time - use backend time if available
            let logDate = null;
            
            if (log.time) {
                logDate = new Date(log.time);
            } else if (log.created_at) {
                logDate = new Date(log.created_at);
            } else if (log.timestamp) {
                // Check if timestamp is in seconds (less than a reasonable year 2099 in ms)
                // If less than 10^11, it's likely seconds, convert to milliseconds
                const ts = Number(log.timestamp);
                logDate = new Date(ts < 10000000000 ? ts * 1000 : ts);
            } else {
                logDate = new Date();
            }

            // Validate date
            if (!logDate || isNaN(logDate.getTime())) {
                logDate = new Date();
            }

            const now = new Date();
            const diffMs = now - logDate;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            let time = 'baru saja';
            if (diffMs < 0) time = 'baru saja'; // Future date fallback
            else if (diffMins < 1) time = 'baru saja';
            else if (diffMins < 60) time = `${diffMins}m lalu`;
            else if (diffHours < 24) time = `${diffHours}h lalu`;
            else if (diffDays < 7) time = `${diffDays}d lalu`;
            else time = logDate.toLocaleDateString('id-ID');

            return {
                user: employeeName,  // ⭐ Nama karyawan sebenarnya dari database
                action: action,
                module: moduleName,
                time,
                icon,
                bg,
                color
            };
        });
    })();

    // Greeting logic
    const hour = now.getHours();
    let greeting = 'Selamat Pagi';
    if (hour >= 12 && hour < 15) greeting = 'Selamat Siang';
    else if (hour >= 15 && hour < 18) greeting = 'Selamat Sore';
    else if (hour >= 18 || hour < 6) greeting = 'Selamat Malam';

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                body { font-family: 'Plus Jakarta Sans', sans-serif; }
                .tab-active { 
                    background-color: #005E54; 
                    color: white; 
                    box-shadow: 0 4px 12px rgba(0, 94, 84, 0.2);
                }
                .tab-inactive { 
                    color: #64748B; 
                    background: transparent;
                    transition: all 0.2s ease;
                }
                .tab-inactive:hover { 
                    background-color: #F1F5F9; 
                    color: #1e293b; 
                }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
            `}</style>
            
            <AdminSidebar user={currentUser} />

            {/* Main Content Area - Optimized Layout */}
            <div className="min-h-screen flex flex-col md:ml-[280px] bg-[#F8FAFC]">
                <main className="flex-1 w-full px-4 md:px-6 lg:px-8 py-6 md:py-8 overflow-x-hidden">
                    <div className="max-w-7xl mx-auto w-full">
                        
                        {/* HERO HEADER */}
                        <div className="mb-8 bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-2xl md:rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 w-48 h-48 md:w-96 md:h-96 bg-[#D6F84C] rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/3"></div>
                            
                            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                                <div className="flex-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                                        <span className="inline-block px-3 py-1 rounded-full bg-[#002824] text-[#D6F84C] text-xs font-bold uppercase tracking-wider">
                                            Live Dashboard
                                        </span>
                                        <span className="text-slate-400 text-xs font-semibold">
                                            {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2 leading-tight">
                                        {greeting}, <span className="text-[#005E54]">{currentUser.name.split(' ')[0]}!</span>
                                    </h1>
                                    <p className="text-slate-600 font-medium max-w-lg text-sm md:text-base">
                                        Ringkasan kinerja pembelajaran, kepatuhan, dan aktivitas user hari ini.
                                    </p>
                                </div>
                                
                                <div className="flex items-center gap-4 bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-slate-100 shadow-sm shrink-0">
                                    <div className="text-4xl">
                                        {weather.icon ? React.createElement(weather.icon, { size: 32, className: "text-amber-500" }) : '🌤️'}
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold text-slate-900">
                                            {weather.temp !== null ? `${Math.round(weather.temp)}°C` : '28°C'}
                                        </div>
                                        <div className="text-xs text-slate-500">{weather.desc || 'Cerah'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Data Status Indicator */}
                        {(!trend || trend.length === 0 || !enrollmentTrend || enrollmentTrend.length === 0) && (
                            <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg flex items-start gap-3">
                                <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-amber-900 text-sm mb-1">Data Dashboard Kosong</h3>
                                    <p className="text-xs text-amber-800 leading-relaxed">
                                        Grafik belum menampilkan data. Jalankan: <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">php artisan db:seed</code>
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Data Status Success */}
                        {trend && trend.length > 0 && enrollmentTrend && enrollmentTrend.length > 0 && (
                            <div className="mb-6 p-3 bg-green-50 border-l-4 border-green-600 rounded-lg flex items-center gap-2 text-xs text-green-800">
                                <CheckCircle size={16} className="shrink-0" />
                                <span>Data real: {trend.length} data compliance, {enrollmentTrend.length} enrollment</span>
                            </div>
                        )}

                        {/* TABS - Responsive */}
                        <div className="mb-8 flex justify-center">
                            <div className="bg-white p-1 rounded-full shadow-sm border border-slate-200 inline-flex flex-wrap justify-center gap-0">
                                {[
                                    { id: 'overview', label: 'Overview', icon: LayoutGrid },
                                    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
                                    { id: 'reports', label: 'Reports', icon: FileCheck },
                                    { id: 'organization', label: 'Organization', icon: GitBranch },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs md:text-sm font-bold transition-all duration-300 ${
                                            activeTab === tab.id ? 'tab-active' : 'tab-inactive'
                                        }`}
                                        title={tab.label}
                                    >
                                        <tab.icon size={16} />
                                        <span className="hidden sm:inline">{tab.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* CONTENT AREA */}
                        <AnimatePresence mode="wait">
                            {loading ? (
                                <div className="py-20 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="animate-spin w-12 h-12 border-4 border-[#005E54] border-t-transparent rounded-full mx-auto mb-4"></div>
                                        <p className="text-slate-500 font-medium">Memuat data...</p>
                                    </div>
                                </div>
                            ) : (
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {activeTab === 'overview' && (
                                        <OverviewTab 
                                            stats={stats} 
                                            trend={trend} 
                                            enrollmentTrend={enrollmentTrend} 
                                            recentActivities={recentActivities} 
                                        />
                                    )}
                                    {activeTab === 'analytics' && (
                                        <AnalyticsTab 
                                            modules={modules_stats}
                                            stats={stats}
                                            topLearners={top_performers}
                                        />
                                    )}
                                    {activeTab === 'reports' && (
                                        <ReportsTab 
                                            reports={reports}
                                            stats={stats}
                                            complianceDistribution={compliance_distribution}
                                        />
                                    )}
                                    {activeTab === 'organization' && (
                                        <OrganizationTab />
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </div>
                </main>
            </div>
        </div>
    );
}
