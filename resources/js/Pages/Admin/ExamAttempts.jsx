import React, { useState, useMemo, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
    ArrowLeft, Download, Eye, Trash2, CheckCircle2, 
    XCircle, Clock, User, Award, Search, Filter,
    MoreHorizontal, TrendingUp, BarChart3, Calendar,
    ChevronDown, RefreshCw, X, Star, MessageCircle, BarChart2,
    Zap, TrendingDown, FileText, Flag, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import AdminLayout from '@/Layouts/AdminLayout';
import axios from 'axios';

// --- Wondr Style System ---
const WondrStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        
        .wondr-dark { background-color: #002824; }
        .wondr-green { color: #005E54; }
        .wondr-lime { color: #D6F84C; }
        
        .glass-panel {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.6);
            box-shadow: 0 10px 30px -10px rgba(0, 40, 36, 0.05);
        }

        .list-card {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            border-left: 4px solid transparent;
        }
        .list-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px -5px rgba(0, 94, 84, 0.1);
            border-left-color: #005E54;
        }

        .hero-pattern {
            background-color: #002824;
            background-image: radial-gradient(#005E54 1px, transparent 1px);
            background-size: 24px 24px;
        }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }

        .animate-enter { animation: enter 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        @keyframes enter {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
    `}</style>
);

// --- Components ---

const StatCard = ({ label, value, subtext, icon: Icon, color, delay }) => {
    const theme = {
        emerald: { bg: 'bg-[#F0FDF4]', text: 'text-[#005E54]' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-700' },
        amber: { bg: 'bg-amber-50', text: 'text-amber-700' },
        red: { bg: 'bg-red-50', text: 'text-red-700' },
    }[color] || { bg: 'bg-slate-50', text: 'text-slate-700' };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay * 0.1 }}
            className="glass-panel p-5 rounded-[24px] flex flex-col justify-between hover:shadow-lg transition-shadow"
        >
            <div className="flex justify-between items-start mb-2">
                <div className={`p-3 rounded-2xl ${theme.bg} ${theme.text}`}>
                    <Icon size={24} />
                </div>
            </div>
            <div>
                <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{value}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{label}</p>
                {subtext && <p className="text-xs text-slate-500 mt-2 font-medium">{subtext}</p>}
            </div>
        </motion.div>
    );
};

const AttemptDetailsModal = ({ attempt, program, allAttempts, isOpen, onClose, onMark, isMarked }) => {
    const [activeTab, setActiveTab] = useState('preview');
    const [comparisonAttempts, setComparisonAttempts] = useState([]);
    const [selectedCompare, setSelectedCompare] = useState(null);

    // Mock answer details
    const answerDetails = [
        { id: 1, question: 'Apa definisi risiko kredit?', category: 'Credit & Risk Management', userAnswer: 'Risiko tidak terjadinya pembayaran', correctAnswer: 'Risiko gagal bayar debitur', isCorrect: false, timeSpent: '1m 23s' },
        { id: 2, question: 'Sebutkan 3 pilar compliance', category: 'Compliance & Regulatory', userAnswer: 'Policies, Procedures, Training', correctAnswer: 'Policies, Procedures, Monitoring', isCorrect: true, timeSpent: '2m 15s' },
        { id: 3, question: 'Hitung NPL ratio jika NPL = 500M, Total Kredit = 10M', category: 'Credit & Risk Management', userAnswer: '5%', correctAnswer: '5%', isCorrect: true, timeSpent: '3m 45s' },
    ];

    const scoreByCategory = [
        { name: 'Credit & Risk', score: 85, max: 100 },
        { name: 'Compliance', score: 90, max: 100 },
        { name: 'Sales', score: 75, max: 100 },
    ];

    const timelineData = [
        { questionNum: 1, time: '1m 23s', score: 0 },
        { questionNum: 2, time: '2m 15s', score: 100 },
        { questionNum: 3, time: '3m 45s', score: 100 },
    ];

    if (!isOpen || !attempt) return null;

    const isPassed = attempt.score >= program.passing_grade;
    const otherAttempts = allAttempts.filter(a => a.id !== attempt.id).slice(0, 5);

    const tabs = [
        { id: 'preview', label: 'Preview', icon: Eye },
        { id: 'answers', label: 'Jawaban', icon: FileText },
        { id: 'breakdown', label: 'Breakdown', icon: BarChart2 },
        { id: 'timeline', label: 'Timeline', icon: Clock },
        { id: 'comparison', label: 'Perbandingan', icon: TrendingDown },
        { id: 'mark', label: 'Review', icon: Flag },
    ];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-[32px] max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
                >
                    {/* Modal Header */}
                    <div className="bg-gradient-to-r from-[#002824] to-[#005E54] px-8 py-6 flex justify-between items-center border-b border-[#005E54]/20">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg
                                ${isPassed ? 'bg-[#D6F84C] text-[#002824]' : 'bg-red-500'}
                            `}>
                                {attempt.user?.name?.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">{attempt.user?.name}</h2>
                                <p className="text-sm text-[#D6F84C]">{program.title}</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition"
                        >
                            <X className="text-white" size={24} />
                        </button>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex gap-1 bg-slate-50 border-b border-slate-200 overflow-x-auto px-4 no-scrollbar">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-4 text-sm font-bold border-b-2 transition whitespace-nowrap
                                        ${activeTab === tab.id 
                                            ? 'border-[#005E54] text-[#005E54]' 
                                            : 'border-transparent text-slate-500 hover:text-slate-700'
                                        }
                                    `}
                                >
                                    <Icon size={16} /> {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab Content */}
                    <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(90vh - 180px)' }}>
                        {/* --- PREVIEW TAB --- */}
                        {activeTab === 'preview' && (
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-xl">
                                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">Skor</p>
                                        <p className={`text-3xl font-black ${isPassed ? 'text-[#005E54]' : 'text-red-600'}`}>{attempt.score}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl">
                                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">KKM</p>
                                        <p className="text-3xl font-black text-slate-700">{program.passing_grade}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl">
                                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">Status</p>
                                        <p className={`text-lg font-bold ${isPassed ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {isPassed ? '✓ Lulus' : '✗ Gagal'}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl">
                                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">Durasi</p>
                                        <p className="text-3xl font-black text-slate-700">{attempt.duration || 0}m</p>
                                    </div>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex gap-3">
                                    <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
                                    <div>
                                        <p className="font-bold text-blue-900">Info Ujian</p>
                                        <p className="text-sm text-blue-700 mt-1">
                                            Ujian dilakukan pada {new Date(attempt.created_at).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- ANSWER DETAILS TAB --- */}
                        {activeTab === 'answers' && (
                            <div className="p-8 space-y-4">
                                {answerDetails.map((answer, idx) => (
                                    <div key={idx} className={`border-l-4 p-4 rounded-lg ${answer.isCorrect ? 'border-emerald-500 bg-emerald-50' : 'border-red-500 bg-red-50'}`}>
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <p className="font-bold text-slate-900">Soal {answer.id}: {answer.question}</p>
                                                <p className="text-xs text-slate-500 font-medium mt-1">{answer.category}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {answer.isCorrect ? (
                                                    <CheckCircle2 className="text-emerald-600" size={20} />
                                                ) : (
                                                    <XCircle className="text-red-600" size={20} />
                                                )}
                                            </div>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="font-bold text-slate-600 mb-1">Jawaban Peserta:</p>
                                                <p className={`p-2 bg-white rounded border-l-2 ${answer.isCorrect ? 'border-emerald-500' : 'border-red-500'}`}>
                                                    {answer.userAnswer}
                                                </p>
                                            </div>
                                            {!answer.isCorrect && (
                                                <div>
                                                    <p className="font-bold text-slate-600 mb-1">Jawaban Benar:</p>
                                                    <p className="p-2 bg-emerald-100 rounded border-l-2 border-emerald-500">
                                                        {answer.correctAnswer}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                            <Clock size={14} /> Waktu: {answer.timeSpent}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* --- SCORE BREAKDOWN TAB --- */}
                        {activeTab === 'breakdown' && (
                            <div className="p-8 space-y-4">
                                {scoreByCategory.map((cat, idx) => {
                                    const percentage = (cat.score / cat.max) * 100;
                                    return (
                                        <div key={idx} className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <p className="font-bold text-slate-900">{cat.name}</p>
                                                <span className={`font-bold text-lg ${percentage >= 80 ? 'text-emerald-600' : percentage >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                                                    {cat.score}/{cat.max}
                                                </span>
                                            </div>
                                            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all ${percentage >= 80 ? 'bg-emerald-500' : percentage >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-slate-500">{Math.round(percentage)}%</p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* --- TIMELINE TAB --- */}
                        {activeTab === 'timeline' && (
                            <div className="p-8 space-y-3">
                                {timelineData.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                                        <div className="w-10 h-10 rounded-full bg-[#005E54] text-white flex items-center justify-center font-bold text-sm">
                                            {item.questionNum}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-900">Soal {item.questionNum}</p>
                                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                                <Clock size={14} /> Waktu: {item.time}
                                            </p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${item.score === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                            {item.score === 100 ? '+100' : '+0'}
                                        </div>
                                    </div>
                                ))}
                                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mt-6">
                                    <p className="font-bold text-blue-900 flex items-center gap-2">
                                        <TrendingUp size={18} /> Total Waktu: {attempt.duration || 0} menit
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* --- COMPARISON TAB --- */}
                        {activeTab === 'comparison' && (
                            <div className="p-8 space-y-4">
                                <div className="bg-slate-50 p-4 rounded-lg mb-4">
                                    <p className="font-bold text-slate-900 mb-3">Percobaan Lain Pengguna</p>
                                    <select 
                                        value={selectedCompare?.id || ''}
                                        onChange={(e) => setSelectedCompare(otherAttempts.find(a => a.id === parseInt(e.target.value)))}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#005E54]/20 outline-none"
                                    >
                                        <option value="">Pilih attempt untuk dibandingkan...</option>
                                        {otherAttempts.map(a => (
                                            <option key={a.id} value={a.id}>
                                                {new Date(a.created_at).toLocaleDateString()} - Skor {a.score}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {selectedCompare ? (
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                            <p className="text-xs font-bold text-blue-600 uppercase mb-2">Attempt Saat Ini</p>
                                            <p className="text-3xl font-black text-[#005E54]">{attempt.score}</p>
                                            <p className="text-sm text-slate-600 mt-2">Durasi: {attempt.duration}m</p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {new Date(attempt.created_at).toLocaleDateString('id-ID')}
                                            </p>
                                        </div>
                                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                                            <p className="text-xs font-bold text-amber-600 uppercase mb-2">Attempt Dibandingkan</p>
                                            <p className="text-3xl font-black text-amber-600">{selectedCompare.score}</p>
                                            <p className="text-sm text-slate-600 mt-2">Durasi: {selectedCompare.duration}m</p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {new Date(selectedCompare.created_at).toLocaleDateString('id-ID')}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-100 p-8 rounded-lg text-center">
                                        <p className="text-slate-500 font-medium">Pilih attempt untuk melihat perbandingan</p>
                                    </div>
                                )}

                                {selectedCompare && (
                                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                                        <p className="font-bold text-green-900 mb-2">Perbedaan Skor</p>
                                        <p className={`text-2xl font-black ${attempt.score > selectedCompare.score ? 'text-green-600' : 'text-red-600'}`}>
                                            {attempt.score > selectedCompare.score ? '+' : ''}{attempt.score - selectedCompare.score} poin
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* --- MARK/REVIEW TAB --- */}
                        {activeTab === 'mark' && (
                            <div className="p-8 space-y-4">
                                <div className={`p-6 rounded-lg border-2 ${isMarked ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-bold text-lg text-slate-900 mb-2">Status Review</p>
                                            <p className={`text-sm ${isMarked ? 'text-amber-700' : 'text-slate-600'}`}>
                                                {isMarked 
                                                    ? 'Attempt ini telah ditandai untuk review lebih lanjut' 
                                                    : 'Tandai attempt ini jika memerlukan review tambahan'
                                                }
                                            </p>
                                        </div>
                                        <Flag className={isMarked ? 'text-amber-600' : 'text-slate-400'} size={32} />
                                    </div>
                                </div>

                                <button 
                                    onClick={() => onMark(attempt.id)}
                                    className={`w-full py-3 px-4 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
                                        isMarked 
                                            ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                                            : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                    }`}
                                >
                                    <Flag size={18} />
                                    {isMarked ? 'Hapus Penandaan' : 'Tandai untuk Review'}
                                </button>

                                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-2">
                                    <p className="font-bold text-blue-900">Catatan Review</p>
                                    <p className="text-sm text-blue-700">
                                        Gunakan fitur penandaan untuk:
                                    </p>
                                    <ul className="text-sm text-blue-700 space-y-1 ml-4">
                                        <li>• Melakukan review ulang terhadap jawaban peserta</li>
                                        <li>• Mengevaluasi soal yang dinilai salah</li>
                                        <li>• Memvalidasi hasil ujian yang diragukan</li>
                                        <li>• Mempersiapkan tindakan lanjutan</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Modal Footer */}
                    <div className="bg-slate-50 border-t border-slate-200 px-8 py-4 flex justify-end gap-2">
                        <button 
                            onClick={onClose}
                            className="px-6 py-2 rounded-lg font-bold text-slate-700 hover:bg-slate-100 transition"
                        >
                            Tutup
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const AttemptRow = ({ attempt, program, onDelete, onView, index, isMarked }) => {
    const isPassed = attempt.score >= program.passing_grade;
    const scorePercent = Math.min(100, Math.max(0, attempt.score));

    return (
        <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`list-card bg-white p-5 rounded-2xl border flex flex-col md:flex-row items-center gap-6 group transition ${
                isMarked ? 'border-amber-300 bg-amber-50' : 'border-slate-100'
            }`}
        >
            {/* Marked Indicator */}
            {isMarked && (
                <div className="absolute top-3 right-3 md:relative md:top-auto md:right-auto">
                    <div className="flex items-center gap-1 px-2 py-1 bg-amber-200 rounded-full">
                        <Flag size={12} className="text-amber-700" />
                        <span className="text-xs font-bold text-amber-700">Ditandai</span>
                    </div>
                </div>
            )}
            
            {/* User Info */}
            <div className="flex items-center gap-4 flex-1 w-full md:w-auto">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-md
                    ${isPassed ? 'bg-gradient-to-br from-[#005E54] to-[#00403a]' : 'bg-gradient-to-br from-red-500 to-red-700'}
                `}>
                    {attempt.user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                    <h4 className="font-bold text-slate-900">{attempt.user?.name || 'Unknown'}</h4>
                    <p className="text-xs text-slate-500">{attempt.user?.email || 'N/A'}</p>
                    <div className="flex items-center gap-3 mt-1 md:hidden">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isPassed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {isPassed ? 'Lulus' : 'Gagal'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats & Metadata */}
            <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-start">
                <div className="text-center md:text-left">
                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">Tanggal</p>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(attempt.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>

                <div className="text-center md:text-left w-24">
                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">Durasi</p>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                        <Clock size={14} className="text-slate-400" />
                        {attempt.duration || 'N/A'}m
                    </div>
                </div>
            </div>

            {/* Score & Visual */}
            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                <div className="flex flex-col items-end w-32">
                    <div className="flex justify-between w-full text-xs mb-1">
                        <span className="font-bold text-slate-500">Skor</span>
                        <span className={`font-black ${isPassed ? 'text-[#005E54]' : 'text-red-600'}`}>{attempt.score}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full ${isPassed ? 'bg-[#005E54]' : 'bg-red-500'}`} 
                            style={{ width: `${scorePercent}%` }}
                        ></div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={() => onView(attempt.id)}
                        className="p-2.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                        title="Lihat Detail"
                    >
                        <Eye size={18} />
                    </button>
                    <button 
                        onClick={() => onDelete(attempt.id)}
                        className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Hapus"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

// --- Main Component ---

export default function ExamAttempts({ program: initialProgram, attempts: initialAttempts, auth }) {
    // Mock Data Fallback
    const program = initialProgram || { 
        title: 'Wondr Financial Suite Masterclass',
        passing_grade: 80,
        total_questions: 50
    };

    const mockAttempts = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        user: { name: ['Sarah Wijaya', 'Budi Santoso', 'Andi Pratama', 'Dewi Lestari', 'Eko Patrio'][i % 5], email: `user${i}@bni.co.id` },
        score: Math.floor(Math.random() * 40) + 60,
        duration: Math.floor(Math.random() * 30) + 15,
        created_at: new Date(Date.now() - i * 86400000).toISOString()
    }));

    const [attempts, setAttempts] = useState(initialAttempts?.data || mockAttempts);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    const [selectedAttempt, setSelectedAttempt] = useState(null);
    const [markedAttempts, setMarkedAttempts] = useState(new Set());

    const showNotification = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    // Filter Logic
    const filteredAttempts = useMemo(() => {
        return attempts.filter(a => {
            const matchesSearch = a.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  a.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
            const isPassed = a.score >= program.passing_grade;
            const matchesFilter = statusFilter === 'all' || 
                                  (statusFilter === 'passed' && isPassed) ||
                                  (statusFilter === 'failed' && !isPassed);
            return matchesSearch && matchesFilter;
        });
    }, [attempts, searchQuery, statusFilter, program.passing_grade]);

    // Stats Calculation
    const stats = useMemo(() => {
        const total = filteredAttempts.length;
        const passed = filteredAttempts.filter(a => a.score >= program.passing_grade).length;
        const failed = total - passed;
        const avgScore = total > 0 ? Math.round(filteredAttempts.reduce((acc, curr) => acc + curr.score, 0) / total) : 0;
        
        return { total, passed, failed, avgScore };
    }, [filteredAttempts, program.passing_grade]);

    // Charts Data
    const pieData = [
        { name: 'Lulus', value: stats.passed, color: '#10B981' },
        { name: 'Gagal', value: stats.failed, color: '#EF4444' },
    ];

    const scoreDistribution = [
        { range: '90-100', count: filteredAttempts.filter(a => a.score >= 90).length },
        { range: '80-89', count: filteredAttempts.filter(a => a.score >= 80 && a.score < 90).length },
        { range: '70-79', count: filteredAttempts.filter(a => a.score >= 70 && a.score < 80).length },
        { range: '< 70', count: filteredAttempts.filter(a => a.score < 70).length },
    ];

    // Handlers
    const handleDelete = async (id) => {
        if(!confirm("Hapus data ini?")) return;

        setLoading(true);
        try {
            await axios.delete(`/api/admin/exam-attempts/${id}`);
            setAttempts(prev => prev.filter(a => a.id !== id));
            showNotification('Percobaan berhasil dihapus', 'success');
        } catch (error) {
            showNotification('Error menghapus percobaan', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (attemptId) => {
        const attempt = attempts.find(a => a.id === attemptId);
        setSelectedAttempt(attempt);
    };

    const handleMarkAttempt = (attemptId) => {
        const newMarked = new Set(markedAttempts);
        if (newMarked.has(attemptId)) {
            newMarked.delete(attemptId);
            showNotification('Penandaan dihapus', 'success');
        } else {
            newMarked.add(attemptId);
            showNotification('Attempt ditandai untuk review', 'success');
        }
        setMarkedAttempts(newMarked);
    };

    const handleExportCSV = async () => {
        try {
            const response = await axios.get(`/api/admin/training-programs/${program.id}/exam-attempts/export`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `exam-attempts-${program.id}.csv`);
            document.body.appendChild(link);
            link.click();
            showNotification('Export berhasil', 'success');
        } catch (error) {
            showNotification('Error mengexport data', 'error');
        }
    };

    return (
        <AdminLayout user={auth?.user}>
            <WondrStyles />
            <Head title={`Hasil Ujian - ${program.title}`} />

            {/* Detail Modal */}
            <AttemptDetailsModal 
                attempt={selectedAttempt} 
                program={program}
                allAttempts={attempts}
                isOpen={!!selectedAttempt}
                onClose={() => setSelectedAttempt(null)}
                onMark={handleMarkAttempt}
                isMarked={selectedAttempt ? markedAttempts.has(selectedAttempt.id) : false}
            />

            {/* Notification */}
            {notification && (
                <div className={`fixed top-6 right-6 px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 ${
                    notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                }`}>
                    {notification.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5" />
                    ) : (
                        <XCircle className="w-5 h-5" />
                    )}
                    {notification.msg}
                </div>
            )}

            <div className="min-h-screen bg-[#F8FAFC] pb-20">
                
                {/* --- Hero Header --- */}
                <div className="hero-pattern pt-8 pb-32 px-6 lg:px-12 relative overflow-hidden shadow-2xl shadow-[#002824]/20">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#005E54] rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/4"></div>
                    
                    <div className="relative z-10 max-w-7xl mx-auto">
                        {/* Top Nav */}
                        <div className="flex justify-between items-center mb-8">
                            <button 
                                onClick={() => router.visit('/admin/training-programs')}
                                className="flex items-center gap-2 text-white/70 hover:text-[#D6F84C] transition font-bold text-sm group"
                            >
                                <div className="p-1.5 bg-white/10 rounded-full group-hover:bg-[#D6F84C] group-hover:text-[#002824] transition-all">
                                    <ArrowLeft size={16} />
                                </div>
                                Kembali ke Program
                            </button>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => window.location.reload()}
                                    className="p-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition"
                                >
                                    <RefreshCw size={18} />
                                </button>
                                <button 
                                    onClick={handleExportCSV}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#D6F84C] text-[#002824] rounded-xl font-bold text-sm hover:bg-[#c2e43c] transition shadow-lg"
                                >
                                    <Download size={16} /> Export CSV
                                </button>
                            </div>
                        </div>

                        {/* Title & Meta */}
                        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                            <div>
                                <div className="flex items-center gap-2 text-[#D6F84C] mb-2 font-bold text-xs tracking-widest uppercase">
                                    <BarChart3 className="w-4 h-4" /> Exam Analytics
                                </div>
                                <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-2">
                                    {program.title}
                                </h1>
                                <p className="text-blue-100 max-w-2xl">
                                    Laporan lengkap hasil ujian peserta. Pantau tingkat kelulusan dan distribusi nilai secara real-time.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Content Overlay --- */}
                <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-20">
                    
                    {/* 1. Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatCard label="Total Percobaan" value={stats.total} icon={TrendingUp} color="blue" delay={0} />
                        <StatCard label="Lulus" value={stats.passed} subtext={`${Math.round((stats.passed/stats.total)*100 || 0)}% Rate`} icon={CheckCircle2} color="emerald" delay={1} />
                        <StatCard label="Gagal" value={stats.failed} icon={XCircle} color="red" delay={2} />
                        <StatCard label="Rata-rata Nilai" value={stats.avgScore} subtext={`KKM: ${program.passing_grade}`} icon={Award} color="amber" delay={3} />
                    </div>

                    {/* 2. Visual Analytics (Charts) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Pass/Fail Ratio */}
                        <div className="glass-panel p-6 rounded-[24px] bg-white animate-enter">
                            <h3 className="font-bold text-slate-900 mb-4">Rasio Kelulusan</h3>
                            <div className="h-48 relative">
                                {stats.total > 0 ? (
                                    <>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-3xl font-black text-slate-800">{stats.passed}</span>
                                            <span className="text-[10px] uppercase font-bold text-slate-400">Lulus</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-400">
                                        <p>Tidak ada data</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-center gap-4 mt-2">
                                {pieData.map((d, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: d.color}}></div>
                                        {d.name}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Score Distribution */}
                        <div className="lg:col-span-2 glass-panel p-6 rounded-[24px] bg-white animate-enter" style={{animationDelay: '0.2s'}}>
                            <h3 className="font-bold text-slate-900 mb-4">Distribusi Nilai</h3>
                            <div className="h-56">
                                {stats.total > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={scoreDistribution} layout="vertical" margin={{ left: 0, right: 20 }}>
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="range" type="category" width={60} tick={{fontSize: 12, fontWeight: 'bold', fill: '#64748B'}} axisLine={false} tickLine={false} />
                                            <RechartsTooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: 'none'}} />
                                            <Bar dataKey="count" fill="#3B82F6" radius={[0, 6, 6, 0]} barSize={24}>
                                                {scoreDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : index === 3 ? '#EF4444' : '#3B82F6'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-400">
                                        <p>Tidak ada data</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 3. Filters & List */}
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-6 lg:p-8 animate-enter" style={{animationDelay: '0.4s'}}>
                        
                        {/* Toolbar */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                            <div className="relative w-full md:w-80 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#005E54] transition-colors" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Cari nama peserta..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-[#005E54]/20 outline-none transition-all"
                                />
                            </div>

                            <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
                                {['all', 'passed', 'failed'].map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => setStatusFilter(filter)}
                                        className={`px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition-all whitespace-nowrap ${
                                            statusFilter === filter 
                                            ? 'bg-[#002824] text-[#D6F84C] shadow-lg' 
                                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                        }`}
                                    >
                                        {filter === 'all' ? 'Semua' : filter === 'passed' ? 'Lulus' : 'Gagal'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* List */}
                        <div className="space-y-3">
                            {loading ? (
                                <div className="text-center py-20">
                                    <div className="animate-spin w-10 h-10 border-4 border-[#005E54] border-t-transparent rounded-full mx-auto mb-4"></div>
                                    <p className="text-slate-500 font-medium">Memuat data...</p>
                                </div>
                            ) : filteredAttempts.length > 0 ? (
                                filteredAttempts.map((attempt, idx) => (
                                    <AttemptRow 
                                        key={attempt.id} 
                                        attempt={attempt} 
                                        program={program}
                                        index={idx}
                                        onDelete={handleDelete}
                                        onView={handleViewDetails}
                                        isMarked={markedAttempts.has(attempt.id)}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-20 bg-slate-50 rounded-[24px] border border-dashed border-slate-200">
                                    <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-slate-900">Data tidak ditemukan</h3>
                                    <p className="text-slate-500 text-sm">Coba ubah filter atau kata kunci pencarian.</p>
                                </div>
                            )}
                        </div>
                        
                        {/* Pagination (Visual Only) */}
                        <div className="mt-8 flex justify-center">
                            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                                <button className="p-2 hover:bg-white rounded-lg transition disabled:opacity-50" disabled><ArrowLeft size={16} /></button>
                                <span className="text-xs font-bold text-slate-600 px-2">Page 1 of 1</span>
                                <button className="p-2 hover:bg-white rounded-lg transition disabled:opacity-50" disabled><ArrowLeft size={16} className="rotate-180" /></button>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </AdminLayout>
    );
}
