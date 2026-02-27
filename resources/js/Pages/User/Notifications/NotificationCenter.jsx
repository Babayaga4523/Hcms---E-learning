import React, { useState, useEffect, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE, API_ENDPOINTS } from '@/Config/api';
import { 
    Bell, Search, Filter, CheckCircle, Trash2, X, 
    Info, AlertCircle, CheckCircle2, XCircle, Clock,
    Settings, Archive, Mail, MailOpen, Sparkles,
    ChevronDown, MoreHorizontal, Check, Loader2, ChevronLeft, ChevronRight
} from 'lucide-react';
import showToast from '@/Utils/toast';
import { handleAuthError } from '@/Utils/authGuard';
import usePagination from '@/Hooks/usePagination';

// --- Wondr Style System ---
const WondrStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F8F9FA; color: #1e293b; }
        
        .wondr-dark { background-color: #002824; }
        .wondr-green { color: #005E54; }
        .wondr-lime { color: #D6F84C; }
        
        .glass-panel {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.6);
            box-shadow: 0 10px 40px -10px rgba(0, 40, 36, 0.05);
        }

        .hero-pattern {
            background-color: #002824;
            background-image: radial-gradient(#005E54 1px, transparent 1px);
            background-size: 24px 24px;
        }

        .notif-card {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            border-left: 4px solid transparent;
        }
        .notif-card:hover {
            background-color: #F0FDF4;
            transform: translateX(4px);
        }
        .notif-card.unread {
            background-color: #ffffff;
            border-left-color: #D6F84C;
        }
        .notif-card.read {
            background-color: #f8fafc;
            opacity: 0.8;
        }

        /* Modern Toggle */
        .toggle-checkbox:checked {
            right: 0;
            border-color: #005E54;
        }
        .toggle-checkbox:checked + .toggle-label {
            background-color: #005E54;
        }
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }

        .animate-enter { animation: enter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        @keyframes enter {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `}</style>
);

// --- Helper Components ---

const NotificationIcon = ({ type }) => {
    const config = {
        info: { bg: 'bg-blue-100', text: 'text-blue-600', icon: Info },
        success: { bg: 'bg-emerald-100', text: 'text-emerald-600', icon: CheckCircle2 },
        warning: { bg: 'bg-amber-100', text: 'text-amber-600', icon: AlertCircle },
        error: { bg: 'bg-red-100', text: 'text-red-600', icon: XCircle },
    };
    const { bg, text, icon: Icon } = config[type] || config.info;

    return (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg} ${text}`}>
            <Icon size={20} />
        </div>
    );
};

const FilterTab = ({ label, active, onClick, count }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all relative ${
            active 
            ? 'bg-[#002824] text-[#D6F84C] shadow-lg' 
            : 'text-slate-500 hover:bg-slate-100'
        }`}
    >
        {label}
        {count > 0 && (
            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${active ? 'bg-[#D6F84C] text-[#002824]' : 'bg-slate-200 text-slate-600'}`}>
                {count}
            </span>
        )}
    </button>
);

const ToggleSwitch = ({ label, checked, onChange, description }) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
        <div>
            <h4 className="font-bold text-slate-900 text-sm">{label}</h4>
            <p className="text-xs text-slate-500">{description}</p>
        </div>
        <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
            <input 
                type="checkbox" 
                id={`toggle-${label}`} 
                aria-label={`${label}, ${checked ? 'aktif' : 'tidak aktif'}`}
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-all duration-300 left-0 checked:left-6 checked:bg-[#D6F84C] checked:border-[#005E54]"
                checked={checked}
                onChange={onChange}
            />
            <label 
                htmlFor={`toggle-${label}`} 
                className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-300 ${checked ? 'bg-[#005E54]' : 'bg-slate-300'}`}
            ></label>
        </div>
    </div>
);

// --- Main Component ---

export default function NotificationCenter({ auth }) {
    const user = auth?.user || { name: 'User' };
    
    // State
    const [notifications, setNotifications] = useState([]);
    const [paginationMeta, setPaginationMeta] = useState({ last_page: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, unread
    const [selectedIds, setSelectedIds] = useState([]);
    const [showSettings, setShowSettings] = useState(false);
    const [deletingIds, setDeletingIds] = useState([]);
    const [readingIds, setReadingIds] = useState([]);
    const pagination = usePagination(1, 20);
    
    // Settings State
    const [settings, setSettings] = useState({
        email_enabled: true,
        push_enabled: true,
        sound_enabled: false,
    });

    useEffect(() => {
        // Initial load
        loadNotifications();
    }, []);

    // Reload when page changes
    useEffect(() => {
        loadNotifications({ search: searchTerm.trim(), status: filterStatus === 'unread' ? 'unread' : '' });
    }, [pagination.page]);

    // Debounced search + status filter (reset to page 1)
    useEffect(() => {
        const handler = setTimeout(() => {
            pagination.resetPage();
            loadNotifications({ search: searchTerm.trim(), status: filterStatus === 'unread' ? 'unread' : '' });
        }, 500);

        return () => clearTimeout(handler);
    }, [searchTerm, filterStatus]);

    const loadNotifications = async ({ search = '', status = '' } = {}) => {
        // If searching, use searchLoading; otherwise use loading for initial load
        if (search) setSearchLoading(true);
        else setLoading(true);

        try {
            const params = new URLSearchParams();
            params.append('page', pagination.page);
            params.append('per_page', pagination.pageSize);
            if (search) params.append('search', search);
            if (status) params.append('status', status);

            const url = `${API_BASE}${API_ENDPOINTS.NOTIFICATIONS}${params.toString() ? `?${params.toString()}` : ''}`;

            const response = await fetch(url, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                // Extract array from paginated response: { data: [...], meta: {...} }
                const notificationData = Array.isArray(data) ? data : (data.data || []);
                setNotifications(notificationData);
                // Update pagination meta if available
                if (data.meta) {
                    setPaginationMeta(data.meta);
                    pagination.updateMeta(notificationData, data.meta);
                }
            } else if (response.status === 401) {
                handleAuthError({ response }, '/login');
            } else {
                console.error('Failed to load notifications, status:', response.status);
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setSearchLoading(false);
            setLoading(false);
        }
    };

    // Filtering Logic (server performs text search; client filters by status only)
    const filteredNotifications = useMemo(() => {
        if (!notifications || notifications.length === 0) return [];
        return notifications.filter(n => {
            return filterStatus === 'all' || (filterStatus === 'unread' && !n.read_at);
        });
    }, [notifications, filterStatus]);

    const unreadCount = notifications.filter(n => !n.read_at).length;

    // Handlers
    const handleMarkAsRead = async (id) => {
        setReadingIds(prev => [...prev, id]);
        
        try {
            // Add timeout to prevent hanging requests
            const fetchWithTimeout = Promise.race([
                fetch(`${API_BASE}${API_ENDPOINTS.NOTIFICATIONS_READ(id)}`, {
                    method: 'PATCH',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                    }
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Request timeout')), 30000)
                )
            ]);

            const response = await fetchWithTimeout;

            if (response.ok) {
                setNotifications(notifications.map(n => 
                    n.id === id ? { ...n, read_at: new Date().toISOString() } : n
                ));
                showToast('Notifikasi ditandai sudah dibaca', 'success');
            } else if (response.status === 401) {
                handleAuthError({ response }, '/login');
            } else {
                showToast('Gagal menandai notifikasi sebagai dibaca', 'error');
            }
        } catch (error) {
            const errorMsg = error.message === 'Request timeout' 
                ? 'Timeout: Server tidak merespons' 
                : `Gagal menandai notifikasi: ${error.message}`;
            showToast(errorMsg, 'error');
            console.error('Failed to mark as read:', error);
        } finally {
            setReadingIds(prev => prev.filter(rid => rid !== id));
        }
    };

    const handleBulkRead = async () => {
        if (selectedIds.length === 0) return;

        setReadingIds(selectedIds);

        try {
            const deleteWithTimeout = (id) => Promise.race([
                fetch(`${API_BASE}${API_ENDPOINTS.NOTIFICATIONS_READ(id)}`, {
                    method: 'PATCH',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                    }
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Request timeout')), 30000)
                )
            ]);

            const responses = await Promise.all(selectedIds.map(deleteWithTimeout));

            // Check for auth errors in any response
            for (const response of responses) {
                if (response.status === 401) {
                    handleAuthError({ response }, '/login');
                    return;
                }
            }

            setNotifications(notifications.map(n => 
                selectedIds.includes(n.id) ? { ...n, read_at: new Date().toISOString() } : n
            ));
            setSelectedIds([]);
            showToast(`${selectedIds.length} notifikasi ditandai sudah dibaca`, 'success');
        } catch (error) {
            const errorMsg = error.message === 'Request timeout'
                ? 'Timeout: Server tidak merespons'
                : `Gagal menandai notifikasi: ${error.message}`;
            showToast(errorMsg, 'error');
            console.error('Failed to bulk read:', error);
        } finally {
            setReadingIds([]);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Hapus ${selectedIds.length} notifikasi?`)) return;

        // Show loading state
        setDeletingIds(selectedIds);
        
        try {
            // Add timeout to prevent hanging requests
            const deleteWithTimeout = (id) => Promise.race([
                fetch(`${API_BASE}${API_ENDPOINTS.NOTIFICATIONS_DELETE(id)}`, {
                    method: 'DELETE',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                    }
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Request timeout')), 30000)
                )
            ]);

            const responses = await Promise.all(selectedIds.map(deleteWithTimeout));

            // Check for auth errors in any response
            for (const response of responses) {
                if (response.status === 401) {
                    handleAuthError({ response }, '/login');
                    return;
                }
            }

            setNotifications(notifications.filter(n => !selectedIds.includes(n.id)));
            setSelectedIds([]);
            showToast(`${selectedIds.length} notifikasi berhasil dihapus`, 'success');
            
        } catch (error) {
            const errorMsg = error.message === 'Request timeout'
                ? 'Timeout: Server tidak merespons'
                : `Gagal menghapus notifikasi: ${error.message}`;
            showToast(errorMsg, 'error');
            console.error('Failed to bulk delete:', error);
        } finally {
            setDeletingIds([]);
        }
    };

    const handleSelectAll = () => {
        if (selectedIds.length === filteredNotifications.length) setSelectedIds([]);
        else setSelectedIds(filteredNotifications.map(n => n.id));
    };

    const handleSelectOne = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus notifikasi ini?')) return;

        setDeletingIds(prev => [...prev, id]);

        try {
            const fetchWithTimeout = Promise.race([
                fetch(`${API_BASE}${API_ENDPOINTS.NOTIFICATIONS_DELETE(id)}`, {
                    method: 'DELETE',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                    }
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Request timeout')), 30000)
                )
            ]);

            const response = await fetchWithTimeout;

            if (response.status === 401) {
                handleAuthError({ response }, '/login');
                return;
            }

            setNotifications(prev => prev.filter(n => n.id !== id));
            showToast('Notifikasi berhasil dihapus', 'success');
        } catch (error) {
            const errorMsg = error.message === 'Request timeout'
                ? 'Timeout: Server tidak merespons'
                : `Gagal menghapus notifikasi: ${error.message}`;
            showToast(errorMsg, 'error');
            console.error('Failed to delete:', error);
        } finally {
            setDeletingIds(prev => prev.filter(did => did !== id));
        }
    };

    return (
        <AppLayout user={user}>
            <WondrStyles />
            <Head title="Notification Center" />

            {/* --- Hero Header --- */}
            <div className="hero-pattern pt-8 pb-32 px-6 lg:px-12 relative rounded-b-[48px] overflow-hidden shadow-2xl shadow-[#002824]/20">
                <div className="max-w-4xl mx-auto relative z-10">
                    {/* Top Bar */}
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3 text-white/80">
                            <div className="p-2 bg-white/10 rounded-full backdrop-blur-md">
                                <Bell size={20} />
                            </div>
                            <span className="font-bold text-sm tracking-wide">Inbox</span>
                        </div>
                        <button 
                            onClick={() => setShowSettings(true)}
                            className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition"
                        >
                            <Settings size={20} />
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                        <div>
                            <h1 className="text-4xl font-extrabold text-white leading-tight mb-2">
                                Notifikasi
                            </h1>
                            <p className="text-blue-100 text-lg">
                                {unreadCount > 0 ? `Anda memiliki ${unreadCount} pesan baru.` : 'Semua sudah terbaca.'}
                            </p>
                        </div>
                        
                        {/* Search Bar */}
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18} />
                            <input 
                                type="text" 
                                placeholder="Cari notifikasi..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-12 py-3 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl text-white placeholder-white/50 focus:bg-white/20 focus:outline-none focus:border-[#D6F84C]/50 transition-all font-medium"
                            />
                            {/* Right-side: loading spinner or clear button */}
                            {searchLoading ? (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80">
                                    <Loader2 size={16} className="animate-spin" />
                                </div>
                            ) : (
                                searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white">
                                        <X size={16} />
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Main Content --- */}
            <div className="max-w-4xl mx-auto px-6 -mt-20 relative z-20 pb-20">
                
                {/* Controls & List */}
                <div className="glass-panel rounded-[32px] p-6 lg:p-8 min-h-[600px] flex flex-col">
                    
                    {/* Tabs & Bulk Select */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                        <div className="flex bg-slate-100 p-1 rounded-2xl">
                            <FilterTab 
                                label="Semua" 
                                active={filterStatus === 'all'} 
                                onClick={() => setFilterStatus('all')} 
                                count={notifications.length}
                            />
                            <FilterTab 
                                label="Belum Dibaca" 
                                active={filterStatus === 'unread'} 
                                onClick={() => setFilterStatus('unread')} 
                                count={unreadCount}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <button 
                                onClick={handleSelectAll}
                                className="text-sm font-bold text-slate-500 hover:text-[#005E54] px-3 py-2 rounded-lg hover:bg-slate-50 transition"
                            >
                                {selectedIds.length === filteredNotifications.length && filteredNotifications.length > 0 ? 'Batal Pilih' : 'Pilih Semua'}
                            </button>
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="space-y-3 flex-1">
                        {loading ? (
                            <div className="text-center py-20">
                                <div className="animate-spin w-12 h-12 border-4 border-[#005E54] border-t-transparent rounded-full mx-auto mb-4"></div>
                                <p className="text-slate-500">Memuat notifikasi...</p>
                            </div>
                        ) : filteredNotifications.length > 0 ? (
                            <AnimatePresence>
                                {filteredNotifications.map((notif, index) => (
                                    <motion.div
                                        key={notif.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`relative group rounded-2xl p-4 flex gap-4 notif-card ${notif.read_at ? 'read' : 'unread border-l-[#D6F84C]'}`}
                                    >
                                        {/* Selection Checkbox */}
                                        <div className="flex items-start pt-3">
                                            <input 
                                                type="checkbox" 
                                                aria-label={`Pilih notifikasi: ${notif.title || 'Tanpa judul'}`}
                                                checked={selectedIds.includes(notif.id)}
                                                onChange={() => handleSelectOne(notif.id)}
                                                className="w-5 h-5 rounded-md border-slate-300 text-[#005E54] focus:ring-[#005E54] cursor-pointer"
                                            />
                                        </div>

                                        {/* Icon */}
                                        <NotificationIcon type={notif.type} />

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => !notif.read_at && handleMarkAsRead(notif.id)}>
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className={`font-bold text-sm ${notif.read_at ? 'text-slate-600' : 'text-slate-900'}`}>
                                                    {notif.title}
                                                </h4>
                                                <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap ml-2">
                                                    {new Date(notif.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                </span>
                                            </div>
                                            <p className={`text-sm leading-relaxed ${notif.read_at ? 'text-slate-400' : 'text-slate-600'}`}>
                                                {notif.message}
                                            </p>
                                        </div>

                                        {/* Hover Actions */}
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm p-1 rounded-xl shadow-sm">
                                            {!notif.read_at && (
                                                <button 
                                                    onClick={() => handleMarkAsRead(notif.id)}
                                                    disabled={readingIds.includes(notif.id)}
                                                    className="p-2 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-400 hover:text-emerald-600 rounded-lg transition"
                                                    title="Tandai Sudah Dibaca"
                                                >
                                                    {readingIds.includes(notif.id) ? (
                                                        <Loader2 size={18} className="animate-spin" />
                                                    ) : (
                                                        <CheckCircle size={18} />
                                                    )}
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleDelete(notif.id)}
                                                disabled={deletingIds.includes(notif.id)}
                                                className="p-2 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-400 hover:text-red-600 rounded-lg transition"
                                                title="Hapus"
                                            >
                                                {deletingIds.includes(notif.id) ? (
                                                    <Loader2 size={18} className="animate-spin" />
                                                ) : (
                                                    <Trash2 size={18} />
                                                )}
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        ) : (
                            <div className="text-center py-20">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Bell className="text-slate-300" size={40} />
                                </div>
                                <h3 className="font-bold text-slate-900 mb-1">Tidak ada notifikasi</h3>
                                <p className="text-slate-500 text-sm">Kotak masuk Anda bersih.</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination Controls */}
                    {filteredNotifications.length > 0 && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-slate-200">
                            <button
                                onClick={pagination.prevPage}
                                disabled={pagination.page === 1}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 font-bold rounded-xl transition-colors"
                            >
                                <ChevronLeft size={18} /> Sebelumnya
                            </button>
                            <span className="text-sm font-bold text-slate-600">
                                Halaman {pagination.page} dari {pagination.totalPages}
                            </span>
                            <button
                                onClick={pagination.nextPage}
                                disabled={!pagination.hasMore}
                                className="flex items-center gap-2 px-4 py-2 bg-[#005E54] hover:bg-[#003d38] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
                            >
                                Selanjutnya <ChevronRight size={18} />
                            </button>
                        </div>
                    )}

                </div>
            </div>

            {/* --- Floating Bulk Actions --- */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-[#002824] text-white px-6 py-4 rounded-[24px] shadow-2xl z-40 flex items-center gap-6 w-[90%] max-w-xl border border-[#D6F84C]/20"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#D6F84C] flex items-center justify-center text-[#002824] font-bold">
                                {selectedIds.length}
                            </div>
                            <span className="font-semibold text-sm">Dipilih</span>
                        </div>
                        
                        <div className="h-8 w-[1px] bg-white/20"></div>

                        <div className="flex items-center gap-2 flex-1 justify-end">
                            <button 
                                onClick={handleBulkRead}
                                disabled={readingIds.length > 0}
                                className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors text-sm font-bold text-white"
                            >
                                {readingIds.length > 0 ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" /> Menandai...
                                    </>
                                ) : (
                                    <>
                                        <MailOpen size={18} className="text-[#D6F84C]" /> Tandai Baca
                                    </>
                                )}
                            </button>
                            <button 
                                onClick={handleBulkDelete}
                                disabled={deletingIds.length > 0}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-red-400 rounded-xl transition-colors text-sm font-bold border border-red-500/20"
                            >
                                {deletingIds.length > 0 ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" /> Menghapus...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={18} /> Hapus
                                    </>
                                )}
                            </button>
                            <button 
                                onClick={() => setSelectedIds([])}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors ml-2"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- Settings Modal --- */}
            <AnimatePresence>
                {showSettings && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-extrabold text-xl text-slate-900">Pengaturan Notifikasi</h3>
                                <button onClick={() => setShowSettings(false)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition">
                                    <X size={20} className="text-slate-500" />
                                </button>
                            </div>
                            
                            <div className="p-6 space-y-4">
                                <ToggleSwitch 
                                    label="Notifikasi Email" 
                                    description="Terima ringkasan notifikasi via email."
                                    checked={settings.email_enabled}
                                    onChange={(e) => setSettings({...settings, email_enabled: e.target.checked})}
                                />
                                <ToggleSwitch 
                                    label="Push Notification" 
                                    description="Notifikasi pop-up di browser."
                                    checked={settings.push_enabled}
                                    onChange={(e) => setSettings({...settings, push_enabled: e.target.checked})}
                                />
                                <ToggleSwitch 
                                    label="Suara Notifikasi" 
                                    description="Mainkan suara saat ada pesan baru."
                                    checked={settings.sound_enabled}
                                    onChange={(e) => setSettings({...settings, sound_enabled: e.target.checked})}
                                />
                            </div>

                            <div className="p-6 bg-slate-50 border-t border-slate-100">
                                <button 
                                    onClick={() => setShowSettings(false)}
                                    className="w-full py-3 bg-[#002824] text-[#D6F84C] font-bold rounded-xl hover:shadow-lg transition-all transform active:scale-95"
                                >
                                    Simpan Perubahan
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </AppLayout>
    );
}
