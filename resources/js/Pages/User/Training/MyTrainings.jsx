import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BookOpen, Clock, Award, PlayCircle, CheckCircle2, 
    AlertTriangle, Search, Filter, Calendar, TrendingUp,
    ChevronRight, Target, BarChart3, Timer, Sparkles
} from 'lucide-react';
import axios from 'axios';

// Status Badge Component
const StatusBadge = ({ status }) => {
    const statusConfig = {
        'not_started': { label: 'Belum Dimulai', bg: 'bg-slate-100', text: 'text-slate-600', icon: Clock },
        'in_progress': { label: 'Sedang Berlangsung', bg: 'bg-amber-100', text: 'text-amber-700', icon: PlayCircle },
        'completed': { label: 'Selesai', bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2 },
        'overdue': { label: 'Terlambat', bg: 'bg-red-100', text: 'text-red-600', icon: AlertTriangle },
    };
    
    const config = statusConfig[status] || statusConfig['not_started'];
    const Icon = config.icon;
    
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${config.bg} ${config.text}`}>
            <Icon size={14} />
            {config.label}
        </span>
    );
};

// Training Card Component
const TrainingCard = ({ training, index }) => {
    const progress = training.progress || 0;
    const dueDate = training.due_date ? new Date(training.due_date) : null;
    const isOverdue = dueDate && dueDate < new Date() && training.status !== 'completed';
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 overflow-hidden"
        >
            {/* Card Header with Image/Color */}
            <div className={`h-3 ${
                training.status === 'completed' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                training.status === 'in_progress' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                isOverdue ? 'bg-gradient-to-r from-red-500 to-rose-500' :
                'bg-gradient-to-r from-blue-500 to-indigo-500'
            }`} />
            
            <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase rounded">
                                {training.category || 'Training'}
                            </span>
                            {training.is_mandatory && (
                                <span className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold uppercase rounded">
                                    Wajib
                                </span>
                            )}
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                            {training.title}
                        </h3>
                    </div>
                    <StatusBadge status={isOverdue ? 'overdue' : training.status} />
                </div>
                
                {/* Description */}
                <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                    {training.description || 'Tidak ada deskripsi'}
                </p>
                
                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-medium text-slate-600">Progress</span>
                        <span className="font-bold text-slate-900">{progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, delay: index * 0.1 }}
                            className={`h-full rounded-full ${
                                progress === 100 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                                progress > 50 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                                'bg-gradient-to-r from-blue-500 to-indigo-500'
                            }`}
                        />
                    </div>
                </div>
                
                {/* Meta Info */}
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                    <div className="flex items-center gap-1">
                        <Timer size={14} />
                        <span>{training.duration || '0'} menit</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <BookOpen size={14} />
                        <span>{training.materials_count || 0} materi</span>
                    </div>
                    {dueDate && (
                        <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : ''}`}>
                            <Calendar size={14} />
                            <span>Due: {dueDate.toLocaleDateString('id-ID')}</span>
                        </div>
                    )}
                </div>
                
                {/* Action Button */}
                <Link
                    href={`/training/${training.id}`}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                        training.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                    }`}
                >
                    {training.status === 'completed' ? (
                        <>
                            <CheckCircle2 size={18} />
                            Lihat Sertifikat
                        </>
                    ) : training.status === 'in_progress' ? (
                        <>
                            <PlayCircle size={18} />
                            Lanjutkan Belajar
                        </>
                    ) : (
                        <>
                            <PlayCircle size={18} />
                            Mulai Training
                        </>
                    )}
                </Link>
            </div>
        </motion.div>
    );
};

// Filter Tab Component
const FilterTab = ({ active, label, count, onClick }) => (
    <button
        onClick={onClick}
        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            active 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
        }`}
    >
        {label}
        {count !== undefined && (
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                active ? 'bg-white/20' : 'bg-slate-100'
            }`}>
                {count}
            </span>
        )}
    </button>
);

// Main Component
export default function MyTrainings({ auth, trainings = [], stats = {} }) {
    const user = auth?.user || {};
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [trainingList, setTrainingList] = useState(trainings);
    const [loading, setLoading] = useState(false);

    // Load trainings on mount if not provided
    useEffect(() => {
        if (trainings.length === 0) {
            loadTrainings();
        }
    }, []);

    const loadTrainings = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/user/trainings');
            setTrainingList(response.data.trainings || []);
        } catch (error) {
            console.error('Failed to load trainings:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter trainings
    const filteredTrainings = trainingList.filter(t => {
        const matchesFilter = filter === 'all' || t.status === filter;
        const matchesSearch = !searchQuery || 
            t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    // Calculate stats
    const totalCount = trainingList.length;
    const inProgressCount = trainingList.filter(t => t.status === 'in_progress').length;
    const completedCount = trainingList.filter(t => t.status === 'completed').length;
    const notStartedCount = trainingList.filter(t => t.status === 'not_started').length;

    return (
        <AppLayout user={user}>
            <Head title="Training Saya" />

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl" />
                
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="text-yellow-400" size={20} />
                        <span className="text-blue-200 text-sm font-medium">Program Pelatihan Anda</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Training Saya</h1>
                    <p className="text-blue-100">Kelola dan pantau semua program pelatihan yang ditugaskan kepada Anda</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-5 border border-slate-200"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <BookOpen className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900">{totalCount}</p>
                            <p className="text-xs text-slate-500 font-medium">Total Training</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl p-5 border border-slate-200"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                            <PlayCircle className="text-amber-600" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900">{inProgressCount}</p>
                            <p className="text-xs text-slate-500 font-medium">Sedang Berjalan</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl p-5 border border-slate-200"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <CheckCircle2 className="text-emerald-600" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900">{completedCount}</p>
                            <p className="text-xs text-slate-500 font-medium">Selesai</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl p-5 border border-slate-200"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                            <Clock className="text-slate-600" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900">{notStartedCount}</p>
                            <p className="text-xs text-slate-500 font-medium">Belum Dimulai</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Search & Filter */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Cari training..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    
                    {/* Filter Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        <FilterTab 
                            active={filter === 'all'} 
                            label="Semua" 
                            count={totalCount}
                            onClick={() => setFilter('all')} 
                        />
                        <FilterTab 
                            active={filter === 'in_progress'} 
                            label="Berlangsung" 
                            count={inProgressCount}
                            onClick={() => setFilter('in_progress')} 
                        />
                        <FilterTab 
                            active={filter === 'not_started'} 
                            label="Belum Mulai" 
                            count={notStartedCount}
                            onClick={() => setFilter('not_started')} 
                        />
                        <FilterTab 
                            active={filter === 'completed'} 
                            label="Selesai" 
                            count={completedCount}
                            onClick={() => setFilter('completed')} 
                        />
                    </div>
                </div>
            </div>

            {/* Training Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                </div>
            ) : filteredTrainings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTrainings.map((training, index) => (
                        <TrainingCard key={training.id} training={training} index={index} />
                    ))}
                </div>
            ) : (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-2xl border border-slate-200 p-12 text-center"
                >
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="text-slate-400" size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Tidak Ada Training</h3>
                    <p className="text-slate-500">
                        {searchQuery 
                            ? 'Tidak ada training yang sesuai dengan pencarian Anda'
                            : 'Belum ada training yang ditugaskan kepada Anda'}
                    </p>
                </motion.div>
            )}
        </AppLayout>
    );
}
