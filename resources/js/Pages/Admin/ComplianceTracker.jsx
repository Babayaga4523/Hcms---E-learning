import React, { useEffect, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    CheckCircle, XCircle, Clock, AlertTriangle, FileText, 
    Upload, Search, Filter, Shield, MoreVertical, 
    ChevronRight, Calendar, Download, Eye, Paperclip,
    BarChart3, FileCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- COMPONENTS ---

const HealthScoreWidget = ({ totalItems, riskItems }) => {
    const compliantItems = totalItems - riskItems;
    const healthScore = totalItems > 0 ? Math.round((compliantItems / totalItems) * 100) : 0;
    const circumference = 2 * Math.PI * 56;
    const strokeDashoffset = circumference - (healthScore / 100) * circumference;

    return (
        <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl flex items-center justify-between">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D6FF59] rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
            
            <div className="relative z-10">
                <h2 className="text-3xl font-black mb-1">Compliance Health</h2>
                <p className="text-slate-400">Overall Organization Status</p>
                
                <div className="flex gap-6 mt-6">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Risk Items</p>
                        <p className="text-2xl font-bold text-red-500">{riskItems} Items</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Compliant</p>
                        <p className="text-2xl font-bold text-[#D6FF59]">{compliantItems} Items</p>
                    </div>
                </div>
            </div>

            <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="#1e293b" strokeWidth="12" fill="none" />
                    <circle 
                        cx="64" cy="64" r="56" 
                        stroke="#D6FF59" 
                        strokeWidth="12" 
                        fill="none" 
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-black text-white">{healthScore}%</span>
                    <span className="text-[10px] font-bold text-[#D6FF59]">{healthScore >= 80 ? 'SAFE' : 'ALERT'}</span>
                </div>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const config = {
        approved: { color: "bg-green-100 text-green-700", icon: CheckCircle, label: "Compliant" },
        rejected: { color: "bg-red-100 text-red-700", icon: AlertTriangle, label: "High Risk" },
        pending: { color: "bg-blue-100 text-blue-700", icon: Clock, label: "In Progress" },
    };
    const { color, icon: Icon, label } = config[status] || config.pending;

    return (
        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-transparent ${color}`}>
            <Icon size={14} /> {label}
        </span>
    );
};

const ProgressBar = ({ percent }) => (
    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            className={`h-full rounded-full ${
                percent === 100 ? 'bg-green-500' : 
                percent < 50 ? 'bg-red-500' : 'bg-blue-500'
            }`}
        />
    </div>
);

export default function ComplianceTracker() {
    const { auth } = usePage().props;
    const user = auth.user;

    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        fetchPrograms();
    }, []);

    const fetchPrograms = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/training-programs', { 
                headers: { 'Accept': 'application/json' } 
            });
            
            if (res.ok) {
                const data = await res.json();
                let progs = data.data || data || [];
                
                // Enrich dengan data compliance
                const enriched = progs.map(p => {
                    const status = p.compliance_status || 'pending';
                    const deadline = new Date(p.created_at);
                    deadline.setDate(deadline.getDate() + 30);
                    const today = new Date();
                    const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
                    
                    return {
                        ...p,
                        status,
                        deadline: deadline.toISOString().split('T')[0],
                        days_left: daysLeft,
                        completion: status === 'approved' ? 100 : (status === 'pending' ? 25 : 60),
                        required_docs: 3,
                        uploaded_docs: status === 'approved' ? 3 : Math.floor(Math.random() * 3),
                    };
                });
                
                setPrograms(enriched);
            }
        } catch (err) {
            console.error('Error fetching programs', err);
        } finally {
            setLoading(false);
        }
    };

    // Filter & Search Logic
    const filteredData = programs.filter(item => {
        const statusMap = { 'approved': 'compliant', 'pending': 'pending', 'rejected': 'rejected' };
        const itemStatus = statusMap[item.status] || 'pending';
        
        const matchesFilter = filter === 'all' || itemStatus === filter;
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const stats = {
        risk: programs.filter(p => p.status === 'rejected' || p.days_left < 7).length,
        total: programs.length,
    };

    return (
        <AdminLayout user={user}>
            <Head title="Compliance Tracker - Shield" />

            <div className="pb-20">
                
                {/* --- HEADER & HEALTH SCORE --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                    <div className="lg:col-span-2">
                        <div className="flex flex-col justify-center h-full">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    Audit Period 2025
                                </span>
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">
                                Compliance <span className="text-indigo-600">Shield</span>
                            </h1>
                            <p className="text-slate-500 max-w-lg leading-relaxed mb-6">
                                Monitor status kepatuhan regulasi, kelengkapan dokumen audit, dan tenggat waktu pelaporan secara real-time.
                            </p>
                            <div className="flex gap-3 flex-wrap">
                                <button className="px-6 py-3 bg-slate-900 text-white rounded-full font-bold shadow-lg hover:bg-slate-800 transition flex items-center gap-2">
                                    <Download size={18} /> Download Audit Report
                                </button>
                                <button className="px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-full font-bold hover:bg-slate-50 transition">
                                    View Audit Logs
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-1">
                        <HealthScoreWidget totalItems={stats.total} riskItems={stats.risk} />
                    </div>
                </div>

                {/* --- FILTERS --- */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <div className="flex gap-2 bg-white p-1 rounded-full border border-slate-200 shadow-sm">
                        {[
                            { id: 'all', label: 'All Items' },
                            { id: 'rejected', label: 'Risk Alert', activeClass: 'bg-red-500 text-white' },
                            { id: 'compliant', label: 'Compliant', activeClass: 'bg-green-500 text-white' },
                            { id: 'pending', label: 'In Progress', activeClass: 'bg-blue-500 text-white' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setFilter(tab.id)}
                                className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                                    filter === tab.id 
                                    ? (tab.activeClass || 'bg-slate-900 text-white') 
                                    : 'text-slate-500 hover:bg-slate-50'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search program..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                        />
                    </div>
                </div>

                {/* --- MAIN TABLE (CARD STYLE) --- */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-[#D6FF59] rounded-full"></div>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-[32px] text-slate-500">
                            <FileText size={48} className="mx-auto mb-4 text-slate-300" />
                            <p className="font-semibold">Tidak ada program ditemukan</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {filteredData.map((item) => {
                                const statusMap = { 'approved': 'compliant', 'pending': 'pending', 'rejected': 'rejected' };
                                const displayStatus = statusMap[item.status] || 'pending';
                                
                                return (
                                    <motion.div 
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        key={item.id}
                                        className="group bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden cursor-pointer"
                                    >
                                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                                            
                                            {/* Column 1: Info */}
                                            <div className="flex-1 min-w-[200px]">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Training Program</span>
                                                    <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Compliance</span>
                                                </div>
                                                <h3 
                                                    className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors"
                                                    onClick={() => setSelectedItem(item)}
                                                >
                                                    {item.title}
                                                </h3>
                                            </div>

                                            {/* Column 2: Deadline Intelligence */}
                                            <div className="w-full md:w-48">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Calendar size={14} className="text-slate-400" />
                                                    <span className="text-xs font-semibold text-slate-600">{item.deadline}</span>
                                                </div>
                                                <div className={`text-xs font-bold px-2 py-1 rounded inline-block ${item.days_left < 7 ? 'bg-red-50 text-red-600' : item.days_left < 14 ? 'bg-yellow-50 text-yellow-700' : 'bg-slate-50 text-slate-600'}`}>
                                                    {item.days_left > 0 ? `${item.days_left} Days Left` : 'Overdue'}
                                                </div>
                                            </div>

                                            {/* Column 3: Progress & Docs */}
                                            <div className="w-full md:w-64">
                                                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                                                    <span>Progress</span>
                                                    <span>{item.completion}%</span>
                                                </div>
                                                <div className="mb-2">
                                                    <ProgressBar percent={item.completion} />
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <Paperclip size={12} />
                                                    <span>{item.uploaded_docs}/{item.required_docs} Evidence Uploaded</span>
                                                </div>
                                            </div>

                                            {/* Column 4: Status & Action */}
                                            <div className="w-full md:w-auto flex items-center justify-between gap-4 md:justify-end min-w-[140px]">
                                                <StatusBadge status={displayStatus} />
                                                
                                                <button 
                                                    onClick={() => setSelectedItem(item)}
                                                    className="p-2 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition"
                                                >
                                                    <ChevronRight size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* --- EVIDENCE VAULT (DRAWER) --- */}
            <AnimatePresence>
                {selectedItem && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedItem(null)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
                        />
                        <motion.div 
                            initial={{ x: '100%' }} 
                            animate={{ x: 0 }} 
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25 }}
                            className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-[70] flex flex-col border-l border-slate-100"
                        >
                            {/* Drawer Header */}
                            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-white z-10">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Evidence Vault</span>
                                    <h2 className="text-xl font-black text-slate-900 leading-tight">{selectedItem.title}</h2>
                                </div>
                                <button 
                                    onClick={() => setSelectedItem(null)} 
                                    className="p-2 hover:bg-slate-50 rounded-full transition"
                                >
                                    <XCircle size={24} className="text-slate-400" />
                                </button>
                            </div>

                            {/* Drawer Body */}
                            <div className="flex-1 overflow-y-auto p-6 bg-[#FAFAFA] space-y-6">
                                
                                {/* Status Card */}
                                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedItem.status === 'approved' ? 'bg-green-100 text-green-600' : selectedItem.status === 'pending' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                                            <BarChart3 size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 font-bold uppercase">Current Status</p>
                                            <p className="font-bold text-slate-900 capitalize">{selectedItem.status}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-slate-900">{selectedItem.completion}%</p>
                                    </div>
                                </div>

                                {/* Upload Zone */}
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                        <Upload size={18} /> Upload Evidence
                                    </h3>
                                    <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 hover:bg-slate-100 hover:border-indigo-400 transition cursor-pointer group">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform">
                                            <Upload className="text-indigo-600" size={20} />
                                        </div>
                                        <p className="text-sm font-bold text-slate-700">Click to upload or drag & drop</p>
                                        <p className="text-xs text-slate-400 mt-1">PDF, DOCX, JPG (Max 10MB)</p>
                                        <input type="file" multiple className="hidden" />
                                    </div>
                                </div>

                                {/* Files List */}
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                        <FileCheck size={18} /> Uploaded Files ({selectedItem.uploaded_docs}/{selectedItem.required_docs})
                                    </h3>
                                    {selectedItem.uploaded_docs > 0 ? (
                                        <div className="space-y-2">
                                            {Array.from({ length: selectedItem.uploaded_docs }).map((_, i) => (
                                                <div key={i} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between group hover:border-slate-200 transition">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center text-xs font-bold">PDF</div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800">Document_{i+1}.pdf</p>
                                                            <p className="text-[10px] text-slate-400">Uploaded by Admin • {i + 1} hours ago</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-700 transition"><Eye size={16}/></button>
                                                        <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-700 transition"><Download size={16}/></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                                            <p className="text-sm text-slate-400 font-medium">Belum ada dokumen yang diupload.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Deadline Info */}
                                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                                    <p className="text-xs font-bold text-amber-700 uppercase mb-1">Deadline</p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-bold text-amber-900">{selectedItem.deadline}</p>
                                        <p className={`text-xs font-bold px-2 py-1 rounded ${selectedItem.days_left < 7 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {selectedItem.days_left > 0 ? `${selectedItem.days_left} days` : 'Overdue'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Drawer Footer */}
                            <div className="p-4 border-t border-slate-100 bg-white sticky bottom-0">
                                <button className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition shadow-lg">
                                    Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
}
