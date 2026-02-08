import React, { useState, useMemo, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
    ArrowLeft, Upload, Trash2, Download, File, Image as ImageIcon,
    Video, FileText, AlertCircle, CheckCircle2, Loader, Search,
    Grid, List as ListIcon, Eye, Sparkles, X, Plus, BookOpen,
    Clock, FileArchive, HelpCircle, FileQuestion, CheckSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/Layouts/AdminLayout';
import axios from 'axios';

// --- Wondr Styles ---
const WondrStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        body { font-family: 'Plus Jakarta+Sans', sans-serif; }
        
        .wondr-dark { background-color: #002824; }
        .wondr-green { color: #005E54; }
        .wondr-lime { color: #D6F84C; }
        
        .glass-panel {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.6);
            box-shadow: 0 10px 30px -10px rgba(0, 40, 36, 0.05);
        }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }

        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
    `}</style>
);

// --- File Icon Component ---
const FileIcon = ({ type, extension }) => {
    const config = {
        document: { icon: FileText, color: 'text-red-500', bg: 'bg-red-50' },
        video: { icon: Video, color: 'text-purple-500', bg: 'bg-purple-50' },
        image: { icon: ImageIcon, color: 'text-blue-500', bg: 'bg-blue-50' },
        presentation: { icon: FileText, color: 'text-orange-500', bg: 'bg-orange-50' },
        spreadsheet: { icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        archive: { icon: FileArchive, color: 'text-slate-500', bg: 'bg-slate-100' },
    };
    const { icon: Icon, color, bg } = config[type] || { icon: File, color: 'text-slate-500', bg: 'bg-slate-50' };

    return (
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bg} ${color}`}>
            <Icon size={24} strokeWidth={2} />
        </div>
    );
};

// --- Stat Card ---
const StatCard = ({ label, value, icon: Icon, color }) => (
    <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-4 rounded-2xl flex items-center gap-4"
    >
        <div className={`p-3 rounded-xl ${color}`}>
            <Icon size={24} className="text-white" />
        </div>
        <div>
            <p className="text-xs text-slate-500 font-bold uppercase">{label}</p>
            <p className="text-2xl font-extrabold text-slate-900">{value}</p>
        </div>
    </motion.div>
);

// --- Main Component ---
export default function ContentManager({ program, auth }) {
    const [activeTab, setActiveTab] = useState('materials');
    const [materials, setMaterials] = useState(program?.materials || []);
    const [pretestQuestions, setPretestQuestions] = useState(program?.pretest_questions || []);
    const [posttestQuestions, setPosttestQuestions] = useState(program?.posttest_questions || []);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null);

    const showNotification = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleDelete = async (type, id) => {
        if (!confirm(`Hapus ${type} ini?`)) return;
        setLoading(true);
        try {
            await axios.delete(`/api/admin/${type}/${id}`);
            showNotification(`${type} berhasil dihapus`, 'success');
            if (type === 'materials') setMaterials(m => m.filter(x => x.id !== id));
            else if (type === 'questions') {
                if (activeTab === 'pretest') setPretestQuestions(q => q.filter(x => x.id !== id));
                else setPosttestQuestions(q => q.filter(x => x.id !== id));
            }
        } catch (error) {
            showNotification('Error menghapus', 'error');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'materials', label: '📚 Materi', icon: BookOpen, count: materials.length },
        { id: 'pretest', label: '❓ Pretest', icon: HelpCircle, count: pretestQuestions.length },
        { id: 'posttest', label: '✅ Posttest', icon: CheckSquare, count: posttestQuestions.length },
    ];

    return (
        <AdminLayout user={auth?.user}>
            <WondrStyles />
            <Head title={`Kelola Konten - ${program.title}`} />

            {/* Notification */}
            {notification && (
                <div className={`fixed top-6 right-6 px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 ${
                    notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                }`}>
                    {notification.type === 'success' ? <CheckCircle2 /> : <AlertCircle />}
                    {notification.msg}
                </div>
            )}

            <div className="min-h-screen bg-[#F8FAFC] pb-20">
                
                {/* Hero Header */}
                <div className="bg-gradient-to-r from-[#002824] to-[#005E54] pt-8 pb-20 px-6 lg:px-12 relative overflow-hidden shadow-lg">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[#005E54] rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/4"></div>
                    
                    <div className="relative z-10 max-w-7xl mx-auto">
                        <button 
                            onClick={() => router.visit('/admin/training-programs')}
                            className="flex items-center gap-2 text-white/70 hover:text-[#D6F84C] transition font-bold text-sm mb-6"
                        >
                            <ArrowLeft size={16} /> Kembali
                        </button>

                        <div>
                            <h1 className="text-4xl font-extrabold text-white mb-2">Kelola Konten Program</h1>
                            <p className="text-[#D6F84C] text-lg font-semibold">{program.title}</p>
                            <p className="text-white/80 mt-2 max-w-2xl">Manage materi pembelajaran, soal pretest, dan posttest dalam satu dashboard yang terintegrasi</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-20">
                    
                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <StatCard label="Total Materi" value={materials.length} icon={BookOpen} color="bg-blue-500" />
                        <StatCard label="Pretest Questions" value={pretestQuestions.length} icon={HelpCircle} color="bg-purple-500" />
                        <StatCard label="Posttest Questions" value={posttestQuestions.length} icon={CheckSquare} color="bg-emerald-500" />
                    </div>

                    {/* Tab Navigation */}
                    <div className="bg-white rounded-t-[32px] border border-b-0 border-slate-200 shadow-sm flex gap-1 p-2">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold transition ${
                                        activeTab === tab.id
                                            ? 'bg-[#005E54] text-white'
                                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    <Icon size={18} />
                                    {tab.label}
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                        activeTab === tab.id ? 'bg-white/20' : 'bg-slate-200'
                                    }`}>
                                        {tab.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab Content */}
                    <div className="bg-white rounded-b-[32px] border border-slate-200 shadow-sm p-8 min-h-[500px]">
                        <AnimatePresence mode="wait">
                            
                            {/* Materials Tab */}
                            {activeTab === 'materials' && (
                                <motion.div
                                    key="materials"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-4"
                                >
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-2xl font-bold text-slate-900">📚 Materi Pembelajaran</h2>
                                        <button 
                                            onClick={() => router.visit(`/admin/training-materials-manager/${program.id}`)}
                                            className="flex items-center gap-2 px-4 py-2 bg-[#005E54] text-white rounded-xl hover:bg-[#004D44] transition font-bold"
                                        >
                                            <Plus size={18} /> Upload Materi Baru
                                        </button>
                                    </div>

                                    {materials.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {materials.map(material => (
                                                <motion.div
                                                    key={material.id}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="glass-panel p-4 rounded-2xl hover:shadow-lg transition group"
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <FileIcon type={material.material_type} />
                                                        <button
                                                            onClick={() => handleDelete('materials', material.id)}
                                                            className="p-2 hover:bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                    <h3 className="font-bold text-slate-900 mb-1 line-clamp-2">{material.title}</h3>
                                                    <p className="text-xs text-slate-500">{material.file_name}</p>
                                                    {material.file_size && (
                                                        <p className="text-xs text-slate-400 mt-2">
                                                            {(material.file_size / 1024 / 1024).toFixed(2)} MB
                                                        </p>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-slate-50 rounded-2xl">
                                            <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
                                            <p className="text-slate-500 font-medium">Belum ada materi</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Pretest Tab */}
                            {activeTab === 'pretest' && (
                                <motion.div
                                    key="pretest"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-4"
                                >
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-2xl font-bold text-slate-900">❓ Soal Pretest</h2>
                                        <button 
                                            onClick={() => router.visit(`/admin/questions/create?type=pretest&module_id=${program.id}`)}
                                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-bold"
                                        >
                                            <Plus size={18} /> Tambah Soal Pretest
                                        </button>
                                    </div>

                                    {pretestQuestions.length > 0 ? (
                                        <div className="space-y-3">
                                            {pretestQuestions.map((q, idx) => (
                                                <motion.div
                                                    key={q.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="glass-panel p-4 rounded-xl flex justify-between items-start group"
                                                >
                                                    <div className="flex-1">
                                                        <span className="inline-block px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full mb-2">Soal {idx + 1}</span>
                                                        <p className="text-slate-900 font-medium line-clamp-2">{q.question_text}</p>
                                                        <p className="text-xs text-slate-500 mt-1">Kesulitan: {q.difficulty || 'N/A'}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDelete('questions', q.id)}
                                                        className="p-2 hover:bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-slate-50 rounded-2xl">
                                            <HelpCircle size={48} className="mx-auto text-slate-300 mb-4" />
                                            <p className="text-slate-500 font-medium">Belum ada soal pretest</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Posttest Tab */}
                            {activeTab === 'posttest' && (
                                <motion.div
                                    key="posttest"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-4"
                                >
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-2xl font-bold text-slate-900">✅ Soal Posttest</h2>
                                        <button 
                                            onClick={() => router.visit(`/admin/questions/create?type=posttest&module_id=${program.id}`)}
                                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-bold"
                                        >
                                            <Plus size={18} /> Tambah Soal Posttest
                                        </button>
                                    </div>

                                    {posttestQuestions.length > 0 ? (
                                        <div className="space-y-3">
                                            {posttestQuestions.map((q, idx) => (
                                                <motion.div
                                                    key={q.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="glass-panel p-4 rounded-xl flex justify-between items-start group"
                                                >
                                                    <div className="flex-1">
                                                        <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full mb-2">Soal {idx + 1}</span>
                                                        <p className="text-slate-900 font-medium line-clamp-2">{q.question_text}</p>
                                                        <p className="text-xs text-slate-500 mt-1">Kesulitan: {q.difficulty || 'N/A'}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDelete('questions', q.id)}
                                                        className="p-2 hover:bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-slate-50 rounded-2xl">
                                            <CheckSquare size={48} className="mx-auto text-slate-300 mb-4" />
                                            <p className="text-slate-500 font-medium">Belum ada soal posttest</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>

                </div>
            </div>
        </AdminLayout>
    );
}
