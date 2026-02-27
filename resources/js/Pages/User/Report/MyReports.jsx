import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '@/Services/axiosInstance';
import { API_ENDPOINTS } from '@/Config/api';
import { 
    FileText, Download, Eye, Calendar, Filter, Search,
    TrendingUp, Award, Clock, BookOpen, ChevronRight,
    BarChart3, Trophy, CheckCircle2, Star, FileBarChart,
    Printer, Mail, Share2, Zap, Shield, ArrowUpRight,
    Sparkles, Loader2, X, RefreshCw
} from 'lucide-react';
import showToast from '@/Utils/toast';
import { handleAuthError } from '@/Utils/authGuard';

// --- Wondr Style System ---
const WondrStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F8F9FA; color: #1e293b; }
        
        .wondr-dark { background-color: #002824; }
        .wondr-green { color: #005E54; }
        .wondr-lime-bg { background-color: #D6F84C; color: #002824; }
        
        .glass-panel {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.6);
            box-shadow: 0 10px 40px -10px rgba(0, 40, 36, 0.05);
        }

        .report-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid #E2E8F0;
            background: white;
        }
        .report-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 25px -5px rgba(0, 94, 84, 0.1);
            border-color: #005E54;
        }

        .hero-pattern {
            background-color: #002824;
            background-image: radial-gradient(#005E54 1px, transparent 1px);
            background-size: 24px 24px;
        }

        .bar-graph-container {
            display: flex;
            align-items: flex-end;
            gap: 8px;
            height: 120px;
        }
        .bar-graph-col {
            flex: 1;
            background: #E2E8F0;
            border-radius: 8px 8px 0 0;
            position: relative;
            transition: height 1s ease-out, background-color 0.3s;
        }
        .bar-graph-col:hover {
            background: #005E54;
        }
        .bar-graph-col::after {
            content: attr(data-value);
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 10px;
            font-weight: bold;
            color: #005E54;
            opacity: 0;
            transition: opacity 0.2s;
        }
        .bar-graph-col:hover::after { opacity: 1; }

        .tab-pill { transition: all 0.3s ease; }
        .tab-pill.active { background-color: #002824; color: #D6F84C; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

        .animate-enter { animation: enter 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        @keyframes enter {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `}</style>
);

// Stats Card Component
const StatCard = ({ label, value, subtext, icon: Icon, color, delay }) => {
    const colors = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600',
        purple: 'bg-purple-50 text-purple-600',
    };

    return (
        <div 
            className="glass-panel p-5 rounded-[24px] flex items-center justify-between animate-enter"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                <h3 className="text-2xl font-extrabold text-slate-900">{value}</h3>
                {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
            </div>
            <div className={`p-3 rounded-2xl ${colors[color]}`}>
                <Icon size={24} />
            </div>
        </div>
    );
};

// Activity Chart Component
const ActivityChart = ({ trainings = [] }) => {
    // Calculate monthly data from trainings
    const monthlyData = Array(12).fill(0).map((_, i) => {
        const monthTrainings = trainings.filter(t => {
            const date = new Date(t.completed_at || t.enrolled_at);
            return date.getMonth() === i;
        });
        return Math.min(monthTrainings.length * 15, 100);
    });
    
    const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    const totalHours = trainings.reduce((sum, t) => sum + (t.time_spent || 2), 0);

    return (
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-bold text-slate-900">Aktivitas Belajar</h3>
                    <p className="text-xs text-slate-500">Total jam belajar per bulan (2024)</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black text-[#005E54]">{totalHours}h</p>
                    <p className="text-xs text-emerald-600 font-bold flex items-center justify-end gap-1">
                        <TrendingUp size={12} /> +12% vs lalu
                    </p>
                </div>
            </div>
            
            <div className="bar-graph-container">
                {monthlyData.map((val, i) => (
                    <div 
                        key={i} 
                        className="bar-graph-col" 
                        style={{ height: `${val}%` }}
                        data-value={`${Math.round(val/10)}h`}
                    ></div>
                ))}
            </div>
            <div className="flex justify-between mt-2 px-1">
                {months.map((m, i) => (
                    <span key={i} className="text-[10px] font-bold text-slate-400 w-full text-center">{m}</span>
                ))}
            </div>
        </div>
    );
};

// Training Row Component
const TrainingRow = ({ training, index }) => {
    const completedAt = training.completed_at || training.enrolled_at;
    const displayDate = completedAt ? new Date(completedAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }) : 'Baru'
    
    return (
        <div 
            className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl hover:border-[#005E54]/30 hover:bg-[#F0FDF4]/30 transition-all animate-enter group"
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                training.progress === 100 ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
            }`}>
                {training.progress === 100 ? <CheckCircle2 size={20} /> : <Clock size={20} />}
            </div>
            
            <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 truncate group-hover:text-[#005E54] transition-colors">{training.title}</h4>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>{displayDate}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span>{training.progress === 100 ? `Score: ${training.score || 85}` : 'In Progress'}</span>
                </div>
            </div>

            {training.progress === 100 && (
                <Link
                    href={`/training/${training.id}/certificate`}
                    className="p-2 bg-slate-50 text-slate-400 hover:text-[#005E54] hover:bg-white hover:shadow-md rounded-xl transition-all border border-transparent hover:border-[#005E54]/20"
                >
                    <Download size={18} />
                </Link>
            )}
        </div>
    );
};

// Quiz Score Card
const QuizScoreCard = ({ quiz, index }) => {
    const isPassed = quiz.score >= (quiz.passing_score || 70);
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl border border-slate-200 p-4"
        >
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h4 className="font-bold text-slate-900">{quiz.training_title}</h4>
                    <p className="text-sm text-slate-500">
                        {quiz.type === 'pretest' ? 'Pre-Test' : 'Post-Test'}
                    </p>
                </div>
                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-lg ${
                    isPassed 
                        ? 'bg-emerald-100 text-emerald-600' 
                        : 'bg-red-100 text-red-600'
                }`}>
                    {quiz.score}
                </div>
            </div>
            <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">
                    {new Date(quiz.completed_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                    })}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                    isPassed 
                        ? 'bg-emerald-100 text-emerald-600' 
                        : 'bg-red-100 text-red-600'
                }`}>
                    {isPassed ? 'LULUS' : 'TIDAK LULUS'}
                </span>
            </div>
        </motion.div>
    );
};

// Certificate Card
const CertificateCard = ({ cert, index }) => {
    if (!cert) return null;
    
    const displayDate = cert.issued_at ? new Date(cert.issued_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }) : 'Baru';
    
    return (
        <div 
            className="report-card p-5 rounded-[24px] relative overflow-hidden group animate-enter"
            style={{ animationDelay: `${index * 100}ms` }}
        >
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-100 to-transparent rounded-bl-full opacity-50 transition-transform group-hover:scale-110"></div>
            
            <div className="relative z-10">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mb-4 shadow-sm">
                    <Award size={24} />
                </div>
                
                <h4 className="font-bold text-slate-900 leading-tight mb-2 line-clamp-2 min-h-[2.5rem]">
                    {cert.training_title || 'Sertifikat'}
                </h4>
                
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Issued</p>
                        <p className="text-sm font-medium text-slate-700">{displayDate}</p>
                    </div>
                    <Link
                        href={`/training/${cert.training_id}/certificate`}
                        className="p-2 bg-[#002824] text-[#D6F84C] rounded-xl hover:scale-105 transition-transform shadow-lg"
                    >
                        <Download size={16} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

// Main Component
export default function MyReports({ auth, stats = {}, trainings = [], quizzes = [], certificates = [] }) {
    const user = auth?.user || {};
    const [activeTab, setActiveTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');
    
    // AI Feature States
    const [showAIModal, setShowAIModal] = useState(false);
    const [aiInsight, setAiInsight] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

    // Use real stats from backend with fallbacks
    const displayStats = {
        total_trainings: stats.total_trainings ?? trainings.length ?? 0,
        completed_trainings: stats.completed_trainings ?? trainings.filter(t => t.progress === 100).length ?? 0,
        average_score: stats.average_score ?? 0,
        total_certificates: stats.total_certificates ?? certificates.length ?? 0,
        total_learning_hours: stats.total_learning_hours ?? '0 jam',
        points_earned: stats.points_earned ?? 0
    };

    // AI Insight Generation Function
    const generateAIInsight = async () => {
        setIsGenerating(true);
        setShowAIModal(true);
        setAiInsight('');

        const currentLevel = Math.floor((displayStats.points_earned || 0) / 200) || 1;
        const prompt = `Analisis data pembelajaran berikut untuk pengguna bernama ${user.name}:
        - Total Training: ${displayStats.total_trainings}
        - Selesai: ${displayStats.completed_trainings}
        - Rata-rata Nilai: ${displayStats.average_score}
        - Jam Belajar: ${displayStats.total_learning_hours}
        - Level Saat Ini: ${currentLevel} (XP: ${displayStats.points_earned})
        - Sertifikat: ${displayStats.total_certificates}
        
        Berikan ringkasan pencapaian yang memotivasi dalam Bahasa Indonesia, soroti kekuatan mereka, dan berikan 1-2 saran singkat untuk pengembangan karir berdasarkan data ini. Gunakan gaya bahasa yang profesional namun menyemangati ala coach, gunakan emoji yang relevan. Buat dalam format poin-poin yang mudah dibaca dengan bullet points.`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            if (!response.ok) throw new Error('Gagal menghubungi AI');
            
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, gagal membuat analisis.";
            setAiInsight(text);
        } catch (error) {
            console.error("AI Error:", error);
            setAiInsight("❌ Terjadi kesalahan koneksi saat menghubungi AI Coach. Silakan coba lagi nanti.");
        } finally {
            setIsGenerating(false);
        }
    };

    // Export PDF state & handler
    const [isExporting, setIsExporting] = useState(false);

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            const response = await axiosInstance.get(API_ENDPOINTS.EXPORT_REPORT_PDF, { responseType: 'blob' });

            // Parse filename from content-disposition
            const disposition = response.headers['content-disposition'] || '';
            const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/);
            const filename = match ? decodeURIComponent(match[1]) : 'report.pdf';

            const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);

            showToast('Unduhan dimulai', 'success');
        } catch (error) {
            console.error('Export PDF error:', error);
            if (handleAuthError(error)) {
                return;
            }
            showToast(error.response?.data?.message || 'Gagal mengunduh laporan', 'error');
        } finally {
            setIsExporting(false);
        }
    };

    const tabs = [
        { key: 'overview', label: 'Overview', icon: BarChart3 },
        { key: 'trainings', label: 'Training', icon: BookOpen },
        { key: 'quizzes', label: 'Quiz', icon: FileText },
        { key: 'certificates', label: 'Sertifikat', icon: Award },
    ];

    return (
        <AppLayout user={user}>
            <WondrStyles />
            <Head title="Laporan Pembelajaran" />

            {/* --- Hero Header --- */}
            <div className="hero-pattern pt-8 pb-32 px-6 lg:px-12 relative rounded-b-[48px] shadow-2xl shadow-[#002824]/20 overflow-hidden mb-8">
                <div className="max-w-7xl mx-auto relative z-10">
                    
                    {/* Top Bar */}
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3 text-white/80">
                            <div className="p-2 bg-white/10 rounded-full backdrop-blur-md">
                                <TrendingUp size={20} />
                            </div>
                            <span className="font-bold text-sm tracking-wide">Report Center</span>
                        </div>
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={generateAIInsight}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full hover:shadow-lg hover:scale-105 transition-all font-bold text-xs border border-white/20"
                            >
                                <Sparkles size={16} /> AI Coach
                            </button>
                            <button className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition">
                                <Share2 size={18} />
                            </button>
                            <button 
                                onClick={() => window.print()}
                                className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition"
                            >
                                <Printer size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                        <div>
                            <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-2">
                                Laporan & <br /> <span className="text-[#D6F84C]">Pencapaian</span>
                            </h1>
                            <p className="text-blue-100 text-lg">Rekap perjalanan pembelajaran Anda di Wondr.</p>
                        </div>
                        
                        {/* Summary Pill */}
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex gap-6">
                            <div className="text-center px-2">
                                <p className="text-xs text-slate-300 uppercase font-bold">Total Jam</p>
                                <p className="text-2xl font-black text-white">{displayStats.total_learning_hours}</p>
                            </div>
                            <div className="w-[1px] bg-white/20"></div>
                            <div className="text-center px-2">
                                <p className="text-xs text-slate-300 uppercase font-bold">Rata-rata</p>
                                <p className="text-2xl font-black text-[#D6F84C]">{displayStats.average_score}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Main Content --- */}
            <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-20 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left Column: Content (8 Cols) */}
                    <div className="lg:col-span-8 space-y-8">
                        
                        {/* KPI Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <StatCard 
                                label="Training Selesai" 
                                value={`${displayStats.completed_trainings}/${displayStats.total_trainings}`}
                                icon={BookOpen} 
                                color="blue" 
                                delay={0} 
                            />
                            <StatCard 
                                label="Sertifikat" 
                                value={displayStats.total_certificates}
                                icon={Award} 
                                color="amber" 
                                delay={100} 
                            />
                        </div>

                        {/* Chart Area */}
                        <ActivityChart trainings={trainings} />

                        {/* Tabs Navigation */}
                        <div>
                            <div className="bg-white rounded-2xl p-1.5 flex gap-1 shadow-sm border border-slate-200 mb-6">
                                {[
                                    { id: 'overview', label: 'Riwayat Training' },
                                    { id: 'certificates', label: 'Galeri Sertifikat' },
                                    { id: 'quizzes', label: 'Detail Nilai' }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all tab-pill ${
                                            activeTab === tab.id ? 'active' : 'text-slate-500 hover:bg-slate-50'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className="min-h-[300px">
                                <AnimatePresence mode="wait">
                                    {activeTab === 'overview' && (
                                        <motion.div 
                                            key="overview"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="space-y-3"
                                        >
                                            {trainings.length > 0 ? trainings.map((t, idx) => (
                                                <TrainingRow key={t.id} training={t} index={idx} />
                                            )) : (
                                                <div className="text-center py-12 bg-slate-50 rounded-xl">
                                                    <BookOpen className="mx-auto text-slate-300 mb-3" size={48} />
                                                    <p className="text-slate-500">Belum ada training yang diikuti</p>
                                                    <Link href="/my-trainings" className="text-blue-600 font-medium mt-2 inline-block hover:underline">
                                                        Jelajahi Training →
                                                    </Link>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {activeTab === 'certificates' && (
                                        <motion.div 
                                            key="certificates"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                        >
                                            {certificates.length > 0 ? certificates.map((c, idx) => (
                                                <CertificateCard key={c.id || idx} cert={c} index={idx} />
                                            )) : (
                                                <div className="col-span-2 text-center py-12 bg-slate-50 rounded-xl">
                                                    <Award className="mx-auto text-slate-300 mb-3" size={48} />
                                                    <p className="text-slate-500">Belum ada sertifikat</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {activeTab === 'quizzes' && (
                                        <motion.div 
                                            key="quizzes"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="bg-white rounded-[24px] p-8 text-center border border-slate-200"
                                        >
                                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <FileText className="text-slate-400" size={32} />
                                            </div>
                                            <h3 className="font-bold text-slate-900 mb-2">Detail Kuis</h3>
                                            <p className="text-slate-500 text-sm">Lihat detail jawaban dan analisis per modul.</p>
                                            {quizzes.length > 0 && (
                                                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {quizzes.map((quiz, index) => (
                                                        <QuizScoreCard key={quiz.id} quiz={quiz} index={index} />
                                                    ))}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Profile Sidebar (4 Cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        
                        {/* Profile Card */}
                        <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-24 bg-[#002824]"></div>
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-20 h-20 rounded-full border-4 border-white shadow-md bg-gradient-to-br from-[#D6F84C] to-[#005E54] flex items-center justify-center text-white font-bold text-2xl mb-3">
                                    {user.name?.charAt(0) || 'U'}
                                </div>
                                <h3 className="font-bold text-xl text-slate-900">{user.name}</h3>
                                <p className="text-slate-500 text-sm mb-6">{user.email || 'Learner'}</p>
                                
                                {/* Gamification Stats */}
                                <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Level {Math.floor(displayStats.points_earned / 200) || 1}</span>
                                        <span className="text-xs font-bold text-[#005E54]">{displayStats.points_earned || 0} XP</span>
                                    </div>
                                    <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-[#005E54] to-[#D6F84C]" style={{ width: `${((displayStats.points_earned || 0) % 200) / 2}%` }}></div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2 text-right">{200 - ((displayStats.points_earned || 0) % 200)} XP menuju level berikutnya</p>
                                </div>

                                {/* Badges */}
                                <div className="w-full">
                                    <h4 className="font-bold text-slate-900 mb-3 text-sm flex items-center gap-2">
                                        <Award size={16} className="text-[#D6F84C]" /> Badges Terbaru
                                    </h4>
                                    <div className="flex gap-2">
                                        {['🚀', '🛡️', '🎓', '⭐'].map((emoji, i) => (
                                            <div key={i} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-lg border border-slate-100 shadow-sm" title="Badge Name">
                                                {emoji}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Download Report Button */}
                        <div className="bg-gradient-to-br from-[#002824] to-[#00403a] rounded-[24px] p-6 text-white text-center">
                            <FileText className="mx-auto mb-3 text-[#D6F84C]" size={32} />
                            <h4 className="font-bold text-lg mb-2">Unduh Transkrip</h4>
                            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                                Dapatkan rekap lengkap seluruh pelatihan dan nilai Anda dalam format PDF resmi.
                            </p>
                            <button
                                onClick={handleExportPDF}
                                disabled={isExporting}
                                className={`w-full py-3 ${isExporting ? 'bg-slate-200 text-slate-500' : 'bg-[#D6F84C] text-[#002824] hover:bg-[#c2e43c]'} rounded-xl font-bold transition shadow-lg flex items-center justify-center gap-2`}
                            >
                                {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={18} />}
                                {isExporting ? 'Mengunduh...' : 'Download PDF'}
                            </button>
                        </div>

                    </div>
                </div>
            </div>

            {/* --- AI Insight Modal --- */}
            <AnimatePresence>
                {showAIModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                            className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl border border-white/20 relative"
                        >
                            {/* Header with flashy gradient */}
                            <div className="bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4c1d95] p-8 text-white relative overflow-hidden">
                                {/* Abstract shapes */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#D6F84C]/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>
                                
                                <div className="relative z-10 flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-inner">
                                            <Sparkles size={24} className="text-[#D6F84C]" />
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-2xl tracking-tight">AI Learning Coach</h3>
                                            <p className="text-indigo-200 text-sm font-medium flex items-center gap-1">
                                                Powered by Gemini <span className="w-1.5 h-1.5 rounded-full bg-[#D6F84C] animate-pulse"></span>
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setShowAIModal(false)} 
                                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="p-8 bg-white relative min-h-[300px]">
                                {isGenerating ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[2px] z-20">
                                        <div className="relative">
                                            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Sparkles size={20} className="text-indigo-600 animate-pulse" />
                                            </div>
                                        </div>
                                        <p className="text-slate-800 font-bold mt-6 text-lg">Menganalisis Data...</p>
                                        <p className="text-slate-500 text-sm">AI sedang mempelajari progres belajar Anda.</p>
                                    </div>
                                ) : (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        <div className="prose prose-slate prose-sm max-w-none">
                                            <div className="text-slate-700 leading-relaxed text-base whitespace-pre-line font-medium">
                                                {aiInsight}
                                            </div>
                                        </div>
                                        
                                        <div className="mt-8 pt-6 border-t border-slate-100 flex gap-3">
                                            <button 
                                                onClick={generateAIInsight}
                                                className="flex-1 py-3.5 px-4 border-2 border-indigo-50 text-indigo-600 font-bold rounded-xl hover:border-indigo-100 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                                            >
                                                <RefreshCw size={18} /> Analisis Ulang
                                            </button>
                                            <button 
                                                onClick={() => setShowAIModal(false)}
                                                className="flex-1 py-3.5 px-4 bg-[#002824] text-[#D6F84C] font-bold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                            >
                                                Mengerti <ArrowUpRight size={18} />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AppLayout>
    );
}
