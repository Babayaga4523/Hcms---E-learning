import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { extractData } from '@/Utilities/apiResponseHandler';
import ErrorBoundary from '@/Components/ErrorBoundary';
import { validateTraining } from '@/Utils/validators';
import axiosInstance from '@/Services/axiosInstance';
import { API_ENDPOINTS } from '@/Config/api';
import { getErrorMessage, isRetryableError, getRetryDelay, getMaxRetries, logError } from '@/Utils/errorHandler';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BookOpen, Clock, Award, PlayCircle, CheckCircle2, 
    FileText, Video, Download, ChevronRight, Lock,
    ArrowLeft, Target, Users, Calendar, Timer, Star,
    AlertCircle, Play, Pause, RotateCcw, Zap, Share2
} from 'lucide-react';
import showToast from '@/Utils/toast';

// --- Wondr Style System ---
const WondrStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        
        .wondr-dark { background-color: #002824; }
        .wondr-green { color: #005E54; }
        .wondr-lime-bg { background-color: #D6F84C; color: #002824; }
        .wondr-lime-text { color: #D6F84C; }
        
        .glass-panel {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.6);
            box-shadow: 0 10px 40px -10px rgba(0, 40, 36, 0.05);
        }

        .material-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid transparent;
        }
        .material-card:hover:not(:disabled) {
            transform: translateX(4px);
            background-color: #F0FDF4;
            border-color: #005E54;
        }
        
        .hero-pattern {
            background-color: #002824;
            background-image: radial-gradient(#005E54 1px, transparent 1px);
            background-size: 24px 24px;
        }

        .animate-enter { animation: enter 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        @keyframes enter {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `}</style>
);

// Material Row Component
const MaterialRow = ({ material, index, isLocked, isActive, onStart }) => {
    const Icon = material.type === 'video' ? Video : FileText;
    
    return (
        <button
            onClick={() => !isLocked && onStart(material)}
            disabled={isLocked}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl material-card group text-left ${
                isActive ? 'bg-[#F0FDF4] border-[#005E54] ring-1 ring-[#005E54]' : 'bg-white border-slate-100'
            } ${isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                material.is_completed ? 'bg-[#005E54] text-[#D6F84C]' : 
                isActive ? 'bg-[#D6F84C] text-[#002824]' : 
                isLocked ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'
            }`}>
                {material.is_completed ? <CheckCircle2 size={20} /> : isLocked ? <Lock size={18} /> : <Icon size={20} />}
            </div>
            
            <div className="flex-1 min-w-0">
                <h4 className={`font-bold text-sm mb-1 ${isActive ? 'text-[#005E54]' : 'text-slate-900'}`}>
                    {index + 1}. {material.title}
                </h4>
                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1"><Clock size={12} /> {material.duration} min</span>
                    <span className="capitalize px-2 py-0.5 bg-slate-100 rounded text-[10px]">{material.type}</span>
                </div>
            </div>

            {!isLocked && (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isActive ? 'bg-[#005E54] text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-[#D6F84C] group-hover:text-[#002824]'
                }`}>
                    <Play size={14} fill="currentColor" />
                </div>
            )}
        </button>
    );
};

// Quiz Section Component
const QuizSection = ({ type, quiz, training, onStart }) => {
    const isPassed = quiz?.is_passed;
    const score = quiz?.score || quiz?.percentage || 0;
    const attempts = quiz?.attempts || 0;
    const hasAttempted = attempts > 0 || score > 0;
    
    // Format last attempted date
    const lastAttemptedDate = quiz?.last_attempted_at 
        ? new Date(quiz.last_attempted_at).toLocaleDateString('id-ID', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : null;
    
    return (
        <div className="bg-gradient-to-br from-[#002824] to-[#00403a] rounded-[32px] p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <Award size={120} />
            </div>
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            isPassed ? 'bg-[#D6F84C] text-[#002824]' : 'bg-white/10'
                        }`}>
                            <Target size={24} />
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D6F84C]/20 text-[#D6F84C] rounded-lg text-xs font-bold uppercase mb-2 border border-[#D6F84C]/20">
                                <Target size={14} /> {type === 'pretest' ? 'Pre-Test' : 'Post-Test'}
                            </div>
                            <h3 className="font-bold text-xl">
                                {type === 'pretest' ? 'Tes Awal' : 'Ujian Akhir'}
                            </h3>
                            <p className="text-blue-100 text-sm mt-1">
                                {type === 'pretest' 
                                    ? 'Ukur pemahaman awal Anda'
                                    : 'Evaluasi pembelajaran akhir'}
                            </p>
                        </div>
                    </div>
                    
                    {hasAttempted && (
                        <div className="text-right">
                            <p className={`text-3xl font-black ${isPassed ? 'text-[#D6F84C]' : 'text-red-400'}`}>
                                {score}%
                            </p>
                            <p className={`text-xs font-bold ${isPassed ? 'text-[#D6F84C]' : 'text-red-400'}`}>
                                {isPassed ? 'LULUS' : 'BELUM LULUS'}
                            </p>
                        </div>
                    )}
                </div>
                
                {/* Quiz Info Row */}
                <div className="flex items-center gap-4 mb-6 text-sm text-blue-100 flex-wrap">
                    <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {quiz?.duration || 30} menit
                    </span>
                    <span className="flex items-center gap-1">
                        <FileText size={14} />
                        {quiz?.questions_count || 5} soal
                    </span>
                    {attempts > 0 && (
                        <span className="flex items-center gap-1">
                            <RotateCcw size={14} />
                            {attempts} {attempts === 1 ? 'percobaan' : 'percobaan'}
                        </span>
                    )}
                </div>

                {/* Last Attempted Info */}
                {lastAttemptedDate && (
                    <div className="mb-6 text-xs text-blue-200 flex items-center gap-2">
                        <Clock size={12} />
                        Percobaan terakhir: {lastAttemptedDate}
                    </div>
                )}
                
                <button
                    onClick={() => {
                        if (isPassed && quiz?.attempt_id) {
                            // If user passed and we have an attempt id, go directly to result page
                            router.visit(`/training/${training.id}/quiz/${type}/result/${quiz.attempt_id}`);
                        } else {
                            onStart(type);
                        }
                    }}
                    className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                        isPassed
                            ? 'bg-white/10 text-white hover:bg-white/20'
                            : 'bg-[#D6F84C] text-[#002824] hover:bg-[#c2e43c] shadow-xl'
                    }`}
                >
                    {isPassed ? (
                        <>
                            <CheckCircle2 size={18} />
                            Lihat Hasil ({score}%)
                        </>
                    ) : hasAttempted ? (
                        <>
                            <RotateCcw size={18} />
                            Coba Lagi (Nilai: {score}%)
                        </>
                    ) : (
                        <>
                            <PlayCircle size={18} />
                            Mulai {type === 'pretest' ? 'Pre-Test' : 'Post-Test'}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

// Main Component
export default function TrainingDetail({ auth, training: initialTraining, enrollment: initialEnrollment, progress: initialProgress, comprehensiveProgress: initialComprehensiveProgress, quizAttempts: initialQuizAttempts, completedMaterials: initialCompletedMaterials, certificateEligible = false, certificateRequirements = {} }) {
    // Use comprehensive progress for display (materials 40% + pretest 30% + posttest 30%)
    // This ensures consistent progress calculation across all pages
    const displayProgress = initialComprehensiveProgress?.total_progress || 0;
    const user = auth?.user || {};
    const [training, setTraining] = useState(initialTraining || {});
    const [comprehensiveProgress, setComprehensiveProgress] = useState(initialComprehensiveProgress || null);
    const [materials, setMaterials] = useState([]);
    const [pretest, setPretest] = useState(null);
    const [posttest, setPosttest] = useState(null);
    const [currentMaterial, setCurrentMaterial] = useState(null);
    const [activeTab, setActiveTab] = useState('curriculum');
    const [loading, setLoading] = useState(!initialTraining);
    const [error, setError] = useState(null);
    const trainingId = training?.id || initialTraining?.id;
    
    // Store comprehensive progress in window for easy access
    useEffect(() => {
        if (comprehensiveProgress) {
            window.comprehensiveProgress = comprehensiveProgress;
        }
    }, [comprehensiveProgress]);
    
    // Load training data on mount
    useEffect(() => {
        if (initialTraining) {
            // Use props data if available
            setupInitialData();
        } else {
            // Fallback to API call if no props
            loadTrainingData();
        }
    }, []);
    
    const setupInitialData = async () => {
        try {
            setLoading(true);
            
            // Validate training data before transformation
            if (!initialTraining || typeof initialTraining !== 'object') {
                throw new Error('Training data is invalid or missing');
            }
            
            // Transform training data from props with safety checks
            const validatedTraining = validateTraining(initialTraining);
            
            const transformedTraining = {
                id: validatedTraining.id,
                title: validatedTraining.title,
                description: validatedTraining.description,
                full_description: validatedTraining.full_description,
                category: validatedTraining.category,
                is_mandatory: initialTraining.is_mandatory || false,
                status: initialEnrollment?.status || 'not_started',
                progress: initialProgress?.progress_percentage || 0,
                duration: initialTraining.duration_minutes || initialTraining.duration || 0,
                due_date: initialTraining.expiry_date || initialTraining.end_date,
                enrolled_count: initialTraining.enrollments_count || 0,
                materials_count: validatedTraining.materials_count,
                objectives: validatedTraining.objectives,
                requirements: validatedTraining.requirements,
                instructor: validatedTraining.instructor,
                certification_available: initialTraining.certificate_template ? true : false
            };
            
            setTraining(transformedTraining);
            
            // Set quiz data from props - show quiz even if not completed
            // Check if pretest exists in quizAttempts (quiz available for this training)
            if (initialQuizAttempts?.pretest) {
                setPretest({
                    is_passed: initialQuizAttempts.pretest.is_passed || false,
                    score: initialQuizAttempts.pretest.score || 0,
                    percentage: initialQuizAttempts.pretest.percentage || 0,
                    attempt_id: initialQuizAttempts.pretest.attempt_id || null,
                    attempts: initialQuizAttempts.pretest.attempts_count || 0,  // Use attempts_count from backend
                    duration: initialQuizAttempts.pretest.duration || 30,  // Use duration from backend
                    questions_count: initialQuizAttempts.pretest.questions_count || 5,  // Use questions_count from backend
                    last_attempted_at: initialQuizAttempts.pretest.last_attempted_at || null
                });
            }
            
            // Check if posttest exists in quizAttempts (quiz available for this training)
            if (initialQuizAttempts?.posttest) {
                setPosttest({
                    is_passed: initialQuizAttempts.posttest.is_passed || false,
                    score: initialQuizAttempts.posttest.score || 0,
                    percentage: initialQuizAttempts.posttest.percentage || 0,
                    attempt_id: initialQuizAttempts.posttest.attempt_id || null,
                    attempts: initialQuizAttempts.posttest.attempts_count || 0,  // Use attempts_count from backend
                    duration: initialQuizAttempts.posttest.duration || 30,  // Use duration from backend
                    questions_count: initialQuizAttempts.posttest.questions_count || 5,  // Use questions_count from backend
                    last_attempted_at: initialQuizAttempts.posttest.last_attempted_at || null
                });
            }
            
            // Load materials - validatedTraining.id is now guaranteed safe
            try {
                const materialsRes = await axiosInstance.get(API_ENDPOINTS.TRAINING_MATERIALS(validatedTraining.id));
                const transformedMaterials = materialsRes.data.materials.map(m => ({
                    id: m.id,
                    title: m.title,
                    type: m.type,
                    duration: m.duration,
                    is_completed: initialCompletedMaterials.includes(m.id),
                    module_title: m.module_title
                }));
                
                setMaterials(transformedMaterials);
            } catch (materialError) {
                // Handle missing API endpoint gracefully
                if (materialError.response?.status === 404) {
                    console.warn('Materials API endpoint not found, using fallback materials from training data');
                    // Try to extract materials from initialTraining if available
                    if (initialTraining?.materials && Array.isArray(initialTraining.materials)) {
                        const transformedMaterials = initialTraining.materials.map(m => ({
                            id: m.id,
                            title: m.title,
                            type: m.type || 'document',
                            duration: m.duration || 0,
                            is_completed: initialCompletedMaterials.includes(m.id),
                            module_title: m.module_title
                        }));
                        setMaterials(transformedMaterials);
                    } else {
                        setMaterials([]);
                    }
                } else {
                    // Re-throw non-404 errors
                    throw materialError;
                }
            }
            setLoading(false);
        } catch (error) {
            // Use centralized error handler for consistent messaging
            const errorMsg = getErrorMessage(error);
            logError(error, 'initialDataSetup', 'error');
            
            setError(errorMsg);
            showToast(errorMsg, 'error');
            setLoading(false);
        }
    };
    
    const loadTrainingData = async (idParam) => {
        try {
            setLoading(true);

            // Determine training id: prefer explicit param, then state/props, then URL
            const idFromUrl = (window.location.pathname || '').split('/')[2];
            const id = idParam || training?.id || initialTraining?.id || idFromUrl;

            if (!id) {
                console.error('No training id available to load training data');
                setLoading(false);
                return;
            }

            // Load training details
            const trainingRes = await axiosInstance.get(API_ENDPOINTS.USER_TRAINING_DETAIL(id));
            const trainingData = trainingRes.data.training;
            const enrollment = trainingRes.data.enrollment;
            const completedMaterialIds = trainingRes.data.completedMaterials || [];
            
            // Transform training data
            const transformedTraining = {
                id: trainingData.id,
                title: trainingData.title,
                description: trainingData.description,
                full_description: trainingData.full_description,
                category: trainingData.category,
                is_mandatory: trainingData.is_mandatory,
                status: enrollment?.status || 'not_started',
                // Prefer server-provided ModuleProgress percentage when available, fall back to final_score
                progress: (trainingRes.data.progress?.progress_percentage) ?? (enrollment?.final_score ?? 0),
                duration: trainingData.duration,
                due_date: trainingData.end_date,
                enrolled_count: trainingData.enrollments_count || 0,
                objectives: null, // Will be set below
                requirements: trainingData.requirements,
                instructor: trainingData.instructor || null,
                certification_available: trainingData.certification_available
            };
            
            // Handle objectives parsing safely
            try {
                if (typeof trainingData.objectives === 'string') {
                    transformedTraining.objectives = JSON.parse(trainingData.objectives);
                } else if (Array.isArray(trainingData.objectives)) {
                    transformedTraining.objectives = trainingData.objectives;
                }
            } catch (e) {
                transformedTraining.objectives = null;
            }
            
            setTraining(transformedTraining);
            
            // Load materials
            const materialsRes = await axiosInstance.get(API_ENDPOINTS.TRAINING_MATERIALS(trainingData.id));
            const transformedMaterials = materialsRes.data.materials.map(m => ({
                id: m.id,
                title: m.title,
                type: m.type,
                duration: m.duration,
                is_completed: completedMaterialIds.includes(m.id),
                module_title: m.module_title
            }));
            
            setMaterials(transformedMaterials);
            
            // Load quizzes data
            try {
                const pretestRes = await axiosInstance.get(API_ENDPOINTS.QUIZ_START(trainingData.id, 'pretest'));
                if (pretestRes.data.quiz) {
                    setPretest({
                        is_passed: pretestRes.data.is_passed || false,
                        score: pretestRes.data.score || 0,
                        attempts: pretestRes.data.attempts || 0,
                        attempt_id: pretestRes.data.attempt_id || null,
                        duration: pretestRes.data.quiz.duration,
                        questions_count: pretestRes.data.quiz.questions_count
                    });
                }
            } catch (e) {
                console.log('No pretest available');
            }
            
            try {
                const posttestRes = await axiosInstance.get(API_ENDPOINTS.QUIZ_START(trainingData.id, 'posttest'));
                if (posttestRes.data.quiz) {
                    setPosttest({
                        is_passed: posttestRes.data.is_passed || false,
                        score: posttestRes.data.score || 0,
                        attempts: posttestRes.data.attempts || 0,
                        attempt_id: posttestRes.data.attempt_id || null,
                        duration: posttestRes.data.quiz.duration,
                        questions_count: posttestRes.data.quiz.questions_count
                    });
                }
            } catch (e) {
                console.log('No posttest available');
            }
            
        } catch (error) {
            // Use centralized error handler for consistent messaging
            const errorMsg = getErrorMessage(error);
            logError(error, 'loadTrainingData', 'error');
            
            setError(errorMsg);
            showToast(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };
    
    
    const handleStartMaterial = (material) => {
        router.visit(`/training/${training.id}/material/${material.id}`);
    };
    
    const handleStartQuiz = (type) => {
        router.visit(`/training/${training.id}/quiz/${type}`);
    };
    
    const handleStartTraining = async () => {
        try {
            setLoading(true);
            await axiosInstance.post(API_ENDPOINTS.TRAINING_START(trainingId));
            // Reload training data to get updated status
            await loadTrainingData();
        } catch (error) {
            // Use centralized error handler for consistent messaging
            const errorMsg = getErrorMessage(error);
            logError(error, 'handleStartTraining', 'error');
            
            // 401 handled by axiosInstance interceptor, but keep for explicit control
            if (error?.response?.status === 401) {
                window.location.href = '/login';
                return;
            }
            
            showToast(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };
    
    if (loading) {
        return (
            <AppLayout user={user}>
                <Head title="Loading..." />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                        <p className="text-slate-600">Memuat data training...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    // If a passing attempt exists, prefer posttest result, otherwise pretest
    const resultLink = posttest?.is_passed && posttest?.attempt_id
        ? `/training/${training.id}/quiz/posttest/result/${posttest.attempt_id}`
        : pretest?.is_passed && pretest?.attempt_id
            ? `/training/${training.id}/quiz/pretest/result/${pretest.attempt_id}`
            : null;

    return (
        <AppLayout user={user}>
            <WondrStyles />
            <Head title={training.title || 'Detail Training'} />

            {/* Immersive Hero Header */}
            <div className={`relative pt-8 pb-40 px-6 lg:px-12 rounded-b-[48px] overflow-hidden shadow-2xl shadow-[#002824]/30 mb-8 ${
                training.cover_image ? '' : 'hero-pattern'
            }`}
            style={training.cover_image ? {
                backgroundImage: `linear-gradient(135deg, rgba(0, 40, 36, 0.85) 0%, rgba(0, 94, 84, 0.8) 100%), url(/storage/${training.cover_image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed'
            } : {}}>
                {/* Navigation */}
                <div className="relative z-20 flex justify-between items-center mb-12 max-w-7xl mx-auto">
                    <Link 
                        href="/my-trainings" 
                        className="flex items-center gap-2 text-white/80 hover:text-[#D6F84C] transition-colors group"
                    >
                        <div className="p-2 bg-white/10 rounded-full group-hover:bg-[#D6F84C] group-hover:text-[#002824] transition-all">
                            <ArrowLeft size={20} />
                        </div>
                        <span className="font-bold text-sm">Kembali</span>
                    </Link>
                    <button className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition">
                        <Share2 size={20} />
                    </button>
                </div>

                <div className="relative z-20 flex flex-col md:flex-row items-end justify-between gap-8 max-w-7xl mx-auto">
                    <div className="flex-1 text-white">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className="px-3 py-1 bg-[#D6F84C] text-[#002824] rounded-lg text-xs font-extrabold uppercase tracking-wider">
                                {training.category || 'Training'}
                            </span>
                            {training.is_mandatory && (
                                <span className="px-3 py-1 bg-red-500/80 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                    <AlertCircle size={12} /> Mandatory
                                </span>
                            )}
                            <span className="flex items-center gap-1 text-white/70 text-xs font-medium bg-white/10 px-3 py-1 rounded-lg">
                                <Clock size={12} /> {training.duration || 60} Menit
                            </span>
                        </div>
                        
                        <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4 max-w-3xl">
                            {training.title}
                        </h1>
                        <p className="text-blue-100 text-lg max-w-2xl leading-relaxed mb-6">
                            {training.description}
                        </p>

                        <div className="flex items-center gap-4">
                            {training.instructor && (
                                <>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D6F84C] to-[#005E54] flex items-center justify-center text-[#002824] font-bold text-xs">
                                            {training.instructor.name?.charAt(0) || 'I'}
                                        </div>
                                        <div className="text-sm">
                                            <p className="font-bold text-white">{training.instructor.name}</p>
                                            <p className="text-white/60 text-xs">{training.instructor.title || 'Instructor'}</p>
                                        </div>
                                    </div>
                                    <div className="h-8 w-[1px] bg-white/20 mx-2"></div>
                                </>
                            )}
                            <div className="text-sm text-white/80">
                                <span className="font-bold text-white">{materials.length || training.materials_count || 1}</span> Materi
                            </div>
                        </div>
                    </div>

                    {/* Circular Progress */}
                    <div className="relative flex-shrink-0">
                        <svg className="w-32 h-32 md:w-40 md:h-40 transform -rotate-90">
                            <circle cx="50%" cy="50%" r="45%" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                            <circle 
                                cx="50%" cy="50%" r="45%" 
                                stroke="#D6F84C" strokeWidth="8" fill="none" strokeLinecap="round"
                                strokeDasharray="283" 
                                strokeDashoffset={283 - (283 * displayProgress) / 100}
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                            <span className="text-3xl md:text-4xl font-black">{Math.round(displayProgress)}%</span>
                            <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Total Progress</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="max-w-7xl mx-auto px-6 -mt-32 relative z-30 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left Column: Content (8 cols) */}
                    <div className="lg:col-span-8 space-y-8">
                        
                        {/* Tabs */}
                        <div className="glass-panel p-2 rounded-[20px] flex gap-1 sticky top-6 z-40 bg-white/90 backdrop-blur-md">
                            {[
                                { id: 'curriculum', label: 'Curriculum' },
                                { id: 'about', label: 'About' },
                                // Only show quiz tab if there are quizzes available
                                ...(Object.keys(initialQuizAttempts || {}).length > 0 ? [{ id: 'quiz', label: 'Quiz' }] : []),
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 py-3 rounded-2xl text-sm font-bold capitalize transition-all ${
                                        activeTab === tab.id ? 'bg-[#002824] text-[#D6F84C] shadow-lg' : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="min-h-[500px] animate-enter">
                            {activeTab === 'curriculum' && (
                                <ErrorBoundary label="Kurikulum & Materi">
                                    <div className="space-y-6">
                                        {/* Material List */}
                                        <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-100">
                                            <div className="flex justify-between items-end mb-6">
                                                <div>
                                                    <h3 className="text-xl font-bold text-slate-900">Materi Pembelajaran</h3>
                                                    <p className="text-sm text-slate-500">
                                                        {materials.filter(m => m.is_completed).length} dari {materials.length} selesai
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-3">
                                                {materials.length > 0 ? materials.map((material, index) => {
                                                    // Status 'enrolled' dari backend = belum dimulai di frontend
                                                    // User selalu bisa akses materi pertama, materi selanjutnya tergantung sequential completion
                                                    const isNotStarted = training.status === 'not_started' || training.status === 'enrolled';
                                                    const isLocked = isNotStarted && index > 0 && !materials[0]?.is_completed;
                                                    const isActive = !material.is_completed && (index === 0 || materials[index-1]?.is_completed);
                                                    
                                                    return (
                                                        <MaterialRow 
                                                            key={material.id} 
                                                            material={material} 
                                                            index={index}
                                                            isLocked={isLocked}
                                                            isActive={isActive}
                                                            onStart={handleStartMaterial}
                                                        />
                                                    );
                                                }) : (
                                                    <div className="text-center py-8 text-slate-500">
                                                        <BookOpen className="mx-auto mb-2 text-slate-300" size={40} />
                                                        <p>Belum ada materi untuk training ini</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </ErrorBoundary>
                            )}

                            {activeTab === 'about' && (
                                <ErrorBoundary label="Tentang Training">
                                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 space-y-6">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 mb-3">Deskripsi Lengkap</h3>
                                            <p className="text-slate-600 leading-relaxed">
                                                {training.full_description || training.description || 'Tidak ada deskripsi lengkap.'}
                                            </p>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 mb-3">Apa yang akan Anda pelajari?</h3>
                                            <ul className="grid grid-cols-1 gap-3">
                                                {(training.objectives && Array.isArray(training.objectives) && training.objectives.length > 0 
                                                    ? training.objectives 
                                                    : [
                                                        'Memahami dan menguasai materi pelatihan dengan baik',
                                                        'Mampu menerapkan pengetahuan yang didapat dalam pekerjaan sehari-hari',
                                                        'Meningkatkan kompetensi dan keterampilan di bidang terkait',
                                                        'Mencapai standar kelulusan yang telah ditentukan'
                                                    ]
                                                ).map((obj, i) => (
                                                    <li key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                                                        <CheckCircle2 className="text-[#005E54] flex-shrink-0 mt-0.5" size={18} />
                                                        <span className="text-slate-700 text-sm font-medium">{obj}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        {training.requirements && (
                                            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
                                                <div className="flex items-start gap-3">
                                                    <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                                                    <div>
                                                        <h3 className="font-bold text-amber-900 mb-2">Prasyarat</h3>
                                                        <p className="text-sm text-amber-800">{training.requirements}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </ErrorBoundary>
                            )}

                            {activeTab === 'quiz' && (
                                <ErrorBoundary label="Quiz & Tes">
                                    <div className="space-y-6">
                                        {pretest && (
                                            <QuizSection
                                                type="pretest"
                                                quiz={pretest}
                                                training={training}
                                                onStart={handleStartQuiz}
                                            />
                                        )}
                                        {posttest && (
                                            <QuizSection
                                                type="posttest"
                                                quiz={posttest}
                                                training={training}
                                                onStart={handleStartQuiz}
                                            />
                                        )}
                                        {!pretest && !posttest && (
                                            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 text-center">
                                                <Target className="mx-auto mb-4 text-slate-300" size={48} />
                                                <p className="text-slate-500">Belum ada quiz untuk training ini</p>
                                            </div>
                                        )}
                                    </div>
                                </ErrorBoundary>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Sticky Sidebar (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        
                        {/* Action Card */}
                        <div className="glass-panel p-6 rounded-[32px] sticky top-6">
                            <h3 className="font-bold text-slate-900 mb-6">Status Training</h3>
                            
                            <div className="space-y-4 mb-6">
                                {training.due_date && (
                                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="text-slate-400" size={20} />
                                            <div>
                                                <p className="text-xs text-slate-500 font-bold uppercase">Deadline</p>
                                                <p className="font-bold text-slate-900">
                                                    {new Date(training.due_date).toLocaleDateString('id-ID')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <Award className={`${certificateEligible ? 'text-amber-400' : 'text-slate-400'}`} size={20} />
                                        <div>
                                            <p className="text-xs text-slate-500 font-bold uppercase">Sertifikat</p>
                                            <p className={`font-bold ${certificateEligible ? 'text-amber-600' : 'text-slate-500'}`}>
                                                {certificateEligible ? '✓ Siap Diambil' : 'Terkunci'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Progress Breakdown - Comprehensive */}
                                <div className="space-y-4 pt-4 border-t border-slate-200">
                                    {/* Total Progress */}
                                    <div className="bg-gradient-to-r from-[#005E54]/10 to-[#D6F84C]/10 p-3 rounded-lg">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-bold text-slate-700">Total Progress</span>
                                            <span className="text-lg font-black text-[#005E54]">
                                                {window.comprehensiveProgress?.total_progress || training.progress || 0}%
                                            </span>
                                        </div>
                                        <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-[#005E54] to-[#D6F84C] rounded-full transition-all duration-500"
                                                style={{ width: `${window.comprehensiveProgress?.total_progress || training.progress || 0}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2">Materials (40%) + Pre-Test (30%) + Post-Test (30%)</p>
                                    </div>

                                    {/* Materials Completion */}
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <div>
                                                <span className="text-slate-600">📚 Materi</span>
                                                <span className="text-xs text-slate-400 ml-2">40% weight</span>
                                            </div>
                                            <span className="font-bold text-[#005E54]">
                                                {window.comprehensiveProgress?.breakdown?.materials?.progress || (materials.length > 0 ? (materials.filter(m => m.is_completed).length / materials.length) * 100 : 0).toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-[#005E54] rounded-full transition-all"
                                                style={{ 
                                                    width: `${window.comprehensiveProgress?.breakdown?.materials?.progress || (materials.length > 0 ? (materials.filter(m => m.is_completed).length / materials.length) * 100 : 0)}%` 
                                                }}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {window.comprehensiveProgress?.breakdown?.materials?.completed || materials.filter(m => m.is_completed).length}/{window.comprehensiveProgress?.breakdown?.materials?.total || materials.length} diselesaikan
                                        </p>
                                    </div>
                                    
                                    {/* Pre-Test Score */}
                                    {(pretest || window.comprehensiveProgress?.breakdown?.pretest?.exists) && (
                                        <div>
                                            <div className="flex justify-between text-sm mb-2">
                                                <div>
                                                    <span className="text-slate-600">📝 Pre-Test</span>
                                                    <span className="text-xs text-slate-400 ml-2">30% weight</span>
                                                </div>
                                                <span className={`font-bold ${
                                                    (window.comprehensiveProgress?.breakdown?.pretest?.passed || pretest?.is_passed) ? 'text-emerald-600' : 'text-slate-500'
                                                }`}>
                                                    {window.comprehensiveProgress?.breakdown?.pretest?.score || pretest?.score || 0}%
                                                </span>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all ${
                                                        (window.comprehensiveProgress?.breakdown?.pretest?.passed || pretest?.is_passed) ? 'bg-emerald-500' : 'bg-orange-400'
                                                    }`}
                                                    style={{ width: `${window.comprehensiveProgress?.breakdown?.pretest?.progress || pretest?.percentage || 0}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {window.comprehensiveProgress?.breakdown?.pretest?.status === 'completed' || pretest?.completed ? (
                                                    window.comprehensiveProgress?.breakdown?.pretest?.passed || pretest?.is_passed ? '✓ Lulus' : '✗ Belum lulus'
                                                ) : 'Belum dikerjakan'}
                                            </p>
                                        </div>
                                    )}
                                    
                                    {/* Post-Test Score */}
                                    {(posttest || window.comprehensiveProgress?.breakdown?.posttest?.exists) && (
                                        <div>
                                            <div className="flex justify-between text-sm mb-2">
                                                <div>
                                                    <span className="text-slate-600">📋 Post-Test</span>
                                                    <span className="text-xs text-slate-400 ml-2">30% weight</span>
                                                </div>
                                                <span className={`font-bold ${
                                                    (window.comprehensiveProgress?.breakdown?.posttest?.passed || posttest?.is_passed) ? 'text-emerald-600' : 'text-slate-500'
                                                }`}>
                                                    {window.comprehensiveProgress?.breakdown?.posttest?.score || posttest?.score || 0}%
                                                </span>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all ${
                                                        (window.comprehensiveProgress?.breakdown?.posttest?.passed || posttest?.is_passed) ? 'bg-emerald-500' : 'bg-orange-400'
                                                    }`}
                                                    style={{ width: `${window.comprehensiveProgress?.breakdown?.posttest?.progress || posttest?.percentage || 0}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {window.comprehensiveProgress?.breakdown?.posttest?.status === 'completed' || posttest?.completed ? (
                                                    window.comprehensiveProgress?.breakdown?.posttest?.passed || posttest?.is_passed ? '✓ Lulus' : '✗ Belum lulus'
                                                ) : 'Belum dikerjakan'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {(training.status === 'not_started' || training.status === 'enrolled') ? (
                                <button
                                    onClick={handleStartTraining}
                                    disabled={loading}
                                    className="w-full py-4 bg-[#005E54] hover:bg-[#00403a] text-white rounded-2xl font-bold shadow-lg shadow-[#005E54]/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                            Memulai...
                                        </>
                                    ) : (
                                        <>
                                            <PlayCircle size={20} />
                                            Mulai Sekarang
                                        </>
                                    )}
                                </button>
                            ) : training.status === 'completed' ? (
                                <div className="space-y-3">
                                    {/* Certificate Requirements Checklist */}
                                    {(certificateRequirements?.materials_total > 0 || certificateRequirements?.pretest_required || certificateRequirements?.posttest_required) && (
                                        <div className="space-y-3 mb-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                            <p className="text-sm font-bold text-slate-700 mb-3">Persyaratan Sertifikat:</p>
                                            
                                            {certificateRequirements?.materials_total > 0 && (
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                                        certificateRequirements?.materials_completed === certificateRequirements?.materials_total
                                                        ? 'bg-emerald-500 text-white' 
                                                        : 'bg-slate-200 text-slate-500'
                                                    }`}>
                                                        {certificateRequirements?.materials_completed === certificateRequirements?.materials_total ? '✓' : '·'}
                                                    </div>
                                                    <span className="text-xs text-slate-600">
                                                        Materi: {certificateRequirements?.materials_completed}/{certificateRequirements?.materials_total} diselesaikan
                                                    </span>
                                                </div>
                                            )}
                                            
                                            {certificateRequirements?.pretest_required && (
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                                        certificateRequirements?.pretest_passed
                                                        ? 'bg-emerald-500 text-white' 
                                                        : 'bg-slate-200 text-slate-500'
                                                    }`}>
                                                        {certificateRequirements?.pretest_passed ? '✓' : '·'}
                                                    </div>
                                                    <span className="text-xs text-slate-600">
                                                        Pre-Test: {certificateRequirements?.pretest_passed ? 'Lulus' : 'Belum lulus'}
                                                    </span>
                                                </div>
                                            )}
                                            
                                            {certificateRequirements?.posttest_required && (
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                                        certificateRequirements?.posttest_passed
                                                        ? 'bg-emerald-500 text-white' 
                                                        : 'bg-slate-200 text-slate-500'
                                                    }`}>
                                                        {certificateRequirements?.posttest_passed ? '✓' : '·'}
                                                    </div>
                                                    <span className="text-xs text-slate-600">
                                                        Post-Test: {certificateRequirements?.posttest_passed ? 'Lulus' : 'Belum lulus'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {certificateEligible ? (
                                        <Link
                                            href={`/training/${training.id}/certificate`}
                                            className="w-full py-3 bg-gradient-to-br from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white rounded-2xl font-bold shadow-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                                        >
                                            <Award size={20} />
                                            Unduh Sertifikat
                                        </Link>
                                    ) : (
                                        <div className="w-full py-3 bg-slate-100 text-slate-500 rounded-2xl font-bold shadow-sm border border-slate-200 flex items-center justify-center gap-2">
                                            <Lock size={18} /> Sertifikat terkunci. Selesaikan semua persyaratan.
                                        </div>
                                    )}

                                    <Link
                                        href={`/training/${training.id}/results`}
                                        className="w-full py-3 bg-white text-[#002824] rounded-2xl font-bold shadow-sm border border-slate-200 flex items-center justify-center gap-2 hover:bg-slate-50"
                                    >
                                        <FileText size={18} />
                                        Review Hasil
                                    </Link>
                                </div>
                            ) : (
                                <button
                                    onClick={() => {
                                        const nextMaterial = materials.find(m => !m.is_completed);
                                        if (nextMaterial) handleStartMaterial(nextMaterial);
                                    }}
                                    className="w-full py-4 bg-[#005E54] hover:bg-[#00403a] text-white rounded-2xl font-bold shadow-lg shadow-[#005E54]/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                                >
                                    <PlayCircle size={20} />
                                    Lanjutkan Belajar
                                </button>
                            )}
                        </div>

                        {/* Help Widget */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[32px] p-6 border border-blue-100">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm mb-4">
                                <AlertCircle size={24} />
                            </div>
                            <h4 className="font-bold text-slate-900 mb-2">Butuh Bantuan?</h4>
                            <p className="text-sm text-slate-600 mb-4">
                                Jika Anda mengalami kendala teknis atau pertanyaan materi.
                            </p>
                            <button className="text-sm font-bold text-blue-600 hover:underline">
                                Hubungi Instructor
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
