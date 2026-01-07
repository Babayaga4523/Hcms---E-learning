import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    BarChart3, LineChart as LineIcon, PieChart as PieIcon, TrendingUp,
    Download, RefreshCw, Calendar, Filter, Search, FileText,
    CheckCircle, AlertCircle, Clock, Award, ChevronDown,
    Zap, MoreHorizontal, ArrowUpRight, ArrowDownRight, Shield,
    Users, Layout, HelpCircle
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
    ResponsiveContainer, BarChart, Bar, Cell, RadialBarChart, RadialBar, Legend,
    PieChart, Pie, LineChart, Line
} from 'recharts';


// --- Wondr Style System ---
const WondrStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F8F9FA; color: #1e293b; }
        
        .wondr-dark { background-color: #002824; }
        .wondr-green { color: #005E54; }
        .wondr-lime-bg { background-color: #D6F84C; color: #002824; }
        .wondr-lime-text { color: #D6F84C; }
        
        .glass-card {
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
            box-shadow: 0 4px 12px -2px rgba(0, 40, 36, 0.2);
        }

        .animate-fade-up { animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }

        .progress-bar { transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    `}</style>
);

// AI Insights mock data (will be replaced with backend in future)
const MOCK_AI_INSIGHTS = [
    { type: 'positive', text: 'Tingkat penyelesaian modul "Anti-Fraud" meningkat 15% minggu ini.', impact: 'High' },
    { type: 'negative', text: 'Departemen IT memiliki tingkat keterlambatan tertinggi (24%) pada modul K3.', impact: 'Medium' },
    { type: 'neutral', text: 'Rata-rata durasi pengerjaan kuis semakin cepat, indikasi materi mudah dipahami.', impact: 'Low' },
];

// --- Components ---

const StatCard = ({ label, value, icon: Icon, trend, trendValue, color, delay }) => {
    const colors = {
        green: { bg: 'bg-[#F0FDF4]', text: 'text-[#005E54]', icon: '#005E54' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: '#2563eb' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: '#9333ea' },
        orange: { bg: 'bg-orange-50', text: 'text-orange-700', icon: '#ea580c' },
    };
    const theme = colors[color] || colors.green;

    return (
        <div 
            className="glass-card p-5 rounded-[24px] flex flex-col justify-between h-full animate-fade-up hover:translate-y-[-4px] transition-transform"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${theme.bg} ${theme.text}`}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend && (
                    <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                        {trendValue}
                    </div>
                )}
            </div>
            <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
                <h3 className="text-3xl font-extrabold text-slate-900">{value}</h3>
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
                        <span className="capitalize">{entry.name}:</span>
                        <span className="font-bold">{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// --- Main Component ---

export default function ReportsCompliance({ auth, stats, learnerProgress, questionPerformance, trendData, complianceDistribution, comparisonData, departments }) {
    // State
    const [activeTab, setActiveTab] = useState('overview');
    const [dateRange, setDateRange] = useState('30D');
    const [isLoading, setIsLoading] = useState(false);

    // Debug log to see what data we receive
    console.log('Reports Compliance Data:', {
        stats,
        learnerProgress,
        questionPerformance,
        trendData,
        complianceDistribution,
        comparisonData
    });

    // Use real data from props with fallbacks - ensure stats exists
    const displayStats = stats ? {
        totalLearners: stats.total_users || 0,
        activeLearners: stats.active_users || 0,
        avgCompletion: Math.round(stats.avg_completion || 0),
        avgScore: Math.round(stats.avg_score || 0),
        complianceStatus: Math.round(stats.compliance_rate || 0),
    } : {
        totalLearners: 0,
        activeLearners: 0,
        avgCompletion: 0,
        avgScore: 0,
        complianceStatus: 0,
    };

    // Format trend data from backend
    const formattedTrendData = Array.isArray(trendData) && trendData.length > 0 ? trendData.map(item => ({
        name: item.day_name || item.name,
        completion: parseInt(item.completion) || 0,
        score: parseInt(item.score) || 0
    })) : [];

    // Format compliance data
    const formattedComplianceData = Array.isArray(complianceDistribution) && complianceDistribution.length > 0 ? complianceDistribution.map((item, index) => ({
        name: item.name,
        value: item.value,
        fill: ['#005E54', '#EAB308', '#EF4444'][index] || '#005E54'
    })) : [
        { name: 'No Data', value: 1, fill: '#CBD5E1' }
    ];

    // Format learner progress
    const formattedLearnerProgress = Array.isArray(learnerProgress) && learnerProgress.length > 0 ? learnerProgress.map(learner => ({
        id: learner.id,
        name: learner.name,
        department: learner.department || 'N/A',
        modules_enrolled: learner.modules_enrolled || 0,
        modules_completed: learner.modules_completed || 0,
        avg_score: learner.avg_score || 0,
        last_active: learner.last_active ? new Date(learner.last_active).toLocaleString('id-ID') : 'N/A',
        status: learner.status || 'active'
    })) : [];

    // Format question performance
    const formattedQuestionPerformance = Array.isArray(questionPerformance) && questionPerformance.length > 0 ? questionPerformance.map(q => ({
        id: `Q${q.id}`,
        question: q.question_text?.substring(0, 50) + '...' || 'N/A',
        correct: parseInt(q.correct_percentage) || 0,
        incorrect: parseInt(q.incorrect_percentage) || 0
    })) : [];

    // Format comparison data
    const formattedComparisonData = Array.isArray(comparisonData) && comparisonData.length > 0 ? comparisonData : [];

    // Mock Fetch
    const refreshData = () => {
        setIsLoading(true);
        window.location.reload();
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-[#F8F9FA] pb-20 font-sans">
                <WondrStyles />

                {/* --- Hero Header --- */}
                <div className="bg-[#002824] pt-8 pb-32 px-6 lg:px-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#005E54] rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/4"></div>
                    
                    <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
                        <div>
                            <div className="flex items-center gap-2 text-[#D6F84C] mb-2 font-bold text-xs tracking-widest uppercase">
                                <TrendingUp className="w-4 h-4" /> Executive Dashboard
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight">
                                Reports & <br /> Compliance
                            </h1>
                        </div>
                        
                        <div className="flex flex-wrap gap-3">
                            <div className="bg-white/10 backdrop-blur-md p-1 rounded-xl flex border border-white/10">
                                {['7D', '30D', 'Q1', 'YTD'].map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => setDateRange(r)}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                            dateRange === r ? 'bg-[#D6F84C] text-[#002824]' : 'text-slate-300 hover:text-white'
                                        }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={refreshData}
                                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/10 transition-all"
                            >
                                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                            <button className="flex items-center gap-2 px-6 py-3 bg-[#D6F84C] hover:bg-[#c2e43c] text-[#002824] rounded-xl font-bold shadow-lg transition-all hover:scale-105">
                                <Download className="w-4 h-4" /> Export Report
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- Main Content --- */}
                <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-20 space-y-8">
                    
                    {/* 1. KPI Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <StatCard label="Total Learners" value={displayStats.totalLearners.toLocaleString()} icon={Users} color="blue" delay={0} />
                        <StatCard label="Active Now" value={displayStats.activeLearners} icon={Zap} color="green" delay={100} />
                        <StatCard label="Completion Rate" value={`${displayStats.avgCompletion}%`} icon={CheckCircle} color="purple" delay={200} />
                        <StatCard label="Avg Score" value={displayStats.avgScore} icon={Award} color="orange" delay={300} />
                        <StatCard label="Compliance" value={`${displayStats.complianceStatus}%`} icon={Shield} color="green" delay={400} />
                    </div>

                    {/* 2. Tabs Navigation */}
                    <div className="bg-white rounded-[20px] p-2 shadow-sm border border-slate-100 flex overflow-x-auto no-scrollbar gap-2">
                        {[
                            { id: 'overview', label: 'Overview', icon: BarChart3 },
                            { id: 'learner-progress', label: 'Learner Progress', icon: Users },
                            { id: 'question-analysis', label: 'Question Analysis', icon: HelpCircle },
                            { id: 'comparison', label: 'Comparison', icon: LineIcon },
                            { id: 'ai-insights', label: 'AI Insights', icon: Zap },
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
                    
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-up">
                            {/* Main Trend Chart */}
                            <div className="lg:col-span-2 glass-card rounded-[32px] p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">Learning Activity Trends</h3>
                                        <p className="text-sm text-slate-500">Completion vs Score Performance</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-bold">
                                        <span className="w-3 h-3 rounded-full bg-[#005E54]"></span> Completion
                                        <span className="w-3 h-3 rounded-full bg-[#D6F84C] ml-2"></span> Score
                                    </div>
                                </div>
                                <div className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={300}>
                                        <AreaChart data={formattedTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#005E54" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#005E54" stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#D6F84C" stopOpacity={0.4}/>
                                                    <stop offset="95%" stopColor="#D6F84C" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                                            <RechartsTooltip content={<CustomTooltip />} />
                                            <Area type="monotone" dataKey="completion" stroke="#005E54" strokeWidth={3} fillOpacity={1} fill="url(#colorComp)" />
                                            <Area type="monotone" dataKey="score" stroke="#84cc16" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Compliance Status Chart - Donut */}
                            <div className="glass-card rounded-[32px] p-8 flex flex-col">
                                <div className="mb-4">
                                    <h3 className="text-xl font-bold text-slate-900 mb-1">Compliance Status</h3>
                                    <p className="text-sm text-slate-500">Distribution across departments</p>
                                </div>
                                
                                <div className="flex-1 min-h-[250px] relative">
                                    <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                                        <PieChart>
                                            <Pie
                                                data={formattedComplianceData}
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                                cornerRadius={6}
                                                startAngle={90}
                                                endAngle={-270}
                                            >
                                                {formattedComplianceData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip 
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
                                                itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                                            />
                                            <Legend 
                                                verticalAlign="bottom" 
                                                height={36}
                                                iconType="circle"
                                                iconSize={8}
                                                formatter={(value) => <span className="text-slate-600 font-bold text-xs ml-1">{value}</span>}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                                        <div className="text-center">
                                            <p className="text-3xl font-extrabold text-slate-900 leading-none">{displayStats.complianceStatus}%</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'learner-progress' && (
                        <div className="glass-card rounded-[32px] p-8 animate-fade-up">
                            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">Learner Progress Detail</h3>
                                    <p className="text-sm text-slate-500">Individual performance metrics and status.</p>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input type="text" placeholder="Search learner..." className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-600 w-64 focus:ring-2 focus:ring-[#005E54]/20 outline-none" />
                                </div>
                            </div>

                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-400 uppercase bg-slate-50/50">
                                        <tr>
                                            <th className="px-6 py-3 font-bold rounded-l-xl">Nama Peserta</th>
                                            <th className="px-6 py-3 font-bold">Departemen</th>
                                            <th className="px-6 py-3 font-bold">Modul Selesai</th>
                                            <th className="px-6 py-3 font-bold">Avg. Score</th>
                                            <th className="px-6 py-3 font-bold text-center rounded-r-xl">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {formattedLearnerProgress.length > 0 ? (
                                            formattedLearnerProgress.map((learner) => (
                                                <tr key={learner.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-6 py-4 font-bold text-slate-900">{learner.name}</td>
                                                    <td className="px-6 py-4 text-slate-500">{learner.department}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                                <div 
                                                                    className="h-full bg-[#005E54] rounded-full progress-bar" 
                                                                    style={{ width: `${learner.modules_enrolled > 0 ? (learner.modules_completed / learner.modules_enrolled) * 100 : 0}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-600">{learner.modules_completed}/{learner.modules_enrolled}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-slate-700">{learner.avg_score}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                                                            learner.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                            {learner.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <Users className="w-12 h-12 text-slate-300" />
                                                        <p className="text-slate-500 font-bold">Belum ada data learner progress</p>
                                                        <p className="text-xs text-slate-400">Data akan muncul setelah ada user yang mendaftar di training program</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'question-analysis' && (
                        <div className="glass-card rounded-[32px] p-8 animate-fade-up">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">Question Difficulty Analysis</h3>
                                    <p className="text-sm text-slate-500">Identifying knowledge gaps through item analysis.</p>
                                </div>
                            </div>
                            
                            {formattedQuestionPerformance.length > 0 ? (
                                <>
                                    <div className="h-[400px] w-full mb-8">
                                        <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={300}>
                                            <BarChart data={formattedQuestionPerformance} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="id" type="category" width={40} tick={{fill: '#64748B', fontWeight: 'bold'}} />
                                                <RechartsTooltip 
                                                    cursor={{fill: 'transparent'}}
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            const data = payload[0].payload;
                                                            return (
                                                                <div className="chart-tooltip max-w-xs">
                                                                    <p className="font-bold text-xs text-[#D6F84C] mb-1">{data.id}</p>
                                                                    <p className="text-xs mb-2">{data.question}</p>
                                                                    <div className="flex justify-between text-xs font-bold">
                                                                        <span className="text-green-400">Correct: {data.correct}%</span>
                                                                        <span className="text-red-400">Incorrect: {data.incorrect}%</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                <Legend />
                                                <Bar dataKey="correct" name="Benar (%)" stackId="a" fill="#005E54" radius={[0, 4, 4, 0]} barSize={20} />
                                                <Bar dataKey="incorrect" name="Salah (%)" stackId="a" fill="#EF4444" radius={[0, 4, 4, 0]} barSize={20} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {formattedQuestionPerformance.filter(q => q.incorrect > 30).map(q => (
                                            <div key={q.id} className="p-4 bg-red-50 rounded-xl border border-red-100 flex gap-3 items-start">
                                                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-xs font-bold text-red-800 mb-1">Perlu Perhatian: {q.id}</p>
                                                    <p className="text-sm text-red-700 font-medium">{q.question}</p>
                                                    <p className="text-xs text-red-600 mt-1">Tingkat Kesalahan: {q.incorrect}%</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="h-[400px] flex flex-col items-center justify-center">
                                    <HelpCircle className="w-16 h-16 text-slate-300 mb-4" />
                                    <p className="text-slate-500 font-bold text-lg mb-2">Belum ada data analisis soal</p>
                                    <p className="text-sm text-slate-400 max-w-md text-center">
                                        Data akan muncul setelah ada user yang mengerjakan kuis atau exam
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'comparison' && (
                        <div className="glass-card rounded-[32px] p-8 animate-fade-up">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">Period Comparison</h3>
                                    <p className="text-sm text-slate-500">Enrollment growth: Current vs Previous Period.</p>
                                </div>
                            </div>
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={300}>
                                    <BarChart data={formattedComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                                        <RechartsTooltip cursor={{fill: '#F1F5F9'}} content={<CustomTooltip />} />
                                        <Legend />
                                        <Bar dataKey="current" name="Periode Ini" fill="#005E54" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="previous" name="Periode Lalu" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ai-insights' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-up">
                            <div className="glass-card rounded-[32px] p-8 bg-gradient-to-br from-white to-[#F0FDF4]">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-[#005E54] rounded-2xl text-[#D6F84C]">
                                        <Zap className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">AI Analysis Summary</h3>
                                        <p className="text-sm text-slate-500">Automated insights based on last 30 days</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {MOCK_AI_INSIGHTS.map((insight, idx) => (
                                        <div key={idx} className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                                    insight.type === 'positive' ? 'bg-green-100 text-green-700' : 
                                                    insight.type === 'negative' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {insight.type} Signal
                                                </span>
                                                <span className="text-xs text-slate-400 font-bold">Impact: {insight.impact}</span>
                                            </div>
                                            <p className="text-slate-700 font-medium leading-relaxed">
                                                {insight.text}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                
                                <button className="w-full mt-6 py-4 rounded-xl bg-[#002824] text-[#D6F84C] font-bold text-sm shadow-lg hover:scale-[1.02] transition-transform">
                                    Generate Full AI Report
                                </button>
                            </div>

                            <div className="glass-card rounded-[32px] p-8 flex flex-col justify-center items-center text-center">
                                <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                    <FileText className="w-12 h-12 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Custom Report Builder</h3>
                                <p className="text-slate-500 max-w-sm mb-8">
                                    Drag and drop metrics to create personalized dashboards for your department.
                                </p>
                                <button className="px-8 py-3 border-2 border-slate-200 rounded-xl text-slate-600 font-bold hover:border-[#005E54] hover:text-[#005E54] transition-colors">
                                    Start Building
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </AdminLayout>
    );
}
