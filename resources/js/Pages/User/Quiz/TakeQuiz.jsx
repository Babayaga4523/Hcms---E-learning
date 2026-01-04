import React, { useState, useEffect, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Clock, ChevronLeft, ChevronRight, AlertCircle, 
    CheckCircle2, Flag, BookmarkPlus, RotateCcw,
    Send, HelpCircle, Timer, X
} from 'lucide-react';
import axios from 'axios';

// Timer Component
const QuizTimer = ({ duration, onTimeUp }) => {
    const [timeLeft, setTimeLeft] = useState(duration * 60); // Convert minutes to seconds
    
    useEffect(() => {
        if (timeLeft <= 0) {
            onTimeUp();
            return;
        }
        
        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        
        return () => clearInterval(timer);
    }, [timeLeft, onTimeUp]);
    
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    
    const isWarning = timeLeft <= 60;
    const isCritical = timeLeft <= 30;
    
    return (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold ${
            isCritical 
                ? 'bg-red-100 text-red-600 animate-pulse' 
                : isWarning 
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-slate-100 text-slate-700'
        }`}>
            <Timer size={18} />
            <span className="text-lg">{formatTime(timeLeft)}</span>
        </div>
    );
};

// Question Navigation
const QuestionNav = ({ questions, currentIndex, answers, flagged, onNavigate }) => (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <h3 className="font-bold text-slate-900 mb-4">Navigasi Soal</h3>
        <div className="grid grid-cols-5 gap-2">
            {questions.map((_, index) => {
                const isAnswered = answers[index] !== undefined;
                const isFlagged = flagged.includes(index);
                const isCurrent = index === currentIndex;
                
                return (
                    <button
                        key={index}
                        onClick={() => onNavigate(index)}
                        className={`relative w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                            isCurrent
                                ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                                : isAnswered
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        {index + 1}
                        {isFlagged && (
                            <Flag className="absolute -top-1 -right-1 text-amber-500" size={12} fill="currentColor" />
                        )}
                    </button>
                );
            })}
        </div>
        
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-emerald-100 rounded" />
                <span>Dijawab</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-slate-100 rounded" />
                <span>Belum</span>
            </div>
            <div className="flex items-center gap-2">
                <Flag className="text-amber-500" size={12} fill="currentColor" />
                <span>Ditandai</span>
            </div>
        </div>
    </div>
);

// Question Card Component
const QuestionCard = ({ question, index, total, answer, onAnswer, isFlagged, onToggleFlag }) => {
    const options = [
        { key: 'a', value: question.option_a },
        { key: 'b', value: question.option_b },
        { key: 'c', value: question.option_c },
        { key: 'd', value: question.option_d },
    ].filter(opt => opt.value);
    
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8"
        >
            {/* Question Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <span className="text-sm text-slate-500 font-medium">Soal {index + 1} dari {total}</span>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 text-xs font-bold rounded ${
                            question.difficulty === 'hard' 
                                ? 'bg-red-100 text-red-600'
                                : question.difficulty === 'medium'
                                    ? 'bg-amber-100 text-amber-600'
                                    : 'bg-emerald-100 text-emerald-600'
                        }`}>
                            {question.difficulty === 'hard' ? 'Sulit' : question.difficulty === 'medium' ? 'Sedang' : 'Mudah'}
                        </span>
                        <span className="text-xs text-slate-400">{question.points || 10} poin</span>
                    </div>
                </div>
                <button
                    onClick={onToggleFlag}
                    className={`p-2 rounded-lg transition ${
                        isFlagged 
                            ? 'bg-amber-100 text-amber-600' 
                            : 'bg-slate-100 text-slate-400 hover:text-amber-500'
                    }`}
                    title={isFlagged ? 'Hapus tanda' : 'Tandai untuk review'}
                >
                    <Flag size={18} fill={isFlagged ? 'currentColor' : 'none'} />
                </button>
            </div>
            
            {/* Question Text */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900 leading-relaxed">
                    {question.question_text}
                </h2>
                {question.image_url && (
                    <img 
                        src={question.image_url} 
                        alt="Question" 
                        className="mt-4 rounded-xl max-h-64 object-contain"
                    />
                )}
            </div>
            
            {/* Options */}
            <div className="space-y-3">
                {options.map((option) => (
                    <button
                        key={option.key}
                        onClick={() => onAnswer(option.key)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                            answer === option.key
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                            answer === option.key
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                        }`}>
                            {option.key.toUpperCase()}
                        </div>
                        <span className={`font-medium ${answer === option.key ? 'text-blue-900' : 'text-slate-700'}`}>
                            {option.value}
                        </span>
                    </button>
                ))}
            </div>
        </motion.div>
    );
};

// Submit Confirmation Modal
const SubmitModal = ({ isOpen, onClose, onConfirm, answeredCount, totalCount, loading }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-3xl w-full max-w-md p-8 text-center"
                >
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Send className="text-blue-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Submit Jawaban?</h2>
                    <p className="text-slate-500 mb-4">
                        Anda akan mengakhiri ujian ini. Pastikan semua jawaban sudah benar.
                    </p>
                    
                    <div className="bg-slate-50 rounded-xl p-4 mb-6">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Soal Dijawab</span>
                            <span className="font-bold text-slate-900">{answeredCount}/{totalCount}</span>
                        </div>
                        {answeredCount < totalCount && (
                            <p className="text-amber-600 text-xs mt-2 flex items-center gap-1">
                                <AlertCircle size={12} />
                                {totalCount - answeredCount} soal belum dijawab
                            </p>
                        )}
                    </div>
                    
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition"
                        >
                            Kembali
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                            ) : (
                                <>
                                    <Send size={18} />
                                    Submit
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

// Main Component
export default function TakeQuiz({ auth, training = {}, quiz = {}, questions = [], examAttempt = {} }) {
    const user = auth?.user || {};
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [flagged, setFlagged] = useState([]);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const totalQuestions = questions.length;
    const currentQuestion = questions[currentIndex];
    const answeredCount = Object.keys(answers).length;

    // Handle answer selection
    const handleAnswer = (answer) => {
        setAnswers(prev => ({
            ...prev,
            [currentIndex]: answer
        }));
    };

    // Handle flag toggle
    const handleToggleFlag = () => {
        setFlagged(prev => 
            prev.includes(currentIndex)
                ? prev.filter(i => i !== currentIndex)
                : [...prev, currentIndex]
        );
    };

    // Navigate to question
    const handleNavigate = (index) => {
        setCurrentIndex(index);
    };

    // Navigate next/prev
    const handleNext = () => {
        if (currentIndex < totalQuestions - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    // Time up handler
    const handleTimeUp = useCallback(() => {
        setShowSubmitModal(true);
    }, []);

    // Submit quiz
    const handleSubmit = async () => {
        try {
            setLoading(true);
            
            // Format answers for API
            const formattedAnswers = Object.entries(answers).map(([index, answer]) => ({
                question_id: questions[parseInt(index)].id,
                answer: answer
            }));
            
            const response = await axios.post(`/api/quiz/${examAttempt.id}/submit`, {
                answers: formattedAnswers
            });
            
            // Redirect to result page
            router.visit(`/training/${training.id}/quiz/${quiz.type}/result/${response.data.attempt_id || examAttempt.id}`);
        } catch (error) {
            console.error('Failed to submit quiz:', error);
            alert('Gagal mengirim jawaban. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    if (!currentQuestion) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Tidak ada soal</h2>
                    <p className="text-slate-500">Quiz ini belum memiliki soal.</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head title={`${quiz.type === 'pretest' ? 'Pre-Test' : 'Post-Test'} - ${training.title}`} />
            
            <div className="min-h-screen bg-slate-50">
                {/* Header */}
                <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
                    <div className="max-w-6xl mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">{training.title}</p>
                                <h1 className="text-lg font-bold text-slate-900">
                                    {quiz.type === 'pretest' ? 'Pre-Test' : 'Post-Test'}
                                </h1>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <QuizTimer 
                                    duration={quiz.duration || 30} 
                                    onTimeUp={handleTimeUp}
                                />
                                <button
                                    onClick={() => setShowSubmitModal(true)}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition flex items-center gap-2"
                                >
                                    <Send size={16} />
                                    Submit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-3 space-y-6">
                            <AnimatePresence mode="wait">
                                <QuestionCard
                                    key={currentIndex}
                                    question={currentQuestion}
                                    index={currentIndex}
                                    total={totalQuestions}
                                    answer={answers[currentIndex]}
                                    onAnswer={handleAnswer}
                                    isFlagged={flagged.includes(currentIndex)}
                                    onToggleFlag={handleToggleFlag}
                                />
                            </AnimatePresence>

                            {/* Navigation Buttons */}
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={handlePrev}
                                    disabled={currentIndex === 0}
                                    className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                >
                                    <ChevronLeft size={20} />
                                    Sebelumnya
                                </button>
                                
                                <span className="text-sm text-slate-500 font-medium">
                                    {answeredCount} dari {totalQuestions} dijawab
                                </span>
                                
                                <button
                                    onClick={handleNext}
                                    disabled={currentIndex === totalQuestions - 1}
                                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                >
                                    Selanjutnya
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-24">
                                <QuestionNav
                                    questions={questions}
                                    currentIndex={currentIndex}
                                    answers={answers}
                                    flagged={flagged}
                                    onNavigate={handleNavigate}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Submit Modal */}
            <SubmitModal
                isOpen={showSubmitModal}
                onClose={() => setShowSubmitModal(false)}
                onConfirm={handleSubmit}
                answeredCount={answeredCount}
                totalCount={totalQuestions}
                loading={loading}
            />
        </>
    );
}
