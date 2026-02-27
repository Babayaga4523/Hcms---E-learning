import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { extractData } from '@/Utilities/apiResponseHandler';
import ErrorBoundary from '@/Components/ErrorBoundary';
import axiosInstance from '@/Services/axiosInstance';
import { API_ENDPOINTS } from '@/Config/api';
import { 
    BookOpen, Clock, Award, PlayCircle, CheckCircle2, 
    AlertTriangle, Search, Filter, Calendar, TrendingUp,
    ChevronRight, Target, BarChart3, Timer, Sparkles,
    MoreHorizontal, Download, ArrowRight, Zap
} from 'lucide-react';

// --- Wondr Style System ---
const WondrStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        .wondr-trainings { font-family: 'Plus Jakarta Sans', sans-serif; }
        
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

        .course-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid #E2E8F0;
        }
        .course-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 25px -5px rgba(0, 94, 84, 0.1);
            border-color: #005E54;
        }

        .hero-pattern {
            background-color: #002824;
            background-image: radial-gradient(#005E54 1px, transparent 1px);
            background-size: 24px 24px;
        }

        .progress-bar-animated {
            background: linear-gradient(90deg, #005E54, #D6F84C);
            background-size: 200% 100%;
            animation: gradientMove 2s infinite linear;
        }
        
        @keyframes gradientMove {
            0% { background-position: 100% 0; }
            100% { background-position: -100% 0; }
        }

        .input-wondr {
            background: #F1F5F9;
            border: 1px solid transparent;
            border-radius: 14px;
            transition: all 0.3s ease;
        }
        .input-wondr:focus {
            background: #FFFFFF;
            border-color: #005E54;
            box-shadow: 0 0 0 4px rgba(0, 94, 84, 0.1);
            outline: none;
        }

        .tab-pill { transition: all 0.3s ease; }
        .tab-pill.active { background-color: #002824; color: #D6F84C; }

        .animate-fade-up { animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `}</style>
);

// --- Components ---

const StatBadge = ({ icon: Icon, value, label, delay }) => (
    <div 
        className="glass-panel px-5 py-4 rounded-[20px] flex items-center gap-4 min-w-[160px] animate-fade-up"
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className="p-3 bg-[#E6FFFA] rounded-full text-[#005E54]">
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <h4 className="text-2xl font-extrabold text-slate-900 leading-none">{value}</h4>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{label}</p>
        </div>
    </div>
);

const FeaturedCourse = ({ course }) => {
    if (!course) return null;
    return (
        <div className="w-full bg-[#002824] rounded-[32px] p-1 shadow-2xl shadow-[#002824]/20 animate-fade-up">
            <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#00403a] to-[#002824] p-8 md:p-10 flex flex-col md:flex-row items-start gap-8">
                {/* Abstract BG */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#005E54] rounded-full blur-[80px] opacity-30 -translate-y-1/2 translate-x-1/4"></div>
                
                <div className="flex-1 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[#D6F84C] text-xs font-bold uppercase tracking-wider mb-4 border border-white/10">
                        <Zap className="w-3 h-3" /> Lanjutkan Belajar
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3 leading-tight">
                        {course.title}
                    </h2>
                    <p className="text-slate-300 mb-6 text-sm md:text-base leading-relaxed max-w-2xl">
                        {course.description || 'Lanjutkan progres Anda untuk menyelesaikan modul ini dan dapatkan sertifikat kompetensi.'}
                    </p>
                    
                    <div className="flex items-center gap-6 mb-8">
                        <div className="flex-1 max-w-xs">
                            <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                                <span>Progress</span>
                                <span className="text-[#D6F84C]">{course.progress}%</span>
                            </div>
                            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-[#D6F84C] rounded-full transition-all duration-500" style={{ width: `${course.progress}%` }}></div>
                            </div>
                        </div>
                    </div>

                    <Link 
                        href={`/training/${course.id}`}
                        className="group inline-flex items-center gap-3 px-8 py-4 bg-[#D6F84C] hover:bg-[#c2e43c] text-[#002824] rounded-2xl font-bold shadow-lg shadow-[#D6F84C]/20 transition-all hover:scale-105"
                    >
                        <PlayCircle className="w-5 h-5 fill-current" />
                        <span>Lanjutkan Kursus</span>
                        <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
                
                {/* Decorative Circle/Image Area */}
                <div className="hidden md:flex relative z-10 w-48 h-48 bg-gradient-to-br from-[#005E54] to-transparent rounded-full items-center justify-center border border-white/10 backdrop-blur-sm">
                    <div className="text-center">
                        <div className="text-5xl font-black text-white">{course.progress}<span className="text-2xl text-[#D6F84C]">%</span></div>
                        <div className="text-xs font-bold text-slate-300 uppercase mt-1">Completed</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CourseCard = ({ training, index }) => {
    const isCompleted = training.status === 'completed' && training.progress >= 100;
    const isOverdue = training.status === 'overdue';

    return (
        <div 
            className="course-card bg-white rounded-[24px] p-6 flex flex-col h-full animate-fade-up"
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                    {training.category || 'Training'}
                </span>
                {training.is_mandatory && (
                    <span className="px-2 py-1 rounded-md bg-red-50 text-red-600 text-[10px] font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Wajib
                    </span>
                )}
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 leading-tight group-hover:text-[#005E54] transition-colors">
                {training.title}
            </h3>

            <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                {training.description || 'Tidak ada deskripsi'}
            </p>

            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium mb-6">
                <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {training.duration || 0}m
                </span>
                <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" /> {training.materials_count || 0} Modul
                </span>
            </div>

            <div className="mt-auto">
                {isCompleted ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-green-600 text-sm font-bold">
                            <CheckCircle2 className="w-5 h-5" /> Selesai
                        </div>
                        {(training.is_certified === 1 || training.is_certified === true) && (
                            <Link href={`/training/${training.id}/certificate`} className="text-xs font-bold text-[#005E54] hover:underline flex items-center gap-1">
                                <Download className="w-3 h-3" /> Sertifikat
                            </Link>
                        )}
                    </div>
                ) : (
                    <div>
                        <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                            <span>Progress</span>
                            <span className={isOverdue ? 'text-red-500' : 'text-[#005E54]'}>{training.progress || 0}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                            <div 
                                className={`h-full rounded-full transition-all duration-500 ${isOverdue ? 'bg-red-500' : 'bg-[#005E54]'}`} 
                                style={{ width: `${training.progress || 0}%` }}
                            ></div>
                        </div>
                        <Link 
                            href={`/training/${training.id}`}
                            className="block w-full py-2.5 rounded-xl border-2 border-slate-100 text-slate-600 font-bold text-sm text-center hover:border-[#005E54] hover:text-[#005E54] transition-all"
                        >
                            {training.progress > 0 ? 'Lanjutkan' : 'Mulai'}
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Main Layout ---

export default function MyTrainings({ auth }) {
    const user = auth?.user || {};
    
    const [stats, setStats] = useState({
        total: 0,
        in_progress: 0,
        completed: 0,
        not_started: 0,
        certifications: 0
    });

    const [trainings, setTrainings] = useState([]);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    // Server-side search state
    const [searchResults, setSearchResults] = useState(null);
    const [searchPage, setSearchPage] = useState(1);
    const [searchTotalPages, setSearchTotalPages] = useState(1);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState(null);

    // Load trainings on mount
    useEffect(() => {
        let isMounted = true;
        
        loadTrainings(isMounted);

        return () => {
            isMounted = false;
        };
    }, []);

    // Debounced server-side search when `searchQuery` changes
    useEffect(() => {
        const handler = setTimeout(() => {
            if (!searchQuery || !searchQuery.trim()) {
                // empty query -> clear search results
                setSearchResults(null);
                setSearchPage(1);
                setSearchTotalPages(1);
            } else {
                fetchSearch(1);
            }
        }, 400); // 400ms debounce

        return () => clearTimeout(handler);
    }, [searchQuery]);

    const loadTrainings = async (isMounted) => {
        try {
            const response = await axiosInstance.get(API_ENDPOINTS.USER_TRAININGS);
            
            // Only update state if component is still mounted
            if (!isMounted) return;
            
            // Extract data from inconsistent API response format
            const trainingsData = extractData(response.data);
            console.log('Raw trainings from backend:', trainingsData); // DEBUG
            
            const transformedTrainings = trainingsData.map(t => {
                // Normalize status: backend uses 'enrolled' for not started
                let status = t.enrollment_status || t.status || 'enrolled';
                // Map 'enrolled' to 'not_started' for frontend consistency
                if (status === 'enrolled') status = 'not_started';
                
                const transformed = {
                    id: t.id,
                    title: t.title,
                    description: t.description,
                    status: status,
                    progress: t.progress || 0,
                    duration: t.duration_minutes || t.duration || 0,
                    category: t.category,
                    is_mandatory: t.is_mandatory,
                    due_date: t.expiry_date || t.end_date,
                    materials_count: t.materials_count || t.modules_count || 0,
                    is_certified: t.is_certified === 1 || t.is_certified === true
                };
                console.log(`Training "${t.title}" - Status: ${transformed.status}, Progress: ${transformed.progress}, Is Certified: ${transformed.is_certified}`); // DEBUG
                return transformed;
            });
            
            console.log('Transformed trainings:', transformedTrainings); // DEBUG
            setTrainings(transformedTrainings);
            
            // Set stats from response or calculate
            if (response.data.stats) {
                setStats({
                    total: response.data.stats.total || 0,
                    in_progress: response.data.stats.in_progress || 0,
                    completed: response.data.stats.completed || 0,
                    not_started: response.data.stats.not_started || 0,
                    certifications: response.data.stats.certifications || transformedTrainings.filter(t => (t.is_certified === 1 || t.is_certified === true) && t.status === 'completed').length
                });
            } else {
                // Calculate stats from trainings
                setStats({
                    total: transformedTrainings.length,
                    in_progress: transformedTrainings.filter(t => t.status === 'in_progress').length,
                    completed: transformedTrainings.filter(t => t.status === 'completed' && t.progress >= 100).length,
                    not_started: transformedTrainings.filter(t => t.status === 'not_started').length,
                    certifications: transformedTrainings.filter(t => (t.is_certified === 1 || t.is_certified === true) && t.status === 'completed' && t.progress >= 100).length
                });
            }
        } catch (error) {
            console.error('Failed to load trainings:', error);
            // Only update state if component is still mounted
            if (!isMounted) return;
            // Log error but don't display - trainings will show empty state
            const msg = error?.response?.data?.message || error?.message || 'Gagal memuat data dari server';
            console.warn('Training fetch error:', msg);
        } finally {
            // Only update state if component is still mounted
            if (!isMounted) return;
            setLoading(false);
        }
    };

    // Server-side search function
    const fetchSearch = async (page = 1) => {
        if (!searchQuery || !searchQuery.trim()) {
            setSearchResults(null);
            setSearchPage(1);
            setSearchTotalPages(1);
            return;
        }

        setSearchLoading(true);
        setSearchError(null);

        try {
            const res = await axiosInstance.get(API_ENDPOINTS.USER_TRAININGS, { params: { search: searchQuery, page } });
            const data = res.data.trainings?.data || res.data.trainings || [];

            // try to read pagination meta (common Laravel structure)
            const meta = res.data.trainings?.meta || res.data.meta || {};
            const current = res.data.trainings?.current_page || meta.current_page || page;
            const last = res.data.trainings?.last_page || meta.last_page || (meta.total && meta.per_page ? Math.ceil(meta.total / meta.per_page) : page);

            setSearchResults(Array.isArray(data) ? data : []);
            setSearchPage(current || page);
            setSearchTotalPages(last || 1);
        } catch (err) {
            console.error('Search failed:', err);
            setSearchError('Gagal melakukan pencarian.');
            setSearchResults([]);
            setSearchPage(1);
            setSearchTotalPages(1);
        } finally {
            setSearchLoading(false);
        }
    };
    // Featured Course (First in-progress mandatory course, or just first in-progress)
    const featuredCourse = useMemo(() => {
        return trainings.find(t => t.status === 'in_progress' && t.is_mandatory) || 
               trainings.find(t => t.status === 'in_progress');
    }, [trainings]);

    // Safe flag for rendering featured course (protect against HMR partial states)
    const showFeatured = (() => {
        try {
            return activeTab !== 'completed' && featuredCourse && !searchQuery;
        } catch (e) {
            console.warn('featuredCourse not available yet:', e);
            return false;
        }
    })();

    // Filtering
    const filteredTrainings = useMemo(() => {
        const base = (searchQuery && searchResults !== null) ? searchResults : trainings;

        return base.filter(t => {
            const matchesTab = activeTab === 'all' || 
                               (activeTab === 'active' && (t.status === 'in_progress' || t.status === 'not_started')) ||
                               (activeTab === 'completed' && t.status === 'completed' && t.progress >= 100);
            return matchesTab;
        });
    }, [trainings, activeTab, searchQuery, searchResults]);

    return (
        <AppLayout user={user}>
            <Head title="Training Saya" />
            
            <div className="wondr-trainings min-h-screen bg-[#F8F9FA] pb-20">
                <WondrStyles />

                {/* --- Hero Header --- */}
                <div className="hero-pattern pt-8 pb-40 px-6 lg:px-12 relative rounded-b-[48px] shadow-2xl shadow-[#002824]/20 overflow-hidden -mx-6 lg:-mx-8">
                    <div className="max-w-7xl mx-auto relative z-10">
                        {/* Navbar */}
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#D6F84C] rounded-full flex items-center justify-center font-extrabold text-[#002824] text-xl shadow-lg">L</div>
                                <div className="flex flex-col">
                                    <span className="text-white font-bold tracking-tight text-lg leading-none">Learning</span>
                                    <span className="text-[#D6F84C] text-[10px] font-bold uppercase tracking-widest">Center</span>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold border border-white/20">
                                {user.name?.charAt(0) || 'U'}
                            </div>
                        </div>

                        {/* Greeting & Filter Bar */}
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                            <div>
                                <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
                                    Training Saya
                                </h1>
                                <div className="flex gap-2 p-1 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 w-fit">
                                    {[
                                        { key: 'all', label: 'Semua' },
                                        { key: 'active', label: 'Aktif' },
                                        { key: 'completed', label: 'Selesai' }
                                    ].map(tab => (
                                        <button
                                            key={tab.key}
                                            onClick={() => setActiveTab(tab.key)}
                                            className={`px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${
                                                activeTab === tab.key 
                                                ? 'bg-[#D6F84C] text-[#002824] shadow-lg' 
                                                : 'text-white hover:bg-white/10'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Search Input */}
                            <div className="relative w-full lg:w-96">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 w-5 h-5" />
                                <input 
                                    type="text" 
                                    placeholder="Cari judul training..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoComplete="off"
                                    className="w-full pl-12 pr-20 py-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl text-white placeholder-white/50 focus:bg-white/20 focus:outline-none focus:border-[#D6F84C]/50 transition-all font-medium"
                                />

                                {/* Clear button or Loading */}
                                {searchQuery && !searchLoading && (
                                    <button
                                        type="button"
                                        onClick={() => { setSearchQuery(''); setSearchResults(null); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                                    >
                                        Hapus
                                    </button>
                                )}

                                {/* Search loading indicator */}
                                {searchLoading && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/50"></div>
                                    </div>
                                )}

                                {/* Search Dropdown Preview */}
                                {(searchQuery || searchLoading) && searchResults !== null && (
                                    <div className="absolute top-full left-0 right-0 mt-3 bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto border border-white/10">
                                        {searchLoading ? (
                                            <div className="p-4 text-center">
                                                <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                <p className="text-xs text-white/50 mt-2">Mencari...</p>
                                            </div>
                                        ) : searchError ? (
                                            <div className="p-4 text-center text-yellow-400 text-xs">{searchError}</div>
                                        ) : searchResults && searchResults.length > 0 ? (
                                            <div className="divide-y divide-white/5">
                                                <div className="p-3 bg-white/5 text-xs font-bold text-white/60">
                                                    Ditemukan {searchResults.length} training
                                                </div>
                                                {searchResults.slice(0, 5).map(result => (
                                                    <Link
                                                        key={result.id}
                                                        href={`/training/${result.id}`}
                                                        className="block p-3 hover:bg-white/5 transition"
                                                    >
                                                        <p className="font-semibold text-sm text-white line-clamp-1">{result.title}</p>
                                                        <p className="text-xs text-white/50 line-clamp-1">{result.description}</p>
                                                        {result.progress > 0 && (
                                                            <div className="mt-2 w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                                                <div className="h-full bg-gradient-to-r from-[#D6F84C] to-[#005E54]" style={{ width: `${result.progress}%` }}></div>
                                                            </div>
                                                        )}
                                                    </Link>
                                                ))}
                                                {searchResults.length > 5 && (
                                                    <div className="p-3 text-center border-t border-white/5">
                                                        <span className="text-xs font-semibold text-[#D6F84C]">
                                                            +{searchResults.length - 5} training lainnya
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : searchQuery && !searchLoading ? (
                                            <div className="p-4 text-center text-white/50 text-sm">
                                                Tidak ada training ditemukan untuk "{searchQuery}"
                                            </div>
                                        ) : null}
                                    </div>
                                )}

                                {/* Search error (full width) */}
                                {searchError && !searchLoading && (
                                    <div className="mt-2 text-xs text-red-400">{searchError}</div>
                                )}

                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Main Content --- */}
                <div className="max-w-7xl mx-auto px-6 -mt-24 relative z-20">
                    
                    {/* Stats Row */}
                    <div className="flex overflow-x-auto gap-4 mb-8 pb-4 no-scrollbar">
                        <StatBadge icon={BookOpen} value={stats.total} label="Total Training" delay={0} />
                        <StatBadge icon={Zap} value={stats.in_progress} label="Sedang Berjalan" delay={100} />
                        <StatBadge icon={CheckCircle2} value={stats.completed} label="Selesai" delay={200} />
                        <StatBadge icon={Award} value={stats.certifications} label="Sertifikat" delay={300} />
                    </div>

                    {/* Featured Course */}
                    {activeTab !== 'completed' && typeof featuredCourse !== 'undefined' && featuredCourse && !searchQuery && (
                        <div className="mb-10">
                            <ErrorBoundary label="Kursus Unggulan">
                                <FeaturedCourse course={featuredCourse} />
                            </ErrorBoundary>
                        </div>
                    )}

                    {/* Course Grid */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <Target className="w-5 h-5 text-[#005E54]" />
                                Daftar Training
                            </h3>
                            <span className="text-sm font-bold text-slate-500 flex items-center gap-1">
                                <TrendingUp className="w-4 h-4" /> {filteredTrainings.length} items
                            </span>
                        </div>

                        {loading ? (
                            <div className="py-20 text-center">
                                <div className="animate-spin w-10 h-10 border-4 border-[#005E54] border-t-transparent rounded-full mx-auto mb-4"></div>
                                <p className="text-slate-500 font-medium">Memuat data...</p>
                            </div>
                        ) : filteredTrainings.length > 0 ? (
                            <ErrorBoundary label="Grid Training">
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {filteredTrainings.map((t, idx) => (
                                            <CourseCard key={t.id} training={t} index={idx} />
                                        ))}
                                    </div>

                                    {/* Pagination for server-side search */}
                                    {searchQuery && searchResults && searchTotalPages > 1 && (
                                    <div className="flex justify-center mt-6 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => fetchSearch(Math.max(1, searchPage - 1))}
                                            disabled={searchPage <= 1 || searchLoading}
                                            className="px-3 py-1 rounded-md bg-white/10 text-sm text-white disabled:opacity-40"
                                        >
                                            Sebelumnya
                                        </button>
                                        <span className="px-4 py-1 rounded-md bg-white/10 text-sm text-white">Halaman {searchPage} / {searchTotalPages}</span>
                                        <button
                                            type="button"
                                            onClick={() => fetchSearch(Math.min(searchTotalPages, searchPage + 1))}
                                            disabled={searchPage >= searchTotalPages || searchLoading}
                                            className="px-3 py-1 rounded-md bg-white/10 text-sm text-white disabled:opacity-40"
                                        >
                                            Selanjutnya
                                        </button>
                                    </div>
                                )}
                                </>
                            </ErrorBoundary>
                        ) : (
                            <div className="glass-panel rounded-[32px] p-16 text-center">
                                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <BookOpen className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Tidak ada training ditemukan</h3>
                                <p className="text-slate-500">
                                    {searchQuery 
                                        ? 'Coba ubah kata kunci pencarian Anda.'
                                        : 'Belum ada training yang ditugaskan kepada Anda.'}
                                </p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}
