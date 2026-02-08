import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { 
    TrendingUp, BarChart3, Award, Clock, Target, Activity, 
    Download, ArrowUpRight, ArrowDownRight, Zap, ChevronDown, 
    CheckCircle, AlertCircle, BookOpen, Filter
} from 'lucide-react';
import showToast from '@/Utils/toast';
import { 
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, AreaChart, Area, RadarChart, PolarGrid, 
    PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Cell
} from 'recharts';

// --- Wondr Style System ---
const WondrStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F8F9FA; color: #1e293b; }
        
        .wondr-dark { background-color: #002824; }
        .wondr-green { color: #005E54; }
        .wondr-lime { color: #D6F84C; }
        
        .glass-panel {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.6);
            box-shadow: 0 10px 40px -10px rgba(0, 40, 36, 0.05);
        }

        .chart-tooltip {
            background: rgba(0, 40, 36, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 12px;
            color: white;
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }

        .tab-active { 
            background-color: #002824; 
            color: #D6F84C; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
        }

        .animate-enter { 
            animation: enter 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
            opacity: 0; 
        }
        
        @keyframes enter {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    `}</style>
);

// --- Components ---

const StatCard = ({ label, value, subtext, icon: Icon, color, trend, trendValue, delay }) => {
    const colors = {
        emerald: { bg: 'bg-[#F0FDF4]', text: 'text-[#005E54]' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-700' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-700' },
        amber: { bg: 'bg-amber-50', text: 'text-amber-700' },
    };
    const theme = colors[color] || colors.emerald;

    return (
        <div 
            className="glass-panel p-5 rounded-[24px] flex flex-col justify-between animate-enter hover:translate-y-[-4px] transition-transform"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex justify-between items-start mb-2">
                <div className={`p-3 rounded-2xl ${theme.bg} ${theme.text}`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${
                        trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                        {trend === 'up' ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
                        {trendValue}
                    </span>
                )}
            </div>
            <div>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">{value}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{label}</p>
                {subtext && <p className="text-xs text-slate-500 mt-2 font-medium">{subtext}</p>}
            </div>
        </div>
    );
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="chart-tooltip">
                <p className="font-bold text-xs text-[#D6F84C] mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs mb-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                        <span className="capitalize text-white/80">{entry.name}:</span>
                        <span className="font-bold">{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// --- Main Page ---

export default function LearnerPerformance() {
    const { auth } = usePage().props;
    const user = auth.user;
    
    // State
    const [activeTab, setActiveTab] = useState('performance');
    const [period, setPeriod] = useState('30d');
    const [loading, setLoading] = useState(true);
    const [performanceData, setPerformanceData] = useState(null);
    const [progressData, setProgressData] = useState(null);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [expandedModule, setExpandedModule] = useState(null);

    // Fetch data on mount and when filters change
    useEffect(() => {
        if (activeTab === 'performance') {
            fetchPerformanceData();
        }
    }, [activeTab, period]);

    useEffect(() => {
        if (activeTab === 'progress') {
            fetchProgressData();
        }
    }, [activeTab, selectedProgram]);

    const fetchPerformanceData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/learner/performance?period=${period}`, {
                headers: { 'Accept': 'application/json' },
            });
            if (!response.ok) {
                const errText = await response.text().catch(() => 'Failed to fetch');
                console.error('Error fetching performance data, status:', response.status, errText);
                showToast('Gagal memuat data performa. Silakan coba lagi.', 'error');
                return;
            }
            const data = await response.json();
            setPerformanceData(data);
        } catch (error) {
            console.error('Error fetching performance data:', error);
            showToast('Gagal memuat data performa. Silakan coba lagi.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchProgressData = async () => {
        try {
            setLoading(true);
            const url = selectedProgram
                ? `/api/learner/progress/${selectedProgram}`
                : '/api/learner/progress';
            const response = await fetch(url, {
                headers: { 'Accept': 'application/json' },
            });
            if (!response.ok) {
                const errText = await response.text().catch(() => 'Failed to fetch');
                console.error('Error fetching progress data, status:', response.status, errText);
                showToast('Gagal memuat data progress. Silakan coba lagi.', 'error');
                return;
            }
            const data = await response.json();
            setProgressData(data);
        } catch (error) {
            console.error('Error fetching progress data:', error);
            showToast('Gagal memuat data progress. Silakan coba lagi.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Export report
    const handleExportReport = () => {
        const data = performanceData || {};
        const csvContent = [
            ['Metrik', 'Nilai'],
            ['Rata-rata Skor', `${data.averageScore || 0}%`],
            ['Tingkat Penyelesaian', `${data.completionRate || 0}%`],
            ['Sertifikasi Diperoleh', data.certifications || 0],
            ['Waktu Pembelajaran (jam)', data.hoursSpent || 0],
        ].map(row => row.join(',')).join('\n');

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

    // Prepare data for charts
    const data = performanceData || {};
    const pdata = progressData || {};
    
    const scoresTrendData = data.scoresTrend || [];
    const skillRadarData = data.skillRadar || [];
    const learningActivityData = data.learningActivity || [];
    const moduleProgressData = pdata.modules || [];
    const programs = pdata.programs || [];

    const averageScore = data.averageScore ?? 0;
    const hoursSpent = data.hoursSpent ?? 0;
    const completionRate = data.completionRate ?? 0;
    const certifications = data.certifications ?? 0;
    const scoreChange = data.scoreChange ?? 0;
    const completionChange = data.completionChange ?? 0;

    const selectedProgramData = selectedProgram
        ? programs.find(p => p.id === selectedProgram)
        : programs[0];

    return (
        <AppLayout user={user}>
            <Head title="Performa & Statistik Pembelajaran" />
            
            <div className="min-h-screen bg-[#F8F9FA] pb-20 font-sans">
                <WondrStyles />
                
                {/* --- Header Section --- */}
                <div className="bg-[#002824] pt-8 pb-32 px-6 lg:px-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#005E54] rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/4"></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                        <div>
                            <div className="flex items-center gap-2 text-[#D6F84C] mb-2 font-bold text-xs tracking-widest uppercase">
                                <Activity className="w-4 h-4" /> Personal Analytics
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight">
                                Performa & <br /> Statistik
                            </h1>
                        </div>
                        
                        <div className="flex flex-wrap gap-3">
                            <div className="bg-white/10 backdrop-blur-md p-1 rounded-xl flex border border-white/10">
                                {['7d', '30d', 'all'].map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPeriod(p)}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                            period === p ? 'bg-[#D6F84C] text-[#002824]' : 'text-slate-300 hover:text-white'
                                        }`}
                                    >
                                        {p === '7d' ? '7D' : p === '30d' ? '30D' : 'ALL'}
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={handleExportReport}
                                className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/10 font-bold transition-all"
                            >
                                <Download className="w-4 h-4" /> Export
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- Main Content --- */}
                <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-20 space-y-8">
                    
                    {/* 1. Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard 
                            label="Rata-rata Skor" 
                            value={`${averageScore}%`}
                            subtext="Dari semua program"
                            icon={Target} 
                            color="emerald" 
                            trend={scoreChange >= 0 ? 'up' : 'down'}
                            trendValue={`${Math.abs(scoreChange)}%`}
                            delay={0}
                        />
                        <StatCard 
                            label="Jam Belajar" 
                            value={`${hoursSpent}h`}
                            subtext="Total pembelajaran"
                            icon={Clock} 
                            color="blue" 
                            delay={100}
                        />
                        <StatCard 
                            label="Penyelesaian" 
                            value={`${completionRate}%`}
                            subtext="Program selesai"
                            icon={CheckCircle} 
                            color="purple" 
                            trend={completionChange >= 0 ? 'up' : 'down'}
                            trendValue={`${Math.abs(completionChange)}%`}
                            delay={200}
                        />
                        <StatCard 
                            label="Sertifikat" 
                            value={certifications}
                            subtext="Sertifikat aktif"
                            icon={Award} 
                            color="amber" 
                            delay={300}
                        />
                    </div>

                    {/* 2. Navigation Tabs */}
                    <div className="bg-white rounded-[20px] p-2 shadow-sm border border-slate-100 flex overflow-x-auto no-scrollbar gap-2">
                        {[
                            { id: 'performance', label: 'Analisis Performa', icon: TrendingUp },
                            { id: 'progress', label: 'Detail Progress', icon: BookOpen },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
                                    activeTab === tab.id ? 'tab-active' : 'text-slate-500 hover:bg-slate-50'
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* 3. Tab Content */}
                    {loading ? (
                        <div className="h-96 glass-panel rounded-[32px] flex items-center justify-center">
                            <div className="animate-spin w-12 h-12 border-4 border-[#005E54] border-t-transparent rounded-full"></div>
                        </div>
                    ) : (
                        <div className="animate-enter">
                            {activeTab === 'performance' && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Score Trend Chart */}
                                    <div className="lg:col-span-2 glass-panel rounded-[32px] p-8">
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-900">Evolusi Skor</h3>
                                                <p className="text-sm text-slate-500">Perbandingan skor Anda vs Target</p>
                                            </div>
                                        </div>
                                        <div className="h-[350px] w-full flex-shrink-0">
                                            {scoresTrendData.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={300}>
                                                    <AreaChart data={scoresTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                        <defs>
                                                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#005E54" stopOpacity={0.3}/>
                                                                <stop offset="95%" stopColor="#005E54" stopOpacity={0}/>
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} domain={[0, 100]} />
                                                        <Tooltip content={<CustomTooltip />} />
                                                        <Area type="monotone" dataKey="score" stroke="#005E54" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" name="Skor Anda" />
                                                        <Line type="monotone" dataKey="target" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Target" />
                                                        <Legend verticalAlign="top" height={36} />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
                                                    <div className="text-center">
                                                        <TrendingUp size={40} className="mx-auto text-gray-300 mb-2" />
                                                        <p className="text-gray-500 text-sm">Belum ada data skor</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Skill Radar */}
                                    <div className="glass-panel rounded-[32px] p-8 flex flex-col items-center">
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">Kompetensi</h3>
                                        <p className="text-sm text-slate-500 mb-4">Pemetaan skill berdasarkan modul</p>
                                        
                                        <div className="h-[300px] w-full relative flex-shrink-0">
                                            {skillRadarData.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%" minWidth={250} minHeight={250}>
                                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillRadarData}>
                                                        <PolarGrid stroke="#E2E8F0" />
                                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 10, fontWeight: 'bold' }} />
                                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                        <Radar
                                                            name="Skill"
                                                            dataKey="value"
                                                            stroke="#D6F84C"
                                                            strokeWidth={3}
                                                            fill="#005E54"
                                                            fillOpacity={0.6}
                                                        />
                                                        <Tooltip />
                                                    </RadarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <p className="text-gray-400 text-sm">Belum ada data skill</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Learning Activity Heatmap-style Bar */}
                                    <div className="lg:col-span-3 glass-panel rounded-[32px] p-8">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xl font-bold text-slate-900">Intensitas Belajar</h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-400 uppercase">Total:</span>
                                                <span className="text-lg font-black text-[#005E54]">{hoursSpent} Jam</span>
                                            </div>
                                        </div>
                                        <div className="h-[200px] w-full flex-shrink-0">
                                            {learningActivityData.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={200}>
                                                    <BarChart data={learningActivityData}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                                                        <Tooltip content={<CustomTooltip />} />
                                                        <Bar dataKey="hours" fill="#005E54" radius={[8, 8, 0, 0]} barSize={40}>
                                                            {learningActivityData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.hours > 3 ? '#005E54' : '#94A3B8'} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
                                                    <p className="text-gray-500 text-sm">Belum ada data aktivitas</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'progress' && (
                                <div className="space-y-6">
                                    {programs.length === 0 ? (
                                        <div className="glass-panel rounded-[32px] p-12 text-center">
                                            <BookOpen size={64} className="mx-auto mb-4 text-gray-300" />
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Program</h3>
                                            <p className="text-gray-500 mb-4">Anda belum terdaftar dalam program pelatihan apapun.</p>
                                            <a 
                                                href="/my-trainings" 
                                                className="inline-flex items-center gap-2 px-6 py-3 bg-[#002824] text-[#D6F84C] rounded-xl font-bold hover:bg-[#005E54] transition"
                                            >
                                                Lihat Pelatihan Tersedia
                                            </a>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Program Selection */}
                                            <div className="glass-panel rounded-[32px] p-8">
                                                <div className="flex items-center justify-between mb-6">
                                                    <h3 className="text-xl font-bold text-slate-900">Program Pembelajaran ({programs.length})</h3>
                                                    <button className="flex items-center gap-2 text-sm font-bold text-[#005E54]">
                                                        <Filter size={16} /> Filter
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {programs.map((program) => (
                                                        <button
                                                            key={program.id}
                                                            onClick={() => setSelectedProgram(program.id)}
                                                            className={`p-4 rounded-2xl border-2 text-left transition hover:shadow-lg ${
                                                                (selectedProgram === program.id || (!selectedProgram && programs[0]?.id === program.id))
                                                                    ? 'border-[#005E54] bg-[#F0FDF4]'
                                                                    : 'border-gray-200 hover:border-gray-300'
                                                            }`}
                                                        >
                                                            <h4 className="font-bold text-gray-900 mb-2">{program.name}</h4>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                                    <div
                                                                        className="bg-[#005E54] h-2 rounded-full transition"
                                                                        style={{ width: `${program.progress}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className="text-sm font-bold text-gray-600">{program.progress}%</span>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Module Progress */}
                                            <div className="glass-panel rounded-[32px] p-8">
                                                <div className="flex items-center justify-between mb-6">
                                                    <h3 className="text-xl font-bold text-slate-900">Detail Modul</h3>
                                                </div>

                                                <div className="space-y-4">
                                                    {moduleProgressData.length > 0 ? (
                                                        moduleProgressData.map((module) => (
                                                            <div key={module.id} className="group bg-white border border-slate-100 rounded-2xl p-5 hover:border-[#005E54]/30 hover:shadow-lg transition-all">
                                                                <div className="flex flex-col md:flex-row md:items-center gap-6">
                                                                    
                                                                    {/* Icon Status */}
                                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                                                        module.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                                                                        module.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                                                                        'bg-slate-100 text-slate-500'
                                                                    }`}>
                                                                        {module.status === 'completed' ? <Award size={24} /> :
                                                                         module.status === 'in_progress' ? <Zap size={24} /> :
                                                                         <BookOpen size={24} />}
                                                                    </div>

                                                                    {/* Info */}
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex justify-between items-start mb-1">
                                                                            <h4 className="font-bold text-slate-900 truncate">{module.name}</h4>
                                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                                                module.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                                                                                module.status === 'in_progress' ? 'bg-blue-50 text-blue-700' :
                                                                                'bg-slate-100 text-slate-600'
                                                                            }`}>
                                                                                {module.status === 'completed' ? 'Selesai' : 
                                                                                 module.status === 'in_progress' ? 'Berlangsung' : 
                                                                                 'Belum Mulai'}
                                                                            </span>
                                                                        </div>
                                                                        
                                                                        {/* Progress Bar */}
                                                                        <div className="flex items-center gap-3 mt-3">
                                                                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                                <div 
                                                                                    className={`h-full rounded-full ${
                                                                                        module.status === 'completed' ? 'bg-emerald-500' : 
                                                                                        module.status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-300'
                                                                                    }`}
                                                                                    style={{ width: `${module.progress || 0}%` }}
                                                                                ></div>
                                                                            </div>
                                                                            <span className="text-xs font-bold text-slate-600">{module.progress || 0}%</span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Score & Action */}
                                                                    <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                                                                        <div className="text-center">
                                                                            <p className="text-xs text-slate-400 font-bold uppercase">Skor</p>
                                                                            <p className={`text-xl font-black ${module.score >= 80 ? 'text-[#005E54]' : 'text-slate-700'}`}>
                                                                                {module.score > 0 ? module.score : '-'}
                                                                            </p>
                                                                        </div>
                                                                        <button 
                                                                            onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                                                                            className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-[#005E54] transition"
                                                                        >
                                                                            <ChevronDown 
                                                                                size={20} 
                                                                                className={`transition-transform ${expandedModule === module.id ? 'rotate-180' : ''}`}
                                                                            />
                                                                        </button>
                                                                    </div>

                                                                </div>

                                                                {/* Expanded Materials */}
                                                                {expandedModule === module.id && module.materials && (
                                                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                                                        <h5 className="text-sm font-bold text-slate-700 mb-3">Materi Pembelajaran</h5>
                                                                        <div className="space-y-2">
                                                                            {module.materials.map((material) => (
                                                                                <div key={material.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                                                    <div className="flex items-center gap-3">
                                                                                        <div className="text-slate-400">
                                                                                            {material.completed ? <CheckCircle size={16} className="text-emerald-500" /> : <AlertCircle size={16} />}
                                                                                        </div>
                                                                                        <span className="text-sm font-medium text-slate-700">{material.name}</span>
                                                                                    </div>
                                                                                    {material.score && (
                                                                                        <span className="text-xs font-bold text-[#005E54]">{material.score}%</span>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-center py-12 text-gray-500">
                                                            <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
                                                            <p>Belum ada data modul untuk program ini</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </AppLayout>
    );
}
