import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Trophy, CheckCircle2, XCircle, Clock, Target, 
    Award, ArrowRight, RotateCcw, Home, Star, TrendingUp,
    AlertCircle, BookOpen, Sparkles, Share2, Download, 
    ChevronDown, ChevronUp, Map
} from 'lucide-react';

// --- Wondr Style System ---
const WondrStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F8F9FA; color: #1e293b; }
        
        .wondr-dark { background-color: #002824; }
        .wondr-green { color: #005E54; }
        .wondr-lime { color: #D6F84C; }
        
        .glass-panel {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.6);
            box-shadow: 0 10px 40px -10px rgba(0, 40, 36, 0.08);
        }

        .result-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid transparent;
        }
        .result-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 25px -5px rgba(0, 94, 84, 0.1);
        }

        .hero-bg {
            background-color: #002824;
            background-image: 
                radial-gradient(at 0% 0%, rgba(0, 94, 84, 0.3) 0px, transparent 50%),
                radial-gradient(at 100% 100%, rgba(214, 248, 76, 0.1) 0px, transparent 50%);
        }

        .score-gauge circle {
            transition: stroke-dashoffset 1.5s ease-out;
        }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }

        .animate-pop { animation: pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        @keyframes pop {
            0% { transform: scale(0.8); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
        }
    `}</style>
);

// Score Gauge Component
const ScoreGauge = ({ score, passingScore }) => {
    const isPassed = score >= passingScore;
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = isPassed ? '#D6F84C' : '#EF4444'; // Lime or Red

    return (
        <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Glow Effect */}
            <div className={`absolute inset-0 rounded-full blur-3xl opacity-20 ${isPassed ? 'bg-[#D6F84C]' : 'bg-red-500'}`}></div>
            
            <svg className="w-full h-full transform -rotate-90 score-gauge relative z-10">
                {/* Track */}
                <circle
                    cx="50%" cy="50%" r={radius}
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="16"
                    fill="none"
                />
                {/* Progress */}
                <circle
                    cx="50%" cy="50%" r={radius}
                    stroke={color}
                    strokeWidth="16"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                />
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-20">
                <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="text-center"
                >
                    <span className="text-6xl font-black tracking-tighter">{score}</span>
                    <span className="text-xl font-medium text-white/60">/100</span>
                </motion.div>
                <div className={`mt-2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                    isPassed ? 'bg-[#D6F84C] text-[#002824]' : 'bg-red-500 text-white'
                }`}>
                    {isPassed ? 'Lulus' : 'Tidak Lulus'}
                </div>
            </div>
        </div>
    );
};

// Stat Box Component
const StatBox = ({ icon: Icon, label, value, subtext, color = 'slate', delay }) => {
    const colors = {
        emerald: 'bg-emerald-50 text-emerald-700',
        blue: 'bg-blue-50 text-blue-700',
        amber: 'bg-amber-50 text-amber-700',
        slate: 'bg-slate-50 text-slate-700',
        red: 'bg-red-50 text-red-700',
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay * 0.1 }}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center hover:border-[#005E54]/20 transition-all"
        >
            <div className={`p-3 rounded-full mb-3 ${colors[color]}`}>
                <Icon size={24} />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
            {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
        </motion.div>
    );
};

// Question Review Item with Collapse
const QuestionReviewItem = ({ question, index }) => {
    const [isOpen, setIsOpen] = useState(false);
    const isCorrect = question.is_correct;
    
    return (
        <div className={`border rounded-2xl transition-all duration-300 ${
            isOpen ? 'bg-white shadow-lg border-[#005E54]/30' : 'bg-white border-slate-200 hover:border-slate-300'
        }`}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-start gap-4 p-5 text-left"
            >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                    isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                    {isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                </div>
                
                <div className="flex-1">
                    <p className="font-bold text-slate-900 text-sm leading-relaxed">
                        {index + 1}. {question.question_text}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                         {!isOpen && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                {isCorrect ? 'Benar' : 'Salah'}
                            </span>
                         )}
                    </div>
                </div>
                
                <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="text-slate-400" size={20} />
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 pt-0 pl-[4.5rem]">
                            <div className="space-y-2 text-sm border-t border-slate-100 pt-4">
                                {['a','b','c','d'].map(opt => {
                                    const val = question[`option_${opt}`];
                                    if(!val) return null;
                                    
                                    const isUserAnswer = question.user_answer?.toLowerCase() === opt;
                                    const isCorrectAnswer = question.correct_answer?.toLowerCase() === opt;
                                    
                                    let style = "border-slate-200 bg-white text-slate-600";
                                    if (isCorrectAnswer) style = "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold";
                                    else if (isUserAnswer && !isCorrectAnswer) style = "border-red-500 bg-red-50 text-red-900 font-bold";

                                    return (
                                        <div key={opt} className={`p-3 rounded-xl border-2 flex justify-between items-center ${style}`}>
                                            <span className="flex items-center gap-2">
                                                <span className="uppercase w-6">{opt}.</span>
                                                {val}
                                            </span>
                                            {isCorrectAnswer && <CheckCircle2 size={16} />}
                                            {isUserAnswer && !isCorrectAnswer && <XCircle size={16} />}
                                        </div>
                                    )
                                })}
                            </div>

                            {question.explanation && (
                                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
                                    <BookOpen className="text-blue-600 shrink-0" size={18} />
                                    <div>
                                        <p className="text-xs font-bold text-blue-700 uppercase mb-1">Penjelasan</p>
                                        <p className="text-sm text-blue-900 leading-relaxed">{question.explanation}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Main Component
export default function QuizResult({ auth, training = {}, quiz = {}, result = {}, questions = [] }) {
    const user = auth?.user || {};
    const isPassed = result.score >= (quiz.passing_score || 70);
    
    // Calculate stats
    const correctCount = result.correct_count || questions.filter(q => q.is_correct).length;
    const wrongCount = result.wrong_count || (questions.length - correctCount);
    
    // Format time spent nicely
    const formatTimeSpent = (timeStr) => {
        if (!timeStr || timeStr === '-') return '-';
        
        // If already in MM:SS format
        if (timeStr.includes(':')) {
            const [mins, secs] = timeStr.split(':').map(Number);
            if (mins > 0 && secs > 0) {
                return `${mins}m ${secs}s`;
            } else if (mins > 0) {
                return `${mins}m`;
            } else {
                return `${secs}s`;
            }
        }
        
        return timeStr;
    };
    
    const timeSpent = formatTimeSpent(result.time_spent);
    
    return (
        <AppLayout user={user}>
            <WondrStyles />
            <Head title={`Hasil ${quiz.type === 'pretest' ? 'Pre-Test' : 'Post-Test'} - ${training.title}`} />

            {/* --- Hero Section --- */}
            <div className="hero-bg text-white pb-32 pt-12 rounded-b-[48px] overflow-hidden relative shadow-2xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#005E54] rounded-full blur-[120px] opacity-40 -translate-y-1/2 translate-x-1/4"></div>
                
                <div className="max-w-5xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center gap-12">
                    
                    {/* Left: Score Visual */}
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <ScoreGauge score={result.score || 0} passingScore={quiz.passing_score || 70} />
                    </motion.div>

                    {/* Right: Text & Context */}
                    <div className="text-center md:text-left flex-1">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[#D6F84C] text-xs font-bold uppercase tracking-widest mb-4">
                                <Award size={14} /> Hasil {quiz.type === 'pretest' ? 'Pre-Test' : 'Post-Test'}
                            </div>
                            
                            <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
                                {isPassed ? (
                                    <>Luar Biasa, <br/>Selamat!</>
                                ) : (
                                    <>Tetap Semangat, <br/>Coba Lagi!</>
                                )}
                            </h1>
                            
                            <p className="text-blue-100 text-lg mb-8 max-w-lg mx-auto md:mx-0">
                                {isPassed 
                                    ? `Anda telah berhasil menyelesaikan "${training.title}" dengan hasil memuaskan.` 
                                    : `Anda belum mencapai nilai kelulusan (${quiz.passing_score || 70}) pada "${training.title}". Pelajari materi lagi ya!`}
                            </p>

                            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                {isPassed ? (
                                    <>
                                        <Link href={`/training/${training.id}/certificate`} className="px-8 py-4 bg-[#D6F84C] hover:bg-[#c2e43c] text-[#002824] rounded-2xl font-bold shadow-lg shadow-[#D6F84C]/20 transition-all hover:scale-105 flex items-center gap-2">
                                            <Award size={20} /> Klaim Sertifikat
                                        </Link>
                                        <button className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold backdrop-blur-md transition flex items-center gap-2">
                                            <Share2 size={20} /> Bagikan
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link href={`/training/${training.id}`} className="px-8 py-4 bg-white text-[#002824] rounded-2xl font-bold hover:bg-slate-100 transition-all shadow-lg flex items-center gap-2">
                                            <BookOpen size={20} /> Pelajari Materi
                                        </Link>
                                        {quiz.allow_retake && (
                                            <button
                                                onClick={() => router.visit(`/training/${training.id}/quiz/${quiz.type}`)}
                                                className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold backdrop-blur-md transition flex items-center gap-2"
                                            >
                                                <RotateCcw size={20} /> Ulangi Ujian
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* --- Main Content --- */}
            <div className="max-w-5xl mx-auto px-6 -mt-20 relative z-20">
                
                {/* 1. Statistics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatBox 
                        label="Total Soal" 
                        value={questions.length} 
                        icon={Target} 
                        color="blue" 
                        delay={1}
                    />
                    <StatBox 
                        label="Jawaban Benar" 
                        value={correctCount} 
                        icon={CheckCircle2} 
                        color="emerald" 
                        delay={2}
                    />
                    <StatBox 
                        label="Waktu Pengerjaan" 
                        value={timeSpent} 
                        icon={Clock} 
                        color="amber" 
                        delay={3}
                    />
                    <StatBox 
                        label="Poin Didapat" 
                        value={`+${result.points_earned || result.score * 10}`} 
                        icon={Star} 
                        color="emerald" 
                        subtext="Wondr Points"
                        delay={4}
                    />
                </div>

                {/* 2. Content Layout */}
                <div className="flex flex-col lg:flex-row gap-8">
                    
                    {/* Left: Review Section */}
                    <div className="flex-1">
                        {quiz.show_review !== false && questions.length > 0 && (
                            <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-100">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                        <BookOpen className="text-[#005E54]" size={24} />
                                        Tinjauan Jawaban
                                    </h3>
                                    <div className="text-sm font-medium text-slate-500">
                                        {correctCount} dari {questions.length} benar
                                    </div>
                                </div>
                                
                                <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                                    {questions.map((q, i) => (
                                        <QuestionReviewItem key={q.id} question={q} index={i} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Sidebar Actions */}
                    <div className="lg:w-80 space-y-6">
                        {/* Status Card */}
                        <div className={`p-6 rounded-[24px] border-2 ${
                            isPassed ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'
                        }`}>
                            <h4 className={`font-bold text-lg mb-2 ${
                                isPassed ? 'text-emerald-900' : 'text-red-900'
                            }`}>
                                {isPassed ? 'Kompetensi Tercapai' : 'Perlu Perbaikan'}
                            </h4>
                            <p className={`text-sm mb-4 ${
                                isPassed ? 'text-emerald-700' : 'text-red-700'
                            }`}>
                                {isPassed 
                                    ? 'Anda telah memenuhi standar kompetensi untuk modul ini.' 
                                    : 'Anda perlu meningkatkan pemahaman di beberapa topik.'}
                            </p>
                            {!isPassed && quiz.allow_retake && (
                                <button
                                    onClick={() => router.visit(`/training/${training.id}/quiz/${quiz.type}`)}
                                    className="w-full py-3 bg-red-600 text-white text-center rounded-xl font-bold hover:bg-red-700 transition"
                                >
                                    Ulangi Ujian
                                </button>
                            )}
                        </div>

                        {/* Next Steps */}
                        <div className="bg-white rounded-[24px] p-6 border border-slate-200">
                            <h4 className="font-bold text-slate-900 mb-4">Langkah Selanjutnya</h4>
                            <div className="space-y-3">
                                <Link href="/my-trainings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition group">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-[#005E54] group-hover:text-white transition-colors">
                                        <Home size={18} />
                                    </div>
                                    <div className="text-sm font-bold text-slate-700">Dashboard Utama</div>
                                </Link>
                                <Link href={`/training/${training.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition group">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-[#005E54] group-hover:text-white transition-colors">
                                        <ArrowRight size={18} />
                                    </div>
                                    <div className="text-sm font-bold text-slate-700">Kembali ke Training</div>
                                </Link>
                                {isPassed && (
                                    <Link href="/reports" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition group">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-[#005E54] group-hover:text-white transition-colors">
                                            <TrendingUp size={18} />
                                        </div>
                                        <div className="text-sm font-bold text-slate-700">Lihat Leaderboard</div>
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Achievement (if passed) */}
                        {isPassed && (
                            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-[24px] p-6">
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                                        <Sparkles className="text-amber-600" size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-amber-900">Achievement!</h4>
                                        <p className="text-amber-700 text-xs">
                                            {quiz.type === 'pretest' 
                                                ? 'Pre-Test Master' 
                                                : 'Post-Test Champion'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
            
            <div className="h-20"></div>
        </AppLayout>
    );
}
