import React, { useState, useEffect } from 'react';
import { Head, usePage, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    Plus, Search, Filter, Download, Upload, Edit3, Trash2, 
    Eye, MoreHorizontal, Copy, BookOpen, BarChart3, 
    Grid, List as ListIcon, CheckCircle2, X, Sparkles, 
    BrainCircuit, FileText, ChevronRight, Layout,
    CheckSquare, HelpCircle, PenTool, AlignLeft, Link2,
    Users, Code, Smile, Lightbulb, FileSearch
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- REUSABLE COMPONENTS ---

const DifficultyBadge = ({ level }) => {
    const styles = {
        easy: "bg-emerald-100 text-emerald-700 border-emerald-200",
        medium: "bg-amber-100 text-amber-700 border-amber-200",
        hard: "bg-red-100 text-red-700 border-red-200",
    };
    return (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[level]}`}>
            {level}
        </span>
    );
};

const TypeIcon = ({ type }) => {
    switch (type) {
        case 'multiple_choice': return <CheckSquare size={16} className="text-blue-500" />;
        case 'true_false': return <HelpCircle size={16} className="text-green-500" />;
        case 'essay': return <PenTool size={16} className="text-orange-500" />;
        case 'short_answer': return <AlignLeft size={16} className="text-purple-500" />;
        case 'matching': return <Link2 size={16} className="text-pink-500" />;
        default: return <BrainCircuit size={16} className="text-slate-500" />;
    }
};

const CategoryIcon = ({ category }) => {
    switch (category) {
        case 'general': return <BookOpen size={16} className="text-slate-500" />;
        case 'technical': return <Code size={16} className="text-indigo-500" />;
        case 'behavioral': return <Smile size={16} className="text-teal-500" />;
        case 'scenario': return <Lightbulb size={16} className="text-amber-500" />;
        case 'case-study': return <FileSearch size={16} className="text-rose-500" />;
        default: return <Users size={16} className="text-slate-400" />;
    }
};

const StatCard = ({ label, value, subtext, color }) => (
    <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex flex-col justify-between h-full">
        <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{label}</p>
            <h3 className="text-3xl font-black text-slate-900">{value}</h3>
        </div>
        <div className="mt-4">
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${color}`} style={{ width: '70%' }}></div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">{subtext}</p>
        </div>
    </div>
);

// --- MAIN COMPONENT ---

export default function QuestionBank() {
    const { auth } = usePage().props;
    const user = auth.user;
    
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedDifficulty, setSelectedDifficulty] = useState('all');
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [showAIModal, setShowAIModal] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [statistics, setStatistics] = useState({});

    const categories = [
        { id: 'all', name: 'Semua Kategori' },
        { id: 'general', name: 'Umum' },
        { id: 'technical', name: 'Teknis' },
        { id: 'behavioral', name: 'Perilaku' },
        { id: 'scenario', name: 'Skenario' },
        { id: 'case-study', name: 'Studi Kasus' }
    ];

    const difficulties = [
        { id: 'all', name: 'Semua Level' },
        { id: 'easy', name: 'Mudah', color: 'bg-emerald-100 text-emerald-700' },
        { id: 'medium', name: 'Sedang', color: 'bg-amber-100 text-amber-700' },
        { id: 'hard', name: 'Sulit', color: 'bg-red-100 text-red-700' },
    ];

    const questionTypes = [
        { id: 'multiple_choice', name: 'Pilihan Ganda' },
        { id: 'true_false', name: 'Benar/Salah' },
        { id: 'short_answer', name: 'Jawaban Singkat' },
        { id: 'essay', name: 'Essay' },
        { id: 'matching', name: 'Pencocokan' }
    ];

    useEffect(() => {
        fetchQuestions();
        fetchStatistics();
    }, [searchTerm, selectedCategory, selectedDifficulty]);

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                search: searchTerm,
                category: selectedCategory === 'all' ? '' : selectedCategory,
                difficulty: selectedDifficulty === 'all' ? '' : selectedDifficulty
            });

            const response = await fetch(`/api/questions?${params}`, {
                headers: { 'Accept': 'application/json' },
            });

            const data = await response.json();
            setQuestions(data.questions || []);
        } catch (error) {
            console.error('Error fetching questions:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            const response = await fetch('/api/questions/statistics', {
                headers: { 'Accept': 'application/json' },
            });
            const data = await response.json();
            setStatistics(data);
        } catch (error) {
            console.error('Error fetching statistics:', error);
        }
    };
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedQuestions(questions.map(q => q.id));
        } else {
            setSelectedQuestions([]);
        }
    };

    const handleSelectQuestion = (questionId) => {
        if (selectedQuestions.includes(questionId)) {
            setSelectedQuestions(selectedQuestions.filter(id => id !== questionId));
        } else {
            setSelectedQuestions([...selectedQuestions, questionId]);
        }
    };

    const handleDeleteQuestion = async (questionId) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus pertanyaan ini?')) return;

        try {
            await fetch(`/api/questions/${questionId}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
            });
            fetchQuestions();
        } catch (error) {
            console.error('Error deleting question:', error);
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Hapus ${selectedQuestions.length} pertanyaan?`)) return;

        try {
            for (const questionId of selectedQuestions) {
                await fetch(`/api/questions/${questionId}`, {
                    method: 'DELETE',
                    headers: {
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                    },
                });
            }
            setSelectedQuestions([]);
            fetchQuestions();
        } catch (error) {
            console.error('Error bulk deleting questions:', error);
        }
    };

    const handleExport = () => {
        const dataToExport = selectedQuestions.length > 0
            ? questions.filter(q => selectedQuestions.includes(q.id))
            : questions;

        const csv = [
            ['ID', 'Pertanyaan', 'Tipe', 'Kategori', 'Level Kesulitan'],
            ...dataToExport.map(q => [
                q.id,
                q.question,
                q.type,
                q.category,
                q.difficulty,
            ])
        ];

        const csvContent = csv.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `questions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const getDifficultyColor = (difficulty) => {
        const diff = difficulties.find(d => d.id === difficulty);
        return diff?.color || 'bg-slate-100 text-slate-700';
    };

    const getDifficultyLabel = (difficulty) => {
        const diff = difficulties.find(d => d.id === difficulty);
        return diff?.name || difficulty;
    };

    const getCategoryLabel = (category) => {
        const cat = categories.find(c => c.id === category);
        return cat?.name || category;
    };

    const getQuestionTypeLabel = (type) => {
        const t = questionTypes.find(qt => qt.id === type);
        return t?.name || type;
    };

    return (
        <AdminLayout user={user}>
            <Head title="Bank Pertanyaan" />

            <div className="pb-20 relative">
                
                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-slate-900 text-[#D6FF59] text-[10px] font-bold uppercase tracking-wider rounded-full">
                                Assessment Engine
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Knowledge Vault</h1>
                        <p className="text-slate-500 font-medium mt-1">Kelola, kategorikan, dan buat pertanyaan untuk penilaian.</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowAIModal(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-xl transition hover:-translate-y-1"
                        >
                            <Sparkles size={18} /> AI Generator
                        </button>
                        <Link
                            href="/admin/question-management"
                            className="flex items-center gap-2 px-6 py-3 bg-[#D6FF59] text-slate-900 rounded-xl font-bold shadow-lg shadow-lime-200 hover:bg-[#cbf542] transition hover:-translate-y-1"
                        >
                            <Plus size={18} /> Buat Baru
                        </Link>
                    </div>
                </div>

                {/* --- STATS ROW --- */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <StatCard label="Total Pertanyaan" value={statistics.total_questions || 0} subtext="Semua kategori" color="bg-blue-500" />
                    <StatCard label="Mudah" value={(statistics.by_difficulty?.easy) || 0} subtext="Level dasar" color="bg-emerald-500" />
                    <StatCard label="Sedang" value={(statistics.by_difficulty?.medium) || 0} subtext="Level menengah" color="bg-amber-500" />
                    <StatCard label="Sulit" value={(statistics.by_difficulty?.hard) || 0} subtext="Level advanced" color="bg-red-500" />
                </div>

                {/* --- TOOLBAR --- */}
                <div className="bg-white p-2 rounded-[24px] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <div className="flex gap-2 w-full md:w-auto p-1">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Cari pertanyaan..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#D6FF59]"
                            />
                        </div>
                        <button className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 transition">
                            <Filter size={18} />
                        </button>
                    </div>
                    
                    <div className="flex gap-2 p-1">
                        <div className="bg-slate-100 p-1 rounded-xl flex">
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow text-slate-900' : 'text-slate-400'}`}
                            >
                                <ListIcon size={18} />
                            </button>
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow text-slate-900' : 'text-slate-400'}`}
                            >
                                <Grid size={18} />
                            </button>
                        </div>
                        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition">
                            <Download size={16} /> Export
                        </button>
                    </div>
                </div>

                {/* --- CONTENT AREA --- */}
                {loading ? (
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-12 text-center">
                        <p className="text-slate-600">Memuat pertanyaan...</p>
                    </div>
                ) : questions.length === 0 ? (
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-12 text-center">
                        <BookOpen className="mx-auto text-slate-400 mb-4" size={48} />
                        <p className="text-slate-600">Tidak ada pertanyaan. Mulai dengan membuat pertanyaan baru.</p>
                    </div>
                ) : viewMode === 'list' ? (
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 w-16">
                                        <input 
                                            type="checkbox" 
                                            onChange={handleSelectAll}
                                            checked={selectedQuestions.length === questions.length && questions.length > 0}
                                            className="w-5 h-5 rounded border-slate-300 text-[#D6FF59] focus:ring-[#D6FF59]" 
                                        />
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Pertanyaan</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Kesulitan</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {questions.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50/80 transition group cursor-pointer" onClick={() => setSelectedQuestion(item)}>
                                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                            <input 
                                                type="checkbox" 
                                                checked={selectedQuestions.includes(item.id)}
                                                onChange={() => handleSelectQuestion(item.id)}
                                                className="w-5 h-5 rounded border-slate-300 text-[#D6FF59] focus:ring-[#D6FF59]" 
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-900 line-clamp-2 mb-1">{item.question_text}</p>
                                            <p className="text-xs text-slate-400">ID: #{item.id}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <DifficultyBadge level={item.difficulty} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link href={`/admin/question-management/${item.id}`} className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg">
                                                    <Edit3 size={18} />
                                                </Link>
                                                <button onClick={(e) => {e.stopPropagation(); handleDeleteQuestion(item.id);}} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {questions.map(item => (
                            <motion.div 
                                layout
                                key={item.id}
                                onClick={() => setSelectedQuestion(item)}
                                className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-lg hover:border-[#D6FF59] transition-all cursor-pointer group relative"
                            >
                                <div className="absolute top-4 right-4" onClick={(e) => e.stopPropagation()}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedQuestions.includes(item.id)}
                                        onChange={() => handleSelectQuestion(item.id)}
                                        className="w-5 h-5 rounded border-slate-300 text-[#D6FF59] focus:ring-[#D6FF59]" 
                                    />
                                </div>
                                <div className="flex gap-2 mb-4">
                                    <DifficultyBadge level={item.difficulty} />
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
                                        <CategoryIcon category={item.category} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">{getCategoryLabel(item.category)}</span>
                                    </div>
                                </div>
                                <h3 className="font-bold text-slate-900 mb-4 line-clamp-3 min-h-[4.5rem]">
                                    {item.question_text}
                                </h3>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                        <TypeIcon type={item.type} />
                                        <span>{getQuestionTypeLabel(item.type)}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* --- BULK ACTION BAR (Floating) --- */}
                <AnimatePresence>
                    {selectedQuestions.length > 0 && (
                        <motion.div 
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 z-50"
                        >
                            <span className="font-bold text-sm bg-white/10 px-3 py-1 rounded-lg">{selectedQuestions.length} Dipilih</span>
                            <div className="h-4 w-[1px] bg-white/20"></div>
                            <div className="flex gap-2">
                                <button onClick={handleExport} className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-lg text-sm font-medium transition">
                                    <Download size={16} /> Export
                                </button>
                                <button 
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg text-sm font-medium transition"
                                >
                                    <Trash2 size={16} /> Hapus
                                </button>
                            </div>
                            <button onClick={() => setSelectedQuestions([])} className="p-1 hover:bg-white/10 rounded-full ml-2">
                                <X size={16} />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* --- PREVIEW DRAWER --- */}
                <AnimatePresence>
                    {selectedQuestion && (
                        <>
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setSelectedQuestion(null)}
                                className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60]"
                            />
                            <motion.div 
                                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 25 }}
                                className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-[70] flex flex-col border-l border-slate-100 overflow-y-auto"
                            >
                                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50 sticky top-0">
                                    <div>
                                        <div className="flex gap-2 mb-2">
                                            <DifficultyBadge level={selectedQuestion.difficulty} />
                                            <span className="bg-white border border-slate-200 px-2 py-1 rounded-md text-[10px] font-bold text-slate-500 uppercase">{getCategoryLabel(selectedQuestion.category)}</span>
                                        </div>
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pratinjau Pertanyaan</h3>
                                    </div>
                                    <button onClick={() => setSelectedQuestion(null)} className="p-2 hover:bg-slate-200 rounded-full"><X size={20}/></button>
                                </div>
                                
                                <div className="p-8 flex-1">
                                    <h2 className="text-xl font-bold text-slate-900 mb-6 leading-relaxed">
                                        {selectedQuestion.question_text}
                                    </h2>

                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <h4 className="text-xs font-bold text-slate-600 uppercase mb-3">Tipe Pertanyaan</h4>
                                        <p className="text-sm font-medium text-slate-700">{getQuestionTypeLabel(selectedQuestion.type)}</p>
                                    </div>
                                </div>

                                <div className="p-6 border-t border-slate-100 bg-white flex gap-3">
                                    <Link href={`/admin/question-management/${selectedQuestion.id}`} className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 text-center">Edit</Link>
                                    <button onClick={() => setSelectedQuestion(null)} className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800">Tutup</button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* --- AI GENERATOR MODAL --- */}
                <AnimatePresence>
                    {showAIModal && (
                        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl"
                            >
                                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white relative overflow-hidden">
                                    <Sparkles className="absolute top-4 right-4 text-white/20" size={80} />
                                    <h2 className="text-2xl font-black mb-2">🤖 AI Question Generator</h2>
                                    <p className="text-indigo-100">Deskripsikan topik, dan biarkan AI membuat soal untuk Anda.</p>
                                </div>
                                <div className="p-8">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Topik / Materi</label>
                                            <textarea 
                                                rows={4}
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
                                                placeholder="Tempel materi pelatihan Anda di sini, atau ketik topik seperti 'Cyber Security Basics'..."
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Jumlah Soal</label>
                                                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">
                                                    <option>5 Pertanyaan</option>
                                                    <option>10 Pertanyaan</option>
                                                    <option>20 Pertanyaan</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Kesulitan</label>
                                                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">
                                                    <option>Campuran</option>
                                                    <option>Mudah</option>
                                                    <option>Sulit</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-8 flex gap-3 justify-end">
                                        <button onClick={() => setShowAIModal(false)} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl">Batal</button>
                                        <button className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg flex items-center gap-2">
                                            <Sparkles size={18} /> Generate
                                        </button>
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
