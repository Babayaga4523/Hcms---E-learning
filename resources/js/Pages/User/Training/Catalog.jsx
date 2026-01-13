import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { 
    Search, Filter, Star, Clock, Users, BookOpen, 
    TrendingUp, Award, Play, ChevronDown, Grid3x3, 
    List, Sparkles, Target, Zap, Shield, Briefcase,
    X, Check, Calendar, ArrowRight, AlertCircle, CheckCircle, Loader2
} from 'lucide-react';
import showToast from '@/Utils/toast';
import { motion, AnimatePresence } from 'framer-motion';

// --- Wondr Styles ---
const WondrStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        .wondr-font { font-family: 'Plus Jakarta Sans', sans-serif; }
        
        .training-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .training-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 40px rgba(0, 94, 84, 0.15);
        }
        
        .filter-chip {
            transition: all 0.2s ease;
        }
        .filter-chip:hover {
            transform: scale(1.05);
        }
        
        .category-badge {
            position: relative;
            overflow: hidden;
        }
        .category-badge::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            transition: left 0.5s;
        }
        .category-badge:hover::before {
            left: 100%;
        }
    `}</style>
);

// --- Sample Data (Replace with API call) ---
const CATEGORIES = [
    { id: 'all', name: 'Semua', icon: Grid3x3, color: 'slate' },
    { id: 'compliance', name: 'Compliance', icon: Shield, color: 'blue' },
    { id: 'leadership', name: 'Leadership', icon: Target, color: 'purple' },
    { id: 'technical', name: 'Technical', icon: Zap, color: 'amber' },
    { id: 'soft-skills', name: 'Soft Skills', icon: Users, color: 'green' },
    { id: 'product', name: 'Product Knowledge', icon: Briefcase, color: 'red' }
];

const DIFFICULTY_LEVELS = [
    { value: 'all', label: 'Semua Level' },
    { value: 'beginner', label: 'Pemula', color: 'green' },
    { value: 'intermediate', label: 'Menengah', color: 'amber' },
    { value: 'advanced', label: 'Lanjutan', color: 'red' }
];

const SORT_OPTIONS = [
    { value: 'newest', label: 'Terbaru' },
    { value: 'popular', label: 'Terpopuler' },
    { value: 'rating', label: 'Rating Tertinggi' },
    { value: 'title', label: 'Judul A-Z' }
];

// --- Sub Components ---
const TrainingCard = ({ training }) => {
    const getCategoryColor = (category) => {
        const cat = CATEGORIES.find(c => c.id === category);
        return cat?.color || 'slate';
    };

    const getDifficultyColor = (level) => {
        const diff = DIFFICULTY_LEVELS.find(d => d.value === level);
        return diff?.color || 'slate';
    };

    const colorMap = {
        slate: 'bg-slate-100 text-slate-700',
        blue: 'bg-blue-100 text-blue-700',
        purple: 'bg-purple-100 text-purple-700',
        amber: 'bg-amber-100 text-amber-700',
        green: 'bg-green-100 text-green-700',
        red: 'bg-red-100 text-red-700'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="training-card bg-white rounded-2xl overflow-hidden border border-slate-200 wondr-font"
        >
            {/* Thumbnail */}
            <div className="relative h-48 bg-gradient-to-br from-[#005E54] to-[#002824] overflow-hidden group">
                {training.thumbnail ? (
                    <img src={training.thumbnail} alt={training.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <BookOpen size={64} className="text-[#D6F84C] opacity-50" />
                    </div>
                )}
                
                {/* Overlay Info */}
                <div className="absolute top-3 left-3 flex gap-2">
                    <span className={`category-badge px-3 py-1 ${colorMap[getCategoryColor(training.category)]} rounded-full text-xs font-bold`}>
                        {CATEGORIES.find(c => c.id === training.category)?.name}
                    </span>
                    {training.is_new && (
                        <span className="px-3 py-1 bg-[#D6F84C] text-[#002824] rounded-full text-xs font-bold flex items-center gap-1">
                            <Sparkles size={12} /> Baru
                        </span>
                    )}
                </div>

                {training.enrolled && (
                    <div className="absolute top-3 right-3">
                        <div className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <Check size={20} className="text-green-600" />
                        </div>
                    </div>
                )}

                {/* Play Button Overlay on Hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform">
                        <Play size={28} className="text-[#005E54] ml-1" />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
                {/* Title */}
                <div>
                    <h3 className="text-lg font-extrabold text-slate-900 leading-tight mb-2 line-clamp-2 hover:text-[#005E54] transition-colors">
                        <Link href={`/training/${training.id}`}>
                            {training.title}
                        </Link>
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-2">{training.description}</p>
                </div>

                {/* Meta Info */}
                <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{training.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Users size={14} />
                        <span>{training.enrolled_count} Peserta</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Star size={14} className="fill-amber-400 text-amber-400" />
                        {training.rating ? (
                            <span className="font-bold text-slate-700">{Number(training.rating).toFixed(1)}</span>
                        ) : (
                            <span className="text-slate-400">—</span>
                        )}
                    </div>
                </div>

                {/* Difficulty & Instructor */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className={`px-3 py-1 ${colorMap[getDifficultyColor(training.difficulty)]} rounded-lg text-xs font-bold`}>
                        {DIFFICULTY_LEVELS.find(d => d.value === training.difficulty)?.label}
                    </span>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#005E54] to-[#002824] flex items-center justify-center text-[10px] font-bold text-white">
                            {training.instructor.charAt(0)}
                        </div>
                        <span className="text-xs text-slate-600 font-medium">{training.instructor}</span>
                    </div>
                </div>

                {/* Action Button */}
                <div className="pt-2">
                    {training.enrolled ? (
                        <Link
                            href={`/training/${training.id}`}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#F0FDF4] text-[#005E54] rounded-xl font-bold hover:bg-[#005E54] hover:text-white transition-all group"
                        >
                            Lanjutkan Belajar
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    ) : (
                        <button
                            onClick={async (e) => {
                                const btn = e.currentTarget;
                                try {
                                    // Disable/enroll feedback
                                    btn.setAttribute('disabled', 'disabled');

                                    await axios.post(`/api/training/${training.id}/start`);

                                    // navigate to training detail
                                    window.location.href = `/training/${training.id}`;
                                } catch (err) {
                                    console.error('Enroll failed', err);
                                    if (err?.response?.status === 401) {
                                        window.location.href = '/login';
                                        return;
                                    }
                                    const serverMsg = err?.response?.data?.message
                                        || (err?.response?.data?.errors && Object.values(err.response.data.errors)[0]?.[0])
                                        || 'Gagal mendaftar. Coba lagi.';
                                    showToast(serverMsg, 'error');
                                    btn.removeAttribute('disabled');
                                }
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#005E54] text-white rounded-xl font-bold hover:bg-[#00403a] transition-all group"
                        >
                            Daftar Sekarang
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// Card for user's enrolled trainings (shows progress & action)
const EnrolledCard = ({ training }) => {
    const status = training.enrollment_status || training.enrollment_status || '';
    const progress = training.progress ?? 0;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between">
            <div>
                <h4 className="font-bold text-slate-900 text-lg line-clamp-2">{training.title}</h4>
                {training.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{training.description}</p>}

                <div className="mt-3">
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="h-2 bg-emerald-500" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                        <span>{progress}%</span>
                        <span className="capitalize">{status.replace('_', ' ')}</span>
                    </div>
                </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
                {status === 'completed' ? (
                    <Link href={`/training/${training.id}/results`} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50">Review Hasil</Link>
                ) : (
                    <Link href={`/training/${training.id}`} className="px-4 py-2 bg-[#005E54] text-white rounded-xl text-sm font-bold hover:bg-[#00403a]">Lanjutkan</Link>
                )}
            </div>
        </div>
    );
};

const FilterSidebar = ({ filters, setFilters, onFilterChange, isMobile, onClose }) => {
    const FilterSection = ({ title, children }) => (
        <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</h4>
            {children}
        </div>
    );

    const handleFilterUpdate = (newFilters) => {
        setFilters(newFilters);
        if (onFilterChange) {
            onFilterChange(newFilters);
        }
    };

    const content = (
        <div className="space-y-6">
            {/* Category Filter */}
            <FilterSection title="Kategori">
                <div className="space-y-2">
                    {CATEGORIES.map(category => {
                        const Icon = category.icon;
                        const isActive = filters.category === category.id;
                        return (
                            <button
                                key={category.id}
                                onClick={() => handleFilterUpdate({ ...filters, category: category.id })}
                                className={`filter-chip w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                                    isActive 
                                        ? 'bg-[#005E54] text-white shadow-lg' 
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <Icon size={18} />
                                <span className="text-sm">{category.name}</span>
                            </button>
                        );
                    })}
                </div>
            </FilterSection>

            {/* Difficulty Filter */}
            <FilterSection title="Level Kesulitan">
                <div className="space-y-2">
                    {DIFFICULTY_LEVELS.map(level => {
                        const isActive = filters.difficulty === level.value;
                        return (
                            <button
                                key={level.value}
                                onClick={() => handleFilterUpdate({ ...filters, difficulty: level.value })}
                                className={`filter-chip w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                    isActive 
                                        ? 'bg-[#005E54] text-white' 
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                {level.label}
                            </button>
                        );
                    })}
                </div>
            </FilterSection>

            {/* Reset Button */}
            <button
                onClick={() => handleFilterUpdate({ category: 'all', difficulty: 'all', search: '' })}
                className="w-full px-4 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
            >
                <X size={18} />
                Reset Filter
            </button>
        </div>
    );

    if (isMobile) {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ x: -300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -300, opacity: 0 }}
                    className="fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl p-6 overflow-y-auto"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-extrabold text-slate-900">Filter</h3>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition">
                            <X size={24} />
                        </button>
                    </div>
                    {content}
                </motion.div>
            </AnimatePresence>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-24">
            {content}
        </div>
    );
};

// --- Main Component ---
const Catalog = ({ trainings: initialTrainings = [], filters: initialFilters = {}, sortBy: initialSort = 'newest', auth, flash }) => {
    const [filters, setFilters] = useState({
        category: initialFilters.category || 'all',
        difficulty: initialFilters.difficulty || 'all',
        search: initialFilters.search || ''
    });
    const [sortBy, setSortBy] = useState(initialSort);
    const [viewMode, setViewMode] = useState('grid'); // grid or list
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

    // Trainings state (fetched from backend). Initialize from server-passed prop if present
    const [trainings, setTrainings] = useState(Array.isArray(initialTrainings) ? initialTrainings : []);
    const [trainingsLoading, setTrainingsLoading] = useState(false);
    const [trainingsPage, setTrainingsPage] = useState(1);
    const [trainingsTotalPages, setTrainingsTotalPages] = useState(1);
    const [trainingsError, setTrainingsError] = useState(null);

    // Search/loading ui state (derived)
    const [isSearching, setIsSearching] = useState(false); // still used for input spinner

    // Apply filters and sorting via URL (server-side)
    const applyFilters = (newFilters, newSort = sortBy) => {
        const params = new URLSearchParams();
        
        if (newFilters.category !== 'all') {
            params.append('category', newFilters.category);
        }
        if (newFilters.difficulty !== 'all') {
            params.append('difficulty', newFilters.difficulty);
        }
        if (newFilters.search) {
            params.append('search', newFilters.search);
        }
        if (newSort !== 'newest') {
            params.append('sort', newSort);
        }

        router.visit(`/catalog?${params.toString()}`, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Handle filter change
    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        applyFilters(newFilters);
    };

    // Handle sort change
    const handleSortChange = (newSort) => {
        setSortBy(newSort);
        applyFilters(filters, newSort);
    };

    // Handle search with debounce (server-side search endpoint /api/user/trainings)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (filters.search !== initialFilters.search) {
                // Trigger a fetch with new search term
                fetchTrainings(1);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [filters.search, filters.category, filters.difficulty, sortBy]);

    // Fetch initial trainings on mount
    useEffect(() => {
        fetchTrainings(1);
    }, []);

    // --- Remove sample/dummy fallback for production. Use data from server only.
    // Available trainings are provided from server as `initialTrainings` prop.
    const availableTrainings = Array.isArray(initialTrainings) ? initialTrainings : [];

    // Use backend user trainings state (enrolled/in-progress/completed)
    const displayTrainings = trainings;

    // Fetch trainings from backend with filters (GET /api/trainings?...)
    const fetchTrainings = async (page = 1) => {
        setTrainingsLoading(true);
        setTrainingsError(null);
        setIsSearching(true);

        const params = new URLSearchParams();
        if (filters.category && filters.category !== 'all') params.append('category', filters.category);
        if (filters.difficulty && filters.difficulty !== 'all') params.append('difficulty', filters.difficulty);
        if (filters.search && filters.search.trim()) params.append('search', filters.search.trim());
        if (sortBy && sortBy !== 'newest') params.append('sort', sortBy);
        params.append('page', page);

        try {
            const url = `/api/user/trainings?${params.toString()}`;
            console.log('fetchTrainings requesting', url);
            const res = await fetch(url, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });

            // If the server redirected us to login or returned 401, go to login
            if (res.redirected || res.status === 401 || (res.url && res.url.includes('/login'))) {
                console.warn('fetchTrainings detected unauthenticated response, redirecting to login.');
                window.location.href = '/login';
                return;
            }

            if (!res.ok) {
                console.error('fetchTrainings response', res.status, res.statusText, url);
                // Try parse message for better error
                let body = null;
                try { body = await res.json(); } catch (e) { /* ignore */ }
                const msg = body?.message || `Network response not ok: ${res.status}`;
                throw new Error(msg);
            }

            const data = await res.json();

            if (Array.isArray(data)) {
                setTrainings(data);
                setTrainingsTotalPages(1);
            } else if (data.data) {
                setTrainings(Array.isArray(data.data) ? data.data : []);
                const last = data?.meta?.last_page || data?.last_page || 1;
                setTrainingsTotalPages(Number(last));
            } else {
                setTrainings([]);
                setTrainingsTotalPages(1);
            }

            setTrainingsPage(page);
        } catch (err) {
            console.error('Fetch trainings failed:', err);
            setTrainingsError(err?.message || 'Gagal memuat daftar training');
            setTrainings([]);
            setTrainingsTotalPages(1);
        } finally {
            setTrainingsLoading(false);
            setIsSearching(false);
        }
    };

    // Current list to render
    const currentList = displayTrainings;

    // User-enrolled trainings (completed/in_progress/not_started)
    const [enrolledTrainings, setEnrolledTrainings] = useState([]);
    const [enrolledPage, setEnrolledPage] = useState(1);
    const [enrolledTotalPages, setEnrolledTotalPages] = useState(1);
    const [enrolledLoading, setEnrolledLoading] = useState(false);
    const [enrolledError, setEnrolledError] = useState(null);
    const [enrolledStatusFilter, setEnrolledStatusFilter] = useState('all');
    const [enrolledStats, setEnrolledStats] = useState({ total: 0, in_progress: 0, completed: 0, not_started: 0 });

    // Merge user's trainings (on top) with available trainings
    const mergedTrainings = (() => {
        const enrolledIds = new Set(enrolledTrainings.map(t => t.id));
        const remaining = availableTrainings.filter(a => !enrolledIds.has(a.id));
        return [
            ...enrolledTrainings.map(t => ({ ...t, _isEnrolled: true })),
            ...remaining
        ];
    })();

    // Fetch enrolled trainings for the current user (API: /api/user/trainings)
    const fetchEnrolledTrainings = async (status = 'all', page = 1) => {
        setEnrolledLoading(true);
        setEnrolledError(null);

        const params = new URLSearchParams();
        if (status && status !== 'all') params.append('status', status);
        if (filters.search && filters.search.trim()) params.append('search', filters.search.trim());
        params.append('page', page);

        try {
            const url = `/api/user/trainings?${params.toString()}`;
            console.log('fetchEnrolledTrainings requesting', url);
            const res = await fetch(url, { headers: { Accept: 'application/json' } });
            if (!res.ok) {
                console.error('fetchEnrolledTrainings response', res.status, res.statusText, url);
                throw new Error(`Network response not ok: ${res.status}`);
            }
            const data = await res.json();

            // API returns { success:true, trainings: Pagination, stats }
            const pageData = data.trainings || data.data || [];
            const items = Array.isArray(pageData.data) ? pageData.data : ([]);
            setEnrolledTrainings(items);
            const lastPage = (pageData?.last_page) || (data.trainings?.last_page) || 1;
            setEnrolledTotalPages(Number(lastPage));
            setEnrolledPage(page);

            if (data.stats) setEnrolledStats(data.stats);
        } catch (err) {
            console.error('Fetch enrolled trainings failed:', err);
            setEnrolledError('Gagal memuat daftar training Anda');
            setEnrolledTrainings([]);
            setEnrolledTotalPages(1);
        } finally {
            setEnrolledLoading(false);
        }
    };

    // Load enrolled trainings on mount
    useEffect(() => {
        fetchEnrolledTrainings(enrolledStatusFilter, 1);
    }, []);

    return (
        <AppLayout user={auth?.user}>
            <Head title="Katalog Training" />
            <WondrStyles />
            
            {/* Flash Messages */}
            {flash?.error && (
                <div className="fixed top-24 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl z-[70] flex items-center gap-3 bg-red-600 text-white animate-slide-down">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-bold text-sm">{flash.error}</span>
                </div>
            )}
            
            {flash?.warning && (
                <div className="fixed top-24 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl z-[70] flex items-center gap-3 bg-amber-600 text-white animate-slide-down">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-bold text-sm">{flash.warning}</span>
                </div>
            )}
            
            {flash?.success && (
                <div className="fixed top-24 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl z-[70] flex items-center gap-3 bg-[#002824] text-white animate-slide-down">
                    <CheckCircle className="w-5 h-5 text-[#D6F84C]" />
                    <span className="font-bold text-sm">{flash.success}</span>
                </div>
            )}

            <div className="wondr-font">
                {/* Hero Section */}
                <div className="bg-gradient-to-br from-[#002824] to-[#005E54] rounded-3xl p-8 md:p-12 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#D6F84C] rounded-full blur-[150px] opacity-20"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-[#D6F84C] rounded-2xl">
                                <BookOpen size={32} className="text-[#002824]" />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
                                    Katalog Training
                                </h1>
                                <p className="text-[#D6F84C] font-bold text-sm">Eksplorasi & Tingkatkan Kompetensi Anda</p>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="mt-6 max-w-2xl">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Cari training berdasarkan judul atau deskripsi..."
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    className="w-full pl-12 pr-12 py-4 bg-white/95 backdrop-blur-sm rounded-2xl border-2 border-transparent focus:border-[#D6F84C] outline-none text-slate-900 font-medium placeholder:text-slate-400"
                                />
                                {/* Right-side control: loading spinner or clear button */}
                                {isSearching ? (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 animate-spin" />
                                ) : filters.search ? (
                                    <button type="button" onClick={() => { setFilters({ ...filters, search: '' }); setTrainingsError(null); fetchTrainings(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-slate-100">
                                        <X className="w-4 h-4 text-slate-500" />
                                    </button>
                                ) : null} 
                            </div>
                        </div>

                        {/* Hero stats (improved) */}
                        <div className="mt-6 flex flex-wrap gap-6 items-center">
                            <div className="bg-white/10 rounded-lg px-4 py-2 flex items-center gap-3">
                                <BookOpen size={18} className="text-white/90" />
                                <div className="text-white text-sm">
                                    <div className="font-bold text-base">{mergedTrainings.length}</div>
                                    <div className="text-xs">Training Tersedia</div>
                                </div>
                            </div>

                            <div className="bg-white/10 rounded-lg px-4 py-2 flex items-center gap-3">
                                <Award size={18} className="text-white/90" />
                                <div className="text-white text-sm">
                                    <div className="font-bold text-base">{enrolledStats?.completed ?? '-'}</div>
                                    <div className="text-xs">Selesai oleh Anda</div>
                                </div>
                            </div>


                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileFilterOpen(true)}
                            className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                            <Filter size={18} />
                            Filter
                        </button>

                        <div className="text-sm text-slate-600 font-medium">
                            Menampilkan <span className="font-bold text-slate-900">{mergedTrainings.length}</span> training
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Sort Dropdown */}
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => handleSortChange(e.target.value)}
                                className="pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-sm text-slate-700 outline-none cursor-pointer appearance-none hover:border-[#005E54] transition"
                            >
                                {SORT_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>

                        {/* View Mode Toggle */}
                        <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-white text-[#005E54] shadow-sm' : 'text-slate-400'}`}
                            >
                                <Grid3x3 size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-white text-[#005E54] shadow-sm' : 'text-slate-400'}`}
                            >
                                <List size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Filter Sidebar - Desktop */}
                    <div className="hidden lg:block lg:col-span-3">
                        <FilterSidebar 
                            filters={filters} 
                            setFilters={setFilters} 
                            onFilterChange={handleFilterChange}
                            isMobile={false} 
                        />
                    </div>

                    {/* Training Grid */}
                    <div className="lg:col-span-9">
                        {/* Search status */}
                        {filters.search && !isSearching && (
                            <div className="mb-4 text-sm text-slate-600">Menampilkan hasil untuk "{filters.search}"</div>
                        )}
                        {trainingsError && (
                            <div className="mb-4 text-sm text-red-500">{trainingsError}</div>
                        )}

                        {/* Merged trainings: enrolled trainings first, then available trainings */}
                        {mergedTrainings.length > 0 ? (
                            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                                {mergedTrainings.map((t) => (
                                    (t.enrollment_status || t._isEnrolled || t.enrolled) ? (
                                        <EnrolledCard key={t.id} training={t} />
                                    ) : (
                                        <TrainingCard key={t.id} training={t} />
                                    )
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-4">
                                    <Search size={40} className="text-slate-400" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Tidak Ada Training Ditemukan</h3>
                                <p className="text-slate-500 mb-6">Coba ubah filter atau kata kunci pencarian Anda.</p>
                                <button
                                    onClick={() => handleFilterChange({ category: 'all', difficulty: 'all', search: '' })}
                                    className="px-6 py-3 bg-[#005E54] text-white rounded-xl font-bold hover:bg-[#00403a] transition"
                                >
                                    Reset Filter
                                </button>
                            </div>
                        )}

                        {/* Pagination for search results */}
                        {filters.search && trainingsTotalPages > 1 && (
                            <div className="mt-6 flex items-center justify-center gap-3">
                                <button disabled={trainingsPage <= 1 || isSearching} onClick={() => fetchTrainings(trainingsPage - 1)} className="px-3 py-2 rounded bg-white border">Prev</button>
                                <span className="text-sm">Halaman {trainingsPage} dari {trainingsTotalPages}</span>
                                <button disabled={trainingsPage >= trainingsTotalPages || isSearching} onClick={() => fetchTrainings(trainingsPage + 1)} className="px-3 py-2 rounded bg-white border">Next</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Filter Overlay */}
            {mobileFilterOpen && (
                <>
                    <div 
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setMobileFilterOpen(false)}
                    />
                    <FilterSidebar 
                        filters={filters} 
                        setFilters={setFilters} 
                        onFilterChange={handleFilterChange}
                        isMobile={true}
                        onClose={() => setMobileFilterOpen(false)}
                    />
                </>
            )}
        </AppLayout>
    );
};

export default Catalog;
