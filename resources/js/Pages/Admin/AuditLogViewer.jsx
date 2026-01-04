import React, { useEffect, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    FileText, Filter, Download, Search, Eye, Activity, 
    ShieldAlert, User, Clock, ChevronRight, Terminal, 
    Calendar, CheckCircle2, XCircle, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- COMPONENTS ---

const SeverityBadge = ({ severity }) => {
    const styles = {
        critical: "bg-red-100 text-red-700 border-red-200",
        warning: "bg-orange-100 text-orange-700 border-orange-200",
        info: "bg-blue-50 text-blue-700 border-blue-100",
        success: "bg-green-50 text-green-700 border-green-100",
    };
    const icons = {
        critical: <ShieldAlert size={12} />,
        warning: <ShieldAlert size={12} />,
        info: <FileText size={12} />,
        success: <CheckCircle2 size={12} />,
    };

    return (
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[severity] || styles.info}`}>
            {icons[severity] || icons.info} {severity}
        </span>
    );
};

const LogStatCard = ({ title, value, icon: Icon, colorClass }) => (
    <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorClass}`}>
            <Icon size={24} />
        </div>
        <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{title}</p>
            <h3 className="text-2xl font-black text-slate-900">{value}</h3>
        </div>
    </div>
);

// --- SEVERITY MAPPER ---

const getSeverity = (action) => {
    const action_lower = String(action || '').toLowerCase();
    
    if (action_lower.includes('delete')) return 'critical';
    if (action_lower.includes('reject') || action_lower.includes('failed')) return 'warning';
    if (action_lower.includes('create') || action_lower.includes('approve')) return 'success';
    return 'info';
};

// --- MAIN PAGE ---

export default function AuditLogViewer() {
    const { auth } = usePage().props;
    const user = auth.user;

    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSeverity, setFilterSeverity] = useState('all');
    const [selectedLog, setSelectedLog] = useState(null);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/activity-logs', { 
                headers: { 'Accept': 'application/json' } 
            });
            
            if (res.ok) {
                const data = await res.json();
                const rawLogs = data.data || data || [];
                
                // Enrich logs with severity and formatting
                const enrichedLogs = rawLogs.map(log => ({
                    ...log,
                    id: log.id || `LOG-${Math.random().toString(36).substr(2, 9)}`,
                    user: log.user_name || log.causer?.name || 'System',
                    user_avatar: (log.user_name || log.causer?.name || 'SYS').substring(0, 2).toUpperCase(),
                    action: (log.event || log.action || 'VIEW').toUpperCase(),
                    module: log.subject_type || log.model || 'System',
                    description: log.description || 'No description provided',
                    ip_address: log.ip_address || 'N/A',
                    timestamp: log.created_at || new Date().toISOString(),
                    severity: getSeverity(log.event || log.action || 'view'),
                    changes: log.properties ? { before: null, after: log.properties } : null
                }));
                
                setLogs(enrichedLogs);
            }
        } catch (err) {
            console.error('Error fetching logs', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const res = await fetch('/api/admin/activity-logs/export', {
                headers: { 'Accept': 'application/json' },
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
            }
        } catch (err) {
            console.error('Error exporting logs', err);
        }
    };

    // Filtering Logic
    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              log.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterSeverity === 'all' || log.severity === filterSeverity;
        return matchesSearch && matchesFilter;
    });

    // Grouping Logic (Today, Yesterday, etc)
    const groupedLogs = filteredLogs.reduce((groups, log) => {
        const date = new Date(log.timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        let key;
        if (date.toDateString() === today.toDateString()) {
            key = 'Hari Ini';
        } else if (date.toDateString() === yesterday.toDateString()) {
            key = 'Kemarin';
        } else {
            key = date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
        }
        
        if (!groups[key]) groups[key] = [];
        groups[key].push(log);
        return groups;
    }, {});

    // Calculate stats
    const stats = {
        total: logs.length,
        critical: logs.filter(l => l.severity === 'critical').length,
        warning: logs.filter(l => l.severity === 'warning').length,
        success: logs.filter(l => l.severity === 'success').length,
    };

    return (
        <AdminLayout user={user}>
            <Head title="Audit Trail - Activity Logs" />

            <div className="pb-20">
                
                {/* --- HEADER & STATS --- */}
                <div className="mb-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-3 py-1 bg-slate-900 text-[#D6FF59] rounded-full text-[10px] font-bold uppercase tracking-wider">
                                    System Security
                                </span>
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Activity Log</h1>
                            <p className="text-slate-500 mt-2 font-medium max-w-xl">
                                Pantau jejak audit digital, perubahan data sensitif, dan akses sistem secara real-time.
                            </p>
                        </div>
                        <button 
                            onClick={handleExport}
                            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-full font-bold shadow-sm transition"
                        >
                            <Download size={18} /> Export CSV
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <LogStatCard title="Total Events" value={stats.total} icon={FileText} colorClass="bg-blue-50 text-blue-600" />
                        <LogStatCard title="Critical Actions" value={stats.critical} icon={ShieldAlert} colorClass="bg-red-50 text-red-600" />
                        <LogStatCard title="Warnings" value={stats.warning} icon={Calendar} colorClass="bg-orange-50 text-orange-600" />
                        <LogStatCard title="Success" value={stats.success} icon={CheckCircle2} colorClass="bg-green-50 text-green-600" />
                    </div>
                </div>

                {/* --- SEARCH & FILTERS --- */}
                <div className="bg-white p-2 rounded-[24px] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                    <div className="flex gap-2 bg-slate-50 p-1.5 rounded-full w-full md:w-auto overflow-x-auto">
                        {[
                            { id: 'all', label: 'All Events' },
                            { id: 'critical', label: 'Critical', color: 'text-red-600' },
                            { id: 'warning', label: 'Warning', color: 'text-orange-600' },
                            { id: 'success', label: 'Success', color: 'text-green-600' },
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setFilterSeverity(f.id)}
                                className={`px-6 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                                    filterSeverity === f.id 
                                    ? 'bg-slate-900 text-white shadow-md' 
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-white'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-80 px-2">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search user, action, or ID..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border-none rounded-full text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#D6FF59]"
                        />
                    </div>
                </div>

                {/* --- LOG FEED (TIMELINE STYLE) --- */}
                <div className="space-y-8">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-[#D6FF59] rounded-full"></div>
                        </div>
                    ) : Object.keys(groupedLogs).length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-slate-200">
                            <Activity className="mx-auto text-slate-300 mb-4" size={48} />
                            <p className="text-slate-500 font-medium">Tidak ada log aktivitas yang ditemukan.</p>
                        </div>
                    ) : (
                        Object.entries(groupedLogs).map(([dateLabel, items]) => (
                            <div key={dateLabel}>
                                <div className="sticky top-4 z-10 inline-block mb-4">
                                    <span className="px-4 py-1.5 bg-slate-200/50 backdrop-blur text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider border border-slate-200">
                                        {dateLabel}
                                    </span>
                                </div>
                                <div className="space-y-3 pl-2 md:pl-0">
                                    {items.map((log) => (
                                        <motion.div 
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={log.id}
                                            onClick={() => setSelectedLog(log)}
                                            className="group bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300 cursor-pointer relative overflow-hidden"
                                        >
                                            {/* Status Indicator Line */}
                                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                                                log.severity === 'critical' ? 'bg-red-500' : 
                                                log.severity === 'warning' ? 'bg-orange-500' : 
                                                log.severity === 'success' ? 'bg-[#D6FF59]' : 'bg-blue-400'
                                            }`}></div>

                                            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 pl-4">
                                                {/* Time & ID */}
                                                <div className="min-w-[100px]">
                                                    <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                                        <Clock size={12} className="text-slate-400" />
                                                        {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                    <p className="text-[10px] font-mono text-slate-400 mt-1">{log.id}</p>
                                                </div>

                                                {/* User Info */}
                                                <div className="flex items-center gap-3 min-w-[180px]">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D6FF59] to-[#00BFA5] flex items-center justify-center text-xs font-bold text-slate-900 border border-slate-200 shadow-sm">
                                                        {log.user_avatar}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{log.user}</p>
                                                        <p className="text-[10px] text-slate-500 font-mono">{log.ip_address}</p>
                                                    </div>
                                                </div>

                                                {/* Action & Description */}
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-black uppercase text-slate-700">{log.action}</span>
                                                        <span className="text-xs text-slate-400">•</span>
                                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{log.module}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 line-clamp-1">{log.description}</p>
                                                </div>

                                                {/* Severity & Action */}
                                                <div className="flex items-center gap-4">
                                                    <SeverityBadge severity={log.severity} />
                                                    <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* --- DETAIL DRAWER --- */}
            <AnimatePresence>
                {selectedLog && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedLog(null)}
                            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[60]"
                        />
                        <motion.div 
                            initial={{ x: '100%' }} 
                            animate={{ x: 0 }} 
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-[70] flex flex-col border-l border-slate-100"
                        >
                            {/* Drawer Header */}
                            <div className="p-8 border-b border-slate-100 bg-[#FAFAFA] sticky top-0">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="px-2 py-1 bg-slate-200 text-slate-600 rounded text-[10px] font-mono font-bold">{selectedLog.id}</span>
                                    <SeverityBadge severity={selectedLog.severity} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 leading-tight mb-2">{selectedLog.action}</h2>
                                <p className="text-slate-500 font-medium">{selectedLog.description}</p>
                            </div>

                            {/* Drawer Body */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                {/* Metadata */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Actor</label>
                                        <div className="flex items-center gap-2">
                                            <User size={16} className="text-slate-700" />
                                            <span className="text-sm font-bold text-slate-900">{selectedLog.user}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">IP Address</label>
                                        <span className="text-sm font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded block">{selectedLog.ip_address}</span>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Module</label>
                                        <span className="text-sm font-bold text-slate-900">{selectedLog.module}</span>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Timestamp</label>
                                        <span className="text-sm font-bold text-slate-900">{new Date(selectedLog.timestamp).toLocaleString('id-ID')}</span>
                                    </div>
                                </div>

                                {/* Data Changes (JSON Diff Simulation) */}
                                {selectedLog.changes && (
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                            <Terminal size={16} /> Data Changes
                                        </h3>
                                        <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs overflow-x-auto">
                                            {selectedLog.changes.before && (
                                                <div className="mb-4">
                                                    <p className="text-red-400 mb-1 font-bold">// BEFORE</p>
                                                    <pre className="text-slate-300 overflow-x-auto">
                                                        {JSON.stringify(selectedLog.changes.before, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                            {selectedLog.changes.after && (
                                                <div>
                                                    <p className="text-[#D6FF59] mb-1 font-bold">// AFTER</p>
                                                    <pre className="text-slate-300 overflow-x-auto">
                                                        {JSON.stringify(selectedLog.changes.after, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Drawer Footer */}
                            <div className="p-4 border-t border-slate-100 bg-white sticky bottom-0">
                                <button 
                                    onClick={() => setSelectedLog(null)}
                                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition flex items-center justify-center gap-2"
                                >
                                    Close <ArrowRight size={16} />
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
}
