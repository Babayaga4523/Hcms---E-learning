import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { motion } from 'framer-motion';
import { 
    FileText, Download, Eye, Calendar, Filter, Search,
    TrendingUp, Award, Clock, BookOpen, ChevronRight,
    BarChart3, Trophy, CheckCircle2, Star, FileBarChart,
    Printer, Mail, Share2
} from 'lucide-react';
import axios from 'axios';

// Stats Card Component
const StatsCard = ({ icon: Icon, label, value, trend, color = 'blue' }) => {
    const colors = {
        blue: 'from-blue-500 to-blue-600',
        emerald: 'from-emerald-500 to-emerald-600',
        amber: 'from-amber-500 to-amber-600',
        purple: 'from-purple-500 to-purple-600',
    };
    
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 p-6"
        >
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center`}>
                    <Icon className="text-white" size={24} />
                </div>
                {trend && (
                    <span className={`text-sm font-medium ${trend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </span>
                )}
            </div>
            <p className="text-3xl font-black text-slate-900 mb-1">{value}</p>
            <p className="text-sm text-slate-500">{label}</p>
        </motion.div>
    );
};

// Training Progress Card
const TrainingCard = ({ training, index }) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition"
    >
        <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                <img 
                    src={training.thumbnail || '/images/training-placeholder.jpg'} 
                    alt={training.title}
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 truncate">{training.title}</h3>
                <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        {training.materials_completed}/{training.total_materials} materi
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {training.time_spent || '2 jam'}
                    </span>
                </div>
            </div>
            <div className="text-right">
                <div className="text-2xl font-black text-blue-600">{training.progress}%</div>
                <p className="text-xs text-slate-500">Progress</p>
            </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${training.progress}%` }}
                transition={{ duration: 1, delay: index * 0.1 }}
                className={`h-full rounded-full ${
                    training.progress === 100 
                        ? 'bg-emerald-500' 
                        : 'bg-blue-500'
                }`}
            />
        </div>
    </motion.div>
);

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
const CertificateCard = ({ certificate, index }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.1 }}
        className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4"
    >
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Award className="text-amber-600" size={24} />
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-amber-900">{certificate.training_title}</h4>
                <p className="text-sm text-amber-700">
                    Diperoleh {new Date(certificate.issued_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    })}
                </p>
            </div>
            <Link
                href={`/certificate/${certificate.id}`}
                className="p-2 bg-amber-100 rounded-lg text-amber-600 hover:bg-amber-200 transition"
            >
                <Eye size={20} />
            </Link>
        </div>
    </motion.div>
);

// Main Component
export default function MyReports({ auth, stats = {}, trainings = [], quizzes = [], certificates = [] }) {
    const user = auth?.user || {};
    const [activeTab, setActiveTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');

    // Default stats if not provided
    const defaultStats = {
        total_trainings: trainings.length || 12,
        completed_trainings: trainings.filter(t => t.progress === 100).length || 8,
        average_score: 85,
        total_certificates: certificates.length || 5,
        total_learning_hours: '45 jam',
        points_earned: 2500
    };

    const displayStats = { ...defaultStats, ...stats };

    const tabs = [
        { key: 'overview', label: 'Overview', icon: BarChart3 },
        { key: 'trainings', label: 'Training', icon: BookOpen },
        { key: 'quizzes', label: 'Quiz', icon: FileText },
        { key: 'certificates', label: 'Sertifikat', icon: Award },
    ];

    return (
        <AppLayout user={user}>
            <Head title="Laporan Pembelajaran" />

            {/* Header */}
            <div className="mb-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">Laporan Pembelajaran</h1>
                        <p className="text-slate-500 mt-1">Pantau progress dan pencapaian Anda</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition">
                            <Download size={18} />
                            Export PDF
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition">
                            <Printer size={18} />
                            Print
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatsCard 
                    icon={BookOpen} 
                    label="Training Selesai" 
                    value={`${displayStats.completed_trainings}/${displayStats.total_trainings}`}
                    color="blue"
                />
                <StatsCard 
                    icon={Trophy} 
                    label="Rata-rata Nilai" 
                    value={displayStats.average_score}
                    trend={5}
                    color="emerald"
                />
                <StatsCard 
                    icon={Clock} 
                    label="Jam Belajar" 
                    value={displayStats.total_learning_hours}
                    color="amber"
                />
                <StatsCard 
                    icon={Award} 
                    label="Sertifikat" 
                    value={displayStats.total_certificates}
                    color="purple"
                />
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-slate-200 mb-8">
                <div className="flex overflow-x-auto border-b border-slate-200">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-6 py-4 font-medium transition whitespace-nowrap ${
                                activeTab === tab.key
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Recent Trainings */}
                            <div>
                                <h3 className="font-bold text-slate-900 mb-4">Training Terbaru</h3>
                                <div className="space-y-4">
                                    {trainings.slice(0, 3).map((training, index) => (
                                        <TrainingCard key={training.id} training={training} index={index} />
                                    ))}
                                </div>
                                {trainings.length > 3 && (
                                    <button
                                        onClick={() => setActiveTab('trainings')}
                                        className="w-full mt-4 py-3 text-blue-600 font-medium hover:bg-blue-50 rounded-xl transition flex items-center justify-center gap-2"
                                    >
                                        Lihat Semua
                                        <ChevronRight size={18} />
                                    </button>
                                )}
                            </div>

                            {/* Recent Quizzes */}
                            <div>
                                <h3 className="font-bold text-slate-900 mb-4">Nilai Quiz Terbaru</h3>
                                <div className="space-y-4">
                                    {quizzes.slice(0, 4).map((quiz, index) => (
                                        <QuizScoreCard key={quiz.id} quiz={quiz} index={index} />
                                    ))}
                                </div>
                                {quizzes.length > 4 && (
                                    <button
                                        onClick={() => setActiveTab('quizzes')}
                                        className="w-full mt-4 py-3 text-blue-600 font-medium hover:bg-blue-50 rounded-xl transition flex items-center justify-center gap-2"
                                    >
                                        Lihat Semua
                                        <ChevronRight size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Trainings Tab */}
                    {activeTab === 'trainings' && (
                        <div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Cari training..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                {trainings
                                    .filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map((training, index) => (
                                        <TrainingCard key={training.id} training={training} index={index} />
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Quizzes Tab */}
                    {activeTab === 'quizzes' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {quizzes.map((quiz, index) => (
                                <QuizScoreCard key={quiz.id} quiz={quiz} index={index} />
                            ))}
                        </div>
                    )}

                    {/* Certificates Tab */}
                    {activeTab === 'certificates' && (
                        <div className="space-y-4">
                            {certificates.length > 0 ? (
                                certificates.map((cert, index) => (
                                    <CertificateCard key={cert.id} certificate={cert} index={index} />
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <Award className="mx-auto text-slate-300 mb-4" size={64} />
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">Belum Ada Sertifikat</h3>
                                    <p className="text-slate-500">Selesaikan training untuk mendapatkan sertifikat</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Achievement Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-8 text-white"
            >
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
                        <Star className="text-yellow-300" size={40} fill="currentColor" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black mb-2">Level: Learner Pro</h3>
                        <p className="text-purple-200">Anda telah mengumpulkan {displayStats.points_earned} poin</p>
                        <div className="mt-3 flex items-center gap-4">
                            <div className="h-2 w-48 bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full w-3/4 bg-yellow-400 rounded-full" />
                            </div>
                            <span className="text-sm text-purple-200">750 poin lagi ke level berikutnya</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AppLayout>
    );
}
