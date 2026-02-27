import React, { useEffect, useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    CheckCircle, XCircle, Clock, Filter, Search, MoreHorizontal, 
    LayoutGrid, List as ListIcon, FileText, ChevronRight,
    AlertCircle, ShieldCheck, User, Calendar, DollarSign,
    ArrowRight, History, Download, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- COMPONENTS ---

const StatusBadge = ({ status }) => {
    const styles = {
        approved: "bg-green-100 text-green-700 border-green-200",
        rejected: "bg-red-100 text-red-700 border-red-200",
        pending: "bg-amber-50 text-amber-600 border-amber-200",
    };
    
    const icons = {
        approved: <CheckCircle size={12} />,
        rejected: <XCircle size={12} />,
        pending: <Clock size={12} />,
    };

    return (
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status]}`}>
            {icons[status]} {status}
        </span>
    );
};

const UrgencyDot = ({ level }) => {
    const colors = {
        high: "bg-red-500 shadow-red-200",
        medium: "bg-orange-500 shadow-orange-200",
        low: "bg-blue-500 shadow-blue-200",
    };
    return (
        <div className={`w-2.5 h-2.5 rounded-full ${colors[level]} shadow-[0_0_8px]`} title={`${level} Urgency`} />
    );
};

const getRiskScore = (approval) => {
    // Simple heuristic untuk risk score
    let score = 0;
    if (!approval.title) score += 20;
    if (!approval.description) score += 15;
    return Math.min(score, 85);
};

export default function ApprovalWorkflow() {
    const { auth } = usePage().props;
    const user = auth.user;

    // State
    const [viewMode, setViewMode] = useState('list');
    const [approvals, setApprovals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showEvidenceModal, setShowEvidenceModal] = useState(false);
    const [selectedEvidence, setSelectedEvidence] = useState(null);

    useEffect(() => {
        fetchApprovals();
    }, []);

    const fetchApprovals = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/training-programs', { 
                headers: { 'Accept': 'application/json' } 
            });
            
            if (res.ok) {
                const data = await res.json();
                let progs = data.data || data || [];
                
                // Enrich dengan data tambahan
                const enriched = progs.map(p => ({
                    ...p,
                    status: p.approval_status || p.compliance_status || 'pending',
                    avatar: p.created_by ? p.created_by.charAt(0) : '?',
                    department: p.department || 'General',
                    urgency: Math.random() > 0.6 ? 'high' : (Math.random() > 0.4 ? 'medium' : 'low'),
                    risk_score: getRiskScore(p),
                    history: [],
                    evidence: [] // Placeholder for evidence files
                }));
                
                setApprovals(enriched);
            }
        } catch (err) {
            console.error('Error fetching approvals', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (programId) => {
        try {
            setSubmitting(true);
            const res = await fetch(`/api/admin/compliance/approvals/${programId}/approve`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content 
                },
                body: JSON.stringify({ comment }),
            });

            if (res.ok) {
                setComment('');
                setSelectedItem(null);
                fetchApprovals();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async (programId) => {
        try {
            setSubmitting(true);
            const res = await fetch(`/api/admin/compliance/approvals/${programId}/reject`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content 
                },
                body: JSON.stringify({ reason: comment }),
            });

            if (res.ok) {
                setComment('');
                setSelectedItem(null);
                fetchApprovals();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    // Filter & Search Logic
    const filteredData = approvals.filter(item => {
        const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
        const matchesSearch = searchTerm === '' || 
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.created_by && item.created_by.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    const stats = {
        pending: approvals.filter(a => a.status === 'pending').length,
        approved: approvals.filter(a => a.status === 'approved').length,
        rejected: approvals.filter(a => a.status === 'rejected').length,
    };

    return (
        <AdminLayout user={user}>
            <Head title="Approval Workflow - Decision Deck" />

            <div className="flex flex-col h-full pb-20">
                
                {/* --- HEADER --- */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <button
                                    onClick={() => window.history.back()}
                                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
                                    title="Kembali"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <span className="px-3 py-1 bg-slate-900 text-[#D6FF59] text-[10px] font-bold uppercase tracking-wider rounded-full">
                                    Management Console
                                </span>
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Approval Workflow</h1>
                            <p className="text-slate-500 font-medium mt-1">Review, analisis risiko, dan setujui program training.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-white border border-slate-200 p-1 rounded-xl flex shadow-sm">
                                <button 
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <ListIcon size={20} />
                                </button>
                                <button 
                                    onClick={() => setViewMode('board')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'board' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <LayoutGrid size={20} />
                                </button>
                            </div>
                            <button className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold shadow-sm transition">
                                <Download size={18} /> Export
                            </button>
                        </div>
                    </div>

                    {/* Quick Stats & Filters */}
                    <div className="flex flex-col xl:flex-row gap-4 justify-between items-center bg-white p-2 rounded-[24px] border border-slate-100 shadow-sm">
                        <div className="flex gap-2 w-full xl:w-auto overflow-x-auto p-1">
                            {[
                                { id: 'all', label: 'All Requests', count: approvals.length },
                                { id: 'pending', label: 'Needs Review', count: stats.pending, activeColor: 'bg-amber-100 text-amber-800' },
                                { id: 'approved', label: 'Approved', count: stats.approved, activeColor: 'bg-green-100 text-green-800' },
                                { id: 'rejected', label: 'Rejected', count: stats.rejected, activeColor: 'bg-red-100 text-red-800' },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setFilterStatus(tab.id)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                                        filterStatus === tab.id 
                                        ? (tab.activeColor || 'bg-slate-900 text-white')
                                        : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                                >
                                    {tab.label}
                                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${filterStatus === tab.id ? 'bg-white/20' : 'bg-slate-100 text-slate-600'}`}>
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <div className="relative w-full xl:w-72 px-2">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search title or requester..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#D6FF59]"
                            />
                        </div>
                    </div>
                </div>

                {/* --- CONTENT AREA --- */}
                <div className="flex-1 relative">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-[#D6FF59] rounded-full"></div>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-[32px] text-slate-500">
                            <FileText size={48} className="mx-auto mb-4 text-slate-300" />
                            <p className="font-semibold">Tidak ada approval yang ditemukan</p>
                        </div>
                    ) : (
                        <>
                            {/* LIST VIEW */}
                            {viewMode === 'list' && (
                                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-100">
                                            <tr>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Requester</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Program Title</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date & Risk</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {filteredData.map(item => (
                                                <tr key={item.id} className="group hover:bg-[#FAFAFA] transition cursor-pointer" onClick={() => setSelectedItem(item)}>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D6FF59] to-[#00BFA5] flex items-center justify-center font-bold text-slate-900 text-xs shadow-md">
                                                                {item.avatar}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900">{item.created_by || 'Admin'}</p>
                                                                <p className="text-xs text-slate-500">{item.department}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <UrgencyDot level={item.urgency} />
                                                            <span className="font-semibold text-slate-700 line-clamp-1">{item.title}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm font-bold text-slate-900">{new Date(item.created_at).toLocaleDateString('id-ID')}</p>
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <div className="h-1.5 w-12 bg-slate-100 rounded-full overflow-hidden">
                                                                <div 
                                                                    className={`h-full ${item.risk_score > 50 ? 'bg-red-500' : 'bg-green-500'}`} 
                                                                    style={{ width: `${item.risk_score}%` }} 
                                                                />
                                                            </div>
                                                            <span className="text-[10px] font-bold text-slate-500">{item.risk_score}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <StatusBadge status={item.status} />
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-full transition">
                                                            <ChevronRight size={20} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* KANBAN VIEW */}
                            {viewMode === 'board' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {['pending', 'approved', 'rejected'].map(status => (
                                        <div key={status} className="bg-slate-50/50 p-4 rounded-[32px] border border-slate-100 min-h-[500px]">
                                            <h3 className="text-sm font-bold uppercase text-slate-400 mb-4 px-2 flex justify-between">
                                                {status} <span className="text-xs bg-white px-2 py-0.5 rounded shadow-sm">{stats[status]}</span>
                                            </h3>
                                            <div className="space-y-3">
                                                {filteredData.filter(i => i.status === status).map(item => (
                                                    <motion.div 
                                                        key={item.id}
                                                        onClick={() => setSelectedItem(item)}
                                                        className="bg-white p-5 rounded-[24px] shadow-sm hover:shadow-lg border border-slate-100 cursor-pointer group transition-all"
                                                    >
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#D6FF59] to-[#00BFA5] text-[10px] flex items-center justify-center font-bold text-slate-900">
                                                                    {item.avatar}
                                                                </div>
                                                                <span className="text-xs text-slate-500 font-bold">{item.department}</span>
                                                            </div>
                                                            <UrgencyDot level={item.urgency} />
                                                        </div>
                                                        <h4 className="font-bold text-slate-900 mb-1 leading-tight line-clamp-2">{item.title}</h4>
                                                        <div className="flex items-center gap-1 mb-4">
                                                            <div className="h-1 w-8 bg-slate-100 rounded-full overflow-hidden">
                                                                <div 
                                                                    className={`h-full ${item.risk_score > 50 ? 'bg-red-500' : 'bg-green-500'}`} 
                                                                    style={{ width: `${item.risk_score}%` }} 
                                                                />
                                                            </div>
                                                            <span className="text-[8px] font-bold text-slate-400">{item.risk_score}%</span>
                                                        </div>
                                                        <div className="flex justify-between items-center border-t border-slate-50 pt-3">
                                                            <span className="text-[10px] text-slate-400">{new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <ChevronRight size={16} className="text-slate-400" />
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* --- SLIDE-OVER DETAIL DRAWER --- */}
            <AnimatePresence>
                {selectedItem && (
                    <>
                        {/* Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedItem(null)}
                            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60]"
                        />
                        
                        {/* Panel */}
                        <motion.div 
                            initial={{ x: '100%' }} 
                            animate={{ x: 0 }} 
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl z-[70] flex flex-col border-l border-slate-100"
                        >
                            {/* Drawer Header */}
                            <div className="px-8 py-6 border-b border-slate-100 flex items-start justify-between bg-white z-10">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <StatusBadge status={selectedItem.status} />
                                        <span className="text-slate-300">|</span>
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ID: #{selectedItem.id}</span>
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 leading-tight">{selectedItem.title}</h2>
                                </div>
                                <button 
                                    onClick={() => setSelectedItem(null)}
                                    className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition"
                                >
                                    <ArrowRight size={20} />
                                </button>
                            </div>

                            {/* Drawer Body */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#FAFAFA]">

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Requester</p>
                                        <div className="flex items-center gap-2">
                                            <User size={16} className="text-slate-700" />
                                            <span className="font-bold text-slate-900">{selectedItem.created_by || '-'}</span>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Department</p>
                                        <div className="flex items-center gap-2">
                                            <LayoutGrid size={16} className="text-slate-700" />
                                            <span className="font-bold text-slate-900">{selectedItem.department}</span>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Duration</p>
                                        <div className="flex items-center gap-2">
                                            <Clock size={16} className="text-slate-700" />
                                            <span className="font-bold text-slate-900">{selectedItem.duration_hours ? selectedItem.duration_hours + ' jam' : '-'}</span>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Created</p>
                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} className="text-slate-700" />
                                            <span className="font-bold text-slate-900">{new Date(selectedItem.created_at).toLocaleDateString('id-ID')}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <h4 className="font-bold text-slate-900 mb-2">Description</h4>
                                    <p className="text-slate-600 leading-relaxed bg-white p-4 rounded-2xl border border-slate-100">
                                        {selectedItem.description || 'Tidak ada deskripsi tersedia'}
                                    </p>
                                </div>

                                {/* Evidence / Attachments Section */}
                                <div>
                                    <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <FileText size={16} /> Supporting Evidence & Documents
                                    </h4>
                                    <div className="space-y-3">
                                        {selectedItem.evidence && selectedItem.evidence.length > 0 ? (
                                            selectedItem.evidence.map((file, idx) => (
                                                <motion.div 
                                                    key={idx}
                                                    whileHover={{ scale: 1.02 }}
                                                    onClick={() => {
                                                        setSelectedEvidence(file);
                                                        setShowEvidenceModal(true);
                                                    }}
                                                    className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-md cursor-pointer transition-all group"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-start gap-3 flex-1">
                                                            <div className="mt-1 p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition">
                                                                <FileText size={20} className="text-blue-600" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-bold text-slate-900 truncate">{file.name || 'Document ' + (idx + 1)}</p>
                                                                <p className="text-xs text-slate-500 mt-0.5">{file.type || 'attachment'} • {file.size || 'N/A'}</p>
                                                                {file.description && <p className="text-xs text-slate-600 mt-1">{file.description}</p>}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <ChevronRight size={18} className="text-slate-400" />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center">
                                                <FileText size={32} className="text-slate-300 mx-auto mb-2" />
                                                <p className="text-sm font-bold text-slate-500">No supporting documents attached</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Timeline */}
                                {selectedItem.history && selectedItem.history.length > 0 && (
                                    <div>
                                        <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            <History size={16} /> Approval Chain
                                        </h4>
                                        <div className="relative pl-4 border-l-2 border-slate-200 space-y-6">
                                            {selectedItem.history.map((hist, idx) => (
                                                <div key={idx} className="relative">
                                                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-slate-300 ring-4 ring-[#FAFAFA]" />
                                                    <p className="text-xs font-bold text-slate-500 mb-0.5">{hist.date}</p>
                                                    <p className="font-bold text-slate-900">{hist.stage}</p>
                                                    <p className="text-xs text-slate-500">by {hist.user}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            </div>

                            {/* Drawer Footer Actions */}
                            {selectedItem.status === 'pending' && (
                                <div className="p-6 border-t border-slate-100 bg-white sticky bottom-0 z-20 space-y-4">
                                    <textarea 
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Tambahkan catatan atau alasan (opsional)..."
                                        className="w-full p-3 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#D6FF59] border border-slate-100"
                                        rows={2}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={() => handleReject(selectedItem.id)}
                                            disabled={submitting}
                                            className="py-3.5 rounded-xl font-bold border border-red-100 text-red-600 hover:bg-red-50 transition flex justify-center items-center gap-2 disabled:opacity-50"
                                        >
                                            <XCircle size={18} /> Reject
                                        </button>
                                        <button 
                                            onClick={() => handleApprove(selectedItem.id)}
                                            disabled={submitting}
                                            className="py-3.5 rounded-xl font-bold bg-[#D6FF59] text-black hover:bg-[#c3eb4b] shadow-lg shadow-lime-200 transition flex justify-center items-center gap-2 disabled:opacity-50"
                                        >
                                            <CheckCircle size={18} /> Approve
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* --- EVIDENCE PREVIEW MODAL --- */}
            <AnimatePresence>
                {showEvidenceModal && selectedEvidence && (
                    <>
                        {/* Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                setShowEvidenceModal(false);
                                setTimeout(() => setSelectedEvidence(null), 300);
                            }}
                            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[80]"
                        />
                        
                        {/* Modal */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed inset-0 flex items-center justify-center z-[90] p-4"
                        >
                            <motion.div className="bg-white rounded-[32px] shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                                
                                {/* Header */}
                                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">{selectedEvidence.name || 'Document Preview'}</h3>
                                        <p className="text-xs text-slate-500 mt-1">{selectedEvidence.type || 'attachment'}</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setShowEvidenceModal(false);
                                            setTimeout(() => setSelectedEvidence(null), 300);
                                        }}
                                        className="p-2 bg-white hover:bg-slate-100 rounded-full transition"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center bg-white">
                                    {selectedEvidence.url ? (
                                        <div className="w-full space-y-4">
                                            {/* Check if it's an image */}
                                            {selectedEvidence.type && ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'].includes(selectedEvidence.type) ? (
                                                <div className="flex justify-center">
                                                    <img 
                                                        src={selectedEvidence.url} 
                                                        alt={selectedEvidence.name}
                                                        className="max-w-full h-auto rounded-2xl border border-slate-100"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
                                                    <FileText size={48} className="text-slate-300 mx-auto mb-4" />
                                                    <p className="font-bold text-slate-700 mb-2">{selectedEvidence.name || 'Document'}</p>
                                                    <p className="text-sm text-slate-500 mb-4">{selectedEvidence.type || 'File'}</p>
                                                    <a 
                                                        href={selectedEvidence.url}
                                                        download
                                                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#D6FF59] text-black font-bold rounded-xl hover:bg-[#c3eb4b] transition"
                                                    >
                                                        <Download size={18} /> Download
                                                    </a>
                                                </div>
                                            )}
                                            {selectedEvidence.description && (
                                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-6">
                                                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Description</p>
                                                    <p className="text-slate-700">{selectedEvidence.description}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <AlertCircle size={48} className="text-slate-300 mx-auto mb-4" />
                                            <p className="font-bold text-slate-700">Cannot preview document</p>
                                            <p className="text-sm text-slate-500 mt-1">File is no longer available</p>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="px-8 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between sticky bottom-0 z-10">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <span className="font-bold">{selectedEvidence.size || 'Unknown size'}</span>
                                        {selectedEvidence.uploadedAt && <span>• {new Date(selectedEvidence.uploadedAt).toLocaleDateString('id-ID')}</span>}
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setShowEvidenceModal(false);
                                            setTimeout(() => setSelectedEvidence(null), 300);
                                        }}
                                        className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition"
                                    >
                                        Close
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
}
