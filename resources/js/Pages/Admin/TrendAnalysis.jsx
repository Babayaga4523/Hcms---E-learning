import React, { useState, useEffect, useMemo } from 'react';
import { 
    LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, 
    CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { 
    ArrowUpRight, ArrowDownRight, Calendar, Download, 
    Filter, TrendingUp, Users, BookOpen, Activity, 
    MoreHorizontal, Sparkles, Zap, ChevronDown 
} from 'lucide-react';

// --- Wondr Style System ---
const WondrStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F8F9FA; color: #1e293b; }
        
        .wondr-dark { background-color: #002824; }
        .wondr-green { color: #005E54; }
        .wondr-lime { color: #D6F84C; }
        
        .glass-card {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.6);
            box-shadow: 0 10px 30px -10px rgba(0, 40, 36, 0.05);
        }

        .chart-tooltip {
            background: rgba(0, 40, 36, 0.95);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: white;
            border-radius: 12px;
            padding: 12px;
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }

        .tab-segment {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .tab-segment.active {
            background-color: #002824;
            color: #D6F84C;
            box-shadow: 0 4px 12px -2px rgba(0, 40, 36, 0.2);
        }

        .animate-fade-up { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `}</style>
);

// --- Mock Data Generators ---
const generateData = (days) => {
    const data = [];
    const now = new Date();
    for (let i = days; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        data.push({
            date: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
            enrollments: Math.floor(Math.random() * 50) + 20 + (i * 0.5),
            completions: Math.floor(Math.random() * 40) + 10 + (i * 0.3),
            active_learners: Math.floor(Math.random() * 100) + 150,
            engagement: Math.floor(Math.random() * 30) + 60,
        });
    }
    return data;
};

// --- Components ---

const KPICard = ({ title, value, change, icon: Icon, trend = 'up', delay }) => (
    <div 
        className="glass-card p-6 rounded-[24px] flex flex-col justify-between h-full animate-fade-up hover:translate-y-[-4px] transition-transform duration-300"
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-[#F0FDF4] rounded-2xl text-[#005E54]">
                <Icon className="w-6 h-6" />
            </div>
            <div className={`flex items-center text-sm font-bold px-2 py-1 rounded-full ${trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {trend === 'up' ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                {change}%
            </div>
        </div>
        <div>
            <p className="text-slate-500 text-sm font-semibold mb-1">{title}</p>
            <h3 className="text-3xl font-extrabold text-slate-900">{value}</h3>
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="chart-tooltip">
                <p className="font-bold text-sm mb-2 text-[#D6F84C]">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs mb-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                        <span className="opacity-80 capitalize">{entry.name.replace('_', ' ')}:</span>
                        <span className="font-bold">{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// --- Main Layout ---

export default function TrendAnalysis() {
    // State
    const [range, setRange] = useState(30); // days
    const [chartType, setChartType] = useState('area'); // area | bar
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);

    // Simulate Data Fetching
    useEffect(() => {
        setLoading(true);
        // Simulate API delay
        setTimeout(() => {
            setData(generateData(range));
            setLoading(false);
        }, 600);
    }, [range]);

    // Derived Stats
    const totalEnrollments = useMemo(() => data.reduce((acc, curr) => acc + curr.enrollments, 0), [data]);
    const avgCompletion = useMemo(() => Math.round(data.reduce((acc, curr) => acc + curr.completions, 0) / data.length), [data]);

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-20 font-sans">
            <WondrStyles />

            {/* --- Header Section --- */}
            <div className="bg-[#002824] pt-8 pb-32 px-6 lg:px-12 relative overflow-hidden">
                {/* Abstract Background */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#005E54] rounded-full blur-[120px] opacity-20 -translate-y-1/2 translate-x-1/4"></div>
                
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-2 text-[#D6F84C] mb-2 font-bold text-sm tracking-widest uppercase">
                            <Activity className="w-4 h-4" /> Analytics Dashboard
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight">
                            Analisis Tren <br /> & Performa
                        </h1>
                    </div>
                    
                    <div className="flex gap-3">
                        <div className="bg-white/10 backdrop-blur-md p-1 rounded-xl flex border border-white/10">
                            {[7, 30, 90, 365].map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setRange(r)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                        range === r ? 'bg-[#D6F84C] text-[#002824]' : 'text-slate-300 hover:text-white'
                                    }`}
                                >
                                    {r === 365 ? '1Y' : `${r}D`}
                                </button>
                            ))}
                        </div>
                        <button className="flex items-center gap-2 px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/10 font-bold transition-all">
                            <Download className="w-4 h-4" /> Export
                        </button>
                    </div>
                </div>
            </div>

            {/* --- Main Content --- */}
            <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-20 space-y-8">
                
                {/* 1. KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPICard 
                        title="Total Enrollments" 
                        value={totalEnrollments.toLocaleString()} 
                        change="12.5" 
                        icon={Users} 
                        delay={100} 
                    />
                    <KPICard 
                        title="Avg. Daily Active" 
                        value="842" 
                        change="5.2" 
                        icon={Zap} 
                        delay={200} 
                    />
                    <KPICard 
                        title="Completion Rate" 
                        value="78%" 
                        change="2.1" 
                        icon={BookOpen} 
                        delay={300} 
                    />
                    <KPICard 
                        title="Engagement Score" 
                        value="9.2" 
                        change="0.8" 
                        icon={TrendingUp} 
                        trend="down"
                        delay={400} 
                    />
                </div>

                {/* 2. Main Chart Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Primary Chart (2 cols) */}
                    <div className="lg:col-span-2 glass-card rounded-[32px] p-8 animate-fade-up" style={{ animationDelay: '500ms' }}>
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Pertumbuhan Peserta</h2>
                                <p className="text-sm text-slate-500">Perbandingan Enrollments vs Completions</p>
                            </div>
                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                <button 
                                    onClick={() => setChartType('area')}
                                    className={`p-2 rounded-lg transition-all ${chartType === 'area' ? 'bg-white shadow text-[#005E54]' : 'text-slate-400'}`}
                                >
                                    <TrendingUp className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => setChartType('bar')}
                                    className={`p-2 rounded-lg transition-all ${chartType === 'bar' ? 'bg-white shadow text-[#005E54]' : 'text-slate-400'}`}
                                >
                                    <Activity className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="h-[350px] w-full">
                            {loading ? (
                                <div className="h-full w-full flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#005E54]"></div>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    {chartType === 'area' ? (
                                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorEnroll" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#005E54" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#005E54" stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#D6F84C" stopOpacity={0.4}/>
                                                    <stop offset="95%" stopColor="#D6F84C" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis 
                                                dataKey="date" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{fill: '#64748B', fontSize: 12}} 
                                                dy={10}
                                                minTickGap={30}
                                            />
                                            <YAxis 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{fill: '#64748B', fontSize: 12}} 
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Area 
                                                type="monotone" 
                                                dataKey="enrollments" 
                                                stroke="#005E54" 
                                                strokeWidth={3} 
                                                fillOpacity={1} 
                                                fill="url(#colorEnroll)" 
                                                activeDot={{ r: 6, strokeWidth: 0, fill: '#005E54' }}
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="completions" 
                                                stroke="#84cc16" 
                                                strokeWidth={3} 
                                                fillOpacity={1} 
                                                fill="url(#colorComp)" 
                                            />
                                        </AreaChart>
                                    ) : (
                                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} minTickGap={30}/>
                                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="enrollments" fill="#005E54" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="completions" fill="#D6F84C" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    )}
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* AI Insights Panel (1 col) */}
                    <div className="glass-card rounded-[32px] p-8 animate-fade-up space-y-6 flex flex-col" style={{ animationDelay: '600ms' }}>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">AI Insights</h2>
                        </div>

                        <div className="space-y-4 flex-1">
                            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                <h4 className="font-bold text-slate-800 text-sm mb-1">Lonjakan Aktivitas</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Terdeteksi peningkatan enrollments sebesar <strong>24%</strong> pada akhir pekan lalu. Pertimbangkan merilis materi baru di hari Jumat.
                                </p>
                            </div>
                            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                <h4 className="font-bold text-slate-800 text-sm mb-1">Prediksi Retensi</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Berdasarkan tren saat ini, tingkat penyelesaian diprediksi naik menjadi <strong>82%</strong> bulan depan.
                                </p>
                            </div>
                            <div className="p-4 bg-red-50 rounded-2xl border border-red-100 shadow-sm">
                                <h4 className="font-bold text-red-800 text-sm mb-1">Perhatian Diperlukan</h4>
                                <p className="text-xs text-red-700 leading-relaxed">
                                    Kategori "Leadership" mengalami penurunan engagement selama 3 hari terakhir.
                                </p>
                            </div>
                        </div>

                        <button className="w-full py-3 rounded-xl bg-[#002824] text-[#D6F84C] font-bold text-sm hover:scale-[1.02] transition-transform">
                            Generate Full Report
                        </button>
                    </div>
                </div>

                {/* 3. Secondary Metrics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
                    <div className="glass-card rounded-[32px] p-8 animate-fade-up" style={{ animationDelay: '700ms' }}>
                        <h3 className="font-bold text-slate-900 mb-6">Top Performing Categories</h3>
                        <div className="space-y-6">
                            {[
                                { name: 'Compliance', val: 92, color: 'bg-emerald-500' },
                                { name: 'Product Knowledge', val: 78, color: 'bg-blue-500' },
                                { name: 'Soft Skills', val: 64, color: 'bg-amber-500' },
                                { name: 'Technical', val: 45, color: 'bg-rose-500' },
                            ].map((cat) => (
                                <div key={cat.name}>
                                    <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                                        <span>{cat.name}</span>
                                        <span>{cat.val}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-3">
                                        <div 
                                            className={`h-3 rounded-full ${cat.color}`} 
                                            style={{ width: `${cat.val}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-card rounded-[32px] p-8 animate-fade-up" style={{ animationDelay: '800ms' }}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-slate-900">User Activity Heatmap</h3>
                            <select className="bg-slate-50 border-none text-xs font-bold text-slate-600 rounded-lg py-1 px-2">
                                <option>Weekly</option>
                                <option>Monthly</option>
                            </select>
                        </div>
                        <div className="h-[200px] w-full flex items-end gap-2">
                            {/* Visual Mockup for Heatmap/Bar */}
                            {Array.from({ length: 20 }).map((_, i) => (
                                <div 
                                    key={i} 
                                    className="flex-1 bg-[#D6F84C] rounded-t-lg hover:bg-[#005E54] transition-colors"
                                    style={{ 
                                        height: `${Math.random() * 80 + 20}%`, 
                                        opacity: Math.random() * 0.5 + 0.5 
                                    }}
                                ></div>
                            ))}
                        </div>
                        <p className="text-center text-xs text-slate-400 mt-4 font-medium">Activity Distribution (00:00 - 23:59)</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
