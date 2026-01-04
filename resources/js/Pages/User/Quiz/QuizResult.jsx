import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { motion } from 'framer-motion';
import { 
    Trophy, CheckCircle2, XCircle, Clock, Target, 
    Award, ArrowRight, RotateCcw, Home, Star, TrendingUp,
    AlertCircle, BookOpen, Sparkles
} from 'lucide-react';

// Score Circle Component
const ScoreCircle = ({ score, passingScore }) => {
    const isPassed = score >= passingScore;
    const circumference = 2 * Math.PI * 60;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    
    return (
        <div className="relative w-40 h-40">
            <svg className="w-full h-full transform -rotate-90">
                <circle
                    cx="80"
                    cy="80"
                    r="60"
                    stroke="#e2e8f0"
                    strokeWidth="12"
                    fill="none"
                />
                <motion.circle
                    cx="80"
                    cy="80"
                    r="60"
                    stroke={isPassed ? '#10b981' : '#ef4444'}
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    style={{ strokeDasharray: circumference }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className={`text-4xl font-black ${isPassed ? 'text-emerald-600' : 'text-red-600'}`}
                >
                    {score}
                </motion.span>
                <span className="text-sm text-slate-500">dari 100</span>
            </div>
        </div>
    );
};

// Result Card Component
const ResultCard = ({ icon: Icon, label, value, color = 'blue' }) => {
    const colors = {
        blue: 'bg-blue-50 text-blue-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600',
        red: 'bg-red-50 text-red-600',
    };
    
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="text-xl font-bold text-slate-900">{value}</p>
            </div>
        </div>
    );
};

// Question Review Item
const QuestionReview = ({ question, index, userAnswer, isCorrect }) => (
    <div className={`border rounded-xl p-4 ${isCorrect ? 'border-emerald-200 bg-emerald-50/50' : 'border-red-200 bg-red-50/50'}`}>
        <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
            }`}>
                {isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            </div>
            <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 mb-2">
                    {index + 1}. {question.question_text}
                </p>
                <div className="space-y-1 text-sm">
                    <p className={`${isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                        Jawaban Anda: <span className="font-bold">{userAnswer?.toUpperCase() || '-'}</span>
                    </p>
                    {!isCorrect && (
                        <p className="text-emerald-600">
                            Jawaban Benar: <span className="font-bold">{question.correct_answer?.toUpperCase()}</span>
                        </p>
                    )}
                </div>
            </div>
        </div>
    </div>
);

// Main Component
export default function QuizResult({ auth, training = {}, quiz = {}, result = {}, questions = [] }) {
    const user = auth?.user || {};
    const isPassed = result.score >= (quiz.passing_score || 70);
    
    // Calculate stats
    const correctCount = result.correct_count || questions.filter(q => q.is_correct).length;
    const wrongCount = result.wrong_count || (questions.length - correctCount);
    const timeSpent = result.time_spent || '25:30';
    
    return (
        <AppLayout user={user}>
            <Head title={`Hasil ${quiz.type === 'pretest' ? 'Pre-Test' : 'Post-Test'} - ${training.title}`} />

            <div className="max-w-4xl mx-auto">
                {/* Result Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-3xl p-8 text-center mb-8 ${
                        isPassed 
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
                            : 'bg-gradient-to-br from-red-500 to-rose-600'
                    }`}
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                        {isPassed ? (
                            <Trophy className="text-white" size={40} />
                        ) : (
                            <AlertCircle className="text-white" size={40} />
                        )}
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-3xl font-black text-white mb-2"
                    >
                        {isPassed ? 'Selamat! Anda Lulus!' : 'Belum Berhasil'}
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-white/80"
                    >
                        {isPassed 
                            ? 'Anda berhasil menyelesaikan ujian dengan baik.' 
                            : 'Jangan menyerah! Coba lagi untuk hasil yang lebih baik.'}
                    </motion.p>
                </motion.div>

                {/* Score Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl border border-slate-200 p-8 mb-8"
                >
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                        <ScoreCircle score={result.score || 0} passingScore={quiz.passing_score || 70} />
                        
                        <div className="text-center md:text-left">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">
                                {quiz.type === 'pretest' ? 'Pre-Test' : 'Post-Test'} - {training.title}
                            </h2>
                            <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                    isPassed 
                                        ? 'bg-emerald-100 text-emerald-700' 
                                        : 'bg-red-100 text-red-700'
                                }`}>
                                    {isPassed ? 'LULUS' : 'TIDAK LULUS'}
                                </span>
                                <span className="text-sm text-slate-500">
                                    Passing Score: {quiz.passing_score || 70}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                                    <CheckCircle2 className="mx-auto text-emerald-600 mb-1" size={20} />
                                    <p className="text-2xl font-bold text-emerald-600">{correctCount}</p>
                                    <p className="text-xs text-emerald-600">Benar</p>
                                </div>
                                <div className="bg-red-50 rounded-xl p-3 text-center">
                                    <XCircle className="mx-auto text-red-600 mb-1" size={20} />
                                    <p className="text-2xl font-bold text-red-600">{wrongCount}</p>
                                    <p className="text-xs text-red-600">Salah</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                >
                    <ResultCard 
                        icon={Target} 
                        label="Total Soal" 
                        value={questions.length}
                        color="blue"
                    />
                    <ResultCard 
                        icon={CheckCircle2} 
                        label="Jawaban Benar" 
                        value={correctCount}
                        color="emerald"
                    />
                    <ResultCard 
                        icon={Clock} 
                        label="Waktu" 
                        value={timeSpent}
                        color="amber"
                    />
                    <ResultCard 
                        icon={Star} 
                        label="Poin" 
                        value={`+${result.points_earned || result.score * 10}`}
                        color="blue"
                    />
                </motion.div>

                {/* Question Review */}
                {quiz.show_review && questions.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white rounded-2xl border border-slate-200 p-6 mb-8"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-900">Review Jawaban</h3>
                            <span className="text-sm text-slate-500">
                                {correctCount}/{questions.length} benar
                            </span>
                        </div>
                        
                        <div className="space-y-4 max-h-[400px] overflow-y-auto">
                            {questions.map((question, index) => (
                                <QuestionReview 
                                    key={question.id}
                                    question={question}
                                    index={index}
                                    userAnswer={question.user_answer}
                                    isCorrect={question.is_correct}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Action Buttons */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    {!isPassed && quiz.allow_retake && (
                        <button
                            onClick={() => router.visit(`/training/${training.id}/quiz/${quiz.type}`)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition"
                        >
                            <RotateCcw size={20} />
                            Coba Lagi
                        </button>
                    )}
                    
                    <Link
                        href={`/training/${training.id}`}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                    >
                        {isPassed ? (
                            <>
                                <ArrowRight size={20} />
                                Lanjutkan Training
                            </>
                        ) : (
                            <>
                                <BookOpen size={20} />
                                Kembali ke Training
                            </>
                        )}
                    </Link>
                    
                    <Link
                        href="/my-trainings"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition"
                    >
                        <Home size={20} />
                        Training Saya
                    </Link>
                </motion.div>

                {/* Achievement Unlocked */}
                {isPassed && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8 }}
                        className="mt-8 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-6 flex items-center gap-4"
                    >
                        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center">
                            <Sparkles className="text-amber-600" size={32} />
                        </div>
                        <div>
                            <h4 className="font-bold text-amber-900">Achievement Unlocked!</h4>
                            <p className="text-amber-700 text-sm">
                                {quiz.type === 'pretest' 
                                    ? 'Pre-Test Master - Siap untuk memulai pembelajaran!'
                                    : 'Post-Test Champion - Anda telah menguasai materi ini!'}
                            </p>
                        </div>
                        <div className="ml-auto">
                            <Award className="text-amber-500" size={40} />
                        </div>
                    </motion.div>
                )}
            </div>
        </AppLayout>
    );
}
