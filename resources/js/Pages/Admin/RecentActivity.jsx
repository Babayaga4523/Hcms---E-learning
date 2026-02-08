import React, { useState, useMemo, useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { 
    Clock, UserPlus, ArrowLeft, Search, Filter, Download, 
    Activity, CheckCircle2, AlertCircle, LogIn, FileText, 
    ChevronDown, RefreshCw, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import AdminLayout from '@/Layouts/AdminLayout';

// --- Wondr Style System ---
const WondrStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
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
);

// --- UI Components ---
const StatWidget = ({ label, value, icon: Icon, color }) => {
    const colors = {
        emerald: 'bg-[#F0FDF4] text-[#005E54]',
        blue: 'bg-blue-50 text-blue-700',
        amber: 'bg-amber-50 text-amber-700',
    };
    const theme = colors[color] || colors.emerald;

    return (
        <div className="glass-panel p-4 rounded-[20px] flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                <h3 className="text-2xl font-black text-slate-900">{value}</h3>
            </div>
            <div className={`p-3 rounded-2xl ${theme}`}>
                <Icon size={24} />
            </div>
        </div>
    );
};

const ActivityIcon = ({ type }) => {
    const config = {
        login: { icon: LogIn, bg: 'bg-blue-100', text: 'text-blue-600' },
        enrolled: { icon: UserPlus, bg: 'bg-emerald-100', text: 'text-emerald-600' },
        completed: { icon: CheckCircle2, bg: 'bg-[#D6F84C]', text: 'text-[#002824]' },
        failed: { icon: AlertCircle, bg: 'bg-red-100', text: 'text-red-600' },
        download: { icon: FileText, bg: 'bg-purple-100', text: 'text-purple-600' },
        update: { icon: RefreshCw, bg: 'bg-slate-100', text: 'text-slate-600' },
    };
    const { icon: Icon, bg, text } = config[type] || config.update;

    return (
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center relative z-10 border-4 border-white shadow-sm ${bg} ${text}`}>
            <Icon size={20} />
        </div>
    );
};

const ActivityRow = ({ activity, isLast }) => {
    const getActionText = (type) => {
        switch(type) {
            case 'login': return 'masuk ke sistem';
            case 'enrolled': return 'mendaftar di training';
            case 'completed': return 'menyelesaikan modul';
            case 'failed': return 'tidak lulus kuis';
            case 'download': return 'mengunduh';
            default: return 'melakukan aktivitas';
        }
    };

    return (
        <div className={`relative flex gap-4 group ${isLast ? 'last-item' : ''}`}>
            <div className="timeline-line"></div>
            <ActivityIcon type={activity.action} />

            <div className="flex-1 pb-8">
                <div className="activity-card bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{activity.user}</span>
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase">{activity.role}</span>
                        </div>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock size={12} /> {activity.time}
                        </span>
                    </div>
                    <p className="text-sm text-slate-600">
                        {getActionText(activity.action)} <span className="font-bold text-[#005E54]">{activity.module}</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default function RecentActivity(props) {
    const { auth } = usePage().props || props;
    const user = auth?.user || props?.auth?.user || { name: 'Admin', role: 'Super Admin' };

    // Get initial data from props (same as dashboard for consistency)
    const initialEnrollments = props?.recent_enrollments || [];
    const initialCompletions = props?.recent_completions || [];
    const initialLogs = props?.recent_activity_logs || [];

    const [activities, setActivities] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [isLoading, setIsLoading] = useState(false);

    // Helper functions
    const timeAgo = (iso) => {
        if (!iso) return 'Baru saja';
        const d = new Date(iso);
        const sec = Math.floor((Date.now() - d.getTime()) / 1000);
        if (sec < 60) return `${sec} detik yang lalu`;
        if (sec < 3600) return `${Math.floor(sec/60)} menit yang lalu`;
        if (sec < 86400) return `${Math.floor(sec/3600)} jam yang lalu`;
        return d.toLocaleDateString('id-ID');
    };

    const getDateKey = (iso) => {
        if (!iso) return 'Tidak Diketahui';
        const d = new Date(iso);
        const today = new Date();
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        if (d.toDateString() === today.toDateString()) return 'Hari Ini';
        if (d.toDateString() === yesterday.toDateString()) return 'Kemarin';
        return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    const normalizeAction = (text) => {
        const t = String(text || '').toLowerCase();
        if (t.includes('login')) return 'login';
        if (t.includes('enroll') || t.includes('pendaftaran') || t.includes('assigned')) return 'enrolled';
        if (t.includes('complete') || t.includes('selesai') || t.includes('finish')) return 'completed';
        if (t.includes('fail') || t.includes('gagal') || t.includes('reject')) return 'failed';
        if (t.includes('download')) return 'download';
        if (t.includes('update') || t.includes('edit')) return 'update';
        return 'other';
    };

    // Helper: map enrollments, completions, and logs to activity objects
    const mapToActivity = (item, type) => {
        if (type === 'enroll') {
            return {
                id: `enroll-${item.id || Math.random()}`,
                user: item.user || item.user_name || 'Unknown User',
                role: item.role || 'User',
                action: 'enrolled',
                module: item.module || item.module_title || 'Unknown Module',
                time: item.time || (item.enrolled_at ? timeAgo(item.enrolled_at) : 'Baru saja'),
                date: item.date || (item.enrolled_at ? getDateKey(item.enrolled_at) : 'Hari Ini'),
                timestamp: item.timestamp || (item.enrolled_at ? new Date(item.enrolled_at).getTime() / 1000 : Date.now() / 1000)
            };
        } else if (type === 'complete') {
            return {
                id: `complete-${item.id || Math.random()}`,
                user: item.user || item.user_name || 'Unknown User',
                role: item.role || 'User',
                action: 'completed',
                module: item.module || item.module_title || 'Unknown Module',
                time: item.time || (item.completed_at ? timeAgo(item.completed_at) : 'Baru saja'),
                date: item.date || (item.completed_at ? getDateKey(item.completed_at) : 'Hari Ini'),
                timestamp: item.timestamp || (item.completed_at ? new Date(item.completed_at).getTime() / 1000 : Date.now() / 1000)
            };
        } else if (type === 'log') {
            // Handle real activity logs from backend
            const name = item.user || item.user_name || (item.causer && item.causer.name) || 'System';
            
            // Prioritas: gunakan type field dari backend jika ada, fallback ke action text
            let action = item.type || normalizeAction(item.action || item.event || item.description || '');
            if (!item.type) {
                action = normalizeAction(item.action || item.event || item.description || '');
            }
            
            const when = item.time || item.logged_at || item.created_at || null;
            const dateKey = getDateKey(when);

            return {
                id: `log-${item.id || Math.random().toString(36).slice(2, 9)}`,
                user: name,
                role: item.role || 'User',
                action: action,
                module: item.module || item.entity_type || item.subject_type || 'System',  // Gunakan module field, bukan type
                time: timeAgo(when),
                date: dateKey,
                timestamp: item.timestamp || (when ? new Date(when).getTime() / 1000 : Date.now() / 1000)
            };
        }
        return null;
    };

    // Initialize with backend data
    useEffect(() => {
        const enrollActs = (Array.isArray(initialEnrollments) ? initialEnrollments : [])
            .map(e => mapToActivity(e, 'enroll'))
            .filter(Boolean);
        const completeActs = (Array.isArray(initialCompletions) ? initialCompletions : [])
            .map(c => mapToActivity(c, 'complete'))
            .filter(Boolean);
        const logActs = (Array.isArray(initialLogs) ? initialLogs : [])
            .map(l => mapToActivity(l, 'log'))
            .filter(Boolean);
        
        const merged = [...enrollActs, ...completeActs, ...logActs]
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setActivities(merged);
    }, [initialEnrollments, initialCompletions, initialLogs]);


    // Fetch real-time updates from API (optional: set interval untuk polling)
    const fetchLatestActivities = async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/admin/activity-logs', { 
                headers: { 'Accept': 'application/json' },
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to fetch activity logs');
            const data = await res.json();
            const rows = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];

            const logActs = rows.map(row => mapToActivity(row, 'log')).filter(Boolean);
            
            // Merge dengan aktivitas yang sudah ada, hindari duplikasi
            setActivities(prev => {
                const existingIds = new Set(prev.map(a => a.id));
                const newActs = logActs.filter(a => !existingIds.has(a.id));
                return [...newActs, ...prev]
                    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
                    .slice(0, 100); // Limit to 100 most recent
            });
        } catch (err) {
            console.error('Failed to fetch latest activities:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Setup real-time polling (optional: setiap 10 detik)
    useEffect(() => {
        // Uncomment untuk enable real-time polling
        // const interval = setInterval(() => fetchLatestActivities(), 10000);
        // return () => clearInterval(interval);
    }, []);

    const filteredActivities = useMemo(() => {
        return activities.filter(act => {
            // Jika ada search query, tampilkan semua aktivitas dari user yang cocok
            const matchSearch = searchQuery === '' || act.user.toLowerCase().includes(searchQuery.toLowerCase());
            const matchFilter = filterType === 'all' || act.action === filterType;
            return matchSearch && matchFilter;
        });
    }, [activities, searchQuery, filterType]);

    const groupedActivities = useMemo(() => {
        return filteredActivities.reduce((groups, act) => {
            const date = act.date || 'Lainnya';
            if (!groups[date]) groups[date] = [];
            groups[date].push(act);
            return groups;
        }, {});
    }, [filteredActivities]);

    const handleRefresh = () => { fetchLatestActivities(); };

    return (
        <AdminLayout user={user}>
            <WondrStyles />
            <Head title="Live Activity Log" />

            <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-[#002824] p-8 rounded-[32px] relative overflow-hidden shadow-2xl shadow-[#002824]/20">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#005E54] rounded-full blur-[80px] opacity-40 -translate-y-1/2 translate-x-1/4"></div>
                    <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-[#D6F84C] rounded-full blur-[100px] opacity-10"></div>

                    <div className="relative z-10">
                        <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-white/70 hover:text-[#D6F84C] mb-4 transition font-bold text-sm group">
                            <div className="p-1.5 bg-white/10 rounded-full group-hover:bg-[#D6F84C] group-hover:text-[#002824] transition-all">
                                <ArrowLeft size={16} />
                            </div>
                            Kembali ke Dashboard
                        </Link>
                        <h1 className="text-4xl font-extrabold text-white leading-tight mb-2">Aktivitas <span className="text-[#D6F84C]">Live</span></h1>
                        <p className="text-blue-100 max-w-lg">Pantau pergerakan dan interaksi pengguna dalam sistem pembelajaran secara real-time.</p>
                    </div>

                    <div className="relative z-10 flex gap-3">
                        <button onClick={handleRefresh} className={`p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md border border-white/10 transition ${isLoading ? 'animate-spin' : ''}`}>
                            <RefreshCw size={20} />
                        </button>
                        <button onClick={async () => {
                                try {
                                    const res = await fetch('/api/admin/activity-logs/export', { headers: { 'Accept': 'application/json' } });
                                    if (!res.ok) throw new Error('Export failed');
                                    const blob = await res.blob();
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
                                    a.click();
                                    window.URL.revokeObjectURL(url);
                                } catch (err) {
                                    console.error('Export error', err);
                                }
                            }} className="flex items-center gap-2 px-6 py-3 bg-[#D6F84C] hover:bg-[#c2e43c] text-[#002824] rounded-xl font-bold shadow-lg shadow-[#D6F84C]/20 transition hover:scale-105">
                            <Download size={18} /> Export Log
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(() => {
                        const total = activities.length;
                        const loginsToday = activities.filter(a => a.action === 'login' && a.date === 'Hari Ini').length;
                        const completed = activities.filter(a => a.action === 'completed').length;
                        return (
                            <>
                                <StatWidget label="Total Aktivitas" value={total} icon={Activity} color="emerald" />
                                <StatWidget label="User Login Hari Ini" value={loginsToday} icon={LogIn} color="blue" />
                                <StatWidget label="Modul Diselesaikan" value={completed} icon={CheckCircle2} color="amber" />
                            </>
                        );
                    })()}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-[24px] p-6 border border-slate-200 shadow-sm sticky top-6">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Filter size={18} className="text-[#005E54]" /> Filter & Pencarian</h3>
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input type="text" placeholder="Cari user atau modul..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#005E54]/20 outline-none" />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Tipe Aktivitas</label>
                                    <div className="space-y-2">
                                        {[
                                            { id: 'all', label: 'Semua Aktivitas', icon: Activity },
                                            { id: 'login', label: 'Login System', icon: LogIn },
                                            { id: 'enrolled', label: 'Pendaftaran', icon: UserPlus },
                                            { id: 'completed', label: 'Penyelesaian', icon: CheckCircle2 },
                                            { id: 'failed', label: 'Gagal / Alert', icon: AlertCircle },
                                        ].map((item) => (
                                            <button key={item.id} onClick={() => setFilterType(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${filterType === item.id ? 'bg-[#002824] text-[#D6F84C] shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}>
                                                <item.icon size={16} />
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm min-h-[600px]">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-[#D6F84C] rounded-full"></div>
                                </div>
                            ) : Object.keys(groupedActivities).length > 0 ? (
                                Object.entries(groupedActivities).map(([date, acts], groupIndex) => (
                                    <div key={date} className="mb-8 animate-enter" style={{ animationDelay: `${groupIndex * 0.1}s` }}>
                                        <div className="sticky top-0 bg-white/90 backdrop-blur-sm z-10 py-2 mb-4 border-b border-slate-100">
                                            <h3 className="text-sm font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-[#D6F84C]"></div>
                                                {date}
                                            </h3>
                                        </div>
                                        <div className="pl-2">
                                            {acts.map((act, idx) => (
                                                <ActivityRow key={act.id} activity={act} isLast={groupIndex === Object.keys(groupedActivities).length - 1 && idx === acts.length - 1} />
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="text-slate-300" size={40} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">Tidak ada aktivitas ditemukan</h3>
                                    <p className="text-slate-500">Coba ubah filter atau kata kunci pencarian Anda.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

            </div>
        </AdminLayout>
    );
}