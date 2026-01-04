import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Bell, Search, Filter, CheckCircle, Trash2, X, 
    Info, AlertCircle, CheckCircle2, XCircle, Clock,
    Settings, Archive, Mail, MailOpen, Sparkles
} from 'lucide-react';

const TypeBadge = ({ type }) => {
    const config = {
        info: { color: 'bg-blue-100 text-blue-700', icon: Info },
        success: { color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
        warning: { color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
        error: { color: 'bg-red-100 text-red-700', icon: XCircle },
    };
    const { color, icon: Icon } = config[type] || config.info;

    return (
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${color}`}>
            <Icon size={12} /> {type}
        </span>
    );
};

export default function NotificationCenter({ auth }) {
    const user = auth.user;
    
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, unread, read
    const [filterType, setFilterType] = useState('all'); // all, info, success, warning, error
    const [selectedIds, setSelectedIds] = useState([]);
    const [showSettings, setShowSettings] = useState(false);

    // Settings state
    const [settings, setSettings] = useState({
        email_enabled: true,
        push_enabled: true,
        sound_enabled: true,
        desktop_enabled: true,
    });

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const response = await fetch('/api/user/notifications', {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                }
            });

            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            const response = await fetch(`/api/user/notifications/${id}/read`, {
                method: 'PATCH',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                }
            });

            if (response.ok) {
                setNotifications(notifications.map(n => 
                    n.id === id ? { ...n, read_at: new Date().toISOString() } : n
                ));
            }
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleBulkMarkAsRead = async () => {
        if (selectedIds.length === 0) {
            alert('Pilih notifikasi terlebih dahulu');
            return;
        }

        try {
            await Promise.all(selectedIds.map(id => 
                fetch(`/api/user/notifications/${id}/read`, {
                    method: 'PATCH',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                    }
                })
            ));

            setNotifications(notifications.map(n => 
                selectedIds.includes(n.id) ? { ...n, read_at: new Date().toISOString() } : n
            ));
            setSelectedIds([]);
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.read_at).map(n => n.id);
        
        if (unreadIds.length === 0) {
            alert('Tidak ada notifikasi yang belum dibaca');
            return;
        }

        try {
            await Promise.all(unreadIds.map(id => 
                fetch(`/api/user/notifications/${id}/read`, {
                    method: 'PATCH',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                    }
                })
            ));

            setNotifications(notifications.map(n => ({ ...n, read_at: new Date().toISOString() })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) {
            alert('Pilih notifikasi terlebih dahulu');
            return;
        }

        if (!confirm(`Hapus ${selectedIds.length} notifikasi yang dipilih?`)) return;

        try {
            await Promise.all(selectedIds.map(id => 
                fetch(`/api/user/notifications/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                    }
                })
            ));

            setNotifications(notifications.filter(n => !selectedIds.includes(n.id)));
            setSelectedIds([]);
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredNotifications.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredNotifications.map(n => n.id));
        }
    };

    const filteredNotifications = notifications.filter(notif => {
        const matchesSearch = notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            notif.message.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || 
                            (filterStatus === 'unread' && !notif.read_at) ||
                            (filterStatus === 'read' && notif.read_at);
        const matchesType = filterType === 'all' || notif.type === filterType;
        
        return matchesSearch && matchesStatus && matchesType;
    });

    const unreadCount = notifications.filter(n => !n.read_at).length;

    return (
        <AppLayout user={user}>
            <Head title="Notification Center" />

            <div className="max-w-6xl mx-auto pb-20">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                                Notifications
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900">Notification Center</h1>
                        <p className="text-slate-500 font-medium mt-1">
                            Kelola semua notifikasi Anda • {unreadCount} belum dibaca
                        </p>
                    </div>
                    <button 
                        onClick={() => setShowSettings(!showSettings)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-sm transition"
                    >
                        <Settings size={18} /> Settings
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
                        <Bell size={24} className="mb-2" />
                        <h3 className="text-2xl font-black">{notifications.length}</h3>
                        <p className="text-xs text-blue-100">Total Notifications</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white">
                        <MailOpen size={24} className="mb-2" />
                        <h3 className="text-2xl font-black">{notifications.filter(n => n.read_at).length}</h3>
                        <p className="text-xs text-green-100">Read</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-4 text-white">
                        <Mail size={24} className="mb-2" />
                        <h3 className="text-2xl font-black">{unreadCount}</h3>
                        <p className="text-xs text-amber-100">Unread</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
                        <Sparkles size={24} className="mb-2" />
                        <h3 className="text-2xl font-black">{notifications.filter(n => n.type === 'success').length}</h3>
                        <p className="text-xs text-purple-100">Achievements</p>
                    </div>
                </div>

                {/* Filters & Actions */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text"
                                placeholder="Search notifications..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Filter Status */}
                        <select 
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="unread">Unread</option>
                            <option value="read">Read</option>
                        </select>

                        {/* Filter Type */}
                        <select 
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Types</option>
                            <option value="info">Info</option>
                            <option value="success">Success</option>
                            <option value="warning">Warning</option>
                            <option value="error">Error</option>
                        </select>
                    </div>

                    {/* Bulk Actions */}
                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                            <span className="text-sm font-semibold text-slate-600">
                                {selectedIds.length} selected
                            </span>
                            <button 
                                onClick={handleBulkMarkAsRead}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-semibold text-sm hover:bg-blue-100 transition"
                            >
                                <CheckCircle size={16} /> Mark as Read
                            </button>
                            <button 
                                onClick={handleBulkDelete}
                                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg font-semibold text-sm hover:bg-red-100 transition"
                            >
                                <Trash2 size={16} /> Delete
                            </button>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                        <button 
                            onClick={toggleSelectAll}
                            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                            {selectedIds.length === filteredNotifications.length ? 'Deselect All' : 'Select All'}
                        </button>
                        <span className="text-slate-300">•</span>
                        <button 
                            onClick={handleMarkAllAsRead}
                            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                            Mark All as Read
                        </button>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="text-center py-16 text-slate-500">
                            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                            Loading notifications...
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="text-center py-16 text-slate-500">
                            <Bell size={48} className="mx-auto mb-4 text-slate-300" />
                            <p className="font-semibold">No notifications found</p>
                            <p className="text-sm mt-1">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filteredNotifications.map((notif) => (
                                <motion.div 
                                    key={notif.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-6 hover:bg-slate-50 transition group flex gap-4 ${
                                        !notif.read_at ? 'bg-blue-50/30' : ''
                                    }`}
                                >
                                    {/* Checkbox */}
                                    <input 
                                        type="checkbox"
                                        checked={selectedIds.includes(notif.id)}
                                        onChange={() => toggleSelect(notif.id)}
                                        className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />

                                    {/* Icon */}
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                        notif.type === 'info' ? 'bg-blue-100 text-blue-600' :
                                        notif.type === 'success' ? 'bg-green-100 text-green-600' :
                                        notif.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                                        'bg-red-100 text-red-600'
                                    }`}>
                                        {notif.type === 'info' ? <Info size={20} /> :
                                         notif.type === 'success' ? <CheckCircle2 size={20} /> :
                                         notif.type === 'warning' ? <AlertCircle size={20} /> :
                                         <XCircle size={20} />}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className={`font-bold text-slate-900 ${!notif.read_at ? 'text-blue-900' : ''}`}>
                                                    {notif.title}
                                                </h3>
                                                <TypeBadge type={notif.type} />
                                                {!notif.read_at && (
                                                    <span className="px-2 py-0.5 bg-blue-500 text-white text-[9px] font-bold rounded uppercase">New</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {!notif.read_at && (
                                                    <button 
                                                        onClick={() => handleMarkAsRead(notif.id)}
                                                        className="p-2 rounded-lg hover:bg-blue-100 text-blue-600 transition opacity-0 group-hover:opacity-100"
                                                        title="Mark as read"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                )}
                                                <span className="text-xs text-slate-400 font-medium">
                                                    {new Date(notif.created_at).toLocaleString('id-ID', { 
                                                        day: 'numeric',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-slate-600 text-sm leading-relaxed">
                                            {notif.message}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Settings Modal */}
                <AnimatePresence>
                    {showSettings && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                                onClick={() => setShowSettings(false)}
                            />
                            
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10"
                            >
                                <div className="p-6 border-b border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-black text-slate-900">Notification Settings</h2>
                                        <button 
                                            onClick={() => setShowSettings(false)}
                                            className="p-2 rounded-lg hover:bg-slate-100"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-slate-900">Email Notifications</p>
                                            <p className="text-xs text-slate-500">Receive notifications via email</p>
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            checked={settings.email_enabled}
                                            onChange={(e) => setSettings({...settings, email_enabled: e.target.checked})}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-slate-900">Push Notifications</p>
                                            <p className="text-xs text-slate-500">Receive push notifications</p>
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            checked={settings.push_enabled}
                                            onChange={(e) => setSettings({...settings, push_enabled: e.target.checked})}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-slate-900">Sound</p>
                                            <p className="text-xs text-slate-500">Play sound for new notifications</p>
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            checked={settings.sound_enabled}
                                            onChange={(e) => setSettings({...settings, sound_enabled: e.target.checked})}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-slate-900">Desktop Notifications</p>
                                            <p className="text-xs text-slate-500">Show desktop notifications</p>
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            checked={settings.desktop_enabled}
                                            onChange={(e) => setSettings({...settings, desktop_enabled: e.target.checked})}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="p-6 border-t border-slate-100">
                                    <button 
                                        onClick={() => {
                                            alert('Settings saved!');
                                            setShowSettings(false);
                                        }}
                                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
                                    >
                                        Save Settings
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </div>
        </AppLayout>
    );
}
