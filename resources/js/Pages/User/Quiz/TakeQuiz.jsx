import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Clock, ChevronLeft, ChevronRight, AlertCircle, 
    CheckCircle2, Flag, BookmarkPlus, RotateCcw,
    Send, HelpCircle, Timer, X, Menu, Settings, Check
} from 'lucide-react';
import axios from 'axios';
import showToast from '@/Utils/toast';

// --- Wondr Style System ---
const WondrStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F8F9FA; color: #1e293b; }
        
        .wondr-dark { background-color: #002824; }
        .wondr-green { color: #005E54; }
        .wondr-lime { color: #D6F84C; }
        
        .glass-header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        .option-card {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            border: 2px solid #E2E8F0;
        }
        .option-card:hover:not(.selected) {
            border-color: #94A3B8;
            background-color: #F8FAFC;
        }
        .option-card.selected {
            border-color: #005E54;
            background-color: #F0FDF4;
            box-shadow: 0 4px 12px rgba(0, 94, 84, 0.1);
        }

        .question-nav-btn {
            transition: all 0.2s ease;
        }
        .question-nav-btn.active {
            background-color: #002824;
            color: #D6F84C;
            transform: scale(1.1);
            box-shadow: 0 4px 10px rgba(0, 40, 36, 0.2);
        }
        .question-nav-btn.answered {
            background-color: #D1FAE5;
            color: #065F46;
            border: 1px solid #10B981;
        }
        .question-nav-btn.flagged {
            border: 2px solid #F59E0B;
        }

        .animate-enter { animation: enter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        @keyframes enter {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
    `}</style>
);

// Timer Component
const TimerDisplay = ({ duration, onTimeUp }) => {
    const [timeLeft, setTimeLeft] = useState(duration * 60);
    
    useEffect(() => {
        if (timeLeft <= 0) {
            onTimeUp();
            return;
        }
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, onTimeUp]);

    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const isCritical = timeLeft <= 300; // 5 mins

    return (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold border transition-colors ${
            isCritical 
            ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' 
            : 'bg-slate-50 text-slate-700 border-slate-200'
        }`}>
            <Clock size={16} />
            <span>{mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}</span>
        </div>
    );
};



// Submit Confirmation Modal
const SubmitModal = ({ isOpen, onClose, onConfirm, answered, total }) => (
    <AnimatePresence>
        {isOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#002824]/60 backdrop-blur-sm">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl"
                >
                    <div className="p-8 text-center">
                        <div className="w-20 h-20 bg-[#F0FDF4] rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={40} className="text-[#005E54]" />
                        </div>
                        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Kumpulkan Jawaban?</h2>
                        <p className="text-slate-500 mb-8 leading-relaxed">
                            Anda telah menjawab <span className="font-bold text-slate-900">{answered}</span> dari <span className="font-bold text-slate-900">{total}</span> soal. 
                            {answered < total && " Masih ada soal yang belum dijawab."}
                            <br/>Apakah Anda yakin ingin mengakhiri sesi ini?
                        </p>
                        
                        <div className="flex gap-3">
                            <button 
                                onClick={onClose}
                                className="flex-1 py-4 font-bold text-slate-600 bg-slate-50 rounded-2xl hover:bg-slate-100 transition"
                            >
                                Periksa Lagi
                            </button>
                            <button 
                                onClick={onConfirm}
                                className="flex-1 py-4 font-bold text-[#002824] bg-[#D6F84C] rounded-2xl hover:bg-[#c2e43c] transition shadow-lg"
                            >
                                Ya, Kumpulkan
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
    </AnimatePresence>
);

// Image Zoom Modal for viewing question images fullscreen
const ImageZoomModal = ({ src, onClose }) => (
    <AnimatePresence>
        {src && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={onClose}>
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative max-w-5xl w-full max-h-screen p-2"
                >
                    <button onClick={onClose} className="absolute -top-12 right-0 text-white p-2 hover:bg-white/20 rounded-full transition">
                        <X size={24} />
                    </button>
                    <img 
                        src={src} 
                        alt="Zoomed Question" 
                        className="w-full h-full max-h-[85vh] object-contain rounded-lg"
                    />
                </motion.div>
            </div>
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
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [zoomedImage, setZoomedImage] = useState(null);
    const [failedImages, setFailedImages] = useState(new Set()); // Track images that failed to load
    
    const totalQuestions = questions.length;
    const currentQuestion = questions[currentIndex];
    const answeredCount = Object.keys(answers).length;
    const progress = Math.round((answeredCount / totalQuestions) * 100);

    // Storage key for persisting answers
    const storageKey = `quiz_answers_${examAttempt.id}`;
    const flaggedStorageKey = `quiz_flagged_${examAttempt.id}`;

    // Load answers from localStorage on mount
    useEffect(() => {
        try {
            const savedAnswers = localStorage.getItem(storageKey);
            const savedFlagged = localStorage.getItem(flaggedStorageKey);
            
            if (savedAnswers) {
                setAnswers(JSON.parse(savedAnswers));
            }
            if (savedFlagged) {
                setFlagged(JSON.parse(savedFlagged));
            }
        } catch (error) {
            console.error('Error loading saved answers:', error);
        }
    }, [storageKey, flaggedStorageKey]);

    // Auto-save answers to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(answers));
        } catch (error) {
            console.error('Error saving answers:', error);
        }
    }, [answers, storageKey]);

    // Auto-save flagged questions to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(flaggedStorageKey, JSON.stringify(flagged));
        } catch (error) {
            console.error('Error saving flagged questions:', error);
        }
    }, [flagged, flaggedStorageKey]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
            if (['a', 'b', 'c', 'd', 'A', 'B', 'C', 'D'].includes(e.key)) {
                handleAnswer(e.key.toLowerCase());
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex]);

    // Handle answer selection
    const handleAnswer = (answer) => {
        setAnswers(prev => ({
            ...prev,
            [currentIndex]: answer
        }));
    };

    // Debugging: log current question and normalized options to console to aid debugging
    useEffect(() => {
        try {
            const opts = (() => {
                let o = currentQuestion?.options || [];
                if (!o) return [];
                if (typeof o === 'string') {
                    try { o = JSON.parse(o); } catch (e) { return []; }
                }
                if (!o) return [];
                if (Array.isArray(o)) return o;
                // object -> entries
                return Object.entries(o).map(([k, v]) => ({ label: k, text: (typeof v === 'string' ? v : (v?.text || v?.value || '')) }));
            })();
            // eslint-disable-next-line no-console
            console.debug('TakeQuiz currentQuestion', { id: currentQuestion?.id, optionsRaw: currentQuestion?.options, normalizedOptions: opts });
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error('TakeQuiz debug error', e);
        }
    }, [currentQuestion]);

    // Normalize options with useMemo (performance)
    const normalizedOptions = useMemo(() => {
        let raw = currentQuestion?.options ?? [];
        if (typeof raw === 'string') {
            try { raw = JSON.parse(raw); } catch (e) { raw = []; }
        }
        const out = [];

        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
            Object.entries(raw).forEach(([k, v]) => {
                if (!v) return;
                if (typeof v === 'string') out.push({ label: k, text: v });
                else if (v && typeof v === 'object') {
                    const text = v.text || v.value || v.content || (v[0] ?? null);
                    const label = v.label || k;
                    if (text) out.push({ label, text });
                }
            });
            return out;
        }

        if (Array.isArray(raw) && raw.length > 0) {
            if (raw.every(x => typeof x === 'string')) {
                const labels = ['a','b','c','d','e','f'];
                raw.forEach((txt,i) => out.push({ label: labels[i]||String(i), text: txt }));
                return out;
            }
            const labels = ['a','b','c','d','e','f'];
            raw.forEach((item,i) => {
                if (!item) return;
                if (typeof item === 'string') out.push({ label: labels[i]||String(i), text: item });
                else {
                    const text = item.text || item.value || item.content || item[0] || null;
                    const label = (item.label || labels[i] || (item.key && item.key.toString()) || String(i)).toString();
                    if (text) out.push({ label, text });
                }
            });
            return out;
        }

        // Legacy fallback
        ['a','b','c','d'].forEach(f => {
            const key = `option_${f}`;
            if (currentQuestion && currentQuestion[key]) out.push({ label: f, text: currentQuestion[key] });
        });

        return out;
    }, [currentQuestion]);

    // Handle flag toggle
    const toggleFlag = () => {
        setFlagged(prev => 
            prev.includes(currentIndex)
                ? prev.filter(i => i !== currentIndex)
                : [...prev, currentIndex]
        );
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

    // Submit quiz with retry logic
    const handleSubmit = async () => {
        const maxRetries = 2; // total attempts = maxRetries + 1
        const formattedAnswers = Object.entries(answers).map(([index, answer]) => ({
            question_id: questions[parseInt(index)].id,
            answer: answer
        }));

        setShowSubmitModal(false);
        setLoading(true);

        const submitAttempt = async (attempt = 0) => {
            try {
                const response = await axios.post(`/api/quiz/${examAttempt.id}/submit`, {
                    answers: formattedAnswers
                });

                // Clear saved answers from localStorage after successful submit
                try {
                    localStorage.removeItem(storageKey);
                    localStorage.removeItem(flaggedStorageKey);
                } catch (error) {
                    console.error('Error clearing saved answers:', error);
                }

                // Redirect to result page
                router.visit(`/training/${training.id}/quiz/${quiz.type}/result/${response.data.attempt_id || examAttempt.id}`);
                return true;
            } catch (error) {
                console.error(`Submit attempt ${attempt + 1} failed:`, error);

                // If client error (4xx) other than 429, don't retry
                const status = error?.response?.status;
                const serverMsg = error?.response?.data?.message || 'Gagal mengirim jawaban.';

                if (status === 401) {
                    // Redirect to login
                    window.location.href = '/login';
                    return false;
                }

                if (status && status >= 400 && status < 500 && status !== 429) {
                    showToast(serverMsg + ' Silakan periksa jawaban Anda.', 'error');
                    return false;
                }

                if (attempt < maxRetries) {
                    const nextAttempt = attempt + 1;
                    const backoff = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
                    showToast(`${serverMsg} Mencoba ulang (${nextAttempt}/${maxRetries + 1})...`, 'warning');
                    await new Promise(res => setTimeout(res, backoff));
                    return submitAttempt(nextAttempt);
                }

                // Exhausted retries
                showToast(serverMsg + ' Gagal setelah beberapa percobaan. Silakan coba lagi nanti.', 'error');
                return false;
            }
        };

        try {
            await submitAttempt(0);
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
        <div className="min-h-screen bg-[#F8F9FA] font-sans flex flex-col">
            <WondrStyles />
            <Head title={`${quiz.type === 'pretest' ? 'Pre-Test' : 'Post-Test'} - ${training.title}`} />

            {/* --- Auto-Save Notification --- */}
            <div className="bg-green-50 border-b border-green-200 px-6 py-2">
                <div className="max-w-[1400px] mx-auto flex items-center gap-2 text-xs text-green-700 font-medium">
                    <CheckCircle2 size={14} />
                    <span>Jawaban Anda disimpan otomatis 💾</span>
                </div>
            </div>

            {/* --- Top Bar (Sticky) --- */}
            <header className="glass-header sticky top-0 z-40 px-6 py-4">
                <div className="max-w-[1400px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#002824] rounded-xl flex items-center justify-center text-[#D6F84C] font-bold shadow-lg">
                            W
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-slate-900 hidden md:block">{training.title}</h1>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                                {quiz.type === 'pretest' ? 'Pre-Test' : 'Final Exam'}
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 mx-8 hidden md:block">
                        <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                            <span>Progress</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className="h-full bg-[#005E54] rounded-full"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <TimerDisplay duration={quiz.duration || 30} onTimeUp={handleTimeUp} />
                        <button 
                            onClick={() => setShowSubmitModal(true)}
                            className="px-5 py-2 bg-[#005E54] hover:bg-[#00403a] text-white rounded-xl font-bold text-sm transition shadow-lg shadow-[#005E54]/20"
                        >
                            Selesai
                        </button>
                        <button 
                            className="md:hidden p-2 bg-slate-100 rounded-lg"
                            onClick={() => setSidebarOpen(!isSidebarOpen)}
                        >
                            <Menu size={20} />
                        </button>
                    </div>
                </div>
            </header>

            {/* --- Main Content --- */}
            <main className="flex-1 max-w-[1400px] w-full mx-auto p-4 md:p-6 lg:p-8 flex gap-8">
                
                {/* Left Column: Question Area */}
                <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white rounded-[32px] p-6 md:p-10 shadow-sm border border-slate-200 flex-1 flex flex-col"
                        >
                            {/* Question Header */}
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <span className="text-slate-400 font-bold text-sm uppercase tracking-widest">
                                        Pertanyaan {currentIndex + 1} <span className="text-slate-300">/ {totalQuestions}</span>
                                    </span>
                                    <div className="flex gap-2 mt-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                            currentQuestion.difficulty === 'hard' ? 'bg-red-100 text-red-600' : 
                                            currentQuestion.difficulty === 'medium' ? 'bg-amber-100 text-amber-600' : 
                                            'bg-green-100 text-green-600'
                                        }`}>
                                            {currentQuestion.difficulty}
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                                            {currentQuestion.points || 10} Poin
                                        </span>
                                    </div>
                                </div>
                                <button 
                                    onClick={toggleFlag}
                                    className={`p-3 rounded-full transition-all ${
                                        flagged.includes(currentIndex) 
                                        ? 'bg-amber-100 text-amber-600' 
                                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                    }`}
                                >
                                    <Flag size={20} fill={flagged.includes(currentIndex) ? "currentColor" : "none"} />
                                </button>
                            </div>

                            {/* Question Body */}
                            <div className="mb-8">
                                <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-relaxed">
                                    {currentQuestion.question_text}
                                </h2>
                                {currentQuestion.image_url && !failedImages.has(currentIndex) && (
                                    <div className="mt-6 group relative">
                                        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            Klik untuk memperbesar
                                        </div>
                                        <img 
                                            src={currentQuestion.image_url} 
                                            alt="Question" 
                                            loading="lazy"
                                            onClick={() => setZoomedImage(currentQuestion.image_url)}
                                            onError={(e) => {
                                                console.warn('Failed to load question image:', currentQuestion.image_url);
                                                // Mark this image as failed
                                                setFailedImages(prev => new Set([...prev, currentIndex]));
                                                // Hide the image element gracefully
                                                e.currentTarget.style.display = 'none';
                                            }}
                                            className="rounded-2xl max-h-96 w-full object-contain bg-slate-50 border border-slate-200 cursor-zoom-in hover:border-slate-300 transition-colors"
                                        />
                                    </div>
                                )} 
                            </div>

                            {/* Options */}
                            <div className="space-y-3 mb-8">
                                {normalizedOptions.length === 0 ? (
                                    <div className="text-sm text-slate-500 italic">Opsi jawaban belum tersedia untuk soal ini.</div>
                                ) : (
                                    normalizedOptions.map((o, idx) => {
                                        const label = (o.label || String.fromCharCode(97 + idx)).toString();
                                        const isSelected = answers[currentIndex] === label;
                                        return (
                                            <button
                                                key={label}
                                                onClick={() => handleAnswer(label)}
                                                className={`option-card w-full p-5 rounded-2xl flex items-center gap-4 text-left group ${isSelected ? 'selected' : ''}`}
                                            >
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                                                    isSelected 
                                                    ? 'bg-[#005E54] text-white shadow-lg' 
                                                    : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                                                }`}>
                                                    {label.toUpperCase()}
                                                </div>
                                                <span className={`font-medium text-lg ${isSelected ? 'text-[#005E54]' : 'text-slate-700'}`}>
                                                    {o.text}
                                                </span>
                                                {isSelected && (
                                                    <CheckCircle2 className="ml-auto text-[#005E54]" size={24} />
                                                )}
                                            </button>
                                        );
                                    })
                                )} 
                            </div>

                        </motion.div>
                    </AnimatePresence>

                    {/* Bottom Navigation */}
                    <div className="flex justify-between items-center mt-8">
                        <button 
                            onClick={handlePrev}
                            disabled={currentIndex === 0}
                            className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                        >
                            <ChevronLeft size={20} /> Sebelumnya
                        </button>
                        
                        <span className="md:hidden text-sm font-bold text-slate-500">
                            {currentIndex + 1} / {totalQuestions}
                        </span>

                        <button 
                            onClick={handleNext}
                            disabled={currentIndex === totalQuestions - 1}
                            className="px-6 py-3 bg-[#002824] text-white font-bold rounded-xl hover:bg-[#00403a] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 shadow-lg"
                        >
                            Selanjutnya <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Right Column: Question Map (Sidebar) */}
                <div className={`fixed inset-y-0 right-0 w-80 bg-white shadow-2xl transform transition-transform duration-300 z-50 md:relative md:transform-none md:w-80 md:bg-transparent md:shadow-none flex-shrink-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
                    <div className="h-full md:h-auto md:sticky md:top-24 bg-white rounded-[32px] border border-slate-200 p-6 flex flex-col">
                        <div className="flex justify-between items-center mb-6 md:hidden">
                            <h3 className="font-bold text-lg">Daftar Soal</h3>
                            <button onClick={() => setSidebarOpen(false)}><X size={24}/></button>
                        </div>
                        
                        <h3 className="font-bold text-slate-900 mb-4 hidden md:block">Navigasi Soal</h3>
                        
                        <div className="grid grid-cols-5 gap-2 mb-6">
                            {questions.map((_, idx) => {
                                const isAnswered = answers[idx] !== undefined;
                                const isFlagged = flagged.includes(idx);
                                const isCurrent = currentIndex === idx;
                                
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setCurrentIndex(idx);
                                            setSidebarOpen(false);
                                        }}
                                        className={`question-nav-btn w-10 h-10 rounded-xl font-bold text-sm flex items-center justify-center relative ${
                                            isCurrent ? 'active' : 
                                            isFlagged ? 'flagged bg-amber-50 text-amber-600' :
                                            isAnswered ? 'answered' : 
                                            'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                        }`}
                                    >
                                        {idx + 1}
                                        {isFlagged && <div className="absolute top-0 right-0 w-2 h-2 bg-amber-500 rounded-full border border-white" />}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-auto md:mt-0 space-y-3 text-xs font-bold text-slate-500">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-[#002824] rounded-full"></div> Sedang Dikerjakan
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-emerald-100 border border-emerald-500 rounded-full"></div> Sudah Dijawab
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-amber-100 border border-amber-500 rounded-full"></div> Ragu-ragu
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-slate-100 rounded-full"></div> Belum Dijawab
                            </div>
                        </div>

                        <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                            <div className="flex gap-3">
                                <HelpCircle className="text-blue-600 shrink-0" size={20} />
                                <div>
                                    <p className="text-xs font-bold text-blue-800 mb-1">Bantuan Pintasan</p>
                                    <p className="text-[10px] text-blue-600 leading-relaxed">
                                        Gunakan panah ⬅️ ➡️ keyboard untuk navigasi, dan A/B/C/D untuk memilih jawaban.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                    <div className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={() => setSidebarOpen(false)}></div>
                )}
            </main>

            <SubmitModal 
                isOpen={showSubmitModal} 
                onClose={() => setShowSubmitModal(false)} 
                onConfirm={handleSubmit}
                answered={answeredCount}
                total={totalQuestions}
            />

            <ImageZoomModal 
                src={zoomedImage} 
                onClose={() => setZoomedImage(null)} 
            />
        </div>
    );
}
