import React, { useState, useEffect } from 'react';
import {
    BarChart3, Users, Award, TrendingUp, Download, RefreshCw,
    Calendar, Search, CheckCircle, AlertCircle, Clock, Zap,
    BookOpen, Target, Activity, PieChart as PieIcon, LineChart as LineIcon,
    ArrowUp, ArrowDown, Eye, Filter, X, Printer, Share2, Shield, ChevronDown, Trophy,
    AlertTriangle, CheckCircle2, Map, Layers, ChevronUp, FileText, AlertOctagon
} from 'lucide-react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    ScatterChart, Scatter
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/Layouts/AdminLayout';

// --- Wondr Style System ---
const WondrStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F8FAFC; color: #1e293b; }
        
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

        .hero-pattern {
            background-color: #002824;
            background-image: radial-gradient(#005E54 1px, transparent 1px);
            background-size: 24px 24px;
        }

        .tab-pill { transition: all 0.3s ease; }
        .tab-pill.active { background-color: #002824; color: #D6F84C; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

        .animate-enter { animation: enter 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        @keyframes enter {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
        
        .alert-banner {
            background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%);
            border-left: 4px solid #FEE2E2;
        }
        
        .expandable-section {
            max-height: 9999px;
            transition: max-height 0.3s ease;
        }
        
        .expandable-section.collapsed {
            max-height: 0;
            overflow: hidden;
        }
    `}</style>
);

// --- Helper Components ---

const StatCardPremium = ({ icon: Icon, label, value, color = 'green', trend = null, trendValue = null, delay = 0 }) => {
    const colors = {
        green: { bg: 'bg-[#F0FDF4]', text: 'text-[#005E54]', border: 'border-[#D1FAE5]' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
        orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
        red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    };
    const theme = colors[color] || colors.green;

    return (
        <div 
            className={`glass-panel p-6 rounded-2xl border ${theme.border} animate-enter hover:shadow-lg transition-all`}
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className={`text-xs font-bold uppercase tracking-wider ${theme.text}`}>{label}</p>
                    <p className="text-3xl font-extrabold text-slate-900 mt-3">{value}</p>
                    {trend && (
                        <div className="flex items-center gap-2 mt-3">
                            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                                trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                                {trend === 'up' ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                                {trendValue}
                            </div>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-xl ${theme.bg} ${theme.text}`}>
                    <Icon className="w-6 h-6" />
                </div>
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
                        <span className="font-bold">{typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function UnifiedReports({
    stats: initialStats,
    trendData,
    departmentLeaderboard: initialLeaderboard,
    learnerProgress,
    examPerformance,
    questionPerformance,
    prePostAnalysis,
    learningImpactSummary,
    atRiskUsers: initialAtRisk,
    certificateStats: initialCertStats,
    questionItemAnalysis,
    moduleStats,
    topPerformers,
    strugglers,
    usersByDepartment,
    usersByStatus,
    engagementScore,
    departmentPassRates,
    overdueTraining,
    overdueCount,
    atRiskCount,
    urgentCount,
    learningDurationStats,
    lastWeekEnrollments,
    lastWeekCompletions,
    dropoutPredictions,
    peakPerformanceTime,
    dateRange = { start: null, end: null }
}) {
    // --- Real Data from Backend ---
    const stats = initialStats || {};
    const departmentLeaderboard = initialLeaderboard || [];
    const atRiskUsers = initialAtRisk || [];
    const certStats = initialCertStats || {};
    const qItemAnalysis = questionItemAnalysis || [];
    const trendChartData = trendData || [];
    const prePostData = prePostAnalysis || [];
    const learningImpact = learningImpactSummary || {};
    const moduleData = moduleStats || [];
    const learnerData = learnerProgress || [];
    const riskUsers = atRiskUsers || [];
    const durationStats = learningDurationStats || [];
    const overdueData = overdueTraining || [];
    const dropoutData = dropoutPredictions || [];
    const peakData = peakPerformanceTime || {};

    // --- State ---
    const [activeTab, setActiveTab] = useState('executive');
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [expandedDepts, setExpandedDepts] = useState({});
    const [filterDept, setFilterDept] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        setAnalyticsLoading(true);
        const timer = setTimeout(() => setAnalyticsLoading(false), 500);
        return () => clearTimeout(timer);
    }, [activeTab]);

    const toggleDept = (dept) => {
        setExpandedDepts(prev => ({ ...prev, [dept]: !prev[dept] }));
    };

    // Initialize with backend date range if available, otherwise use 30 days
    const [exportDateRange, setExportDateRange] = React.useState({
        startDate: dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: dateRange?.end || new Date().toISOString().split('T')[0],
        showDatePicker: false
    });

    const exportTabData = async (format, tabName) => {
        try {
            if (format === 'excel') {
                // Handle "Export All" vs specific tabs
                let url;
                const queryParams = new URLSearchParams({
                    start_date: exportDateRange.startDate,
                    end_date: exportDateRange.endDate
                });

                if (tabName === 'All') {
                    url = `/admin/reports/unified/export-excel?${queryParams.toString()}`;
                } else {
                    // Map tab names to backend endpoint
                    const tabMap = {
                        'Executive': 'executive',
                        'Learners': 'learners', 
                        'Learning': 'learning',
                        'Compliance': 'compliance',
                        'Certificates': 'certificates',
                        'Overdue': 'overdue',
                        'Questions': 'questions',
                        'Dropout Risk': 'dropout',
                        'Peak Time': 'peaktime'
                    };

                    const tabKey = tabMap[tabName] || tabName.toLowerCase().replace(' ', '');
                    url = `/admin/reports/unified/export-tab/${tabKey}?${queryParams.toString()}`;
                }
                
                window.location.href = url;
            } else if (format === 'pdf') {
                alert('PDF export coming soon!');
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('Export failed: ' + error.message);
        }
    };

    // --- RENDER: Date Range Filter Component ---
    const DateRangeFilter = () => (
        <div className="bg-gradient-to-r from-[#005E54]/10 to-[#003d38]/10 rounded-[16px] p-6 mb-6 border border-[#005E54]/20">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <Calendar size={20} className="text-[#005E54]" />
                    <span className="font-bold text-gray-700">Filter Periode Data:</span>
                </div>
                
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex flex-col">
                        <label className="text-xs font-semibold text-gray-600 mb-1">Dari Tanggal</label>
                        <input
                            type="date"
                            value={exportDateRange.startDate}
                            onChange={(e) => setExportDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                            className="px-3 py-2 border border-[#005E54]/30 rounded-lg bg-white text-gray-700 font-medium hover:border-[#005E54]/60 transition"
                        />
                    </div>

                    <div className="flex items-center justify-center pt-6">
                        <div className="text-gray-400 font-bold">→</div>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-xs font-semibold text-gray-600 mb-1">Sampai Tanggal</label>
                        <input
                            type="date"
                            value={exportDateRange.endDate}
                            onChange={(e) => setExportDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                            className="px-3 py-2 border border-[#005E54]/30 rounded-lg bg-white text-gray-700 font-medium hover:border-[#005E54]/60 transition"
                        />
                    </div>

                    <button
                        onClick={() => {
                            const endDate = new Date();
                            const startDate = new Date(endDate);
                            startDate.setDate(startDate.getDate() - 7);
                            setExportDateRange(prev => ({
                                ...prev,
                                startDate: startDate.toISOString().split('T')[0],
                                endDate: endDate.toISOString().split('T')[0]
                            }));
                        }}
                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition text-sm h-fit"
                    >
                        7 Hari
                    </button>

                    <button
                        onClick={() => {
                            const endDate = new Date();
                            const startDate = new Date(endDate);
                            startDate.setMonth(startDate.getMonth() - 1);
                            setExportDateRange(prev => ({
                                ...prev,
                                startDate: startDate.toISOString().split('T')[0],
                                endDate: endDate.toISOString().split('T')[0]
                            }));
                        }}
                        className="px-3 py-2 bg-[#005E54] text-white rounded-lg font-medium hover:bg-[#003d38] transition text-sm h-fit"
                    >
                        1 Bulan
                    </button>
                </div>
            </div>
            <p className="text-xs text-gray-600 mt-3">Data yang ditampilkan: <strong>{exportDateRange.startDate}</strong> hingga <strong>{exportDateRange.endDate}</strong></p>
        </div>
    );

    // --- RENDER: Executive Dashboard ---
    const renderExecutiveDashboard = () => (
        <div className="space-y-8 animate-enter">
            {/* Date Range Filter */}
            <DateRangeFilter />
            {/* Alert Banner for At-Risk Users */}
            {atRiskCount > 0 && (
                <div className="alert-banner text-white p-6 rounded-[24px] flex items-start gap-4">
                    <AlertOctagon className="w-6 h-6 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">⚠️ Pengguna Berisiko Mendesak</h3>
                        <p className="text-red-100 mb-3">Ada {urgentCount} pengguna dengan status urgent dan {overdueCount} training yang terlewat lebih dari 30 hari.</p>
                        <button onClick={() => setActiveTab('compliance')} className="px-4 py-2 bg-white text-red-600 rounded-lg font-bold hover:bg-red-50 transition text-sm">
                            Lihat Detail Compliance →
                        </button>
                    </div>
                </div>
            )}

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCardPremium icon={Users} label="Total User" value={stats.total_users || 0} color="blue" delay={0} />
                <StatCardPremium icon={TrendingUp} label="Completion Rate" value={`${stats.avg_completion || 0}%`} color="green" trend="up" trendValue="5%" delay={100} />
                <StatCardPremium icon={Zap} label="Engagement" value={`${engagementScore || 0}%`} color="orange" delay={200} />
                <StatCardPremium icon={AlertCircle} label="At Risk" value={atRiskCount || 0} color="red" delay={300} />
                <StatCardPremium icon={Shield} label="Compliance" value={`${stats.compliance_rate || 0}%`} color="purple" delay={400} />
            </div>

            {/* Leaderboard & Department Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Department Leaderboard */}
                <div className="glass-panel p-6 rounded-[24px]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-[#005E54]" /> Top Departments
                        </h3>
                        <button onClick={() => exportTabData('excel', 'Leaderboard')} className="text-xs text-[#005E54] hover:underline flex items-center gap-1">
                            <Download size={14} /> Export
                        </button>
                    </div>
                    <div className="space-y-3">
                        {departmentLeaderboard.slice(0, 5).map((dept, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-[#F0FDF4] transition">
                                <span className="text-2xl font-bold">{dept.badge || '⭐'}</span>
                                <div className="flex-1">
                                    <p className="font-bold text-slate-900">{dept.department}</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#005E54]" style={{ width: `${dept.completion_rate}%` }}></div>
                                        </div>
                                        <span className="text-xs font-bold text-[#005E54]">{dept.completion_rate}%</span>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-slate-600">{dept.total_users} users</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Department Comparison Chart */}
                {departmentLeaderboard.length > 0 && (
                    <div className="glass-panel p-6 rounded-[24px]">
                        <h3 className="font-bold text-lg text-slate-900 mb-6 flex items-center gap-2">
                            <BarChart3 size={20} /> Perbandingan Departemen
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={departmentLeaderboard.slice(0, 10)}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="department" angle={-45} height={80} tick={{ fontSize: 12 }} />
                                <YAxis />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="completion_rate" fill="#005E54" name="Completion %" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* At-Risk Panel */}
            <div className="glass-panel p-6 rounded-[24px] border-l-4 border-red-500">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" /> Pengguna Berisiko
                    </h3>
                    <button onClick={() => exportTabData('excel', 'At-Risk')} className="text-xs text-red-600 hover:underline flex items-center gap-1">
                        <Download size={14} /> Export
                    </button>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {riskUsers.slice(0, 8).map((user, idx) => (
                        <div key={idx} className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-slate-900">{user.name}</h4>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                    user.risk_level === 'overdue' ? 'bg-red-200 text-red-700' : 'bg-orange-200 text-orange-700'
                                }`}>
                                    {user.risk_level}
                                </span>
                            </div>
                            <p className="text-xs text-slate-600">{user.department} • {user.days_inactive} hari tidak aktif</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    // --- RENDER: Learner Progress ---
    const renderLearnerProgress = () => (
        <div className="space-y-6 animate-enter">
            {/* Filters */}
            <div className="glass-panel p-4 rounded-[24px] flex gap-4 flex-wrap">
                <select 
                    value={filterDept}
                    onChange={(e) => setFilterDept(e.target.value)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium"
                >
                    <option value="all">All Departments</option>
                    {Array.from(new Set(learnerData?.map(l => l.department))).map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                    ))}
                </select>

                <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium"
                >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="pending">Pending</option>
                </select>

                <button onClick={() => exportTabData('excel', 'Learner Progress')} className="ml-auto flex items-center gap-2 px-4 py-2 bg-[#005E54] text-white rounded-lg font-bold hover:bg-[#003d38] transition text-sm">
                    <Download size={16} /> Export
                </button>
            </div>

            {/* Learner Groups by Department */}
            {Array.from(new Set(learnerData?.map(l => l.department))).filter(d => filterDept === 'all' || d === filterDept).map(dept => {
                const deptLearners = learnerData.filter(l => l.department === dept && (filterStatus === 'all' || l.status === filterStatus));
                const isExpanded = expandedDepts[dept];

                return (
                    <div key={dept} className="glass-panel rounded-[24px] overflow-hidden">
                        <button
                            onClick={() => toggleDept(dept)}
                            className="w-full p-6 flex justify-between items-center hover:bg-slate-50 transition font-bold"
                        >
                            <div>
                                <h3 className="text-lg text-slate-900">{dept}</h3>
                                <p className="text-xs text-slate-500">{deptLearners.length} karyawan</p>
                            </div>
                            {isExpanded ? <ChevronUp /> : <ChevronDown />}
                        </button>

                        {isExpanded && (
                            <div className="border-t p-6 bg-slate-50">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="text-xs font-bold text-slate-600 uppercase">
                                            <tr>
                                                <th className="text-left pb-3">Nama</th>
                                                <th className="text-center pb-3">Modul</th>
                                                <th className="text-center pb-3">Progress</th>
                                                <th className="text-center pb-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="space-y-2">
                                            {deptLearners.map((learner, idx) => (
                                                <tr key={idx} className="bg-white hover:bg-blue-50">
                                                    <td className="px-3 py-3 font-semibold">{learner.learner_name || learner.name}</td>
                                                    <td className="px-3 py-3 text-center">{learner.modules_completed || 0}/{learner.modules_enrolled || 0}</td>
                                                    <td className="px-3 py-3">
                                                        <div className="flex items-center gap-2 justify-center">
                                                            <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                                <div className="h-full bg-[#005E54]" style={{ width: `${learner.completion_percentage || 0}%` }}></div>
                                                            </div>
                                                            <span className="text-xs font-bold">{learner.completion_percentage || 0}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                            learner.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                            learner.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                            {learner.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    // --- RENDER: Certificate Analytics ---
    const renderCertificateAnalytics = () => (
        <div className="space-y-8 animate-enter">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCardPremium icon={Award} label="Total Issued" value={certStats.total_issued || 0} color="green" delay={0} />
                <StatCardPremium icon={CheckCircle2} label="Active" value={certStats.active || 0} color="blue" delay={100} />
                <StatCardPremium icon={Clock} label="Expired" value={certStats.expired || 0} color="orange" delay={200} />
                <StatCardPremium icon={AlertTriangle} label="Revoked" value={certStats.revoked || 0} color="red" delay={300} />
            </div>

            {/* Certificate Distribution Chart */}
            {certStats.total_issued > 0 && (
                <div className="glass-panel p-6 rounded-[24px]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-slate-900">Distribusi Sertifikat</h3>
                        <button onClick={() => exportTabData('excel', 'Certificates')} className="text-xs text-[#005E54] hover:underline flex items-center gap-1">
                            <Download size={14} /> Export
                        </button>
                    </div>
                    <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                            <Pie
                                data={[
                                    { name: 'Active', value: certStats.active || 0, fill: '#10b981' },
                                    { name: 'Expired', value: certStats.expired || 0, fill: '#f59e0b' },
                                    { name: 'Revoked', value: certStats.revoked || 0, fill: '#ef4444' }
                                ]}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value }) => `${name}: ${value}`}
                                outerRadius={100}
                            >
                                <Cell fill="#10b981" />
                                <Cell fill="#f59e0b" />
                                <Cell fill="#ef4444" />
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Certificates by Program */}
            {certStats.by_program && certStats.by_program.length > 0 && (
                <div className="glass-panel p-6 rounded-[24px]">
                    <h3 className="font-bold text-lg text-slate-900 mb-6">Sertifikat per Program</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr className="text-left text-xs font-bold text-slate-600 uppercase">
                                    <th className="px-4 py-3">Program</th>
                                    <th className="px-4 py-3 text-center">Jumlah</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {certStats.by_program.map((prog, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-semibold text-slate-900">{prog.name}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="px-3 py-1 bg-[#005E54] text-white rounded-full text-sm font-bold">{prog.count}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );

    // --- RENDER: Overdue Training ---
    const renderOverdueTraining = () => (
        <div className="space-y-8 animate-enter">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCardPremium icon={Clock} label="Total Overdue" value={overdueCount || 0} color="red" delay={0} />
                <StatCardPremium icon={AlertTriangle} label="Urgent (>30 hari)" value={overdueData.filter(o => o.days_enrolled > 30).length || 0} color="orange" delay={100} />
                <StatCardPremium icon={CheckCircle2} label="Warning (14-30 hari)" value={overdueData.filter(o => o.days_enrolled >= 14 && o.days_enrolled <= 30).length || 0} color="blue" delay={200} />
            </div>

            {/* Overdue Tracker Table */}
            {overdueData.length > 0 && (
                <div className="glass-panel p-6 rounded-[24px]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                            <Clock size={20} className="text-orange-600" /> Training Terlewat
                        </h3>
                        <button onClick={() => exportTabData('excel', 'Overdue')} className="text-xs text-[#005E54] hover:underline flex items-center gap-1">
                            <Download size={14} /> Export
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr className="text-left text-xs font-bold text-slate-600 uppercase">
                                    <th className="px-4 py-3">Karyawan</th>
                                    <th className="px-4 py-3">Departemen</th>
                                    <th className="px-4 py-3 text-center">Hari Terlewat</th>
                                    <th className="px-4 py-3 text-center">Level</th>
                                    <th className="px-4 py-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {overdueData.slice(0, 15).map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-semibold">{item.user_name || 'Unknown'}</td>
                                        <td className="px-4 py-3">{item.department || '-'}</td>
                                        <td className="px-4 py-3 text-center font-bold">{item.days_enrolled} hari</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                item.days_enrolled > 30 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                            }`}>
                                                {item.days_enrolled > 30 ? 'URGENT' : 'WARNING'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition font-bold">
                                                Notify
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );

    // --- RENDER: Learning Impact ---
    const renderLearningImpact = () => (
        <div className="space-y-8 animate-enter">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCardPremium 
                    icon={TrendingUp} 
                    label="Rata-rata Peningkatan" 
                    value={`${learningImpact.overall_improvement || 0}%`} 
                    color="green" 
                    delay={0} 
                />
                <StatCardPremium 
                    icon={Target} 
                    label="Modul Teranalisis" 
                    value={learningImpact.total_modules_with_tests || 0} 
                    color="blue" 
                    delay={100} 
                />
                <StatCardPremium 
                    icon={CheckCircle2} 
                    label="Modul Meningkat" 
                    value={learningImpact.modules_with_improvement || 0} 
                    color="orange" 
                    delay={200} 
                />
            </div>

            {prePostData.length > 0 && (
                <>
                    <div className="glass-panel p-6 rounded-[24px]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 size={20} /> Pre-Test vs Post-Test
                            </h3>
                            <button onClick={() => exportTabData('excel', 'Learning Impact')} className="text-xs text-[#005E54] hover:underline flex items-center gap-1">
                                <Download size={14} /> Export
                            </button>
                        </div>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={prePostData.slice(0, 10)}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="module_title" angle={-45} height={100} tick={{ fontSize: 11 }} />
                                <YAxis />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="avg_pretest" fill="#ef4444" name="Pre-Test" />
                                <Bar dataKey="avg_posttest" fill="#10b981" name="Post-Test" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="glass-panel p-6 rounded-[24px]">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Ranking Peningkatan</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50">
                                    <tr className="text-xs font-bold text-slate-600 uppercase">
                                        <th className="text-left px-4 py-3">Modul</th>
                                        <th className="text-center px-4 py-3">Pre</th>
                                        <th className="text-center px-4 py-3">Post</th>
                                        <th className="text-center px-4 py-3">Gain</th>
                                        <th className="text-center px-4 py-3">%</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {prePostData.slice(0, 10).map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-semibold">{item.module_title}</td>
                                            <td className="px-4 py-3 text-center">{item.avg_pretest.toFixed(1)}</td>
                                            <td className="px-4 py-3 text-center text-green-600 font-bold">{item.avg_posttest.toFixed(1)}</td>
                                            <td className="px-4 py-3 text-center">{item.improvement.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                    item.improvement_pct > 20 ? 'bg-green-100 text-green-700' :
                                                    item.improvement_pct > 5 ? 'bg-blue-100 text-blue-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {item.improvement_pct}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );

    // --- RENDER: Compliance ---
    const renderCompliance = () => (
        <div className="space-y-8 animate-enter">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCardPremium 
                    icon={Shield} 
                    label="Tingkat Kepatuhan" 
                    value={`${stats.compliance_rate || 0}%`} 
                    color="green" 
                    delay={0} 
                />
                <StatCardPremium 
                    icon={AlertTriangle} 
                    label="Pengguna Berisiko" 
                    value={atRiskCount || 0} 
                    color="red" 
                    delay={100} 
                />
                <StatCardPremium 
                    icon={Clock} 
                    label="Training Terlewat" 
                    value={overdueCount || 0} 
                    color="orange" 
                    delay={200} 
                />
            </div>

            {riskUsers.length > 0 && (
                <div className="glass-panel p-6 rounded-[24px] border-l-4 border-red-500">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                            <AlertTriangle size={20} className="text-red-600" /> Pengguna Berisiko
                        </h3>
                        <button onClick={() => exportTabData('excel', 'At-Risk')} className="text-xs text-red-600 hover:underline flex items-center gap-1">
                            <Download size={14} /> Export
                        </button>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {riskUsers.slice(0, 15).map((user, idx) => (
                            <div key={idx} className={`p-3 rounded-lg border-l-4 ${
                                user.risk_level === 'overdue' ? 'bg-red-50 border-red-500' :
                                user.risk_level === 'urgent' ? 'bg-orange-50 border-orange-500' :
                                'bg-yellow-50 border-yellow-500'
                            }`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-slate-900">{user.name}</h4>
                                        <p className="text-xs text-slate-600">{user.department} • {user.days_inactive} hari tidak aktif</p>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${
                                        user.risk_level === 'overdue' ? 'bg-red-200 text-red-700' :
                                        user.risk_level === 'urgent' ? 'bg-orange-200 text-orange-700' :
                                        'bg-yellow-200 text-yellow-700'
                                    }`}>
                                        {user.risk_level}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {departmentPassRates && departmentPassRates.length > 0 && (
                <div className="glass-panel p-6 rounded-[24px]">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Tingkat Kelulusan Departemen</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={departmentPassRates}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} height={80} tick={{ fontSize: 12 }} />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="pass_rate" fill="#10b981" name="Pass Rate %" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );

    // --- RENDER: Question Analysis ---
    const renderQuestionAnalysis = () => (
        <div className="space-y-8 animate-enter">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCardPremium 
                    icon={Target} 
                    label="Total Soal Teranalisis" 
                    value={qItemAnalysis.length} 
                    color="blue" 
                    delay={0} 
                />
                <StatCardPremium 
                    icon={AlertTriangle} 
                    label="Soal Kritis (>80%)" 
                    value={qItemAnalysis.filter(q => q.difficulty_index >= 80).length} 
                    color="red" 
                    delay={100} 
                />
                <StatCardPremium 
                    icon={CheckCircle2} 
                    label="Soal Mudah" 
                    value={qItemAnalysis.filter(q => q.difficulty_index < 40).length} 
                    color="green" 
                    delay={200} 
                />
            </div>

            {qItemAnalysis.length > 0 && (
                <>
                    <div className="glass-panel p-6 rounded-[24px]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 size={20} /> Difficulty Index Chart
                            </h3>
                            <button onClick={() => exportTabData('excel', 'Questions')} className="text-xs text-[#005E54] hover:underline flex items-center gap-1">
                                <Download size={14} /> Export
                            </button>
                        </div>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={qItemAnalysis.slice(0, 15)}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="id" tick={{ fontSize: 11 }} />
                                <YAxis />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="difficulty_index" fill="#ef4444" name="Difficulty %" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="glass-panel p-6 rounded-[24px]">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Analisis Soal Tersulit</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50">
                                    <tr className="text-xs font-bold text-slate-600 uppercase">
                                        <th className="text-left px-4 py-3">No</th>
                                        <th className="text-left px-4 py-3">Soal</th>
                                        <th className="text-center px-4 py-3">Kesulitan</th>
                                        <th className="text-center px-4 py-3">Coba</th>
                                        <th className="text-center px-4 py-3">Salah</th>
                                        <th className="text-center px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {qItemAnalysis.slice(0, 12).map((q, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-bold">Q{q.id}</td>
                                            <td className="px-4 py-3 max-w-xs truncate">{q.question}</td>
                                            <td className="px-4 py-3 text-center font-bold">{q.difficulty_index.toFixed(1)}%</td>
                                            <td className="px-4 py-3 text-center">{q.total_attempts}</td>
                                            <td className="px-4 py-3 text-center font-bold text-red-600">{q.wrong_attempts}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                    q.severity === 'critical' ? 'bg-red-100 text-red-700' :
                                                    q.severity === 'warning' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-green-100 text-green-700'
                                                }`}>
                                                    {q.severity}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );

    // --- RENDER: Dropout Prediction (Predictive Analytics) ---
    const renderDropoutPrediction = () => (
        <div className="space-y-8 animate-enter">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCardPremium 
                    icon={AlertOctagon} 
                    label="High Risk (>70%)" 
                    value={dropoutData.filter(d => d.probability_of_failure >= 70).length} 
                    color="red" 
                    delay={0} 
                />
                <StatCardPremium 
                    icon={AlertTriangle} 
                    label="Medium Risk (40-70%)" 
                    value={dropoutData.filter(d => d.probability_of_failure >= 40 && d.probability_of_failure < 70).length} 
                    color="orange" 
                    delay={100} 
                />
                <StatCardPremium 
                    icon={CheckCircle2} 
                    label="On Track (<40%)" 
                    value={dropoutData.filter(d => d.probability_of_failure < 40).length} 
                    color="green" 
                    delay={200} 
                />
            </div>

            {/* Risk Distribution Chart */}
            {dropoutData.length > 0 && (
                <div className="glass-panel p-6 rounded-[24px]">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Activity size={20} /> Distribusi Probabilitas Kegagalan
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dropoutData.slice(0, 15)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} height={100} tick={{ fontSize: 11 }} />
                            <YAxis label={{ value: 'Probability %', angle: -90, position: 'insideLeft' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="probability_of_failure" fill="#ef4444" name="Failure Probability %" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Risk Prediction Table with Recommendations */}
            {dropoutData.length > 0 && (
                <div className="glass-panel p-6 rounded-[24px]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <AlertTriangle size={20} /> Prediksi Dropout - Intervensi Diperlukan
                        </h3>
                        <button onClick={() => exportTabData('excel', 'Dropout')} className="text-xs text-[#005E54] hover:underline flex items-center gap-1">
                            <Download size={14} /> Export
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr className="text-left text-xs font-bold text-slate-600 uppercase">
                                    <th className="px-4 py-3">Karyawan</th>
                                    <th className="px-4 py-3">Departemen</th>
                                    <th className="px-4 py-3 text-center">Probabilitas</th>
                                    <th className="px-4 py-3 text-center">Risk Level</th>
                                    <th className="px-4 py-3">Faktor Risiko</th>
                                    <th className="px-4 py-3">Rekomendasi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {dropoutData.slice(0, 15).map((user, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-semibold">{user.name}</td>
                                        <td className="px-4 py-3">{user.department}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                user.probability_of_failure >= 70 ? 'bg-red-100 text-red-700' :
                                                user.probability_of_failure >= 40 ? 'bg-orange-100 text-orange-700' :
                                                'bg-green-100 text-green-700'
                                            }`}>
                                                {user.probability_of_failure}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`text-lg font-bold ${
                                                user.risk_level === 'high' ? 'text-red-600' :
                                                user.risk_level === 'medium' ? 'text-orange-600' :
                                                'text-green-600'
                                            }`}>
                                                {user.risk_level === 'high' ? '🔴' : user.risk_level === 'medium' ? '🟡' : '🟢'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                            • {user.days_inactive}d inactive<br/>
                                            • {user.failed_attempts} failed attempts<br/>
                                            • {user.session_duration}m session
                                        </td>
                                        <td className="px-4 py-3 text-xs">{user.recommendation}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );

    // --- RENDER: Peak Performance Time (Heatmap) ---
    const renderPeakPerformanceTime = () => (
        <div className="space-y-8 animate-enter">
            {/* Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Peak Hours */}
                <div className="glass-panel p-6 rounded-[24px] bg-gradient-to-br from-green-50 to-green-100">
                    <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                        <CheckCircle2 size={20} /> Peak Learning Times ⭐
                    </h3>
                    <div className="space-y-3">
                        {peakData.peak_hours && peakData.peak_hours.slice(0, 4).map((time, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg">
                                <p className="font-bold text-slate-900">{time.day} {time.hour}:00 - {time.hour + 1}:00</p>
                                <p className="text-sm text-slate-600">Avg Score: <span className="font-bold text-green-600">{time.score}</span> | {time.attempts} attempts</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Worst Hours */}
                <div className="glass-panel p-6 rounded-[24px] bg-gradient-to-br from-red-50 to-red-100">
                    <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
                        <AlertTriangle size={20} /> Avoid Learning Times ⚠️
                    </h3>
                    <div className="space-y-3">
                        {peakData.worst_hours && peakData.worst_hours.slice(0, 4).map((time, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg">
                                <p className="font-bold text-slate-900">{time.day} {time.hour}:00 - {time.hour + 1}:00</p>
                                <p className="text-sm text-slate-600">Avg Score: <span className="font-bold text-red-600">{time.score}</span> | {time.attempts} attempts</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Activity Heatmap */}
            {peakData.heatmap && (
                <div className="glass-panel p-8 rounded-[24px]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-900">Heatmap Produktivitas Belajar (30 Hari Terakhir)</h3>
                        <button onClick={() => exportTabData('excel', 'Peak Time')} className="text-xs text-[#005E54] hover:underline flex items-center gap-1">
                            <Download size={14} /> Export
                        </button>
                    </div>

                    <div className="overflow-x-auto pb-4">
                        <div className="min-w-[1200px]">
                            {/* Legend */}
                            <div className="mb-6 flex gap-6 justify-center flex-wrap">
                                <span className="flex items-center gap-2 text-sm font-bold">
                                    <div className="w-4 h-4 bg-slate-100 rounded"></div> Sepi (0-10%)
                                </span>
                                <span className="flex items-center gap-2 text-sm font-bold">
                                    <div className="w-4 h-4 bg-orange-300 rounded"></div> Sedang (30-60%)
                                </span>
                                <span className="flex items-center gap-2 text-sm font-bold">
                                    <div className="w-4 h-4 bg-green-600 rounded"></div> Padat (70-100%)
                                </span>
                            </div>

                            {/* Header Hours */}
                            <div className="flex mb-2">
                                <div className="w-24 shrink-0"></div>
                                {Array.from({ length: 17 }, (_, i) => i + 6).map(h => (
                                    <div key={h} className="flex-1 text-center text-xs font-bold text-slate-500 px-1">
                                        {h}:00
                                    </div>
                                ))}
                            </div>

                            {/* Heatmap Rows */}
                            {Object.entries(peakData.heatmap || {}).map(([day, hoursObj]) => (
                                <div key={day} className="flex mb-2 h-12">
                                    <div className="w-24 shrink-0 flex items-center text-sm font-bold text-slate-700">{day}</div>
                                    {Object.values(hoursObj || {}).map((hour, hIdx) => {
                                        const intensity = hour.intensity || 0;
                                        let bgColor = 'bg-slate-100';
                                        if (intensity > 0.7) bgColor = 'bg-green-600';
                                        else if (intensity > 0.4) bgColor = 'bg-orange-400';
                                        else if (intensity > 0.1) bgColor = 'bg-blue-200';

                                        return (
                                            <div key={hIdx} className="flex-1 px-1 group relative">
                                                <div className={`w-full h-full rounded-md transition-all duration-300 ${bgColor} hover:shadow-lg hover:scale-110 cursor-pointer`}></div>
                                                {/* Tooltip */}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 text-white text-xs p-3 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none z-10 text-center whitespace-nowrap">
                                                    <p className="font-bold">{day}, {hour.hour}:00</p>
                                                    <p>Score: {hour.avg_score.toFixed(1)} | Passed: {hour.passed}</p>
                                                    <p>{hour.attempts} attempts</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recommendation */}
                    <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                        <p className="font-bold text-blue-900">💡 Rekomendasi Scheduling Training</p>
                        <p className="text-sm text-blue-800 mt-1">
                            {peakData.peak_hours && peakData.peak_hours[0] ? 
                                `Jadwalkan training wajib pada ${peakData.peak_hours[0].day} pukul ${peakData.peak_hours[0].hour}:00 untuk hasil optimal. Hindari ${peakData.worst_hours?.[0]?.day} sore untuk engagement maksimal.` 
                                : 'Data masih diproses...'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <AdminLayout>
            <WondrStyles />
            <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
                
                {/* Hero Header */}
                <div className="hero-pattern pt-8 pb-32 px-6 lg:px-12 relative overflow-hidden shadow-2xl shadow-[#002824]/20">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#005E54] rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/4"></div>
                    
                    <div className="relative z-10 max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
                            <div>
                                <div className="flex items-center gap-2 text-[#D6F84C] mb-2 font-bold text-xs tracking-widest uppercase">
                                    <Activity className="w-4 h-4" /> Executive Center
                                </div>
                                <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-2">
                                    Analytics & <br /> <span className="text-[#D6F84C]">Intelligence</span>
                                </h1>
                                <p className="text-blue-100 text-lg max-w-xl">
                                    Pantau performa, kepatuhan, sertifikat, dan efektivitas pembelajaran di seluruh organisasi.
                                </p>
                            </div>
                            
                            <div className="flex gap-3">
                                <button className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md border border-white/10 transition">
                                    <RefreshCw size={20} />
                                </button>
                                <button onClick={() => exportTabData('excel', 'All')} className="flex items-center gap-2 px-6 py-3 bg-[#D6F84C] hover:bg-[#c2e43c] text-[#002824] rounded-xl font-bold shadow-lg transition hover:scale-105">
                                    <Download size={18} /> Export All
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-20">
                    
                    {/* Tabs */}
                    <div className="bg-white rounded-[24px] p-2 shadow-sm border border-slate-100 flex overflow-x-auto gap-2 mb-8">
                        {[
                            { id: 'executive', label: '📊 Executive' },
                            { id: 'learners', label: '👥 Learners' },
                            { id: 'learning', label: '🎓 Learning' },
                            { id: 'compliance', label: '🛡️ Compliance' },
                            { id: 'certificates', label: '🏆 Certificates' },
                            { id: 'overdue', label: '⏰ Overdue' },
                            { id: 'questions', label: '❓ Questions' },
                            { id: 'dropout', label: '🔮 Dropout Risk' },
                            { id: 'peaktime', label: '🕰️ Peak Time' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                                    activeTab === tab.id ? 'tab-active' : 'text-slate-500 hover:bg-slate-50'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <AnimatePresence mode="wait">
                        {analyticsLoading ? (
                            <div className="h-96 flex items-center justify-center">
                                <div className="animate-spin w-12 h-12 border-4 border-[#005E54] border-t-transparent rounded-full"></div>
                            </div>
                        ) : (
                            <>
                                {activeTab === 'executive' && renderExecutiveDashboard()}
                                {activeTab === 'learners' && renderLearnerProgress()}
                                {activeTab === 'learning' && renderLearningImpact()}
                                {activeTab === 'compliance' && renderCompliance()}
                                {activeTab === 'certificates' && renderCertificateAnalytics()}
                                {activeTab === 'overdue' && renderOverdueTraining()}
                                {activeTab === 'questions' && renderQuestionAnalysis()}
                                {activeTab === 'dropout' && renderDropoutPrediction()}
                                {activeTab === 'peaktime' && renderPeakPerformanceTime()}
                            </>
                        )}
                    </AnimatePresence>

                </div>
            </div>
        </AdminLayout>
    );
}
