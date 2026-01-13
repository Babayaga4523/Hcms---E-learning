import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { 
    BookOpen, Clock, Award, TrendingUp, Bell, Search, 
    PlayCircle, CheckCircle, Calendar, ArrowRight, 
    MoreHorizontal, Star, Shield, Zap, ChevronRight, RotateCw 
} from 'lucide-react';

// --- Wondr Style System ---
const WondrStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        .wondr-dashboard { font-family: 'Plus Jakarta Sans', sans-serif; }
        
        .wondr-dark { background-color: #002824; }
        .wondr-green { color: #005E54; }
        .wondr-lime-bg { background-color: #D6F84C; color: #002824; }
        .wondr-lime-text { color: #D6F84C; }
        
        .glass-card {
            background: white;
            border: 1px solid #E2E8F0;
            box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.05);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 30px -10px rgba(0, 40, 36, 0.1);
            border-color: #005E54;
        }

        .hero-pattern {
            background-color: #002824;
            background-image: radial-gradient(#005E54 1px, transparent 1px);
            background-size: 24px 24px;
        }

        .progress-bar { transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); }
        
        .tab-pill {
            transition: all 0.2s ease;
        }
        .tab-pill.active {
            background-color: #002824;
            color: #D6F84C;
        }

        .animate-enter { animation: enter 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        @keyframes enter {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `}</style>
);

// --- Components ---

const StatPill = ({ icon: Icon, value, label }) => (
    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10">
        <div className="p-2 bg-[#D6F84C] rounded-full text-[#002824]">
            <Icon className="w-4 h-4" />
        </div>
        <div>
            <p className="text-white font-bold leading-none">{value}</p>
            <p className="text-slate-300 text-xs mt-1 font-medium">{label}</p>
        </div>
    </div>
);

const CourseCard = ({ course, type = 'grid' }) => {
    if (type === 'list') {
        return (
            <Link href={`/training/${course.id}`} className="group flex gap-4 p-4 bg-white rounded-2xl border border-slate-100 hover:border-[#005E54]/30 hover:shadow-lg transition-all cursor-pointer">
                <div className="w-24 h-24 rounded-xl bg-slate-200 flex-shrink-0 overflow-hidden relative">
                    {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#005E54] to-[#002824]" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                        <PlayCircle className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity transform scale-75 group-hover:scale-100" />
                    </div>
                </div>
                <div className="flex-1 py-1">
                    <div className="flex justify-between items-start mb-2">
                        <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                            {course.category || 'Training'}
                        </span>
                        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {course.duration || '1h'}
                        </span>
                    </div>
                    <h4 className="font-bold text-slate-900 mb-1 line-clamp-1 group-hover:text-[#005E54] transition-colors">{course.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{course.description}</p>
                    
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#005E54] rounded-full progress-bar" style={{ width: `${course.progress || 0}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-slate-700">{course.progress || 0}%</span>
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <Link href={`/training/${course.id}`} className="glass-card rounded-[24px] overflow-hidden flex flex-col h-full group cursor-pointer">
            <div className="h-40 bg-slate-200 relative overflow-hidden">
                {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#005E54] to-[#002824]" />
                )}
                <div className="absolute top-4 left-4 z-10">
                    {course.is_mandatory && (
                        <span className="px-3 py-1 bg-red-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm">
                            Mandatory
                        </span>
                    )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#002824]/80 to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
                <div className="mb-2 flex justify-between items-center">
                    <span className="text-xs font-bold text-[#005E54]">{course.category || 'Training'}</span>
                    {course.rating ? (
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            {Number(course.rating).toFixed(1)}
                        </div>
                    ) : null}
                </div>
                <h3 className="font-bold text-slate-900 mb-2 leading-tight group-hover:text-[#005E54] transition-colors line-clamp-2">
                    {course.title}
                </h3>
                <div className="mt-auto pt-4">
                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                        <span>Progress</span>
                        <span>{course.progress || 0}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#005E54] to-[#D6F84C] progress-bar" style={{ width: `${course.progress || 0}%` }}></div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

const AnnouncementWidget = ({ announcements = [], loading = false, error = null }) => {
    const latest = announcements.length > 0 ? announcements[0] : null;

    if (loading) {
        return (
            <div className="rounded-[24px] p-6 bg-white animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-5/6"></div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-[#D6F84C] to-[#c2e43c] rounded-[24px] p-6 text-[#002824] relative overflow-hidden group cursor-pointer">
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-1 bg-[#002824]/10 rounded-lg text-xs font-bold uppercase">Pengumuman</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>

                {error ? (
                    <>
                        <h4 className="font-extrabold text-lg leading-tight mb-1">Gagal memuat pengumuman</h4>
                        <p className="text-sm font-medium opacity-80">Silakan muat ulang halaman atau hubungi admin.</p>
                    </>
                ) : latest ? (
                    <>
                        <h4 className="font-extrabold text-lg leading-tight mb-1">{latest.title}</h4>
                        <p className="text-sm font-medium opacity-80 line-clamp-2">{latest.content || latest.body}</p>
                        {announcements.length > 1 && (
                            <div className="mt-3 text-xs text-slate-800 font-medium">{announcements.length} pengumuman lainnya</div>
                        )}
                    </>
                ) : (
                    <>
                        <h4 className="font-extrabold text-lg leading-tight mb-1">Tidak ada pengumuman aktif</h4>
                        <p className="text-sm font-medium opacity-80">Saat ini tidak ada pengumuman. Periksa arsip pengumuman jika Anda mencari informasi sebelumnya.</p>
                        <Link href="/announcements" className="inline-block mt-4 px-4 py-2 bg-white text-[#002824] rounded-lg font-bold">Lihat Pengumuman</Link>
                    </>
                )}
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
        </div>
    );
};

const RecentActivity = ({ activities = [], loading = false, error = null, onRefresh = null }) => (
    <div className="glass-card rounded-[24px] p-4">
        <h3 className="font-bold text-slate-900 mb-3 flex items-center justify-between">
            <span>Aktivitas Terbaru</span>
            <div className="flex items-center gap-2">
                {loading ? <span className="text-xs text-slate-400">Memuat...</span> : null}
                <button onClick={onRefresh} className="p-1 rounded-full hover:bg-slate-100" title="Segarkan Aktivitas">
                    <RotateCw className="w-4 h-4 text-slate-500" />
                </button>
            </div>
        </h3>
        <div className="space-y-3">
            {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3 animate-pulse">
                        <div className="w-9 h-9 rounded-full bg-slate-200" />
                        <div className="flex-1">
                            <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                            <div className="h-3 bg-slate-200 rounded w-1/2" />
                        </div>
                    </div>
                ))
            ) : error ? (
                <p className="text-sm text-red-500">{error}</p>
            ) : activities.length > 0 ? (
                activities.slice(0, 5).map((act, i) => (
                    <div key={i} className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-[#005E54]">{act.user_initial || (act.actor ? act.actor.charAt(0) : 'U')}</div>
                        <div>
                            <div className="text-sm font-medium text-slate-800">{act.title || act.action}</div>
                            <div className="text-xs text-slate-500">{act.time || new Date(act.created_at || act.date || Date.now()).toLocaleString('id-ID')}</div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center text-sm text-slate-400">
                    <p>Belum ada aktivitas terbaru</p>
                    <Link href="/activity" className="inline-block mt-3 px-3 py-1 bg-[#D6F84C] text-[#002824] rounded font-bold">Lihat Semua Aktivitas</Link>
                </div>
            )}
        </div>
        {!loading && <Link href="/activity" className="block mt-3 text-xs text-[#005E54] font-bold hover:underline">Lihat Semua Aktivitas</Link>}
    </div>
);

// --- Main Layout ---

export default function Dashboard({ auth, trainings = [], completedTrainings = [], upcomingTrainings = [], recentActivity = [], announcements = [], notifications = { unread_count: 0 } }) {
    const user = auth?.user || {};

    // Search state (uses backend API when searching)
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);

    // Announcements state (fetch from API /api/announcements/active)
    const [announcementsData, setAnnouncementsData] = useState(Array.isArray(announcements) ? announcements : []);
    const [announcementsLoading, setAnnouncementsLoading] = useState(false);
    const [announcementsError, setAnnouncementsError] = useState(null);

    // Recent activity (initialize from server prop, allow refresh)
    const [recentActivities, setRecentActivities] = useState(Array.isArray(recentActivity) ? recentActivity : []);
    const [recentLoading, setRecentLoading] = useState(false);
    const [recentError, setRecentError] = useState(null);

    // Upcoming trainings (from server prop, allow refresh)
    const [upcomingData, setUpcomingData] = useState(Array.isArray(upcomingTrainings) ? upcomingTrainings : []);
    const [upcomingLoading, setUpcomingLoading] = useState(false);
    const [upcomingError, setUpcomingError] = useState(null);

    // Dashboard statistics (use /api/dashboard/statistics)
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [statsError, setStatsError] = useState(null);

    const fetchUpcoming = async () => {
        setUpcomingLoading(true);
        setUpcomingError(null);
        try {
            const res = await fetch('/api/dashboard/upcoming', { headers: { Accept: 'application/json' }});
            if (!res.ok) throw new Error('Network response was not ok');
            const data = await res.json();
            setUpcomingData(Array.isArray(data) ? data : []);
        } catch (err) {
            setUpcomingError('Gagal memuat jadwal mendatang');
        } finally {
            setUpcomingLoading(false);
        }
    };

    const fetchStats = async () => {
        setStatsLoading(true);
        setStatsError(null);
        try {
            const res = await fetch('/api/dashboard/statistics', { headers: { Accept: 'application/json' }});
            if (!res.ok) throw new Error('Network response was not ok');
            const data = await res.json();
            setStats(data);
        } catch (err) {
            setStatsError('Gagal memuat statistik');
        } finally {
            setStatsLoading(false);
        }
    };

    const fetchAnnouncements = async () => {
        setAnnouncementsLoading(true);
        setAnnouncementsError(null);
        try {
            const res = await fetch('/api/announcements/active', { headers: { Accept: 'application/json' }});
            if (!res.ok) throw new Error('Network response was not ok');
            const data = await res.json();
            setAnnouncementsData(Array.isArray(data) ? data : []);
        } catch (err) {
            setAnnouncementsError('Gagal memuat pengumuman');
        } finally {
            setAnnouncementsLoading(false);
        }
    };

    const fetchRecent = async () => {
        setRecentLoading(true);
        setRecentError(null);
        try {
            const res = await fetch('/api/user/recent-activity', { headers: { Accept: 'application/json' }});
            if (!res.ok) throw new Error('Network response was not ok');
            const data = await res.json();
            setRecentActivities(Array.isArray(data) ? data : []);
        } catch (err) {
            setRecentError('Gagal memuat aktivitas terbaru');
        } finally {
            setRecentLoading(false);
        }
    };

    useEffect(() => {
        // Fetch both on mount to keep UI live (server props provide initial state)
        fetchAnnouncements();
        fetchRecent();
        fetchUpcoming();
        fetchStats();
    }, []);

    const handleSearch = async (e) => {
        e?.preventDefault?.();
        if (!searchQuery.trim()) {
            setSearchResults(null);
            return;
        }

        setIsSearching(true);
        setSearchError(null);

        try {
            const res = await fetch(`/api/user/trainings?search=${encodeURIComponent(searchQuery)}`, {
                headers: { Accept: 'application/json' }
            });

            if (!res.ok) throw new Error('Network response was not ok');

            const data = await res.json();
            setSearchResults(Array.isArray(data) ? data : []);
        } catch (err) {
            setSearchError('Gagal mengambil hasil pencarian');
            // fallback: client-side filter (derive from `trainings` prop to avoid referencing `trainingsArray` before it's declared)
            const fallback = (Array.isArray(trainings) ? trainings : Object.values(trainings || {})).filter(t => (t.title || '').toLowerCase().includes(searchQuery.toLowerCase()));
            setSearchResults(fallback);
        } finally {
            setIsSearching(false);
        }
    };

    // Ensure trainings is always an array
    const trainingsArray = Array.isArray(trainings) ? trainings : Object.values(trainings || {});
    const completedArray = Array.isArray(completedTrainings) ? completedTrainings : Object.values(completedTrainings || {});
    const upcomingArray = Array.isArray(upcomingData) ? upcomingData : Object.values(upcomingData || {});

    // Calculate statistics
    const totalTrainings = trainingsArray.length || 0;
    const completedCount = completedArray.length || 0;
    const inProgressCount = trainingsArray.filter(t => t?.status === 'in_progress').length || 0;
    const certifications = trainingsArray.filter(t => t?.is_certified).length || 0;
    
    // Get active courses (in progress or can be started: enrolled/not_started)
    const activeCourses = trainingsArray
        .filter(t => ['in_progress', 'enrolled', 'not_started'].includes(t?.status))
        // Sort so in-progress & higher progress items show first
        .sort((a, b) => (b.progress || 0) - (a.progress || 0));

    // Build assigned list from both trainings marked as assigned and upcomingTrainings passed from the server
    const assignedFromTrainings = trainingsArray.filter(t => t?.status === 'assigned' || t?.status === 'not_started' || t?.status === 'enrolled');
    // Merge and dedupe by id
    const assignedMap = {};
    assignedFromTrainings.forEach(t => { if (t && t.id) assignedMap[t.id] = t; });
    (upcomingArray || []).forEach(t => { if (t && t.id) assignedMap[t.id] = { ...t, status: 'assigned' }; });
    const assignedList = Object.values(assignedMap);

    // Get first active course for "Continue Learning"
    const continueCourse = activeCourses[0] || trainingsArray[0] || assignedList[0] || upcomingArray[0];
    // Calculate total learning hours
    const totalHours = trainingsArray.reduce((acc, t) => acc + (t?.duration_hours || 0), 0);

    const [activeTab, setActiveTab] = useState('active');

    const getDisplayCourses = () => {
        if (searchQuery && searchResults !== null) {
            return searchResults;
        }

        switch (activeTab) {
            case 'active':
                return activeCourses;
            case 'assigned':
                return assignedList;
            case 'completed':
                return completedArray;
            default:
                return activeCourses;
        }
    };

    return (
        <AppLayout user={user}>
            <Head title="Dashboard Pembelajaran" />
            
            <div className="wondr-dashboard min-h-screen bg-[#F8F9FA] pb-20">
                <WondrStyles />

                {/* --- Hero Section --- */}
                <div className="hero-pattern pt-8 pb-32 px-6 lg:px-12 relative rounded-b-[40px] shadow-2xl shadow-[#002824]/20">
                    <div className="max-w-7xl mx-auto relative z-10">
                        {/* Top Nav */}
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#D6F84C] rounded-full flex items-center justify-center font-extrabold text-[#002824] text-xl">
                                    L
                                </div>
                                <span className="text-white font-bold tracking-tight text-lg">Learning Hub</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <form onSubmit={handleSearch} className="relative hidden md:block">
                                    <input 
                                        type="text" 
                                        placeholder="Cari kursus..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-20 py-2 bg-white/10 border border-white/10 rounded-full text-white placeholder-white/50 text-sm focus:outline-none focus:bg-white/20 transition-all w-48 focus:w-64"
                                    />
                                    <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs">Cari</button>
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                                    {isSearching && <span className="absolute left-10 top-full text-xs mt-1 text-white">Mencari...</span>}
                                </form>
                                <Link href="/notifications" className="relative p-2 bg-white/10 rounded-full hover:bg-white/20 transition text-white">
                                    <Bell className="w-5 h-5" />
                                    {notifications?.unread_count > 0 && (
                                        <span className="absolute -top-1 -right-1.5 min-w-[18px] h-5 px-1.5 text-xs flex items-center justify-center bg-red-500 rounded-full border border-[#002824] font-bold">
                                            {notifications.unread_count}
                                        </span>
                                    )}
                                </Link>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D6F84C] to-[#005E54] p-[2px]">
                                    <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-sm">
                                        {user.name?.charAt(0) || 'U'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Greeting & Stats */}
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
                            <div>
                                <p className="text-[#D6F84C] font-bold text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Zap className="w-4 h-4" /> Welcome Back
                                </p>
                                <h1 className="text-3xl lg:text-5xl font-extrabold text-white leading-tight mb-2">
                                    Halo, {user.name || 'Learner'}!
                                </h1>
                                <p className="text-slate-300 text-lg">
                                    {inProgressCount > 0 ? (
                                        <>Anda memiliki <span className="text-white font-bold underline decoration-[#D6F84C]">{inProgressCount} kursus aktif</span> yang perlu diselesaikan.</>
                                    ) : (
                                        <>Mulai perjalanan belajar Anda hari ini!</>
                                    )}
                                </p>
                            </div>
                            
                            <div className="flex flex-wrap gap-4">
                                <StatPill icon={TrendingUp} value={completedCount} label="Selesai" />
                                <StatPill icon={Clock} value={`${totalHours}h`} label="Total Jam" />
                                <StatPill icon={Award} value={certifications} label="Sertifikat" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Main Content --- */}
                <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-20">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        
                        {/* Left Column (Content) - 8 cols */}
                        <div className="lg:col-span-8 space-y-8">
                            
                            {/* 1. Continue Learning (Featured) */}
                            {continueCourse && (
                                <div className="glass-card rounded-[32px] p-1 animate-enter">
                                    <div className="flex flex-col md:flex-row bg-[#002824] rounded-[28px] overflow-hidden text-white relative">
                                        <div className="p-8 flex-1 relative z-10">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-[#D6F84C] mb-4">
                                                <Clock className="w-3 h-3" /> Lanjutkan Belajar
                                            </div>
                                            <h3 className="text-2xl font-bold mb-2">{continueCourse.title}</h3>
                                            <p className="text-slate-400 text-sm mb-6 line-clamp-2">{continueCourse.description || 'Lanjutkan pembelajaran Anda dari sesi terakhir.'}</p>
                                            
                                            <div className="flex items-center gap-4">
                                                <Link 
                                                    href={`/training/${continueCourse.id}`}
                                                    className="px-6 py-3 bg-[#D6F84C] hover:bg-[#c2e43c] text-[#002824] rounded-xl font-bold text-sm transition-all hover:scale-105 flex items-center gap-2"
                                                >
                                                    <PlayCircle className="w-5 h-5" /> Lanjutkan - {continueCourse.progress || 0}%
                                                </Link>
                                            </div>
                                        </div>
                                        <div className="md:w-1/3 bg-[#005E54] relative min-h-[150px]">
                                            {continueCourse.thumbnail ? (
                                                <img src={continueCourse.thumbnail} alt="" className="w-full h-full object-cover opacity-50" />
                                            ) : (
                                                <>
                                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                                                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#D6F84C] rounded-full blur-[60px] opacity-20"></div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 2. My Learning Tabs & Grid */}
                            <div>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                                    <div className="flex bg-white rounded-full p-1 shadow-sm border border-slate-200">
                                        {['active', 'assigned', 'completed'].map(tab => (
                                            <button
                                                key={tab}
                                                onClick={() => setActiveTab(tab)}
                                                className={`px-4 sm:px-6 py-2 rounded-full text-sm font-bold capitalize tab-pill ${
                                                    activeTab === tab ? 'active' : 'text-slate-500 hover:text-slate-800'
                                                }`}
                                            >
                                                {tab === 'active' ? 'Aktif' : tab === 'assigned' ? 'Ditugaskan' : 'Selesai'}
                                            </button>
                                        ))}
                                    </div>
                                    <Link href="/my-trainings" className="text-sm font-bold text-[#005E54] hover:underline flex items-center gap-1">
                                        Lihat Semua <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-enter" style={{ animationDelay: '200ms' }}>
                                    {getDisplayCourses().slice(0, 4).map(course => (
                                        <CourseCard key={course.id} course={course} />
                                    ))}
                                    {/* Empty State */}
                                    {getDisplayCourses().length === 0 && (
                                        <div className="col-span-2 py-12 text-center border-2 border-dashed border-slate-200 rounded-[24px]">
                                            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                            <p className="text-slate-500 font-medium">Belum ada kursus di tab ini.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 3. Recommended For You */}
                            {upcomingArray.length > 0 && (
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-4">Rekomendasi Untuk Anda</h3>
                                    <div className="space-y-4 animate-enter" style={{ animationDelay: '400ms' }}>
                                        {upcomingArray.slice(0, 3).map(course => (
                                            <CourseCard key={course.id} course={course} type="list" />
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Right Column (Sidebar) - 4 cols */}
                        <div className="lg:col-span-4 space-y-6">
                            
                            {/* Announcement Widget */}
                            <AnnouncementWidget announcements={announcementsData} loading={announcementsLoading} error={announcementsError} />

                            {/* Recent Activity */}
                            <RecentActivity activities={recentActivities} loading={recentLoading} error={recentError} onRefresh={fetchRecent} />

                            {/* Calendar / Upcoming Widget */}
                            <div className="glass-card rounded-[24px] p-6">
                                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-[#005E54]" /> Jadwal Mendatang
                                </h3>
                                <div className="space-y-4">
                                    {upcomingLoading ? (
                                        Array.from({ length: 2 }).map((_, i) => (
                                            <div key={i} className="flex gap-4 items-center animate-pulse">
                                                <div className="bg-slate-200 rounded-xl p-2 text-center min-w-[3.5rem] h-16" />
                                                <div className="flex-1">
                                                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                                                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                                                </div>
                                            </div>
                                        ))
                                    ) : upcomingError ? (
                                        <p className="text-sm text-red-500 text-center py-4">{upcomingError}</p>
                                    ) : upcomingArray.length > 0 ? (
                                        upcomingArray.slice(0, 2).map((event, idx) => (
                                            <div key={idx} className="flex gap-4 items-center">
                                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-center min-w-[3.5rem]">
                                                    <span className="block text-xs font-bold text-slate-400 uppercase">
                                                        {new Date(event.start_date || Date.now()).toLocaleDateString('id-ID', { month: 'short' })}
                                                    </span>
                                                    <span className="block text-xl font-extrabold text-[#002824]">
                                                        {new Date(event.start_date || Date.now()).getDate()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h5 className="font-bold text-slate-800 text-sm line-clamp-1">{event.title}</h5>
                                                    <p className="text-xs text-slate-500 font-medium mt-0.5">Deadline</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-400 text-center py-4">Tidak ada jadwal mendatang</p>
                                    )}
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <Link href="/training-calendar" className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-slate-50 rounded-xl hover:bg-slate-100 transition text-center">Buka Kalender</Link>
                                    <button onClick={fetchUpcoming} className="px-3 py-2 rounded-xl bg-[#D6F84C] text-[#002824] font-bold">Segarkan</button>
                                </div>
                            </div>

                            {/* Achievement Widget */}
                            <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Award className="w-24 h-24 text-[#D6F84C]" />
                                </div>
                                <h3 className="font-bold text-slate-900 mb-4 relative z-10">Pencapaian Anda</h3>
                                <div className="space-y-4 relative z-10">
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#002824] to-[#005E54] text-white">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#D6F84C] flex items-center justify-center">
                                                <TrendingUp className="w-5 h-5 text-[#002824]" />
                                            </div>
                                            <div>
                                                <span className="text-sm font-bold">Total Progress</span>
                                                <p className="text-xs text-slate-300">{stats ? `${stats.total_trainings} Training` : `${totalTrainings} Training`}</p>
                                            </div>
                                        </div>
                                        <span className="text-2xl font-extrabold text-[#D6F84C]">
                                            {stats ? `${stats.completion_percentage}%` : (totalTrainings > 0 ? Math.round((completedCount / totalTrainings) * 100) : 0)}
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-slate-50 rounded-xl text-center">
                                            <p className="text-2xl font-extrabold text-[#005E54]">{stats ? stats.completed_count : completedCount}</p>
                                            <p className="text-xs text-slate-500 font-medium">Selesai</p>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-xl text-center">
                                            <p className="text-2xl font-extrabold text-[#005E54]">{stats ? stats.certifications : certifications}</p>
                                            <p className="text-xs text-slate-500 font-medium">Sertifikat</p>
                                        </div>
                                    </div>
                                    {statsError && <p className="text-xs text-red-500">{statsError}</p>}
                                </div>
                            </div>

                            {/* Quick Links */}
                            <div className="glass-card rounded-[24px] p-6">
                                <h3 className="font-bold text-slate-900 mb-4">Menu Cepat</h3>
                                <div className="space-y-2">
                                    <Link href="/learner/performance" className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition group">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                                <TrendingUp className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-700">Performa & Progres</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                    <Link href="/my-reports" className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition group">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                                <BookOpen className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-700">Laporan Pembelajaran</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                    <Link href="/notifications" className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition group">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                                                <Bell className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-700">Notifikasi</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
