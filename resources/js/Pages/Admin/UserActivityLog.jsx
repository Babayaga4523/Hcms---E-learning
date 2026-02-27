import React, { useState, useEffect, useMemo } from 'react';
import { 
    Activity, Search, Filter, Download, Calendar, User, 
    AlertCircle, Eye, Zap, Trash2, Edit3, Plus, 
    LogOut, Upload, FileText, CheckCircle, Shield, 
    ChevronRight, X, Clock, RefreshCw
} from 'lucide-react';
import axios from 'axios';

// --- Wondr Style System ---
const WondrStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F8F9FA; color: #1e293b; }
        
        .wondr-dark { background-color: #002824; }
        .wondr-green { color: #005E54; }
        .wondr-lime { color: #D6F84C; }
        
        .glass-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.6);
            box-shadow: 0 10px 40px -10px rgba(0, 40, 36, 0.08);
        }

        .timeline-connector {
            position: absolute;
            top: 2rem;
            bottom: -2rem;
            left: 1.5rem;
            width: 2px;
            background: #E2E8F0;
            z-index: 0;
        }
        .last-item .timeline-connector { display: none; }

        .slide-over {
            transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .slide-over-open { transform: translateX(0); }
        .slide-over-closed { transform: translateX(100%); }

        .animate-pulse-slow { animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: .5; }
        }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
    `}</style>
);

// --- Mock Data & Constants ---
const ACTION_CONFIG = {
    login: { icon: Eye, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Login' },
    logout: { icon: LogOut, color: 'text-slate-600', bg: 'bg-slate-100', label: 'Logout' },
    create: { icon: Plus, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Created' },
    update: { icon: Edit3, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Updated' },
    delete: { icon: Trash2, color: 'text-red-600', bg: 'bg-red-100', label: 'Deleted' },
    upload: { icon: Upload, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Uploaded' },
    security: { icon: Shield, color: 'text-rose-600', bg: 'bg-rose-100', label: 'Security Alert' },
    export: { icon: Download, color: 'text-cyan-600', bg: 'bg-cyan-100', label: 'Exported' },
};

const MOCK_ACTIVITIES = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    user: { 
        name: ['Sarah Wijaya', 'Budi Santoso', 'System Admin', 'Dewi Putri', 'Andi Pratama'][i % 5],
        email: `user${i}@bni.co.id`,
        avatar_color: ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500'][i % 5]
    },
    action: ['login', 'create', 'update', 'delete', 'security', 'upload', 'export'][i % 7],
    entity: i % 2 === 0 ? 'Training Program' : 'User Profile',
    entity_id: `ID-${1000 + i}`,
    ip_address: `192.168.1.${10 + i}`,
    location: 'Jakarta, ID',
    device: 'Chrome / Windows',
    timestamp: new Date(Date.now() - i * 1000 * 60 * 45).toISOString(), // intervals
    details: {
        changes: i % 3 === 0 ? { old: 'Draft', new: 'Published' } : null,
        description: 'Performed standard operation on the dashboard.'
    }
}));

// --- Components ---

const FilterPill = ({ label, active, onClick, icon: Icon }) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all border ${
            active 
            ? 'bg-[#002824] text-[#D6F84C] border-[#002824] shadow-md' 
            : 'bg-white text-slate-600 border-slate-200 hover:border-[#005E54] hover:text-[#005E54]'
        }`}
    >
        {Icon && <Icon className="w-4 h-4" />}
        {label}
    </button>
);

const ActivityRow = ({ activity, isLast, onClick }) => {
    const config = ACTION_CONFIG[activity.action] || ACTION_CONFIG.update;
    const Icon = config.icon;

    return (
        <div className={`relative flex gap-6 group cursor-pointer ${isLast ? 'last-item' : ''}`} onClick={onClick}>
            {/* Timeline Line */}
            <div className="timeline-connector"></div>
            
            {/* Icon Node */}
            <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border-2 border-white shadow-sm transition-transform group-hover:scale-110 ${config.bg} ${config.color}`}>
                <Icon className="w-6 h-6" />
            </div>

            {/* Content Card */}
            <div className="flex-1 pb-8">
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group-hover:border-[#005E54]/20">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${config.bg} ${config.color}`}>
                                {config.label}
                            </span>
                            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(activity.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#005E54] transition-colors" />
                    </div>
                    
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h4 className="font-bold text-slate-900 text-sm">
                                <span className="text-[#005E54]">{activity.user.name}</span> 
                                <span className="font-medium text-slate-500"> {activity.action === 'login' ? 'logged in from' : `${activity.action}d`} </span>
                                <span className="text-slate-800">{activity.entity}</span>
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                {activity.ip_address} • {activity.device}
                            </p>
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${activity.user.avatar_color}`}>
                            {activity.user.name.charAt(0)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Layout ---

export default function UserActivityLog() {
    // State
    const [activities, setActivities] = useState([]);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [isLive, setIsLive] = useState(true);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Fetch activities from backend API
    useEffect(() => {
        fetchActivities();
        if (isLive) {
            const interval = setInterval(fetchActivities, 30000); // Refresh every 30s
            return () => clearInterval(interval);
        }
    }, [isLive, dateFrom, dateTo]);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (dateFrom) params.append('dateFrom', dateFrom);
            if (dateTo) params.append('dateTo', dateTo);
            
            const response = await axios.get(`/api/admin/activity-logs?${params.toString()}`);
            if (response.data && response.data.data) {
                setActivities(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching activities:', error);
            // Fallback to empty array on error
            setActivities([]);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredActivities = useMemo(() => {
        return activities.filter(act => {
            const actionType = act.action?.toLowerCase() || '';
            const matchesFilter = filter === 'all' || actionType === filter || (filter === 'security' && actionType === 'security');
            const matchesSearch = (act.user?.name || '').toLowerCase().includes(search.toLowerCase()) || 
                                  (act.ip_address || '').includes(search) ||
                                  (act.entity || '').toLowerCase().includes(search.toLowerCase());
            return matchesFilter && matchesSearch;
        });
    }, [activities, filter, search]);

    // Handlers
    const handleExport = async () => {
        try {
            setExporting(true);
            const params = new URLSearchParams();
            if (dateFrom) params.append('dateFrom', dateFrom);
            if (dateTo) params.append('dateTo', dateTo);
            if (filter !== 'all') params.append('action', filter);
            
            const response = await axios.get(`/api/admin/activity-logs/export?${params.toString()}`, {
                responseType: 'blob'
            });
            
            // Create blob download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `activity-logs-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error('Error exporting logs:', error);
            alert('Export failed. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-20 font-sans overflow-hidden">
            <WondrStyles />

            {/* --- Hero Header --- */}
            <div className="bg-[#002824] pt-8 pb-32 px-6 lg:px-12 relative">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#005E54] rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-2 text-[#D6F84C] mb-2 font-bold text-sm tracking-widest uppercase">
                            <Activity className="w-4 h-4" /> System Audit Trail
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight">
                            User Activity <br /> Logs
                        </h1>
                    </div>
                    
                    <div className="flex gap-3 flex-wrap lg:flex-nowrap items-center">
                        <div className="flex gap-2">
                            <input 
                                type="date" 
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 text-sm font-semibold placeholder-white/50 focus:border-[#D6F84C] focus:ring-2 focus:ring-[#D6F84C]/30 focus:bg-white/20 transition-all outline-none"
                            />
                            <input 
                                type="date" 
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 text-sm font-semibold placeholder-white/50 focus:border-[#D6F84C] focus:ring-2 focus:ring-[#D6F84C]/30 focus:bg-white/20 transition-all outline-none"
                            />
                        </div>
                        <button 
                            onClick={() => setIsLive(!isLive)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all border whitespace-nowrap ${
                                isLive 
                                ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse-slow' 
                                : 'bg-white/10 text-slate-400 border-white/10 hover:bg-white/20'
                            }`}
                        >
                            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500' : 'bg-slate-400'}`}></div>
                            {isLive ? 'Live' : 'Paused'}
                        </button>
                        <button 
                            onClick={handleExport}
                            disabled={exporting}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#D6FF59] hover:bg-[#c2e43c] disabled:opacity-50 disabled:cursor-not-allowed text-[#002824] rounded-xl font-bold shadow-lg shadow-[#D6FF59]/20 transition-all hover:scale-105 whitespace-nowrap"
                        >
                            {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            {exporting ? 'Exporting...' : 'Export'}
                        </button>
                    </div>
                </div>
                
                <div className="relative z-10">
                    <input 
                        type="text" 
                        placeholder="Search by user, IP, or entity..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-6 py-3 bg-white/10 text-white rounded-xl border border-white/20 font-semibold placeholder-white/50 focus:border-[#D6FF59] focus:ring-2 focus:ring-[#D6FF59]/30 focus:bg-white/20 transition-all outline-none"
                    />
                </div>
            </div>

            {/* --- Main Content (Floating Panel) --- */}
            <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-20 flex gap-8">
                
                {/* Left Column: List */}
                <div className="flex-1 min-w-0">
                    <div className="glass-card rounded-[32px] p-6 lg:p-8 min-h-[80vh]">
                        
                        {/* Loading or Empty State */}
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <RefreshCw className="w-8 h-8 animate-spin text-[#005E54] mb-4" />
                                <p className="text-slate-600 font-semibold">Loading activity logs...</p>
                            </div>
                        ) : filteredActivities.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <AlertCircle className="w-8 h-8 text-slate-300 mb-4" />
                                <p className="text-slate-600 font-semibold">No activity logs found</p>
                            </div>
                        ) : null}

                        {/* Filter Pills */}
                        {!loading && filteredActivities.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2">
                                <FilterPill label="All" active={filter === 'all'} onClick={() => setFilter('all')} />
                                <FilterPill label="Security" icon={Shield} active={filter === 'security'} onClick={() => setFilter('security')} />
                                <FilterPill label="Logins" icon={Eye} active={filter === 'login'} onClick={() => setFilter('login')} />
                                <FilterPill label="Changes" icon={Edit3} active={filter === 'update'} onClick={() => setFilter('update')} />
                            </div>
                        )}
                        <div className="space-y-0 px-2">
                            {filteredActivities.length > 0 ? (
                                filteredActivities.map((activity, index) => (
                                    <ActivityRow 
                                        key={activity.id} 
                                        activity={activity} 
                                        isLast={index === filteredActivities.length - 1}
                                        onClick={() => setSelectedActivity(activity)}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-20">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900">Tidak ada aktivitas ditemukan</h3>
                                    <p className="text-slate-500">Coba ubah filter pencarian Anda.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Stats (Hidden on mobile, sticky on desktop) */}
                <div className="hidden lg:block w-80 flex-shrink-0 space-y-6">
                    <div className="glass-card rounded-[24px] p-6 sticky top-6">
                        <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-[#005E54]" /> Overview Hari Ini
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="p-4 bg-[#F0FDF4] rounded-2xl border border-green-100">
                                <div className="text-xs font-bold text-green-600 mb-1">Total Aktivitas</div>
                                <div className="text-3xl font-extrabold text-[#005E54]">1,248</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                    <div className="text-xs font-bold text-blue-600 mb-1">Logins</div>
                                    <div className="text-xl font-extrabold text-blue-800">452</div>
                                </div>
                                <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                                    <div className="text-xs font-bold text-red-600 mb-1">Alerts</div>
                                    <div className="text-xl font-extrabold text-red-800">3</div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Top Active Users</h4>
                            <div className="space-y-4">
                                {[1,2,3].map((i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-600">U{i}</div>
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-slate-800">User {i}</div>
                                            <div className="text-xs text-slate-500">24 actions</div>
                                        </div>
                                        <div className="text-xs font-bold text-[#005E54]">Active</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* --- Slide-Over Detail Panel --- */}
            <div className={`fixed inset-0 z-50 pointer-events-none ${selectedActivity ? 'bg-[#002824]/40 backdrop-blur-sm pointer-events-auto' : ''} transition-colors duration-300`}>
                <div 
                    className={`absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl slide-over ${selectedActivity ? 'slide-over-open' : 'slide-over-closed'}`}
                >
                    {selectedActivity && (
                        <div className="h-full flex flex-col">
                            {/* Header */}
                            <div className="bg-[#002824] p-6 flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-extrabold text-white mb-1">Activity Detail</h2>
                                    <p className="text-[#D6F84C] font-mono text-sm">ID: #{selectedActivity.id}</p>
                                </div>
                                <button 
                                    onClick={() => setSelectedActivity(null)}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                                {/* User Info */}
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">User Information</h3>
                                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${selectedActivity.user.avatar_color}`}>
                                            {selectedActivity.user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">{selectedActivity.user.name}</div>
                                            <div className="text-sm text-slate-500">{selectedActivity.user.email}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Meta Info */}
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Metadata</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="text-xs text-slate-500 mb-1">IP Address</div>
                                            <div className="font-mono font-bold text-slate-800">{selectedActivity.ip_address}</div>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="text-xs text-slate-500 mb-1">Device</div>
                                            <div className="font-bold text-slate-800 text-sm truncate">{selectedActivity.device}</div>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 col-span-2">
                                            <div className="text-xs text-slate-500 mb-1">Timestamp</div>
                                            <div className="font-bold text-slate-800">
                                                {new Date(selectedActivity.timestamp).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Changes JSON */}
                                {selectedActivity.details?.changes && (
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Data Changes</h3>
                                        <div className="bg-slate-900 rounded-2xl p-4 overflow-hidden">
                                            <pre className="text-xs text-[#D6F84C] font-mono whitespace-pre-wrap">
                                                {JSON.stringify(selectedActivity.details.changes, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-slate-100 bg-slate-50">
                                <button 
                                    onClick={() => setSelectedActivity(null)}
                                    className="w-full py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors"
                                >
                                    Close Panel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
