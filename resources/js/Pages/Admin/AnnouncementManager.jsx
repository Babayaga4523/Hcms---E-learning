import React, { useEffect, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import showToast from '@/Utils/toast';
import { 
    Megaphone, Plus, Edit3, Trash2, Eye, EyeOff, X, Search, 
    Calendar, MoreHorizontal, Bell, Smartphone, Layout, Target,
    BarChart3, CheckCircle2, AlertCircle, Clock, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- COMPONENTS ---

const StatusBadge = ({ status }) => {
    const styles = {
        active: "bg-green-100 text-green-700 border-green-200",
        inactive: "bg-slate-100 text-slate-500 border-slate-200",
        scheduled: "bg-orange-100 text-orange-700 border-orange-200",
    };
    
    const icons = {
        active: <CheckCircle2 size={12} />,
        inactive: <EyeOff size={12} />,
        scheduled: <Clock size={12} />,
    };

    return (
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status]}`}>
            {icons[status]} {status}
        </span>
    );
};

const TypeBadge = ({ type }) => {
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
        <span className={`px-2 py-1 rounded-md text-xs font-bold ${styles[type]}`}>
            {labels[type]}
        </span>
    );
};

const StatCard = ({ label, value, icon: Icon, color }) => (
    <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
            <Icon size={24} />
        </div>
        <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</p>
            <h3 className="text-2xl font-black text-slate-900">{value}</h3>
        </div>
    </div>
);

export default function AnnouncementManager() {
    const { auth } = usePage().props;
    const user = auth.user;

    // State
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'general',
        status: 'active',
        display_type: 'banner',
        start_date: '',
        end_date: '',
        is_featured: false,
    });

    // Load announcements
    useEffect(() => {
        loadAnnouncements();
    }, []);

    const loadAnnouncements = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/announcements', {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                }
            });

            if (res.ok) {
                const data = await res.json();
                setAnnouncements(data);
            }
        } catch (err) {
            console.error('Failed to load announcements:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAnnouncement = async () => {
        if (!formData.title || !formData.content) {
            showToast('Title dan content harus diisi', 'warning');
            return;
        }

        try {
            setSaving(true);
            const method = editingId ? 'PUT' : 'POST';
            const url = editingId 
                ? `/api/admin/announcements/${editingId}`
                : '/api/admin/announcements';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setShowModal(false);
                resetForm();
                loadAnnouncements();
            } else {
                showToast('Gagal menyimpan announcement', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Gagal menyimpan announcement', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleEditAnnouncement = async (id) => {
        try {
            const res = await fetch(`/api/admin/announcements/${id}`, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                }
            });

            if (res.ok) {
                const data = await res.json();
                setFormData(data);
                setEditingId(id);
                setShowModal(true);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteAnnouncement = async (id) => {
        if (!confirm('Hapus announcement ini?')) return;

        try {
            const res = await fetch(`/api/admin/announcements/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                }
            });

            if (res.ok) {
                loadAnnouncements();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            const res = await fetch(`/api/admin/announcements/${id}/toggle-status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                loadAnnouncements();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            content: '',
            type: 'general',
            status: 'active',
            display_type: 'banner',
            start_date: '',
            end_date: '',
            is_featured: false,
        });
        setEditingId(null);
    };

    // Filter Logic
    const filteredData = announcements.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Calculate stats
    const totalViews = announcements.reduce((sum, ann) => sum + (ann.views || 0), 0);
    const activeCount = announcements.filter(a => a.status === 'active').length;
    const scheduledCount = announcements.filter(a => a.status === 'scheduled').length;
    const avgEngagement = announcements.length > 0 
        ? Math.round(announcements.reduce((sum, ann) => sum + (ann.clicks || 0), 0) / announcements.length) 
        : 0;

    return (
        <AdminLayout user={user}>
            <Head title="Broadcast Center" />

            <div className="pb-20 font-sans bg-[#FAFAFA]">
                
                {/* Header Section */}
                <div className="mb-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Broadcast Center</h2>
                            <p className="text-slate-500 mt-2 font-medium">Kelola notifikasi, banner, dan popup sistem.</p>
                        </div>
                        <button 
                            onClick={() => {
                                resetForm();
                                setShowModal(true);
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-full font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                        >
                            <Plus size={18} /> Buat Announcement
                        </button>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <StatCard label="Active Broadcasts" value={activeCount} icon={Megaphone} color="bg-green-100 text-green-600" />
                        <StatCard label="Total Views" value={totalViews.toLocaleString()} icon={Eye} color="bg-blue-100 text-blue-600" />
                        <StatCard label="Avg Engagement" value={avgEngagement} icon={BarChart3} color="bg-orange-100 text-orange-600" />
                        <StatCard label="Scheduled" value={scheduledCount} icon={Calendar} color="bg-purple-100 text-purple-600" />
                    </div>

                    {/* Filters & Search */}
                    <div className="bg-white p-2 rounded-[24px] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex gap-2 bg-slate-50 p-1.5 rounded-full w-full md:w-auto overflow-x-auto">
                            {['all', 'active', 'scheduled', 'inactive'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-6 py-2 rounded-full text-xs font-bold capitalize transition-all whitespace-nowrap ${
                                        filterStatus === status 
                                        ? 'bg-[#D6FF59] text-black shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                        <div className="relative w-full md:w-64 px-2">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Cari judul..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border-none rounded-full text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#D6FF59]"
                            />
                        </div>
                    </div>
                </div>

                {/* Grid Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {loading ? (
                            <div className="col-span-full text-center py-12 text-slate-500">
                                <div className="animate-spin inline-block w-8 h-8 border-4 border-slate-200 border-t-[#D6FF59] rounded-full"></div>
                            </div>
                        ) : filteredData.length === 0 ? (
                            <div className="col-span-full text-center py-16 bg-white rounded-[32px] text-slate-500">
                                <Megaphone size={48} className="mx-auto mb-4 text-slate-300" />
                                <p className="font-semibold">Belum ada announcement</p>
                            </div>
                        ) : (
                            filteredData.map((item) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    key={item.id}
                                    className="group bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:border-[#D6FF59]/50 transition-all duration-300 relative overflow-hidden"
                                >
                                    {/* Card Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-2">
                                            <TypeBadge type={item.type} />
                                            <StatusBadge status={item.status} />
                                            {item.is_featured && (
                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded-full">⭐ Featured</span>
                                            )}
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-900">
                                                <MoreHorizontal size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="mb-6 h-[80px]">
                                        <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-1">{item.title}</h3>
                                        <p className="text-slate-500 text-sm leading-relaxed line-clamp-3">{item.content}</p>
                                    </div>

                                    {/* Meta Info */}
                                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 mb-6 border-t border-slate-50 pt-4">
                                        <div className="flex items-center gap-1.5">
                                            <Layout size={14} /> {item.display_type}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={14} /> {new Date(item.created_at || new Date()).toLocaleDateString('id-ID')}
                                        </div>
                                    </div>

                                    {/* Footer Actions & Stats */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-3">
                                            <div className="flex items-center gap-1 text-xs font-bold text-slate-600">
                                                <Eye size={14} className="text-[#00BFA5]" /> {item.views || 0}
                                            </div>
                                            <div className="flex items-center gap-1 text-xs font-bold text-slate-600">
                                                <Send size={14} className="text-[#FF5500]" /> {item.clicks || 0}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleToggleStatus(item.id, item.status)}
                                                className={`p-2 rounded-full border transition ${
                                                    item.status === 'active' 
                                                    ? 'border-green-200 text-green-600 hover:bg-green-50' 
                                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                                }`}
                                            >
                                                {item.status === 'active' ? <Eye size={16} /> : <EyeOff size={16} />}
                                            </button>
                                            <button 
                                                onClick={() => handleEditAnnouncement(item.id)}
                                                className="p-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteAnnouncement(item.id)}
                                                className="p-2 rounded-full border border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 transition"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* --- CREATE / EDIT MODAL --- */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[32px] w-full max-w-5xl h-[90vh] flex flex-col md:flex-row overflow-hidden shadow-2xl"
                    >
                        {/* LEFT: FORM INPUTS */}
                        <div className="flex-1 p-8 overflow-y-auto">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black text-slate-900">
                                    {editingId ? 'Edit Broadcast' : 'Buat Broadcast Baru'}
                                </h2>
                                <button 
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }} 
                                    className="p-2 rounded-full hover:bg-slate-100"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Title Input */}
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Judul Pesan</label>
                                    <input 
                                        type="text" 
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#D6FF59]"
                                        placeholder="Contoh: Maintenance Server..."
                                    />
                                </div>

                                {/* Content Input */}
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Isi Pesan</label>
                                    <textarea 
                                        rows={5}
                                        value={formData.content}
                                        onChange={(e) => setFormData({...formData, content: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-600 font-medium outline-none focus:ring-2 focus:ring-[#D6FF59]"
                                        placeholder="Tulis detail pengumuman di sini..."
                                    />
                                </div>

                                {/* Configuration Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Tipe</label>
                                        <select 
                                            value={formData.type}
                                            onChange={(e) => setFormData({...formData, type: e.target.value})}
                                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#D6FF59]"
                                        >
                                            <option value="general">ℹ️ General Info</option>
                                            <option value="urgent">🚨 Urgent Alert</option>
                                            <option value="maintenance">🛠️ Maintenance</option>
                                            <option value="event">🎉 Event</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Status</label>
                                        <select 
                                            value={formData.status}
                                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#D6FF59]"
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="scheduled">Scheduled</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Display Type Toggle */}
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Display Type</label>
                                    <div className="flex bg-slate-50 p-1 rounded-xl">
                                        {['banner', 'modal', 'notification'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setFormData({...formData, display_type: type})}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                                                    formData.display_type === type 
                                                    ? 'bg-white shadow-sm text-black' 
                                                    : 'text-slate-400 hover:text-slate-600'
                                                }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Date Range */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Start Date</label>
                                        <input
                                            type="date"
                                            value={formData.start_date}
                                            onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#D6FF59]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">End Date</label>
                                        <input
                                            type="date"
                                            value={formData.end_date}
                                            onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#D6FF59]"
                                        />
                                    </div>
                                </div>

                                {/* Featured Checkbox */}
                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                                    <input
                                        type="checkbox"
                                        id="featured"
                                        checked={formData.is_featured}
                                        onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                                        className="w-5 h-5 rounded accent-[#D6FF59]"
                                    />
                                    <label htmlFor="featured" className="text-sm font-bold text-slate-700">
                                        ⭐ Featured - Prioritas tinggi di dashboard
                                    </label>
                                </div>
                            </div>
                            
                            <div className="mt-8 pt-6 border-t border-slate-100 flex gap-4">
                                <button 
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }} 
                                    className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSaveAnnouncement}
                                    disabled={saving}
                                    className="flex-1 py-3 font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 shadow-lg disabled:opacity-50"
                                >
                                    {saving ? 'Publishing...' : editingId ? 'Update Broadcast' : 'Publish Now'}
                                </button>
                            </div>
                        </div>

                        {/* RIGHT: LIVE PREVIEW */}
                        <div className="w-[400px] bg-[#0F172A] p-8 flex flex-col items-center justify-center border-l border-slate-800 relative overflow-hidden hidden md:flex">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D6FF59] rounded-full blur-[100px] opacity-10 pointer-events-none"></div>

                            <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                                <Smartphone size={18} className="text-[#D6FF59]" /> Live Mobile Preview
                            </h3>

                            {/* Mock Phone Frame */}
                            <div className="w-[280px] h-[550px] bg-white rounded-[40px] border-[8px] border-slate-800 overflow-hidden relative shadow-2xl">
                                {/* Status Bar */}
                                <div className="h-6 bg-slate-900 w-full flex justify-between px-4 items-center">
                                    <span className="text-[8px] text-white">9:41</span>
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                </div>
                                
                                {/* App Header */}
                                <div className="bg-white p-4 border-b border-slate-100 flex justify-between items-center">
                                    <div className="w-6 h-6 bg-slate-200 rounded-full"></div>
                                    <span className="font-bold text-slate-900 text-sm">wondr</span>
                                    <Bell size={16} className="text-slate-400" />
                                </div>

                                {/* PREVIEW CONTENT */}
                                <div className="p-4 bg-slate-50 h-full relative">
                                    
                                    {/* Scenario 1: Banner Preview */}
                                    {formData.display_type === 'banner' && (
                                        <div className="bg-[#D6FF59] p-4 rounded-2xl shadow-sm mb-4">
                                            <div className="flex gap-3">
                                                <div className="bg-white/20 p-2 rounded-lg h-fit">
                                                    <Megaphone size={16} className="text-black" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm text-black mb-1">{formData.title || "Judul Banner"}</h4>
                                                    <p className="text-xs text-black/70 leading-tight">{formData.content.substring(0, 80) || "Isi konten akan muncul di sini..."}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Scenario 2: Notification List */}
                                    {formData.display_type === 'notification' && (
                                        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex gap-3">
                                            <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 shrink-0"></div>
                                            <div>
                                                <h4 className="font-bold text-xs text-slate-900 mb-1">{formData.title || "Notifikasi Baru"}</h4>
                                                <p className="text-[10px] text-slate-500 leading-tight">{formData.content.substring(0, 60) || "Isi notifikasi..."}</p>
                                                <span className="text-[8px] text-slate-400 mt-2 block">Baru saja</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Scenario 3: Modal */}
                                    {formData.display_type === 'modal' && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-10 backdrop-blur-sm">
                                            <div className="bg-white p-5 rounded-2xl w-full shadow-2xl text-center">
                                                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <AlertCircle size={24} />
                                                </div>
                                                <h4 className="font-bold text-slate-900 mb-2 text-sm">{formData.title || "Judul Popup"}</h4>
                                                <p className="text-xs text-slate-500 mb-4">{formData.content.substring(0, 80) || "Pesan penting..."}</p>
                                                <button className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold">Mengerti</button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Dummy App Content Background */}
                                    <div className="mt-4 space-y-3 opacity-30 pointer-events-none">
                                        <div className="h-24 bg-slate-200 rounded-xl"></div>
                                        <div className="h-10 bg-slate-200 rounded-xl"></div>
                                        <div className="flex gap-2">
                                            <div className="h-24 bg-slate-200 rounded-xl flex-1"></div>
                                            <div className="h-24 bg-slate-200 rounded-xl flex-1"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <p className="text-slate-500 text-xs mt-4">Preview tampilan di iOS/Android</p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AdminLayout>
    );
}
