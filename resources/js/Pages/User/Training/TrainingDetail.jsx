import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BookOpen, Clock, Award, PlayCircle, CheckCircle2, 
    FileText, Video, Download, ChevronRight, Lock,
    ArrowLeft, Target, Users, Calendar, Timer, Star,
    AlertCircle, Play, Pause, RotateCcw
} from 'lucide-react';
import axios from 'axios';

// Material Item Component
const MaterialItem = ({ material, index, isLocked, onStart, currentMaterial }) => {
    const isActive = currentMaterial?.id === material.id;
    const isCompleted = material.is_completed;
    
    const getIcon = () => {
        switch (material.type) {
            case 'video': return Video;
            case 'pdf': case 'document': return FileText;
            case 'download': return Download;
            default: return BookOpen;
        }
    };
    
    const Icon = getIcon();
    
    return (
        <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => !isLocked && onStart(material)}
            disabled={isLocked}
            className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left ${
                isActive 
                    ? 'bg-blue-50 border-2 border-blue-500' 
                    : isLocked 
                        ? 'bg-slate-50 opacity-60 cursor-not-allowed'
                        : 'bg-white hover:bg-slate-50 border border-slate-200'
            }`}
        >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isCompleted 
                    ? 'bg-emerald-100 text-emerald-600' 
                    : isActive 
                        ? 'bg-blue-100 text-blue-600'
                        : isLocked 
                            ? 'bg-slate-100 text-slate-400'
                            : 'bg-slate-100 text-slate-600'
            }`}>
                {isCompleted ? <CheckCircle2 size={20} /> : isLocked ? <Lock size={18} /> : <Icon size={20} />}
            </div>
            
            <div className="flex-1 min-w-0">
                <h4 className={`font-semibold text-sm ${isLocked ? 'text-slate-400' : 'text-slate-900'}`}>
                    {material.title}
                </h4>
                <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                    <Timer size={12} />
                    {material.duration || 5} menit
                    {material.type && (
                        <span className="uppercase text-[10px] px-1.5 py-0.5 bg-slate-100 rounded">
                            {material.type}
                        </span>
                    )}
                </p>
            </div>
            
            {!isLocked && !isCompleted && (
                <ChevronRight className="text-slate-400" size={20} />
            )}
        </motion.button>
    );
};

// Quiz Section Component
const QuizSection = ({ type, quiz, training, onStart }) => {
    const isPassed = quiz?.is_passed;
    const score = quiz?.score;
    const attempts = quiz?.attempts || 0;
    
    return (
        <div className={`p-6 rounded-2xl border-2 ${
            isPassed 
                ? 'bg-emerald-50 border-emerald-200' 
                : 'bg-white border-slate-200'
        }`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isPassed ? 'bg-emerald-100' : 'bg-blue-100'
                    }`}>
                        <Target className={isPassed ? 'text-emerald-600' : 'text-blue-600'} size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-900">
                            {type === 'pretest' ? 'Pre-Test' : 'Post-Test'}
                        </h3>
                        <p className="text-sm text-slate-500">
                            {type === 'pretest' 
                                ? 'Tes awal untuk mengukur pemahaman Anda'
                                : 'Tes akhir untuk evaluasi pembelajaran'}
                        </p>
                    </div>
                </div>
                
                {isPassed && (
                    <div className="text-right">
                        <p className="text-2xl font-black text-emerald-600">{score}%</p>
                        <p className="text-xs text-emerald-600">Lulus</p>
                    </div>
                )}
            </div>
            
            <div className="flex items-center gap-4 mb-4 text-sm text-slate-600">
                <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {quiz?.duration || 30} menit
                </span>
                <span className="flex items-center gap-1">
                    <FileText size={14} />
                    {quiz?.questions_count || 10} soal
                </span>
                {attempts > 0 && (
                    <span className="flex items-center gap-1">
                        <RotateCcw size={14} />
                        {attempts} percobaan
                    </span>
                )}
            </div>
            
            <button
                onClick={() => onStart(type)}
                disabled={isPassed && type === 'pretest'}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    isPassed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                }`}
            >
                {isPassed ? (
                    <>
                        <CheckCircle2 size={18} />
                        {type === 'pretest' ? 'Sudah Selesai' : 'Lihat Hasil'}
                    </>
                ) : (
                    <>
                        <PlayCircle size={18} />
                        Mulai {type === 'pretest' ? 'Pre-Test' : 'Post-Test'}
                    </>
                )}
            </button>
        </div>
    );
};

// Main Component
export default function TrainingDetail({ auth, training = {}, materials = [], pretest = null, posttest = null }) {
    const user = auth?.user || {};
    const [currentMaterial, setCurrentMaterial] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(false);
    
    const progress = training.progress || 0;
    const completedMaterials = materials.filter(m => m.is_completed).length;
    const totalMaterials = materials.length;
    
    const handleStartMaterial = (material) => {
        router.visit(`/training/${training.id}/material/${material.id}`);
    };
    
    const handleStartQuiz = (type) => {
        router.visit(`/training/${training.id}/quiz/${type}`);
    };
    
    const handleStartTraining = async () => {
        try {
            setLoading(true);
            await axios.post(`/api/training/${training.id}/start`);
            // Refresh page to get updated status
            router.reload();
        } catch (error) {
            console.error('Failed to start training:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout user={user}>
            <Head title={training.title || 'Detail Training'} />

            {/* Back Navigation */}
            <div className="mb-6">
                <Link 
                    href="/my-trainings"
                    className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="font-medium">Kembali ke Training Saya</span>
                </Link>
            </div>

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                
                <div className="relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full">
                                    {training.category || 'Training'}
                                </span>
                                {training.is_mandatory && (
                                    <span className="px-3 py-1 bg-red-500/80 text-white text-xs font-bold rounded-full">
                                        Wajib
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-white mb-3">{training.title}</h1>
                            <p className="text-blue-100 mb-4 max-w-2xl">{training.description}</p>
                            
                            {/* Meta Info */}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-blue-100">
                                <span className="flex items-center gap-2">
                                    <Clock size={16} />
                                    {training.duration || 60} menit
                                </span>
                                <span className="flex items-center gap-2">
                                    <BookOpen size={16} />
                                    {totalMaterials} materi
                                </span>
                                <span className="flex items-center gap-2">
                                    <Users size={16} />
                                    {training.enrolled_count || 0} peserta
                                </span>
                                {training.due_date && (
                                    <span className="flex items-center gap-2">
                                        <Calendar size={16} />
                                        Deadline: {new Date(training.due_date).toLocaleDateString('id-ID')}
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        {/* Progress Circle */}
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <svg className="w-28 h-28 transform -rotate-90">
                                    <circle
                                        cx="56"
                                        cy="56"
                                        r="48"
                                        stroke="rgba(255,255,255,0.2)"
                                        strokeWidth="8"
                                        fill="none"
                                    />
                                    <circle
                                        cx="56"
                                        cy="56"
                                        r="48"
                                        stroke="#D6FF59"
                                        strokeWidth="8"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeDasharray={`${progress * 3.02} 302`}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl font-black text-white">{progress}%</span>
                                </div>
                            </div>
                            
                            {training.status === 'not_started' && (
                                <button
                                    onClick={handleStartTraining}
                                    disabled={loading}
                                    className="px-8 py-4 bg-[#D6FF59] text-slate-900 rounded-2xl font-bold hover:bg-[#cbf542] transition-all shadow-xl flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-900 border-t-transparent" />
                                            Memulai...
                                        </>
                                    ) : (
                                        <>
                                            <PlayCircle size={20} />
                                            Mulai Training
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tabs */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-1.5 flex gap-1">
                        {[
                            { id: 'overview', label: 'Overview' },
                            { id: 'materials', label: 'Materi' },
                            { id: 'quiz', label: 'Quiz & Ujian' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-blue-600 text-white shadow'
                                        : 'text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' && (
                            <motion.div
                                key="overview"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                {/* About */}
                                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                                    <h3 className="font-bold text-lg text-slate-900 mb-4">Tentang Training Ini</h3>
                                    <div className="prose prose-slate max-w-none">
                                        <p>{training.full_description || training.description || 'Tidak ada deskripsi lengkap.'}</p>
                                    </div>
                                </div>

                                {/* Learning Objectives */}
                                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                                    <h3 className="font-bold text-lg text-slate-900 mb-4">Tujuan Pembelajaran</h3>
                                    <ul className="space-y-3">
                                        {(training.objectives || ['Memahami konsep dasar', 'Menerapkan dalam pekerjaan', 'Meningkatkan kompetensi']).map((obj, i) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <CheckCircle2 className="text-emerald-500 flex-shrink-0 mt-0.5" size={18} />
                                                <span className="text-slate-700">{obj}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Requirements */}
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
                            </motion.div>
                        )}

                        {activeTab === 'materials' && (
                            <motion.div
                                key="materials"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-white rounded-2xl border border-slate-200 p-6"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-lg text-slate-900">Daftar Materi</h3>
                                    <span className="text-sm text-slate-500">
                                        {completedMaterials}/{totalMaterials} selesai
                                    </span>
                                </div>
                                
                                <div className="space-y-3">
                                    {materials.length > 0 ? materials.map((material, index) => (
                                        <MaterialItem
                                            key={material.id}
                                            material={material}
                                            index={index}
                                            isLocked={training.status === 'not_started' && index > 0}
                                            onStart={handleStartMaterial}
                                            currentMaterial={currentMaterial}
                                        />
                                    )) : (
                                        <div className="text-center py-8 text-slate-500">
                                            <BookOpen className="mx-auto mb-2 text-slate-300" size={40} />
                                            <p>Belum ada materi untuk training ini</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'quiz' && (
                            <motion.div
                                key="quiz"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                <QuizSection
                                    type="pretest"
                                    quiz={pretest}
                                    training={training}
                                    onStart={handleStartQuiz}
                                />
                                <QuizSection
                                    type="posttest"
                                    quiz={posttest}
                                    training={training}
                                    onStart={handleStartQuiz}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Progress Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <h3 className="font-bold text-lg text-slate-900 mb-4">Progress Anda</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-600">Materi</span>
                                    <span className="font-bold">{completedMaterials}/{totalMaterials}</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-blue-600 rounded-full transition-all"
                                        style={{ width: `${(completedMaterials/totalMaterials)*100 || 0}%` }}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-600">Pre-Test</span>
                                    <span className="font-bold">{pretest?.is_passed ? 'Lulus' : 'Belum'}</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${pretest?.is_passed ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                        style={{ width: pretest?.is_passed ? '100%' : '0%' }}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-600">Post-Test</span>
                                    <span className="font-bold">{posttest?.is_passed ? 'Lulus' : 'Belum'}</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${posttest?.is_passed ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                        style={{ width: posttest?.is_passed ? '100%' : '0%' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Certificate Card */}
                    {training.status === 'completed' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 text-white"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <Award size={32} />
                                <div>
                                    <h3 className="font-bold text-lg">Selamat!</h3>
                                    <p className="text-sm opacity-90">Anda telah menyelesaikan training ini</p>
                                </div>
                            </div>
                            <Link
                                href={`/training/${training.id}/certificate`}
                                className="w-full py-3 bg-white text-orange-600 rounded-xl font-bold text-sm hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
                            >
                                <Download size={18} />
                                Unduh Sertifikat
                            </Link>
                        </motion.div>
                    )}

                    {/* Instructor Info */}
                    {training.instructor && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <h3 className="font-bold text-lg text-slate-900 mb-4">Instruktur</h3>
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                                    {training.instructor.name?.charAt(0) || 'I'}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">{training.instructor.name}</p>
                                    <p className="text-sm text-slate-500">{training.instructor.title || 'Training Instructor'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
