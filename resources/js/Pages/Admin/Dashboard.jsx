import React, { useState, useEffect } from 'react';
import { 
    Users, BookOpen, Trophy, TrendingUp, AlertCircle, CheckCircle, 
    Clock, FileText, Download, Search, Sparkles, ArrowUpRight, 
    MoreHorizontal, Bell, Zap, BarChart2, RefreshCw, Loader, 
    Award, LayoutGrid, Calendar, LogOut, ChevronRight, Menu, X, Plus, Send
} from 'lucide-react';
import { 
    ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
    PieChart, Pie, Cell, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
    LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

// --- MOCK DATA ---
const mockStats = {
    total_users: 12450,
    completion_rate: 88.5,
    total_modules: 42,
    total_certifications: 1560,
    average_score: 84
};

const mockTrend = [
    { month: 'Jan', enrolled: 65, completed: 40 },
    { month: 'Feb', enrolled: 75, completed: 55 },
    { month: 'Mar', enrolled: 90, completed: 85 },
    { month: 'Apr', enrolled: 85, completed: 80 },
    { month: 'May', enrolled: 100, completed: 92 },
    { month: 'Jun', enrolled: 120, completed: 110 },
];

const mockModules = [
    { name: 'Compliance 101', value: 92 },
    { name: 'Data Security', value: 85 },
    { name: 'Leadership', value: 78 },
    { name: 'Product Knowledge', value: 95 },
];

// --- COMPONENTS ---

const DashboardCard = ({ title, value, subtext, icon: Icon, trend, colorTheme = "slate", delay = 0 }) => {
    const themes = {
        slate: "bg-white border-slate-100 text-slate-900",
        dark: "bg-slate-900 border-slate-800 text-white",
        lime: "bg-[#D6FF59] border-[#D6FF59] text-slate-900",
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            className={`p-6 rounded-[32px] border shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-300 ${themes[colorTheme]}`}
        >
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-3 rounded-2xl ${colorTheme === 'dark' ? 'bg-white/10' : 'bg-slate-100'}`}>
                    <Icon size={24} className={colorTheme === 'dark' ? 'text-[#D6FF59]' : 'text-slate-900'} />
                </div>
                {trend && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                        colorTheme === 'dark' ? 'bg-white/10 text-white' : 'bg-green-100 text-green-700'
                    }`}>
                        <TrendingUp size={12} /> {trend}
                    </span>
                )}
            </div>
            <div className="relative z-10">
                <h3 className="text-4xl font-black tracking-tight mb-1">{value}</h3>
                <p className={`text-sm font-bold uppercase tracking-wider opacity-70`}>{title}</p>
                {subtext && <p className="text-xs mt-2 opacity-50">{subtext}</p>}
            </div>
            
            {/* Decor Blob */}
            <div className={`absolute -bottom-4 -right-4 w-32 h-32 rounded-full blur-[50px] opacity-20 pointer-events-none ${
                colorTheme === 'lime' ? 'bg-white' : 'bg-[#D6FF59]'
            }`}></div>
        </motion.div>
    );
};

const TabPill = ({ active, label, icon: Icon, onClick }) => (
    <button
        onClick={onClick}
        className={`relative flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 ${
            active 
            ? 'text-slate-900 bg-white shadow-md ring-2 ring-[#D6FF59]' 
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
        }`}
    >
        <Icon size={16} /> {label}
    </button>
);

// --- ANALYTICS PANEL WITH MODERN CHARTS ---
const AnalyticsPanel = ({ modules, stats, trend }) => {
    const moduleData = (modules || []).map(m => ({
        name: m.title || 'Unknown',
        value: m.total_enrollments > 0 ? Math.round((m.completed_count / m.total_enrollments) * 100) : 0,
        learners: m.total_enrollments,
        completed: m.completed_count
    })).slice(0, 8);

    const learnerStatus = [
        { name: 'Completed', value: stats?.completed_trainings || 0, color: '#10b981' },
        { name: 'In Progress', value: (stats?.total_enrollments || 0) - (stats?.completed_trainings || 0), color: '#3b82f6' },
        { name: 'Pending', value: stats?.pending_enrollments || 0, color: '#f59e0b' },
    ];

    const scoreDistribution = [
        { range: '90-100', count: Math.floor((stats?.total_users || 0) * 0.25), fill: '#10b981' },
        { range: '80-89', count: Math.floor((stats?.total_users || 0) * 0.35), fill: '#3b82f6' },
        { range: '70-79', count: Math.floor((stats?.total_users || 0) * 0.25), fill: '#f59e0b' },
        { range: '<70', count: Math.floor((stats?.total_users || 0) * 0.15), fill: '#ef4444' },
    ];

    return (
        <div className="space-y-8">
            {/* Top KPI Row with Animated Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { icon: Users, label: 'Active Learners', value: stats?.total_users?.toLocaleString() || '0', color: 'blue', trend: '+12%' },
                    { icon: CheckCircle, label: 'Avg Completion', value: stats?.completion_rate || '0' + '%', color: 'teal', trend: '+5%' },
                    { icon: BookOpen, label: 'Programs', value: stats?.total_modules || '0', color: 'purple', trend: '+3%' },
                    { icon: Trophy, label: 'Certifications', value: stats?.total_certifications || '0', color: 'amber', trend: '+8%' },
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`bg-gradient-to-br from-${item.color}-50 to-${item.color}-100/50 rounded-2xl p-4 border border-${item.color}-200/50 shadow-sm hover:shadow-lg transition-all`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className={`p-3 rounded-xl bg-${item.color}-100`}>
                                <item.icon size={20} className={`text-${item.color}-600`} />
                            </div>
                            <span className={`text-xs font-bold text-${item.color}-600 bg-${item.color}-100 px-2 py-1 rounded-full`}>{item.trend}</span>
                        </div>
                        <div className="text-xs text-slate-500 uppercase font-semibold">{item.label}</div>
                        <div className="text-2xl font-bold text-slate-900 mt-1">{item.value}</div>
                    </motion.div>
                ))}
            </div>

            {/* Modern Trend Line Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-all"
            >
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Learning Trend Analysis</h3>
                        <p className="text-sm text-slate-500">Enrollment & Completion Rate (6 Months)</p>
                    </div>
                    <button className="p-2 hover:bg-slate-100 rounded-xl transition">
                        <MoreHorizontal size={20} className="text-slate-400" />
                    </button>
                </div>
                <div className="h-80 w-full">
                    {trend && trend.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trend} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                <defs>
                                    <linearGradient id="enrollGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e6eaf0" vertical={false} />
                                <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                                    cursor={{ stroke: '#d6ff59', strokeWidth: 2 }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="enrolled" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 5 }} activeDot={{ r: 7 }} name="Enrolled" />
                                <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 5 }} activeDot={{ r: 7 }} name="Completed" />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400">No data available</div>
                    )}
                </div>
            </motion.div>

            {/* Module Performance & Score Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Module Performance Bar Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-all"
                >
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Module Performance</h3>
                    <div className="h-72">
                        {moduleData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={moduleData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                                    <defs>
                                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#d6ff59"/>
                                            <stop offset="100%" stopColor="#10b981"/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6eaf0" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} tick={{ fontSize: 11 }} />
                                    <YAxis stroke="#94a3b8" label={{ value: 'Completion %', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}/>
                                    <Bar dataKey="value" fill="url(#barGradient)" radius={[8, 8, 0, 0]} animationDuration={1500} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400">No module data</div>
                        )}
                    </div>
                </motion.div>

                {/* Score Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-all"
                >
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Score Distribution</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={scoreDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 20 }} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6eaf0" />
                                <XAxis type="number" stroke="#94a3b8" />
                                <YAxis dataKey="range" type="category" stroke="#94a3b8" />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}/>
                                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                                    {scoreDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* Learner Status & Completion Pie */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Learner Status Pie */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-all"
                >
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Learner Status</h3>
                    <div className="h-72 flex items-center justify-center">
                        {learnerStatus.some(s => s.value > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={learnerStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5}>
                                        {learnerStatus.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}/>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-slate-400">No data</div>
                        )}
                    </div>
                    <div className="space-y-2 mt-6 border-t border-slate-200 pt-4">
                        {learnerStatus.map((item) => (
                            <div key={item.name} className="flex justify-between items-center">
                                <span className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    <span className="text-sm text-slate-700 font-medium">{item.name}</span>
                                </span>
                                <span className="font-bold text-slate-900">{item.value.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Module Details Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-all"
                >
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Top Modules</h3>
                    <div className="space-y-3 max-h-72 overflow-y-auto">
                        {moduleData.slice(0, 6).map((mod, i) => (
                            <div key={i} className="p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl hover:shadow-md transition-all">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-slate-800 text-sm">{mod.name}</span>
                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2.5 py-1 rounded-full">{mod.value}%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${mod.value}%` }}
                                        transition={{ delay: i * 0.1, duration: 1 }}
                                        className="h-full bg-gradient-to-r from-indigo-600 to-purple-600"
                                    ></motion.div>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">{mod.completed.toLocaleString()} / {mod.learners.toLocaleString()} completed</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

// --- REPORTS PANEL WITH MODERN CHARTS & FUNCTIONAL BUTTONS ---
const ReportsPanel = ({ stats, pending_actions, onDownloadReport, onExportReport }) => {
    const [exportFormat, setExportFormat] = useState(null);

    const handleExport = (format) => {
        onExportReport(format);
        setExportFormat(null);
    };

    const handleDownload = (reportId, title) => {
        onDownloadReport(reportId, title);
    };

    const recentReports = [
        { id: 1, title: 'Q4 Compliance Report', type: 'Compliance', date: '2025-12-20', status: 'Completed', size: '2.4 MB' },
        { id: 2, title: 'Monthly Audit - Dec', type: 'Audit', date: '2025-12-18', status: 'Completed', size: '1.8 MB' },
        { id: 3, title: 'Learner Performance Summary', type: 'Performance', date: '2025-12-15', status: 'Review', size: '3.2 MB' },
        { id: 4, title: 'Training Effectiveness', type: 'Training', date: '2025-12-10', status: 'Completed', size: '2.1 MB' },
        { id: 5, title: 'Risk Assessment', type: 'Compliance', date: '2025-12-08', status: 'Pending', size: '1.5 MB' },
    ];

    const reportsByType = [
        { name: 'Compliance', value: 34, color: '#ef4444' },
        { name: 'Audit', value: 28, color: '#f59e0b' },
        { name: 'Performance', value: 45, color: '#3b82f6' },
        { name: 'Training', value: 22, color: '#10b981' },
    ];

    const reportsByStatus = [
        { name: 'Generated', value: 89 },
        { name: 'Pending', value: (pending_actions?.certifications_pending || 0) + (pending_actions?.enrollments_pending || 0) },
        { name: 'Review', value: 6 },
    ];

    const getStatusColor = (status) => {
        const colors = {
            'Completed': 'bg-emerald-100 text-emerald-800',
            'Review': 'bg-blue-100 text-blue-800',
            'Pending': 'bg-amber-100 text-amber-800'
        };
        return colors[status] || 'bg-slate-100 text-slate-800';
    };

    const getTypeColor = (type) => {
        const colors = {
            'Compliance': 'bg-red-100 text-red-700',
            'Audit': 'bg-amber-100 text-amber-700',
            'Performance': 'bg-blue-100 text-blue-700',
            'Training': 'bg-emerald-100 text-emerald-700'
        };
        return colors[type] || 'bg-slate-100 text-slate-700';
    };

    return (
        <div className="space-y-8">
            {/* Top KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { icon: FileText, label: 'Total Reports', value: '129', color: 'blue' },
                    { icon: AlertCircle, label: 'Pending', value: (pending_actions?.certifications_pending || 0) + (pending_actions?.enrollments_pending || 0), color: 'red' },
                    { icon: TrendingUp, label: 'Generated (30d)', value: '34', color: 'emerald' },
                    { icon: Download, label: 'Export Rate', value: '95%', color: 'amber' },
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`bg-gradient-to-br from-${item.color}-50 to-${item.color}-100/50 rounded-2xl p-4 border border-${item.color}-200/50 shadow-sm hover:shadow-lg transition-all cursor-pointer hover:scale-105`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs text-slate-500 uppercase font-semibold">{item.label}</div>
                                <div className="text-2xl font-bold text-slate-900 mt-2">{item.value}</div>
                            </div>
                            <div className={`p-4 rounded-xl bg-${item.color}-100`}>
                                <item.icon size={24} className={`text-${item.color}-600`} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Export Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-[32px] p-8 border border-indigo-200/50 shadow-sm"
            >
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Export Reports</h3>
                        <p className="text-sm text-slate-500">Generate and download reports in your preferred format</p>
                    </div>
                    <div className="p-4 bg-indigo-100 rounded-xl">
                        <Download size={24} className="text-indigo-600" />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                        { format: 'pdf', label: 'PDF Report', icon: '📄' },
                        { format: 'excel', label: 'Excel Spreadsheet', icon: '📊' },
                        { format: 'csv', label: 'CSV Data', icon: '📑' },
                    ].map((item) => (
                        <motion.button
                            key={item.format}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleExport(item.format)}
                            className="bg-white hover:bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-center transition-all font-bold text-slate-800 shadow-sm hover:shadow-md"
                        >
                            <span className="text-2xl mb-2 block">{item.icon}</span>
                            {item.label}
                        </motion.button>
                    ))}
                </div>
            </motion.div>

            {/* Reports by Type & Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Reports by Type Pie */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-all"
                >
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Reports by Type</h3>
                    <div className="h-72 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={reportsByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} paddingAngle={3}>
                                    {reportsByType.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 mt-4 border-t border-slate-200 pt-4">
                        {reportsByType.map((item) => (
                            <div key={item.name} className="flex justify-between items-center">
                                <span className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    <span className="text-sm text-slate-700 font-medium">{item.name}</span>
                                </span>
                                <span className="font-bold text-slate-900">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Reports by Status Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-all"
                >
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Report Status Distribution</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={reportsByStatus} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                <defs>
                                    <linearGradient id="statusGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#06b6d4"/>
                                        <stop offset="100%" stopColor="#0ea5e9"/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6eaf0" />
                                <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}/>
                                <Bar dataKey="value" fill="url(#statusGradient)" radius={[8, 8, 0, 0]} animationDuration={1500} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* Recent Reports Table with Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-all"
            >
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Recent Reports</h3>
                        <p className="text-sm text-slate-500">Latest generated and available reports</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => alert('Generate new report functionality')}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg transition-all"
                    >
                        <Plus size={18} /> Generate Report
                    </motion.button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="text-left py-3 px-4 font-semibold text-slate-700">Title</th>
                                <th className="text-left py-3 px-4 font-semibold text-slate-700">Type</th>
                                <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
                                <th className="text-center py-3 px-4 font-semibold text-slate-700">Status</th>
                                <th className="text-right py-3 px-4 font-semibold text-slate-700">Size</th>
                                <th className="text-center py-3 px-4 font-semibold text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentReports.map((report) => (
                                <motion.tr
                                    key={report.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: report.id * 0.1 }}
                                    className="border-b border-slate-100 hover:bg-slate-50 transition group"
                                >
                                    <td className="py-4 px-4 font-medium text-slate-800 group-hover:text-indigo-600">{report.title}</td>
                                    <td className="py-4 px-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(report.type)}`}>{report.type}</span>
                                    </td>
                                    <td className="py-4 px-4 text-slate-600 text-xs">{report.date}</td>
                                    <td className="py-4 px-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(report.status)}`}>{report.status}</span>
                                    </td>
                                    <td className="text-right py-4 px-4 text-slate-600 font-medium">{report.size}</td>
                                    <td className="text-center py-4 px-4">
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleDownload(report.id, report.title)}
                                            className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1.5 rounded-lg font-bold text-xs transition-all"
                                        >
                                            <Download size={16} className="inline mr-1" /> Download
                                        </motion.button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
};

// --- MODAL DIALOGS ---
const AddUserModal = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({ name: '', email: '', role: 'learner' });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
        setFormData({ name: '', email: '', role: 'learner' });
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Add New User</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-2">Full Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter name"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-2">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter email"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-2">Role</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({...formData, role: e.target.value})}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="learner">Learner</option>
                            <option value="instructor">Instructor</option>
                            <option value="manager">Manager</option>
                        </select>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
                        >
                            Add User
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

const CreateCourseModal = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({ title: '', description: '', category: 'general' });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
        setFormData({ title: '', description: '', category: 'general' });
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Create New Course</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-2">Course Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="Enter course title"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-2">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="Enter course description"
                            rows="3"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-2">Category</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                            <option value="general">General</option>
                            <option value="compliance">Compliance</option>
                            <option value="technical">Technical</option>
                            <option value="leadership">Leadership</option>
                        </select>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition"
                        >
                            Create Course
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

const NotificationsPanel = ({ isOpen, onClose }) => {
    const notificationsList = [
        { id: 1, title: 'New Enrollment', message: '5 new learners enrolled in Compliance 101', time: '2 hours ago', icon: Users, color: 'blue' },
        { id: 2, title: 'Course Completed', message: 'John Doe completed Data Security module', time: '4 hours ago', icon: CheckCircle, color: 'green' },
        { id: 3, title: 'Alert', message: 'Compliance deadline approaching in 3 days', time: '1 day ago', icon: AlertCircle, color: 'red' },
    ];

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl max-h-96 overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Notifications</h2>
                <div className="space-y-4">
                    {notificationsList.map((notif) => (
                        <div key={notif.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition">
                            <div className="flex gap-3">
                                <div className={`p-2 rounded-lg bg-${notif.color}-100`}>
                                    <notif.icon size={20} className={`text-${notif.color}-600`} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-slate-900">{notif.title}</h3>
                                    <p className="text-sm text-slate-600">{notif.message}</p>
                                    <p className="text-xs text-slate-400 mt-2">{notif.time}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    onClick={onClose}
                    className="w-full mt-6 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition"
                >
                    Close
                </button>
            </motion.div>
        </motion.div>
    );
};

// --- MAIN DASHBOARD CONTENT ---

export default function AdminDashboard({ auth, statistics, compliance_trend, pending_actions, alerts, recent_enrollments, recent_completions, modules_stats, exam_stats }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    const user = auth?.user || { name: 'Admin User' };
    const stats = statistics || mockStats;
    const trend = compliance_trend || mockTrend;
    const enrollments = recent_enrollments || [];
    const completions = recent_completions || [];
    const modules = modules_stats || [];
    const exams = exam_stats || [];

    // Refresh button handler
    const handleRefresh = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            window.location.reload();
        }, 1500);
    };

    // Search handler
    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            console.log('Search triggered with query:', searchQuery.trim());
            router.visit(`/admin/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    // Navigation handlers
    const navigateToUsers = () => router.get('/admin/users');
    const navigateToPrograms = () => router.get('/admin/training-programs');
    const navigateToCompliance = () => router.get('/admin/compliance');
    const navigateToReports = () => router.get('/admin/reports');

    // Modal handlers
    const handleAddUser = (userData) => {
        router.post('/api/admin/users', userData, {
            onSuccess: () => {
                setShowAddUserModal(false);
                window.location.reload();
            },
        });
    };

    const handleNewCourse = (courseData) => {
        router.post('/api/admin/training-programs', courseData, {
            onSuccess: () => {
                setShowCreateCourseModal(false);
                window.location.reload();
            },
        });
    };

    // Download handler - Direct link to download
    const handleDownloadReport = (reportId, title) => {
        // Direct download using window.location
        window.location.href = `/admin/reports/${reportId}/download`;
    };

    // Export handler - Use fetch to handle file download
    const handleExportReport = (format) => {
        // Show loading state
        setLoading(true);
        
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || '';

        // Use fetch to download file
        fetch('/admin/reports/export', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
            },
            body: JSON.stringify({ format })
        })
        .then(response => {
            if (!response.ok) {
                // Try to get error message from response
                return response.text().then(text => {
                    throw new Error(text || `HTTP Error: ${response.status}`);
                });
            }
            
            // Get filename from Content-Disposition header
            const disposition = response.headers.get('Content-Disposition');
            let filename = `Compliance_Report_${format}_${new Date().toISOString().split('T')[0]}`;
            
            if (disposition) {
                const match = disposition.match(/filename="?([^"]+)"?/);
                if (match) filename = match[1];
            }
            
            return response.blob().then(blob => ({ blob, filename }));
        })
        .then(({ blob, filename }) => {
            // Create blob URL and trigger download
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(link);
            }, 100);
            
            setLoading(false);
        })
        .catch(error => {
            console.error('Export error:', error);
            alert('Gagal mengekspor laporan. Silakan coba lagi.');
            setLoading(false);
        });
    };

    return (
        <AdminLayout user={user}>
            <Head title="Wondr Admin Dashboard" />
            
            <div className="p-6 lg:p-10 max-w-[1920px] mx-auto space-y-10">
                
                {/* --- HEADER SECTION --- */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 rounded-full bg-slate-900 text-[#D6FF59] text-[10px] font-bold uppercase tracking-wider border border-slate-700">
                                Live Dashboard
                            </span>
                            <span className="text-slate-400 text-xs font-semibold">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">
                            Selamat Pagi, <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">{user.name.split(' ')[0]}!</span>
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium max-w-xl">
                            Berikut adalah ringkasan kinerja pembelajaran, kepatuhan, dan aktivitas user hari ini.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500" size={20} />
                            <input 
                                type="text" 
                                placeholder="Cari data karyawan, report..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={handleSearch}
                                className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#D6FF59]/30 transition-all w-[300px] shadow-sm"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-100 px-2 py-1 rounded-md text-[10px] font-bold text-slate-500 border border-slate-200">⌘K</div>
                        </div>
                        <button 
                            onClick={handleRefresh}
                            className={`p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition shadow-sm ${loading ? 'animate-spin' : ''}`}
                        >
                            <RefreshCw size={20} className="text-slate-600" />
                        </button>
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowNotifications(true)}
                            className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition shadow-lg shadow-slate-900/20 relative"
                        >
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        </motion.button>
                    </div>
                </div>

                {/* --- AI INSIGHT (FEATURE) --- */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 rounded-[32px] p-1 shadow-2xl shadow-indigo-500/20"
                >
                    <div className="bg-slate-900/90 backdrop-blur-xl rounded-[30px] p-6 lg:p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-30 animate-pulse"></div>
                        
                        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D6FF59] to-emerald-400 flex items-center justify-center shrink-0 shadow-lg shadow-lime-400/20">
                                <Sparkles size={28} className="text-slate-900" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                    Wondr AI Insight 
                                    <span className="bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide">Beta</span>
                                </h3>
                                <p className="text-slate-300 leading-relaxed max-w-3xl">
                                    "Berdasarkan tren 7 hari terakhir, tingkat penyelesaian modul <strong>Compliance</strong> menurun sebesar 12%. Disarankan untuk mengirim <em>Smart Reminder</em> via WhatsApp kepada 45 karyawan yang belum menyelesaikan."
                                </p>
                            </div>
                            <button className="whitespace-nowrap px-6 py-3 bg-white text-indigo-900 rounded-full font-bold text-sm hover:bg-indigo-50 transition shadow-lg flex items-center gap-2">
                                <Zap size={16} /> Jalankan Aksi Otomatis
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* --- NAVIGATION TABS --- */}
                <div className="flex justify-center">
                    <div className="p-1.5 bg-slate-200/50 rounded-full flex gap-1 backdrop-blur-sm">
                        {[
                            { id: 'overview', label: 'Overview', icon: LayoutGrid },
                            { id: 'analytics', label: 'Deep Analytics', icon: BarChart2 },
                            { id: 'reports', label: 'Reports', icon: FileText },
                        ].map(tab => (
                            <TabPill 
                                key={tab.id}
                                {...tab}
                                active={activeTab === tab.id}
                                onClick={() => setActiveTab(tab.id)}
                            />
                        ))}
                    </div>
                </div>

                {/* --- CONTENT AREA --- */}
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div 
                            key="overview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                        >
                            {/* 1. BENTO GRID STATS */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <DashboardCard 
                                    title="Active Learners" 
                                    value={stats.total_users.toLocaleString()} 
                                    icon={Users} 
                                    colorTheme="slate"
                                    trend={`+${Math.round(stats.pending_enrollments / stats.total_users * 10)}% pending`}
                                    delay={0.1}
                                />
                                <DashboardCard 
                                    title="Completion Rate" 
                                    value={`${stats.completion_rate}%`} 
                                    icon={CheckCircle} 
                                    colorTheme="lime"
                                    subtext={`${stats.completed_trainings} of ${stats.total_enrollments} done`}
                                    delay={0.2}
                                />
                                <DashboardCard 
                                    title="Total Programs" 
                                    value={stats.total_modules} 
                                    icon={BookOpen} 
                                    colorTheme="slate"
                                    subtext={`${stats.total_enrollments} enrollments`}
                                    delay={0.3}
                                />
                                <DashboardCard 
                                    title="Avg. Score" 
                                    value={`${stats.average_score}%`} 
                                    icon={Trophy} 
                                    colorTheme="dark"
                                    subtext={`${stats.total_certifications} certified`}
                                    delay={0.4}
                                />
                            </div>

                            {/* 2. CHARTS & ACTIVITY */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left: Main Chart */}
                                <div className="lg:col-span-2 bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm">
                                    <div className="flex justify-between items-center mb-8">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900">Learning Momentum</h3>
                                            <p className="text-sm text-slate-500">Enrollment vs Completion (6 Bulan Terakhir)</p>
                                        </div>
                                        <button className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition"><MoreHorizontal size={20} className="text-slate-400" /></button>
                                    </div>
                                    <div className="h-[350px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={trend}>
                                                <defs>
                                                    <linearGradient id="colorEnroll" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                    </linearGradient>
                                                    <linearGradient id="colorComplete" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                                                    itemStyle={{ color: '#fff' }}
                                                />
                                                <Area type="monotone" dataKey="enrolled" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorEnroll)" />
                                                <Area type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorComplete)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Right: Top Modules & Quick Actions */}
                                <div className="space-y-6">
                                    <div className="bg-white rounded-[32px] p-6 border border-slate-200 shadow-sm">
                                        <h3 className="text-lg font-bold text-slate-900 mb-6">Top Performing Modules</h3>
                                        <div className="space-y-4">
                                            {modules.length > 0 ? (
                                                modules.slice(0, 4).map((mod, i) => {
                                                    const percentage = mod.total_enrollments > 0 
                                                        ? Math.round((mod.completed_count / mod.total_enrollments) * 100)
                                                        : 0;
                                                    return (
                                                        <div key={i} className="group">
                                                            <div className="flex justify-between text-sm mb-1">
                                                                <span className="font-bold text-slate-700 truncate">{mod.title}</span>
                                                                <span className="font-bold text-indigo-600">{percentage}%</span>
                                                            </div>
                                                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                                <div 
                                                                    className="bg-indigo-600 h-full rounded-full transition-all duration-1000 group-hover:bg-[#D6FF59]" 
                                                                    style={{ width: `${percentage}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <p className="text-sm text-slate-400 text-center py-4">Tidak ada data modul</p>
                                            )}
                                        </div>
                                        <motion.button 
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => router.visit(route('admin.modules.index'))}
                                            className="w-full mt-6 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition flex items-center justify-center gap-2 group"
                                        >
                                            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                            View All Modules ({modules.length})
                                        </motion.button>
                                    </div>

                                    {/* Quick Actions Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <motion.button 
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => router.visit(route('admin.users.create'))}
                                            className="p-4 bg-indigo-50 rounded-[24px] hover:bg-indigo-100 transition text-left group"
                                        >
                                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                                                <Plus size={20} className="text-indigo-600" />
                                            </div>
                                            <p className="font-bold text-indigo-900 text-sm">Add User</p>
                                        </motion.button>
                                        <motion.button 
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => router.visit(route('admin.modules.create'))}
                                            className="p-4 bg-teal-50 rounded-[24px] hover:bg-teal-100 transition text-left group"
                                        >
                                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                                                <Plus size={20} className="text-teal-600" />
                                            </div>
                                            <p className="font-bold text-teal-900 text-sm">New Course</p>
                                        </motion.button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Placeholder for other tabs */}
                    {activeTab === 'analytics' && (
                        <motion.div
                            key="analytics"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            <AnalyticsPanel modules={modules} stats={stats} trend={trend} />
                        </motion.div>
                    )}

                    {activeTab === 'reports' && (
                        <motion.div
                            key="reports"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            <ReportsPanel 
                                stats={stats} 
                                pending_actions={pending_actions}
                                onDownloadReport={handleDownloadReport}
                                onExportReport={handleExportReport}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>

            {/* MODAL DIALOGS */}
            <AnimatePresence>
                {showAddUserModal && (
                    <AddUserModal 
                        key="add-user-modal"
                        isOpen={showAddUserModal} 
                        onClose={() => setShowAddUserModal(false)}
                        onSubmit={handleAddUser}
                    />
                )}
                {showCreateCourseModal && (
                    <CreateCourseModal 
                        key="create-course-modal"
                        isOpen={showCreateCourseModal} 
                        onClose={() => setShowCreateCourseModal(false)}
                        onSubmit={handleNewCourse}
                    />
                )}
                {showNotifications && (
                    <NotificationsPanel 
                        key="notifications-panel"
                        isOpen={showNotifications} 
                        onClose={() => setShowNotifications(false)}
                    />
                )}
            </AnimatePresence>
        </AdminLayout>
    );
}
