import React, { useState, useEffect, useCallback } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import axios from 'axios';
import { 
    Bell, Send, MessageSquare, Megaphone, Plus, X, Edit2, Trash2,
    CheckCircle2, AlertTriangle, Info, XCircle, Clock, Calendar,
    Search, Filter, BarChart3, Eye, Zap, ArrowRight, Smartphone,
    Sparkles, ChevronRight, User, MoreHorizontal, Copy, Check,
    TrendingUp, Users, Activity, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ====== TOAST NOTIFICATION SYSTEM ======
const Toast = ({ message, type = 'success', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const styles = {
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white',
        info: 'bg-blue-500 text-white',
        warning: 'bg-amber-500 text-white',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 px-6 py-3 rounded-full font-bold text-sm shadow-lg z-[200] ${styles[type]}`}
        >
            {message}
        </motion.div>
    );
};

// ====== REUSABLE COMPONENTS ======

const TypeBadge = ({ type }) => {
    const config = {
        info: { color: "bg-blue-100 text-blue-700", icon: Info },
        warning: { color: "bg-amber-100 text-amber-700", icon: AlertTriangle },
        success: { color: "bg-green-100 text-green-700", icon: CheckCircle2 },
        error: { color: "bg-red-100 text-red-700", icon: XCircle },
    };
    const { color, icon: Icon } = config[type] || config.info;

    return (
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${color}`}>
            <Icon size={12} /> {type}
        </span>
    );
};

const StatusBadge = ({ status }) => {
    const styles = {
        active: "bg-green-100 text-green-700 border-green-200",
        inactive: "bg-slate-100 text-slate-500 border-slate-200",
        scheduled: "bg-orange-100 text-orange-700 border-orange-200",
        draft: "bg-slate-100 text-slate-600 border-slate-200",
        sent: "bg-green-100 text-green-700 border-green-200",
    };
    
    const icons = {
        active: <CheckCircle2 size={12} />,
        inactive: <AlertTriangle size={12} />,
        scheduled: <Clock size={12} />,
        draft: <AlertCircle size={12} />,
        sent: <CheckCircle2 size={12} />,
    };

    return (
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles.inactive}`}>
            {icons[status] || icons.inactive} {status}
        </span>
    );
};

const AnnouncementTypeBadge = ({ type }) => {
    const styles = {
        general: "bg-blue-50 text-blue-600",
        urgent: "bg-red-50 text-red-600",
        maintenance: "bg-yellow-50 text-yellow-700",
        event: "bg-purple-50 text-purple-600",
    };
    const labels = {
        general: "ℹ️ Info",
        urgent: "🚨 Alert",
        maintenance: "🛠️ Maintenance",
        event: "🎉 Event",
    };
    return (
        <span className={`px-2 py-1 rounded-md text-xs font-bold ${styles[type] || styles.general}`}>
            {labels[type] || labels.general}
        </span>
    );
};

const StatCard = ({ label, value, icon: Icon, color }) => (
    <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
            <Icon size={24} />
        </div>
        <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</p>
            <h3 className="text-2xl font-black text-slate-900">{value}</h3>
        </div>
    </div>
);

const EmptyState = ({ icon: Icon, title, description }) => (
    <div className="py-16 text-center">
        <Icon className="mx-auto mb-4 text-slate-300" size={48} />
        <h3 className="text-lg font-bold text-slate-700 mb-1">{title}</h3>
        <p className="text-slate-500 text-sm">{description}</p>
    </div>
);

// ====== ANNOUNCEMENT ITEM ======
const AnnouncementItem = ({ item, onEdit, onDelete }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(item.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 hover:bg-slate-50 transition border-b border-slate-100 last:border-0"
        >
            <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-lg">{item.title}</h3>
                        <StatusBadge status={item.status} />
                        <AnnouncementTypeBadge type={item.type} />
                    </div>
                    <p className="text-slate-600 text-sm line-clamp-2 mb-3">{item.content}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                        <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                        <span className="flex items-center gap-1"><Eye size={12}/> {item.views || 0} views</span>
                        {item.is_featured && <span className="text-amber-600 flex items-center gap-1"><Sparkles size={12}/> Featured</span>}
                    </div>
                </div>

                <div className="flex gap-2 mt-4 md:mt-0">
                    <button
                        onClick={handleCopy}
                        title="Copy content"
                        className="p-2 rounded-full hover:bg-blue-100 text-blue-600 transition"
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                    <button
                        onClick={() => onEdit(item.id)}
                        title="Edit announcement"
                        className="p-2 rounded-full hover:bg-slate-200 text-slate-600 transition"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button
                        onClick={() => onDelete(item.id)}
                        title="Delete announcement"
                        className="p-2 rounded-full hover:bg-red-100 text-red-600 transition"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

// ====== NOTIFICATION ITEM ======
const NotificationItem = ({ item, onDelete }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(item.message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 hover:bg-slate-50 transition border-b border-slate-100 last:border-0"
        >
            <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-lg">{item.title}</h3>
                        <TypeBadge type={item.type} />
                        <StatusBadge status={item.status || 'sent'} />
                    </div>
                    <p className="text-slate-600 text-sm line-clamp-2 mb-3">{item.message}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                        <span className="flex items-center gap-1"><User size={12}/> {item.recipients === 'all' ? 'All Users' : item.recipients || 'Unknown'}</span>
                        <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                    </div>
                </div>

                <div className="flex gap-2 mt-4 md:mt-0">
                    <button
                        onClick={handleCopy}
                        title="Copy message"
                        className="p-2 rounded-full hover:bg-blue-100 text-blue-600 transition"
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                    <button
                        onClick={() => onDelete(item.id)}
                        title="Delete notification"
                        className="p-2 rounded-full hover:bg-red-100 text-red-600 transition"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

// ====== MAIN COMPONENT ======

export default function CommunicationHub() {
    const { auth } = usePage().props;
    const user = auth.user;

    // ===== TOAST STATE =====
    const [toast, setToast] = useState(null);

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
    }, []);

    // Tabs
    const [activeTab, setActiveTab] = useState('announcements');

    // ===== ANNOUNCEMENTS STATE =====
    const [announcements, setAnnouncements] = useState([]);
    const [announcementsLoading, setAnnouncementsLoading] = useState(false);
    const [announcementSearch, setAnnouncementSearch] = useState('');
    const [announcementStatusFilter, setAnnouncementStatusFilter] = useState('all');
    const [announcementTypeFilter, setAnnouncementTypeFilter] = useState('all');
    const [announcementSortBy, setAnnouncementSortBy] = useState('newest');
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    const [editingAnnouncementId, setEditingAnnouncementId] = useState(null);
    const [announcementSaving, setAnnouncementSaving] = useState(false);

    const [announcementForm, setAnnouncementForm] = useState({
        title: '',
        content: '',
        type: 'general',
        status: 'active',
        display_type: 'banner',
        start_date: '',
        end_date: '',
        is_featured: false,
    });

    // ===== NOTIFICATIONS STATE =====
    const [notifications, setNotifications] = useState([]);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [notificationSearch, setNotificationSearch] = useState('');
    const [notificationTypeFilter, setNotificationTypeFilter] = useState('all');
    const [notificationStatusFilter, setNotificationStatusFilter] = useState('all');
    const [notificationSortBy, setNotificationSortBy] = useState('newest');
    const [showNotificationCompose, setShowNotificationCompose] = useState(false);
    const [notificationSending, setNotificationSending] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

    const [notificationForm, setNotificationForm] = useState({
        title: '',
        message: '',
        type: 'info',
        recipients: 'all',
        scheduled_at: '',
        is_scheduled: false,
    });

    // ===== LOAD DATA =====
    useEffect(() => {
        loadAnnouncements();
        loadNotifications();
    }, []);

    const loadAnnouncements = async () => {
        try {
            setAnnouncementsLoading(true);
            const response = await axios.get('/api/admin/announcements');
            setAnnouncements(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Failed to load announcements:', err);
            showToast('Gagal memuat announcements', 'error');
            setAnnouncements([]);
        } finally {
            setAnnouncementsLoading(false);
        }
    };

    const loadNotifications = async () => {
        try {
            setNotificationsLoading(true);
            const response = await axios.get('/api/admin/notifications');
            setNotifications(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Failed to load notifications:', err);
            showToast('Gagal memuat notifications', 'error');
            setNotifications([]);
        } finally {
            setNotificationsLoading(false);
        }
    };

    // ===== ANNOUNCEMENT HANDLERS =====
    const handleSaveAnnouncement = async () => {
        if (!announcementForm.title.trim() || !announcementForm.content.trim()) {
            showToast('Title dan content harus diisi', 'warning');
            return;
        }

        try {
            setAnnouncementSaving(true);
            
            if (editingAnnouncementId) {
                await axios.put(`/api/admin/announcements/${editingAnnouncementId}`, announcementForm);
                showToast('Announcement berhasil diupdate', 'success');
            } else {
                await axios.post('/api/admin/announcements', announcementForm);
                showToast('Announcement berhasil dibuat', 'success');
            }
            
            setShowAnnouncementModal(false);
            resetAnnouncementForm();
            loadAnnouncements();
        } catch (err) {
            console.error(err);
            showToast(err.response?.data?.message || 'Gagal menyimpan announcement', 'error');
        } finally {
            setAnnouncementSaving(false);
        }
    };

    const handleDeleteAnnouncement = async (id) => {
        try {
            await axios.delete(`/api/admin/announcements/${id}`);
            loadAnnouncements();
            showToast('Announcement berhasil dihapus', 'success');
            setShowDeleteConfirm(null);
        } catch (err) {
            console.error(err);
            showToast('Gagal menghapus announcement', 'error');
        }
    };

    const handleEditAnnouncement = async (id) => {
        try {
            const response = await axios.get(`/api/admin/announcements/${id}`);
            setAnnouncementForm(response.data);
            setEditingAnnouncementId(id);
            setShowAnnouncementModal(true);
        } catch (err) {
            console.error(err);
            showToast('Gagal memuat announcement', 'error');
        }
    };

    const resetAnnouncementForm = () => {
        setAnnouncementForm({
            title: '',
            content: '',
            type: 'general',
            status: 'active',
            display_type: 'banner',
            start_date: '',
            end_date: '',
            is_featured: false,
        });
        setEditingAnnouncementId(null);
    };

    // ===== NOTIFICATION HANDLERS =====
    const handleSendNotification = async () => {
        if (!notificationForm.title.trim() || !notificationForm.message.trim()) {
            showToast('Title dan message harus diisi', 'warning');
            return;
        }

        try {
            setNotificationSending(true);
            await axios.post('/api/admin/notifications/send', notificationForm);
            
            showToast('Notification berhasil dikirim', 'success');
            setShowNotificationCompose(false);
            setNotificationForm({
                title: '',
                message: '',
                type: 'info',
                recipients: 'all',
                scheduled_at: '',
                is_scheduled: false,
            });
            loadNotifications();
        } catch (err) {
            console.error(err);
            showToast(err.response?.data?.message || 'Gagal mengirim notification', 'error');
        } finally {
            setNotificationSending(false);
        }
    };

    const handleDeleteNotification = async (id) => {
        try {
            await axios.delete(`/api/admin/notifications/${id}`);
            loadNotifications();
            showToast('Notification berhasil dihapus', 'success');
            setShowDeleteConfirm(null);
        } catch (err) {
            console.error(err);
            showToast('Gagal menghapus notification', 'error');
        }
    };

    // ===== FILTER & SEARCH & SORT =====
    const sortItems = (items) => {
        const sorted = [...items];
        if (announcementSortBy === 'newest') {
            return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } else if (announcementSortBy === 'oldest') {
            return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        }
        return sorted;
    };

    const filteredAnnouncements = sortItems(announcements.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(announcementSearch.toLowerCase()) ||
                            item.content.toLowerCase().includes(announcementSearch.toLowerCase());
        const matchesStatus = announcementStatusFilter === 'all' || item.status === announcementStatusFilter;
        const matchesType = announcementTypeFilter === 'all' || item.type === announcementTypeFilter;
        return matchesSearch && matchesStatus && matchesType;
    }));

    const filteredNotifications = sortItems(notifications.filter(notif => {
        const matchesSearch = notif.title.toLowerCase().includes(notificationSearch.toLowerCase()) ||
                            notif.message.toLowerCase().includes(notificationSearch.toLowerCase());
        const matchesType = notificationTypeFilter === 'all' || notif.type === notificationTypeFilter;
        const matchesStatus = notificationStatusFilter === 'all' || (notif.status || 'sent') === notificationStatusFilter;
        return matchesSearch && matchesType && matchesStatus;
    }));

    // ===== STATS =====
    const announcementStats = {
        total: announcements.length,
        active: announcements.filter(a => a.status === 'active').length,
        views: announcements.reduce((sum, ann) => sum + (ann.views || 0), 0),
        featured: announcements.filter(a => a.is_featured).length,
    };

    const notificationStats = {
        total: notifications.length,
        sent: notifications.filter(n => (n.status || 'sent') !== 'draft').length,
        scheduled: notifications.filter(n => n.is_scheduled && (n.status || 'sent') === 'draft').length,
    };

    return (
        <AdminLayout user={user}>
            <Head title="Communication Hub" />

            {/* Toast Notifications */}
            <AnimatePresence>
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => setShowDeleteConfirm(null)}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-[24px] p-8 shadow-2xl relative z-10"
                        >
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Hapus item?</h3>
                            <p className="text-slate-600 mb-6">Tindakan ini tidak dapat dibatalkan.</p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="flex-1 py-3 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={() => {
                                        if (showDeleteConfirm.type === 'announcement') {
                                            handleDeleteAnnouncement(showDeleteConfirm.id);
                                        } else {
                                            handleDeleteNotification(showDeleteConfirm.id);
                                        }
                                    }}
                                    className="flex-1 py-3 font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition"
                                >
                                    Hapus
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div>
                
                {/* ===== HEADER ===== */}
                <div className="mb-12">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="px-3 py-1 bg-slate-900 text-[#D6FF59] text-[10px] font-bold uppercase tracking-wider rounded-full">
                            📡 Communication
                        </span>
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-2">Communication Hub</h1>
                    <p className="text-slate-600 font-medium max-w-2xl">Kelola pengumuman dan notifikasi dengan mudah. Jangkau seluruh pengguna dengan pesan yang relevan dan tepat waktu.</p>
                </div>

                {/* ===== TABS ===== */}
                <div className="flex gap-3 mb-10">
                    <button
                        onClick={() => setActiveTab('announcements')}
                        className={`px-6 py-3 rounded-full font-bold text-sm transition flex items-center gap-2 ${
                            activeTab === 'announcements'
                                ? 'bg-slate-900 text-white shadow-lg'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <Megaphone size={18} /> Announcements
                    </button>
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`px-6 py-3 rounded-full font-bold text-sm transition flex items-center gap-2 ${
                            activeTab === 'notifications'
                                ? 'bg-slate-900 text-white shadow-lg'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <Bell size={18} /> Notifications
                    </button>
                </div>

                {/* ===== ANNOUNCEMENTS TAB ===== */}
                {activeTab === 'announcements' && (
                    <div className="space-y-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard label="Total Broadcasts" value={announcementStats.total} icon={Megaphone} color="bg-purple-100 text-purple-600" />
                            <StatCard label="Active Now" value={announcementStats.active} icon={CheckCircle2} color="bg-green-100 text-green-600" />
                            <StatCard label="Featured" value={announcementStats.featured} icon={Sparkles} color="bg-yellow-100 text-yellow-600" />
                            <StatCard label="Total Views" value={announcementStats.views.toLocaleString('id-ID')} icon={Eye} color="bg-blue-100 text-blue-600" />
                        </div>

                        {/* Create Button */}
                        <div className="flex justify-end">
                            <button 
                                onClick={() => {
                                    resetAnnouncementForm();
                                    setShowAnnouncementModal(true);
                                }}
                                className="group flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl font-bold text-sm shadow-lg hover:shadow-xl transition hover:-translate-y-0.5"
                            >
                                <Plus size={20} /> Create Announcement
                            </button>
                        </div>

                        {/* Search & Filter Section */}
                        <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <div className="lg:col-span-2 relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                        type="text"
                                        placeholder="Cari announcement..."
                                        value={announcementSearch}
                                        onChange={(e) => setAnnouncementSearch(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                                    />
                                </div>
                                <select 
                                    value={announcementStatusFilter}
                                    onChange={(e) => setAnnouncementStatusFilter(e.target.value)}
                                    className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                                >
                                    <option value="all">Semua Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="scheduled">Scheduled</option>
                                </select>
                                <select 
                                    value={announcementTypeFilter}
                                    onChange={(e) => setAnnouncementTypeFilter(e.target.value)}
                                    className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                                >
                                    <option value="all">Semua Type</option>
                                    <option value="general">General</option>
                                    <option value="urgent">Urgent</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="event">Event</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                                <div className="text-sm text-slate-600 font-medium">
                                    Menampilkan <span className="font-bold text-slate-900">{filteredAnnouncements.length}</span> dari <span className="font-bold text-slate-900">{announcements.length}</span> announcements
                                </div>
                                <select 
                                    value={announcementSortBy}
                                    onChange={(e) => setAnnouncementSortBy(e.target.value)}
                                    className="text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900"
                                >
                                    <option value="newest">Terbaru</option>
                                    <option value="oldest">Terlama</option>
                                </select>
                            </div>

                            {/* List */}
                            {announcementsLoading ? (
                                <div className="text-center py-16">
                                    <div className="inline-flex animate-spin">
                                        <Activity className="text-slate-400" size={32} />
                                    </div>
                                    <p className="text-slate-500 mt-3 font-medium">Loading announcements...</p>
                                </div>
                            ) : filteredAnnouncements.length === 0 ? (
                                <EmptyState 
                                    icon={Megaphone}
                                    title="Belum ada announcement"
                                    description={announcementSearch ? "Coba ubah filter atau kata kunci pencarian" : "Mulai dengan membuat announcement pertama Anda"}
                                />
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {filteredAnnouncements.map((item) => (
                                        <AnnouncementItem
                                            key={item.id}
                                            item={item}
                                            onEdit={handleEditAnnouncement}
                                            onDelete={(id) => setShowDeleteConfirm({ type: 'announcement', id })}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ===== NOTIFICATIONS TAB ===== */}
                {activeTab === 'notifications' && (
                    <div className="space-y-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[28px] p-6 text-white relative overflow-hidden shadow-lg">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500 blur-[100px] opacity-20"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Notifications</p>
                                        <Bell className="text-blue-400" size={20} />
                                    </div>
                                    <h3 className="text-4xl font-black">{notificationStats.total}</h3>
                                </div>
                            </div>
                            <StatCard label="Sent" value={notificationStats.sent} icon={Send} color="bg-green-100 text-green-600" />
                            <StatCard label="Scheduled" value={notificationStats.scheduled} icon={Clock} color="bg-orange-100 text-orange-600" />
                        </div>

                        {/* Create Button */}
                        <div className="flex justify-end">
                            <button 
                                onClick={() => setShowNotificationCompose(true)}
                                className="group flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-[#D6FF59] to-[#cbf542] text-slate-900 rounded-2xl font-bold text-sm shadow-lg shadow-lime-200/50 hover:shadow-xl transition hover:-translate-y-0.5"
                            >
                                <Send size={20} /> Send Notification
                            </button>
                        </div>

                        {/* Search & Filter Section */}
                        <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <div className="lg:col-span-2 relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                        type="text"
                                        placeholder="Cari notification..."
                                        value={notificationSearch}
                                        onChange={(e) => setNotificationSearch(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                                    />
                                </div>
                                <select 
                                    value={notificationTypeFilter}
                                    onChange={(e) => setNotificationTypeFilter(e.target.value)}
                                    className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                                >
                                    <option value="all">Semua Type</option>
                                    <option value="info">Info</option>
                                    <option value="warning">Warning</option>
                                    <option value="success">Success</option>
                                    <option value="error">Error</option>
                                </select>
                                <select 
                                    value={notificationStatusFilter}
                                    onChange={(e) => setNotificationStatusFilter(e.target.value)}
                                    className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                                >
                                    <option value="all">Semua Status</option>
                                    <option value="sent">Sent</option>
                                    <option value="draft">Draft</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                                <div className="text-sm text-slate-600 font-medium">
                                    Menampilkan <span className="font-bold text-slate-900">{filteredNotifications.length}</span> dari <span className="font-bold text-slate-900">{notifications.length}</span> notifications
                                </div>
                                <select 
                                    value={notificationSortBy}
                                    onChange={(e) => setNotificationSortBy(e.target.value)}
                                    className="text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900"
                                >
                                    <option value="newest">Terbaru</option>
                                    <option value="oldest">Terlama</option>
                                </select>
                            </div>

                            {/* List */}
                            {notificationsLoading ? (
                                <div className="text-center py-16">
                                    <div className="inline-flex animate-spin">
                                        <Activity className="text-slate-400" size={32} />
                                    </div>
                                    <p className="text-slate-500 mt-3 font-medium">Loading notifications...</p>
                                </div>
                            ) : filteredNotifications.length === 0 ? (
                                <EmptyState 
                                    icon={Bell}
                                    title="Belum ada notification"
                                    description={notificationSearch ? "Coba ubah filter atau kata kunci pencarian" : "Mulai dengan mengirim notification pertama Anda"}
                                />
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {filteredNotifications.map((item) => (
                                        <NotificationItem
                                            key={item.id}
                                            item={item}
                                            onDelete={(id) => setShowDeleteConfirm({ type: 'notification', id })}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ===== ANNOUNCEMENT MODAL ===== */}
                <AnimatePresence>
                    {showAnnouncementModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                                onClick={() => setShowAnnouncementModal(false)}
                            />
                            
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                                animate={{ opacity: 1, scale: 1, y: 0 }} 
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-white w-full max-w-2xl rounded-[28px] shadow-2xl relative z-10 overflow-hidden max-h-[90vh] flex flex-col"
                            >
                                <div className="p-8 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900">
                                            {editingAnnouncementId ? '✏️ Edit Announcement' : '📢 Create Announcement'}
                                        </h2>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {editingAnnouncementId ? 'Update announcement yang ada' : 'Buat announcement baru untuk pengguna'}
                                        </p>
                                    </div>
                                    <button onClick={() => setShowAnnouncementModal(false)} className="p-2 rounded-full hover:bg-slate-100">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="p-8 space-y-6 overflow-y-auto flex-1">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">Judul Announcement</label>
                                        <input 
                                            type="text" 
                                            value={announcementForm.title}
                                            onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                                            placeholder="Masukkan judul announcement..." 
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                                        />
                                        <p className="text-xs text-slate-400 mt-2">{announcementForm.title.length}/100 karakter</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">Konten</label>
                                        <textarea 
                                            rows={6}
                                            value={announcementForm.content}
                                            onChange={(e) => setAnnouncementForm({...announcementForm, content: e.target.value})}
                                            placeholder="Masukkan konten announcement..."
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition resize-none"
                                        />
                                        <p className="text-xs text-slate-400 mt-2">{announcementForm.content.length}/1000 karakter</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">Tipe</label>
                                            <select 
                                                value={announcementForm.type}
                                                onChange={(e) => setAnnouncementForm({...announcementForm, type: e.target.value})}
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                                            >
                                                <option value="general">🔵 General</option>
                                                <option value="urgent">🔴 Urgent</option>
                                                <option value="maintenance">🟡 Maintenance</option>
                                                <option value="event">🟣 Event</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">Status</label>
                                            <select 
                                                value={announcementForm.status}
                                                onChange={(e) => setAnnouncementForm({...announcementForm, status: e.target.value})}
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                                <option value="scheduled">Scheduled</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">Tipe Display</label>
                                            <select 
                                                value={announcementForm.display_type}
                                                onChange={(e) => setAnnouncementForm({...announcementForm, display_type: e.target.value})}
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                                            >
                                                <option value="banner">📊 Banner</option>
                                                <option value="modal">🪟 Modal</option>
                                                <option value="notification">🔔 Notification</option>
                                            </select>
                                        </div>
                                        <div className="flex items-end">
                                            <label className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl flex-1">
                                                <input
                                                    type="checkbox"
                                                    checked={announcementForm.is_featured}
                                                    onChange={(e) => setAnnouncementForm({...announcementForm, is_featured: e.target.checked})}
                                                    className="w-5 h-5 rounded cursor-pointer"
                                                />
                                                <span className="text-sm font-bold text-amber-900">⭐ Featured</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">Mulai Tanggal</label>
                                            <input
                                                type="datetime-local"
                                                value={announcementForm.start_date}
                                                onChange={(e) => setAnnouncementForm({...announcementForm, start_date: e.target.value})}
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">Akhir Tanggal</label>
                                            <input
                                                type="datetime-local"
                                                value={announcementForm.end_date}
                                                onChange={(e) => setAnnouncementForm({...announcementForm, end_date: e.target.value})}
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 border-t border-slate-100 bg-white flex gap-3 sticky bottom-0">
                                    <button 
                                        onClick={() => setShowAnnouncementModal(false)}
                                        className="flex-1 py-3 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
                                    >
                                        Batal
                                    </button>
                                    <button 
                                        onClick={handleSaveAnnouncement}
                                        disabled={announcementSaving}
                                        className="flex-1 py-3 font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                    >
                                        {announcementSaving ? (
                                            <>
                                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                                                    <Activity size={16} />
                                                </motion.div>
                                                Saving...
                                            </>
                                        ) : (
                                            <>✓ Simpan</>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* ===== NOTIFICATION COMPOSE MODAL ===== */}
                <AnimatePresence>
                    {showNotificationCompose && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                                onClick={() => setShowNotificationCompose(false)}
                            />
                            
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                                animate={{ opacity: 1, scale: 1, y: 0 }} 
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-white w-full max-w-2xl rounded-[28px] shadow-2xl relative z-10 overflow-hidden max-h-[90vh] flex flex-col"
                            >
                                <div className="p-8 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900">📨 Send Notification</h2>
                                        <p className="text-sm text-slate-500 mt-1">Kirim pesan ke pengguna secara real-time atau terjadwal</p>
                                    </div>
                                    <button onClick={() => setShowNotificationCompose(false)} className="p-2 rounded-full hover:bg-slate-100">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="p-8 space-y-6 overflow-y-auto flex-1">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">Judul Notification</label>
                                        <input 
                                            type="text" 
                                            value={notificationForm.title}
                                            onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
                                            placeholder="Masukkan judul notification..." 
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                                        />
                                        <p className="text-xs text-slate-400 mt-2">{notificationForm.title.length}/100 karakter</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">Pesan</label>
                                        <textarea 
                                            rows={6}
                                            value={notificationForm.message}
                                            onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
                                            placeholder="Masukkan pesan notification..."
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition resize-none"
                                        />
                                        <p className="text-xs text-slate-400 mt-2">{notificationForm.message.length}/500 karakter</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">Tipe</label>
                                            <select 
                                                value={notificationForm.type}
                                                onChange={(e) => setNotificationForm({...notificationForm, type: e.target.value})}
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                                            >
                                                <option value="info">ℹ️ Info</option>
                                                <option value="warning">⚠️ Warning</option>
                                                <option value="success">✅ Success</option>
                                                <option value="error">❌ Error</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">Penerima</label>
                                            <select 
                                                value={notificationForm.recipients}
                                                onChange={(e) => setNotificationForm({...notificationForm, recipients: e.target.value})}
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                                            >
                                                <option value="all">👥 Semua Pengguna</option>
                                                <option value="role">🎯 Berdasarkan Role</option>
                                                <option value="user">👤 Pengguna Tertentu</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition">
                                        <input
                                            type="checkbox"
                                            id="schedule"
                                            checked={notificationForm.is_scheduled}
                                            onChange={(e) => setNotificationForm({...notificationForm, is_scheduled: e.target.checked})}
                                            className="w-5 h-5 rounded cursor-pointer"
                                        />
                                        <label htmlFor="schedule" className="text-sm font-bold text-slate-700 cursor-pointer flex-1">
                                            ⏰ Jadwalkan pengiriman (opsional)
                                        </label>
                                    </div>

                                    {notificationForm.is_scheduled && (
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">Waktu Pengiriman</label>
                                            <input
                                                type="datetime-local"
                                                value={notificationForm.scheduled_at}
                                                onChange={(e) => setNotificationForm({...notificationForm, scheduled_at: e.target.value})}
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                                            />
                                            <p className="text-xs text-slate-500 mt-2">💡 Pilih tanggal dan waktu untuk pengiriman otomatis</p>
                                        </div>
                                    )}

                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                        <p className="text-sm text-blue-900 font-medium">
                                            ✨ <strong>Tips:</strong> Gunakan pesan yang singkat dan jelas agar mudah dipahami pengguna.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-6 border-t border-slate-100 bg-white flex gap-3 sticky bottom-0">
                                    <button 
                                        onClick={() => setShowNotificationCompose(false)}
                                        className="flex-1 py-3 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
                                    >
                                        Batal
                                    </button>
                                    <button 
                                        onClick={handleSendNotification}
                                        disabled={notificationSending}
                                        className="flex-1 py-3 font-bold text-slate-900 bg-[#D6FF59] rounded-xl hover:bg-[#cbf542] transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                    >
                                        {notificationSending ? (
                                            <>
                                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                                                    <Send size={16} />
                                                </motion.div>
                                                Sending...
                                            </>
                                        ) : (
                                            <>✉️ Kirim</>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </div>
        </AdminLayout>
    );
}
