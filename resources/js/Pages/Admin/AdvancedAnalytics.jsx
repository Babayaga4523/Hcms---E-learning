import React, { useEffect, useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import showToast from '@/Utils/toast';
import { 
    ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell 
} from 'recharts';
import { 
    Activity, TrendingUp, Users, AlertTriangle, Download, 
    Calendar, Sparkles, BrainCircuit, Target, Clock, ArrowRight, Filter, Shield, Bell, Menu
} from 'lucide-react';
import { motion } from 'framer-motion';

// --- COMPONENTS ---

const InsightCard = ({ icon: Icon, title, value, trend, subtext, color = "lime" }) => {
    const colors = {
        lime: "bg-[#F7FEE7] text-[#4D7C0F] border-lime-200",
        orange: "bg-[#FFF7ED] text-[#C2410C] border-orange-200",
        teal: "bg-[#F0FDFA] text-[#0F766E] border-teal-200",
        slate: "bg-[#F8FAFC] text-[#334155] border-slate-200",
    };

    return (
        <motion.div 
            whileHover={{ y: -5 }}
            className={`p-6 rounded-[32px] border ${colors[color].split(' ')[2]} bg-white shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden`}
        >
            <div className={`absolute top-0 right-0 p-4 opacity-10`}>
                <Icon size={80} />
            </div>
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-3 rounded-2xl ${colors[color].split(' ')[0]} ${colors[color].split(' ')[1]}`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <span className="flex items-center gap-1 text-xs font-bold bg-white border border-gray-100 px-2 py-1 rounded-full shadow-sm text-gray-700">
                        <TrendingUp size={12} className={trend.includes('+') ? 'text-green-600' : 'text-red-600'} />
                        {trend}
                    </span>
                )}
            </div>
            <div className="relative z-10">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
                <p className="text-sm font-bold text-slate-600 mt-1">{title}</p>
                <p className="text-xs text-slate-400 mt-2">{subtext}</p>
            </div>
        </motion.div>
    );
};

const SectionTitle = ({ title, subtitle, icon: Icon, onDetailClick, dark = false }) => (
    <div className="mb-6 flex items-end justify-between relative z-10">
        <div>
            <div className="flex items-center gap-2 mb-1">
                <Icon size={18} className={dark ? "text-[#D6FF59]" : "text-[#FF5500]"} />
                <span className={`text-xs font-bold uppercase tracking-widest ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{subtitle}</span>
            </div>
            <h2 className={`text-2xl font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
        </div>
        {onDetailClick && (
            <button 
                onClick={onDetailClick}
                className={`text-sm font-bold ${dark ? 'text-[#D6FF59] hover:text-[#E4FF8C]' : 'text-[#00BFA5] hover:underline'} flex items-center gap-1 transition-colors cursor-pointer relative z-20`}
            >
                Lihat Detail <ArrowRight size={14} />
            </button>
        )}
    </div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/90 backdrop-blur text-white p-4 rounded-2xl shadow-xl border border-slate-700">
                <p className="text-sm font-bold mb-2 text-[#D6FF59]">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs py-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="capitalize text-slate-300">{entry.name}:</span>
                        <span className="font-bold">{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function AdvancedAnalytics() {
    const { auth } = usePage().props;
    const user = auth.user;

    const [overview, setOverview] = useState(null);
    const [trends, setTrends] = useState([]);
    const [engagement, setEngagement] = useState([]);
    const [skillsRadar, setSkillsRadar] = useState([]);
    const [cohortData, setCohortData] = useState([]);
    const [atRiskUsers, setAtRiskUsers] = useState([]);
    const [topPerformers, setTopPerformers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30');
    const [department, setDepartment] = useState('all');

    useEffect(() => {
        loadData();
    }, [timeRange, department]);

    // Export report function with professional formatting
    const handleExportReport = () => {
        const now = new Date();
        const dateStr = now.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
        const timeStr = now.toLocaleTimeString('id-ID');
        
        const csvRows = [
            ['======================================================================='],
            ['WONDR INTELLIGENCE HUB - ADVANCED ANALYTICS REPORT'],
            ['======================================================================='],
            [''],
            ['Report Information:'],
            ['Generated Date:', dateStr],
            ['Generated Time:', timeStr],
            ['Time Range:', timeRange === '7D' ? 'Last 7 Days' : timeRange === '30D' ? 'Last 30 Days' : timeRange === '90D' ? 'Last 90 Days' : 'Year to Date'],
            ['Department Filter:', department === 'all' ? 'All Departments' : department],
            [''],
            ['======================================================================='],
            ['SECTION 1: KEY PERFORMANCE INDICATORS (KPI)'],
            ['======================================================================='],
            [''],
            ['Metric', 'Value', 'Description'],
            ['Total Enrollments', overview?.enrollments ?? 0, 'Total number of course enrollments'],
            ['Completion Rate', `${overview?.completion_rate ?? 0}%`, 'Percentage of completed courses'],
            ['Active Learners', overview?.active_learners ?? 0, 'Number of active users in last 30 days'],
            ['At Risk Users', atRiskUsers?.length ?? 0, 'Users with compliance deadline < 7 days'],
            ['Total Users', overview?.total_users ?? 0, 'Total registered users'],
            ['Completed Courses', overview?.completions ?? 0, 'Total completed courses'],
            [''],
            ['======================================================================='],
            ['SECTION 2: LEARNING VELOCITY TRENDS'],
            ['======================================================================='],
            [''],
            ['Period', 'Completions', 'Learning Hours', 'New Enrollments'],
            ...(trends && trends.length > 0 ? trends.map(t => [
                t.name || '-',
                t.completions || 0,
                t.hours || 0,
                t.enrollments || 0
            ]) : [['No data available', '-', '-', '-']]),
            [''],
            ['Summary:'],
            ['Total Completions:', trends.reduce((sum, t) => sum + (t.completions || 0), 0)],
            ['Total Learning Hours:', trends.reduce((sum, t) => sum + (t.hours || 0), 0)],
            ['Total Enrollments:', trends.reduce((sum, t) => sum + (t.enrollments || 0), 0)],
            [''],
            ['======================================================================='],
            ['SECTION 3: USER ENGAGEMENT ANALYSIS'],
            ['======================================================================='],
            [''],
            ['Engagement Level', 'User Count', 'Percentage'],
            ...(engagement && engagement.length > 0 ? engagement.map(e => {
                const total = engagement.reduce((sum, item) => sum + (item.value || 0), 0);
                const percentage = total > 0 ? ((e.value / total) * 100).toFixed(1) : 0;
                return [e.name || '-', e.value || 0, `${percentage}%`];
            }) : [['No data available', '-', '-']]),
            [''],
            ['Total Users Tracked:', engagement.reduce((sum, e) => sum + (e.value || 0), 0)],
            [''],
            ['======================================================================='],
            ['SECTION 4: SKILLS COMPETENCY RADAR'],
            ['======================================================================='],
            [''],
            ['Skill Area', 'Current Level', 'Target Level', 'Gap'],
            ...(skillsRadar && skillsRadar.length > 0 ? skillsRadar.map(s => [
                s.subject || '-',
                s.A || 0,
                s.B || 0,
                (s.B || 0) - (s.A || 0)
            ]) : [['No data available', '-', '-', '-']]),
            [''],
            ['Average Completion:', skillsRadar.length > 0 ? (skillsRadar.reduce((sum, s) => sum + (s.A || 0), 0) / skillsRadar.length).toFixed(1) : 0],
            ['Average Target:', skillsRadar.length > 0 ? (skillsRadar.reduce((sum, s) => sum + (s.B || 0), 0) / skillsRadar.length).toFixed(1) : 0],
            [''],
            ['======================================================================='],
            ['SECTION 5: AT-RISK USERS'],
            ['======================================================================='],
            [''],
            ['User ID', 'Risk Level', 'Days Until Deadline'],
            ...(atRiskUsers && atRiskUsers.length > 0 ? atRiskUsers.map(u => [
                u.id || '-',
                u.risk || 'Medium',
                u.days_left || '-'
            ]) : [['No users at risk', '-', '-']]),
            [''],
            ['Total At-Risk Users:', atRiskUsers?.length ?? 0],
            [''],
            ['======================================================================='],
            ['END OF REPORT'],
            ['======================================================================='],
            [''],
            ['Note: This report is generated automatically from Wondr Intelligence Hub'],
            ['For more details, please visit the Advanced Analytics dashboard'],
            [''],
            ['© 2025 HCMS E-Learning Platform. All rights reserved.']
        ];

        // Convert to CSV format with proper escaping
        const csvContent = csvRows.map(row => {
            return row.map(cell => {
                // Convert to string and escape quotes
                const cellStr = String(cell ?? '');
                // If cell contains comma, quote, or newline, wrap in quotes
                if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                    return `"${cellStr.replace(/"/g, '""')}`;
                }
                return cellStr;
            }).join(',');
        }).join('\n');

        // Add BOM for proper UTF-8 encoding in Excel
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Wondr-Analytics-Report-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message
        showToast('✅ Report berhasil diunduh! File tersimpan di folder Downloads Anda.', 'success');
    };

    const loadData = async () => {
        try {
            setLoading(true);
            
            // Fetch all analytics data in parallel
            const [overviewRes, trendsRes, engagementRes, skillsRes, cohortRes, atRiskRes, topPerformersRes] = await Promise.all([
                fetch(`/api/admin/analytics/overview?range=${timeRange}&department=${department}`),
                fetch(`/api/admin/analytics/trends?range=${timeRange}`),
                fetch(`/api/admin/analytics/engagement`),
                fetch(`/api/admin/analytics/skills-radar`),
                fetch(`/api/admin/analytics/cohort`),
                fetch(`/api/admin/analytics/at-risk`),
                fetch(`/api/admin/analytics/top-performers?limit=4`)
            ]);
            
            if (overviewRes.ok) {
                const data = await overviewRes.json();
                setOverview(data);
                console.log('Overview data:', data);
            }
            
            if (trendsRes.ok) {
                const data = await trendsRes.json();
                setTrends(data);
                console.log('Trends data:', data);
            }
            
            if (engagementRes.ok) {
                const data = await engagementRes.json();
                setEngagement(data);
                console.log('Engagement data:', data);
            }
            
            if (skillsRes.ok) {
                const response = await skillsRes.json();
                // Transform data for radar chart format
                const transformedData = response.data.map(item => ({
                    subject: item.skill,
                    A: item.value, // Completion Rate
                    B: Math.min(item.value + 20, 100), // Target (completion + 20% or max 100%)
                    fullMark: 100
                }));
                setSkillsRadar(transformedData);
                console.log('Skills data:', transformedData);
            }
            
            if (cohortRes.ok) {
                const data = await cohortRes.json();
                setCohortData(data);
                console.log('Cohort data:', data);
            }
            
            if (atRiskRes.ok) {
                const data = await atRiskRes.json();
                setAtRiskUsers(data);
                console.log('At-risk data:', data);
            }
            
            if (topPerformersRes.ok) {
                const data = await topPerformersRes.json();
                setTopPerformers(data);
                console.log('Top performers data:', data);
            }
        } catch (err) {
            console.error('Error loading analytics data:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout user={user}>
            <Head title="Advanced Analytics - Wondr Intelligence Hub" />

            <div className="pb-20 font-sans bg-[#FAFAFA]">
                
                {/* --- 1. SUPER HEADER --- */}
                <div className="relative bg-white border-b border-slate-100 px-8 py-8 mb-8">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#D6FF59]/30 to-transparent rounded-bl-full pointer-events-none opacity-50" />
                    
                    <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 relative z-10">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-[#D6FF59] text-xs font-bold mb-3">
                                <Sparkles size={12} /> Wondr Intelligence Hub v2.0
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                                Performance <span className="text-[#FF5500]">Overview</span>
                            </h1>
                            <p className="text-slate-500 mt-2 max-w-xl">
                                Analisis mendalam tentang tren pembelajaran, kesenjangan kompetensi, dan prediksi kepatuhan organisasi Anda.
                            </p>
                        </div>
                        
                        <div className="flex gap-3">
                            <div className="bg-slate-100 p-1 rounded-full flex">
                                {['7D', '30D', '90D', 'YTD'].map((range) => (
                                    <button 
                                        key={range}
                                        onClick={() => setTimeRange(range)}
                                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                                            timeRange === range 
                                            ? 'bg-white text-black shadow-sm' 
                                            : 'text-slate-500 hover:text-slate-900'
                                        }`}
                                    >
                                        {range}
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={handleExportReport}
                                className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full text-sm font-bold hover:bg-slate-800 transition shadow-lg hover:shadow-xl"
                            >
                                <Download size={16} /> Export Report
                            </button>
                        </div>
                    </div>
                </div>

                <div className="px-8 max-w-[1600px] mx-auto space-y-10">

                    {/* --- 2. AI EXECUTIVE SUMMARY --- */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-[#00BFA5] to-[#009688] rounded-[32px] p-1 shadow-lg"
                    >
                        <div className="bg-white rounded-[30px] p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center">
                            <div className="flex-shrink-0 w-16 h-16 bg-[#E0F2F1] rounded-2xl flex items-center justify-center text-[#00BFA5]">
                                <BrainCircuit size={32} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    AI Insight Summary 
                                    <span className="px-2 py-0.5 bg-[#D6FF59] text-black text-[10px] rounded-full uppercase">Beta</span>
                                </h3>
                                <p className="text-slate-600 mt-2 leading-relaxed text-sm">
                                    {overview && overview.completion_rate && overview.trends ? (
                                        <>
                                            Analisis periode ini menunjukkan {overview.trends.completions_trend > 0 ? 'tren positif' : 'penurunan'}. 
                                            <strong className={overview.trends.completions_trend > 0 ? 'text-teal-600' : 'text-orange-600'}>
                                                Completion rate {overview.trends.completions_trend > 0 ? 'naik' : 'turun'} {Math.abs(overview.trends.completions_trend)}%
                                            </strong> dengan total {overview.completions} pelatihan selesai. 
                                            {overview.completion_rate < 80 && (
                                                <> Target completion rate belum tercapai (saat ini {overview.completion_rate}%). 
                                                Disarankan untuk mengaktifkan <em>Smart Reminder</em> untuk meningkatkan engagement.</>
                                            )}
                                            {overview.completion_rate >= 80 && (
                                                <> Kinerja sangat baik dengan completion rate {overview.completion_rate}%. 
                                                Pertahankan momentum ini dengan program recognition untuk top performers.</>
                                            )}
                                        </>
                                    ) : (
                                        'Menganalisis data pembelajaran untuk memberikan insight yang relevan...'
                                    )}
                                </p>
                            </div>
                            <button 
                                onClick={() => showToast('Fitur AI Detail Action akan segera hadir! Saat ini dalam tahap pengembangan.', 'info')}
                                className="flex-shrink-0 px-6 py-3 border-2 border-slate-100 rounded-full text-sm font-bold text-slate-700 hover:border-[#D6FF59] hover:bg-[#F7FEE7] transition"
                            >
                                Generate Detail Action
                            </button>
                        </div>
                    </motion.div>

                    {/* --- 3. KPI CARDS --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <InsightCard 
                            title="Total Enrollments" 
                            value={overview?.enrollments?.toLocaleString() ?? "Loading..."}
                            trend={overview?.trends?.enrollments_trend ? 
                                `${overview.trends.enrollments_trend > 0 ? '+' : ''}${overview.trends.enrollments_trend}% vs last period` 
                                : null}
                            subtext={`${overview?.total_users ?? 0} users total`}
                            icon={Activity}
                            color="lime"
                        />
                        <InsightCard 
                            title="Completion Rate" 
                            value={`${overview?.completion_rate ?? 0}%`}
                            trend={overview?.trends?.completions_trend ? 
                                `${overview.trends.completions_trend > 0 ? '+' : ''}${overview.trends.completions_trend}% vs last period` 
                                : null}
                            subtext={`${overview?.completions?.toLocaleString() ?? 0} completed`}
                            icon={Target}
                            color="teal"
                        />
                        <InsightCard 
                            title="Active Learners" 
                            value={overview?.active_learners ?? 0}
                            trend={overview?.trends?.active_learners_trend ? 
                                `${overview.trends.active_learners_trend > 0 ? '+' : ''}${overview.trends.active_learners_trend}% vs last period` 
                                : null}
                            subtext={`Last 30 days activity`}
                            icon={Users}
                            color="orange"
                        />
                        <InsightCard 
                            title="At Risk Users" 
                            value={atRiskUsers?.length ?? 0}
                            subtext={`Compliance deadline < 7 days`}
                            icon={AlertTriangle}
                            color="slate"
                        />
                    </div>

                    {/* --- 4. ADVANCED CHARTS SECTION --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* LEFT: Mixed Chart */}
                        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                            <SectionTitle 
                                title="Learning Velocity" 
                                subtitle="Activity Trends" 
                                icon={Activity}
                                onDetailClick={() => router.visit('/admin/reports')}
                            />
                            
                            <div className="h-[350px] w-full">
                                {trends && trends.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={300}>
                                        <ComposedChart data={trends}>
                                            <defs>
                                                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#D6FF59" stopOpacity={0.8}/>
                                                    <stop offset="95%" stopColor="#D6FF59" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid stroke="#f1f5f9" vertical={false} strokeDasharray="3 3" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                            <Bar dataKey="completions" barSize={20} fill="#1e293b" radius={[10, 10, 0, 0]} name="Penyelesaian" />
                                            <Area type="monotone" dataKey="hours" stroke="#D6FF59" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" name="Jam Belajar" />
                                            <Line type="monotone" dataKey="enrollments" stroke="#FF5500" strokeWidth={2} dot={{r: 4}} name="Enrollment" />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-400">Loading trends data...</div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT: Engagement Pie */}
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col">
                            <SectionTitle 
                                title="Engagement Level" 
                                subtitle="User Activity" 
                                icon={Users}
                                onDetailClick={() => router.visit('/admin/users')}
                            />
                            
                            <div className="flex-1 min-h-[250px] relative">
                                {engagement && engagement.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                                        <PieChart>
                                            <Pie
                                                data={engagement}
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {engagement.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-400">Loading engagement data...</div>
                                )}
                                {engagement && engagement.length > 0 && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-3xl font-black text-slate-900">
                                            {engagement[0]?.value ?? 0}
                                        </span>
                                        <span className="text-xs font-bold text-slate-400 uppercase">{engagement[0]?.name}</span>
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-4">
                                {engagement.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-xs font-bold text-slate-600">{item.name} ({item.value})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* --- 5. SKILL MATRIX & LEADERBOARD --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                        
                        {/* Skill Radar Chart */}
                        <div className="bg-slate-900 p-8 rounded-[32px] text-white shadow-xl relative overflow-hidden">
                            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#D6FF59] rounded-full blur-[80px] opacity-20 pointer-events-none"></div>

                            <SectionTitle 
                                title="Skill Competency" 
                                subtitle="Department Gap Analysis" 
                                icon={Target}
                                onDetailClick={() => router.visit('/admin/departments')}
                                dark={true}
                            />
                            <div className="h-[300px] w-full relative z-10">
                                {skillsRadar && skillsRadar.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={250} minHeight={250}>
                                        <RadarChart outerRadius={90} data={skillsRadar}>
                                            <PolarGrid stroke="#334155" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                            <Radar name="Completion Rate" dataKey="A" stroke="#D6FF59" strokeWidth={2} fill="#D6FF59" fillOpacity={0.3} />
                                            <Radar name="Target" dataKey="B" stroke="#00BFA5" strokeWidth={2} fill="#00BFA5" fillOpacity={0.3} />
                                            <Legend wrapperStyle={{ fontSize: '12px', marginTop: '10px' }}/>
                                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} itemStyle={{ color: '#fff' }}/>
                                        </RadarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-400">Loading skills data...</div>
                                )}
                            </div>
                        </div>

                        {/* Top Performers Table */}
                        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                            <SectionTitle 
                                title="Top Talent Leaderboard" 
                                subtitle="Gamification" 
                                icon={Users}
                                onDetailClick={() => router.visit('/admin/users')}
                            />
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Rank</th>
                                            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Employee</th>
                                            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Department</th>
                                            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">XP Earned</th>
                                            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {topPerformers && topPerformers.length > 0 ? (
                                            topPerformers.map((performer, index) => {
                                                const initials = performer.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
                                                return (
                                                    <tr key={performer.id} className="group hover:bg-slate-50 transition">
                                                        <td className="py-4">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                                                index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                                                                index === 1 ? 'bg-gray-200 text-gray-700' :
                                                                index === 2 ? 'bg-orange-100 text-orange-700' :
                                                                'bg-slate-100 text-slate-600'
                                                            }`}>
                                                                #{index + 1}
                                                            </div>
                                                        </td>
                                                        <td className="py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                                                                    index === 0 ? 'bg-yellow-500' :
                                                                    index === 1 ? 'bg-gray-400' :
                                                                    index === 2 ? 'bg-orange-500' :
                                                                    'bg-slate-500'
                                                                }`}>
                                                                    {initials}
                                                                </div>
                                                                <span className="font-bold text-sm text-slate-700">{performer.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 text-sm text-slate-500">{performer.department || 'No Department'}</td>
                                                        <td className="py-4 text-sm font-bold text-[#00BFA5]">{performer.xp_earned?.toLocaleString() || 0} XP</td>
                                                        <td className="py-4">
                                                            <span className={`px-3 py-1 text-[10px] font-bold rounded-full ${
                                                                performer.badge === 'PRO' ? 'bg-[#D6FF59] text-black' :
                                                                performer.badge === 'ADVANCED' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-slate-100 text-slate-600'
                                                            }`}>
                                                                {performer.badge || 'MEMBER'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="py-8 text-center text-slate-400 text-sm">
                                                    No performers data available yet
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </AdminLayout>
    );
}
