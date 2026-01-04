import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    Bell, Send, History, Filter, Search, X, User, Clock, 
    MessageSquare, Smartphone, Sparkles, CheckCircle2, 
    AlertTriangle, Info, XCircle, ChevronRight, Calendar,
    BarChart3, MoreHorizontal, Zap, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- REUSABLE COMPONENTS ---

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

const StatPill = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
        <Icon size={14} className="text-slate-400" />
        <div className="text-xs">
            <span className="text-slate-500 mr-1">{label}:</span>
            <span className="font-bold text-slate-900">{value}</span>
        </div>
    </div>
);

// --- MAIN COMPONENT ---

export default function Notifications() {
    const { auth } = usePage().props;
    const user = auth.user;

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCompose, setShowCompose] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [sending, setSending] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: 'info',
        recipients: 'all',
        scheduled_at: '',
        is_scheduled: false,
    });

    // Load notifications
    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const res = await fetch('/api/admin/notifications', {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                }
            });

            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (err) {
            console.error('Failed to load notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendNotification = async () => {
        if (!formData.title || !formData.message) {
            alert('Title dan message harus diisi');
            return;
        }

        try {
            setSending(true);
            const res = await fetch('/api/admin/notifications/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                alert('Notifikasi berhasil dikirim');
                setShowCompose(false);
                setFormData({
                    title: '',
                    message: '',
                    type: 'info',
                    recipients: 'all',
                    scheduled_at: '',
                    is_scheduled: false,
                });
                loadNotifications();
            } else {
                alert('Gagal mengirim notifikasi');
            }
        } catch (err) {
            console.error(err);
            alert('Gagal mengirim notifikasi');
        } finally {
            setSending(false);
        }
    };

    const handleDeleteNotification = async (id) => {
        if (!confirm('Hapus notifikasi ini?')) return;

        try {
            const res = await fetch(`/api/admin/notifications/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                }
            });

            if (res.ok) {
                loadNotifications();
                alert('Notifikasi berhasil dihapus');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAIGenerate = () => {
        setFormData({
            ...formData,
            title: "Penting: Update Kebijakan Keamanan",
            message: "Halo Tim! Kami telah memperbarui kebijakan keamanan data. Mohon luangkan waktu 5 menit untuk membacanya di menu Dokumen. Terima kasih atas kerjasama Anda menjaga keamanan data perusahaan. 🔒"
        });
    };

    const filteredNotifications = notifications.filter(notif => {
        const matchesSearch = notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            notif.message.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'all' || notif.type === filterType;
        return matchesSearch && matchesFilter;
    });

    return (
        <AdminLayout user={user}>
            <Head title="Notifications" />

            <div className="pb-20">
                
                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-slate-900 text-[#D6FF59] text-[10px] font-bold uppercase tracking-wider rounded-full">
                                Communication
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Broadcast Center</h1>
                        <p className="text-slate-500 font-medium mt-1">Kirim notifikasi push, alert sistem, dan pengumuman.</p>
                    </div>
                    <button 
                        onClick={() => setShowCompose(true)}
                        className="group flex items-center gap-3 px-6 py-4 bg-[#D6FF59] text-slate-900 rounded-2xl font-bold text-sm shadow-lg shadow-lime-200 hover:bg-[#cbf542] transition hover:-translate-y-1"
                    >
                        <div className="w-8 h-8 bg-black/10 rounded-full flex items-center justify-center group-hover:bg-black/20 transition">
                            <Send size={16} />
                        </div>
                        Compose Notification
                    </button>
                </div>

                {/* --- STATS OVERVIEW --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-slate-900 rounded-[28px] p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 blur-[60px] opacity-20"></div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Sent</p>
                        <h3 className="text-4xl font-black">12.5k</h3>
                        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                            <ArrowRight size={12} /> Messages delivered
                        </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Open Rate</p>
                        <h3 className="text-4xl font-black text-slate-900">68%</h3>
                        <p className="text-xs text-green-600 mt-2 font-bold">+5% vs last month</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Engagement</p>
                        <h3 className="text-4xl font-black text-slate-900">4.2%</h3>
                        <p className="text-xs text-slate-500 mt-2">Click-through rate</p>
                    </div>
                </div>

                {/* --- LIST & FILTER --- */}
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex gap-2">
                            {['All', 'Sent', 'Scheduled', 'Draft'].map(tab => (
                                <button key={tab} className={`px-4 py-2 rounded-full text-xs font-bold transition ${tab === 'All' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text"
                                placeholder="Search history..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-[#D6FF59]"
                            />
                        </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {loading ? (
                            <div className="text-center py-12 text-slate-500">Loading...</div>
                        ) : filteredNotifications.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">Belum ada notifikasi</div>
                        ) : (
                            filteredNotifications.map((item) => (
                                <div key={item.id} className="p-6 hover:bg-slate-50 transition group cursor-pointer flex flex-col md:flex-row gap-6 items-start">
                                    {/* Icon & Status */}
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                            item.status === 'scheduled' ? 'bg-orange-100 text-orange-600' : 'bg-blue-50 text-blue-600'
                                        }`}>
                                            {item.status === 'scheduled' ? <Clock size={24} /> : <Send size={24} />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-slate-900 text-lg">{item.title}</h3>
                                                <TypeBadge type={item.type} />
                                            </div>
                                            <p className="text-slate-500 text-sm line-clamp-2 max-w-2xl">{item.message}</p>
                                            
                                            <div className="flex items-center gap-4 mt-3 text-xs text-slate-400 font-medium">
                                                <span className="flex items-center gap-1"><User size={12}/> {item.recipients || 'All Users'}</span>
                                                <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(item.created_at).toLocaleString('id-ID')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Analytics Pills */}
                                    <div className="flex gap-2">
                                        <StatPill icon={Send} label="Sent" value={item.stats?.sent || 0} />
                                        <StatPill icon={CheckCircle2} label="Read" value={item.stats?.read || 0} />
                                        <StatPill icon={Zap} label="Clicks" value={item.stats?.clicked || 0} />
                                    </div>

                                    <button 
                                        onClick={() => handleDeleteNotification(item.id)}
                                        className="p-2 rounded-full hover:bg-slate-200 text-slate-400 transition self-center">
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* --- COMPOSE MODAL --- */}
                <AnimatePresence>
                    {showCompose && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                                onClick={() => setShowCompose(false)}
                            />
                            
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                                animate={{ opacity: 1, scale: 1, y: 0 }} 
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-white w-full max-w-6xl h-[85vh] rounded-[32px] shadow-2xl relative z-10 flex overflow-hidden"
                            >
                                {/* Left: Form */}
                                <div className="w-full lg:w-1/2 p-8 lg:p-10 flex flex-col h-full border-r border-slate-100 overflow-y-auto">
                                    <div className="flex justify-between items-center mb-8">
                                        <h2 className="text-2xl font-black text-slate-900">Compose Message</h2>
                                        <button onClick={() => setShowCompose(false)} className="p-2 rounded-full hover:bg-slate-100">
                                            <X size={24} />
                                        </button>
                                    </div>

                                    <div className="space-y-6 flex-1">
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Notification Title</label>
                                            <input 
                                                type="text" 
                                                value={formData.title}
                                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                                placeholder="Enter a catchy title..." 
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#D6FF59] transition"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider">Message Body</label>
                                                <button 
                                                    onClick={handleAIGenerate}
                                                    className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg hover:bg-indigo-100 transition"
                                                >
                                                    <Sparkles size={12} /> Auto-Generate
                                                </button>
                                            </div>
                                            <textarea 
                                                rows={5}
                                                value={formData.message}
                                                onChange={(e) => setFormData({...formData, message: e.target.value})}
                                                placeholder="Type your message here..."
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-medium outline-none focus:ring-2 focus:ring-[#D6FF59] transition resize-none"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Type</label>
                                                <select 
                                                    value={formData.type}
                                                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-[#D6FF59]"
                                                >
                                                    <option value="info">ℹ️ Info</option>
                                                    <option value="warning">⚠️ Warning</option>
                                                    <option value="success">✅ Success</option>
                                                    <option value="error">🚨 Error</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Target Audience</label>
                                                <select 
                                                    value={formData.recipients}
                                                    onChange={(e) => setFormData({...formData, recipients: e.target.value})}
                                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-[#D6FF59]"
                                                >
                                                    <option value="all">All Users</option>
                                                    <option value="role">By Role</option>
                                                    <option value="user">Specific User</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="schedule"
                                                checked={formData.is_scheduled}
                                                onChange={(e) => setFormData({...formData, is_scheduled: e.target.checked})}
                                                className="rounded"
                                            />
                                            <label htmlFor="schedule" className="text-sm font-medium text-slate-700">
                                                Schedule Delivery
                                            </label>
                                        </div>

                                        {formData.is_scheduled && (
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Scheduled Time</label>
                                                <input
                                                    type="datetime-local"
                                                    value={formData.scheduled_at}
                                                    onChange={(e) => setFormData({...formData, scheduled_at: e.target.value})}
                                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#D6FF59]"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-6 mt-6 border-t border-slate-100 flex gap-3">
                                        <button 
                                            onClick={() => setShowCompose(false)}
                                            className="flex-1 py-4 font-bold text-slate-500 bg-slate-50 rounded-xl hover:bg-slate-100 transition">
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={handleSendNotification}
                                            disabled={sending}
                                            className="flex-[2] py-4 font-bold text-slate-900 bg-[#D6FF59] rounded-xl hover:bg-[#cbf542] shadow-lg shadow-lime-200 transition flex justify-center items-center gap-2 disabled:opacity-50"
                                        >
                                            {sending ? 'Sending...' : <><Send size={18} /> Send Broadcast</>}
                                        </button>
                                    </div>
                                </div>

                                {/* Right: Live Preview */}
                                <div className="hidden lg:flex w-1/2 bg-slate-100 items-center justify-center relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-[100px]"></div>
                                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#D6FF59]/20 rounded-full blur-[100px]"></div>

                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="mb-6 flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm text-slate-500 text-xs font-bold uppercase tracking-wider">
                                            <Smartphone size={14} /> Live Preview
                                        </div>

                                        {/* Phone Mockup */}
                                        <div className="w-[320px] h-[640px] bg-white rounded-[48px] border-[8px] border-slate-900 shadow-2xl relative overflow-hidden">
                                            {/* Notch */}
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-20"></div>
                                            
                                            {/* Screen Content */}
                                            <div className="w-full h-full bg-[#F2F2F7] pt-14 px-4 overflow-y-auto">
                                                {/* Lock Screen Time */}
                                                <div className="text-center mb-8">
                                                    <p className="text-base font-semibold text-slate-500">Wednesday, 25 Oct</p>
                                                    <h2 className="text-6xl font-light text-slate-900">09:41</h2>
                                                </div>

                                                {/* Notification Card */}
                                                <motion.div 
                                                    initial={{ y: 20, opacity: 0 }}
                                                    animate={{ y: 0, opacity: 1 }}
                                                    className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm mb-3 relative overflow-hidden"
                                                >
                                                    {/* Type Indicator Line */}
                                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                                        formData.type === 'error' ? 'bg-red-500' : 
                                                        formData.type === 'success' ? 'bg-green-500' : 
                                                        formData.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                                                    }`}></div>

                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="w-5 h-5 bg-[#D6FF59] rounded-md flex items-center justify-center text-[10px] font-bold text-slate-900">W</div>
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase flex-1">Wondr Learning • Now</span>
                                                    </div>
                                                    <h4 className="font-bold text-slate-900 text-sm mb-1">
                                                        {formData.title || "Notification Title"}
                                                    </h4>
                                                    <p className="text-xs text-slate-600 leading-relaxed">
                                                        {formData.message || "Your notification content will appear here exactly as the user sees it."}
                                                    </p>
                                                </motion.div>

                                                {/* Dummy older notifications */}
                                                <div className="opacity-40 space-y-3">
                                                    <div className="bg-white/60 p-4 rounded-2xl">
                                                        <div className="h-2 w-20 bg-slate-300 rounded mb-2"></div>
                                                        <div className="h-2 w-full bg-slate-300 rounded mb-1"></div>
                                                        <div className="h-2 w-2/3 bg-slate-300 rounded"></div>
                                                    </div>
                                                    <div className="bg-white/60 p-4 rounded-2xl">
                                                        <div className="h-2 w-20 bg-slate-300 rounded mb-2"></div>
                                                        <div className="h-2 w-full bg-slate-300 rounded mb-1"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </div>
        </AdminLayout>
    );
}
