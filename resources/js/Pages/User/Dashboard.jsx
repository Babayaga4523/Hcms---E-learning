import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { extractData } from '@/Utilities/apiResponseHandler';
import ErrorBoundary from '@/Components/ErrorBoundary';
import { API_BASE, API_ENDPOINTS } from '@/Config/api';
import { SkeletonStats, SkeletonCards, SkeletonActivity } from '@/Components/SkeletonLoader';
import { 
    BookOpen, Clock, Award, TrendingUp, Bell, Search, 
    PlayCircle, CheckCircle, Calendar, ArrowRight, 
    MoreHorizontal, Star, Shield, Zap, ChevronRight, RotateCw, AlertTriangle, Trash2, Eye, ChevronLeft
} from 'lucide-react';
import LeaderboardWidget from '@/Components/Dashboard/LeaderboardWidget';
import GoalTrackerWidget from '@/Components/Dashboard/GoalTrackerWidget';
import LearningStatsCards from '@/Components/Dashboard/LearningStatsCards';
import usePagination from '@/Hooks/usePagination';

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

const RecentActivity = ({ activities = [], loading = false, error = null, onRefresh = null, pagination = null, onPageChange = null }) => (
    <div className="glass-card rounded-[24px] p-4">
        <h3 className="font-bold text-slate-900 mb-3 flex items-center justify-between">
            <span>Aktivitas Terbaru</span>
            <div className="flex items-center gap-2">
                {loading ? <span className="text-xs text-slate-400">Memuat...</span> : null}
                <button onClick={onRefresh} className="p-1 rounded-full hover:bg-slate-100" aria-label="Segarkan Aktivitas" title="Segarkan Aktivitas">
                    <RotateCw className="w-4 h-4 text-slate-500" />
                </button>
            </div>
        </h3>
        <div className="space-y-3">
            {loading ? (
                <SkeletonActivity count={3} />
            ) : error ? (
                <p className="text-sm text-red-500">{error}</p>
            ) : activities.length > 0 ? (
                <>
                    <div className="space-y-3">
                        {activities.map((act, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-[#005E54]">{act.user_initial || (act.actor ? act.actor.charAt(0) : 'U')}</div>
                                <div>
                                    <div className="text-sm font-medium text-slate-800">{act.title || act.action}</div>
                                    <div className="text-xs text-slate-500">{act.time || new Date(act.created_at || act.date || Date.now()).toLocaleString('id-ID')}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-slate-200">
                            <button
                                onClick={() => onPageChange?.(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded transition"
                            >
                                <ChevronLeft size={14} /> Sebelumnya
                            </button>
                            <span className="text-xs font-bold text-slate-600">
                                Hal. {pagination.page}/{pagination.totalPages}
                            </span>
                            <button
                                onClick={() => onPageChange?.(pagination.page + 1)}
                                disabled={!pagination.hasMore}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-[#005E54] hover:bg-[#003d38] disabled:opacity-50 text-white rounded transition"
                            >
                                Selanjutnya <ChevronRight size={14} />
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center text-sm text-slate-400">
                    <p>Belum ada aktivitas terbaru</p>
                    <Link href="/activity" className="inline-block mt-3 px-3 py-1 bg-[#D6F84C] text-[#002824] rounded font-bold">Lihat Semua Aktivitas</Link>
                </div>
            )}
        </div>
    </div>
);

const UnifiedUpdates = ({ updates = [], tab = 'semua', onTabChange = null, loading = false, error = null, unreadCount = 0, onDelete = null }) => {
    const filterUpdates = () => {
        if (tab === 'pengumuman') return updates.filter(u => u.type === 'announcement');
        if (tab === 'notifikasi') return updates.filter(u => u.type === 'notification');
        return updates;
    };

    const filtered = filterUpdates();
    const announcementCount = updates.filter(u => u.type === 'announcement').length;
    const notificationCount = updates.filter(u => u.type === 'notification').length;

    const getTypeColors = (updateType, category) => {
        if (updateType === 'announcement') {
            const colors = {
                'urgent': { bg: 'bg-red-50', border: 'border-red-200', icon: '🚨', label: 'Urgent' },
                'maintenance': { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: '🔧', label: 'Maintenance' },
                'event': { bg: 'bg-green-50', border: 'border-green-200', icon: '📅', label: 'Event' },
                'general': { bg: 'bg-blue-50', border: 'border-blue-200', icon: '📢', label: 'Pengumuman' },
            };
            return colors[category] || colors.general;
        } else {
            const colors = {
                'success': { bg: 'bg-green-50', border: 'border-green-200', icon: '✅', label: 'Sukses' },
                'warning': { bg: 'bg-orange-50', border: 'border-orange-200', icon: '⚠️', label: 'Peringatan' },
                'error': { bg: 'bg-red-50', border: 'border-red-200', icon: '❌', label: 'Error' },
                'info': { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'ℹ️', label: 'Info' },
            };
            return colors[category] || colors.info;
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return 'Baru saja';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Baru saja';
            
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) return 'Baru saja';
            if (diffMins < 60) return `${diffMins}m yang lalu`;
            if (diffHours < 24) return `${diffHours}h yang lalu`;
            if (diffDays < 7) return `${diffDays}d yang lalu`;
            return date.toLocaleDateString('id-ID');
        } catch (e) {
            return 'Baru saja';
        }
    };

    // Extract content from multiple possible field names
    const getContent = (update) => {
        return update.content || update.message || update.body || update.description || '(Konten tidak tersedia)';
    };

    // Extract date from multiple possible field names
    const getDate = (update) => {
        return update.created_at || update.date || update.timestamp || new Date().toISOString();
    };

    // Extract category with proper defaults
    const getCategory = (update) => {
        if (update.type === 'announcement') {
            return update.category || update.announcement_type || 'general';
        } else {
            return update.category || update.notification_type || 'info';
        }
    };

    return (
        <div className="glass-card rounded-[24px] p-6">
            <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[#005E54]" />
                    Notifikasi & Pengumuman
                    {unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-extrabold rounded-full animate-pulse">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </h3>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-5 border-b border-slate-200 pb-3 overflow-x-auto">
                {[
                    { key: 'semua', label: 'Semua', count: updates.length },
                    { key: 'pengumuman', label: '📢 Pengumuman', count: announcementCount },
                    { key: 'notifikasi', label: '🔔 Notifikasi', count: notificationCount },
                ].map(t => (
                    <button
                        key={t.key}
                        onClick={() => onTabChange?.(t.key)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                            tab === t.key
                                ? 'bg-[#D6F84C] text-[#002824] shadow-md'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        {t.label}
                        {t.count > 0 && <span className="ml-2 text-xs bg-slate-200/70 px-2 py-0.5 rounded-full">{t.count}</span>}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <SkeletonCards count={3} />
            ) : error ? (
                <div className="text-center py-8 text-slate-500">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="mt-3 text-xs text-[#005E54] font-bold hover:underline"
                    >
                        Coba Lagi
                    </button>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                    <Bell className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-sm font-medium mb-1">
                        {tab === 'semua' ? 'Tidak ada update' : `Tidak ada ${tab === 'pengumuman' ? 'pengumuman' : 'notifikasi'}`}
                    </p>
                    <p className="text-xs">Kembali kemudian untuk melihat update terbaru</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2 custom-scrollbar">
                    {filtered.map(update => {
                        const category = getCategory(update);
                        const colors = getTypeColors(update.type, category);
                        const content = getContent(update);
                        const dateStr = getDate(update);
                        const title = update.title || '(Tanpa judul)';

                        return (
                            <div
                                key={`${update.type}-${update.id}`}
                                className={`p-4 rounded-xl border-2 ${colors.bg} ${colors.border} transition-all hover:shadow-lg hover:scale-[1.01] cursor-pointer group`}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Icon Badge */}
                                    <div className="flex-shrink-0 mt-1">
                                        <div className="text-2xl">{colors.icon}</div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h4 className="font-bold text-sm text-slate-900 line-clamp-1 group-hover:text-[#005E54] transition flex-1">
                                                {title}
                                            </h4>
                                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider flex-shrink-0 ${
                                                update.type === 'announcement'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-orange-100 text-orange-700'
                                            }`}>
                                                {colors.label}
                                            </span>
                                        </div>

                                        {/* Message Preview */}
                                        <p className="text-xs text-slate-700 line-clamp-2 mb-3 leading-relaxed break-words">
                                            {content}
                                        </p>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatTime(dateStr)}
                                            </span>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => alert(title + '\n\n' + content)}
                                                    aria-label="Lihat Detail"
                                                    title="Lihat Detail"
                                                    className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all border border-blue-200 flex items-center justify-center hover:shadow-sm"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                                <button 
                                                    onClick={() => onDelete?.(update.id, update.type)}
                                                    aria-label="Hapus"
                                                    title="Hapus"
                                                    className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-all border border-red-200 flex items-center justify-center hover:shadow-sm"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// --- Main Layout ---

export default function Dashboard({ auth, trainings = [], assignedTrainings = [], completedTrainings = [], upcomingTrainings = [], recentActivity = [], announcements = [], notifications = { unread_count: 0 } }) {
    const user = auth?.user || {};

    // Search state (uses backend API when searching)
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);

    // Unified Updates (combined announcements + notifications) with tabs
    const [unifiedUpdates, setUnifiedUpdates] = useState([]);
    const [unifiedLoading, setUnifiedLoading] = useState(false);
    const [unifiedError, setUnifiedError] = useState(null);
    const [updatesTab, setUpdatesTab] = useState('semua'); // 'semua', 'pengumuman', 'notifikasi'
    const [unreadCount, setUnreadCount] = useState(0);

    // Recent activity (initialize from server prop, allow refresh)
    const [recentActivities, setRecentActivities] = useState(Array.isArray(recentActivity) ? recentActivity : []);
    const recentPagination = usePagination(1, 5);
    const [recentActivityMeta, setRecentActivityMeta] = useState({ last_page: 1, total: 0 });
    const [recentLoading, setRecentLoading] = useState(false);
    const [recentError, setRecentError] = useState(null);

    // Training Schedules (events from server)
    const [schedules, setSchedules] = useState([]);
    const [schedulesLoading, setSchedulesLoading] = useState(false);
    const [schedulesError, setSchedulesError] = useState(null);

    // Training Recommendations (courses from server prop, allow refresh)
    const [recommendations, setRecommendations] = useState([]);
    const [recommendationsLoading, setRecommendationsLoading] = useState(false);
    const [recommendationsError, setRecommendationsError] = useState(null);

    // Dashboard statistics (use /api/dashboard/statistics)
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [statsError, setStatsError] = useState(null);

    const fetchSchedules = async (isMounted, signal) => {
        try {
            const res = await fetch(`${API_BASE}${API_ENDPOINTS.USER_SCHEDULES}`, { 
                headers: { Accept: 'application/json' },
                signal // Add AbortController signal
            });
            if (!res.ok) throw new Error('Network response was not ok');
            const data = await res.json();
            console.log('Training schedules data:', data);
            
            // Only update state if component is still mounted
            if (!isMounted) return;
            
            // Extract data from inconsistent API response format
            const events = extractData(data);
            setSchedules(events);
        } catch (err) {
            // Don't log or update state if request was aborted (expected on unmount)
            if (err.name === 'AbortError') {
                console.log('Schedules fetch aborted on component unmount');
                return;
            }
            
            console.error('Error fetching schedules:', err);
            // Only update state if component is still mounted
            if (!isMounted) return;
            setSchedulesError('Gagal memuat jadwal pelatihan');
        } finally {
            // Only update state if component is still mounted
            if (!isMounted) return;
            setSchedulesLoading(false);
        }
    };

    const fetchRecommendations = async (isMounted, signal) => {
        try {
            const res = await fetch(`${API_BASE}${API_ENDPOINTS.DASHBOARD_RECOMMENDATIONS}`, { 
                headers: { Accept: 'application/json' },
                signal // Add AbortController signal
            });
            if (!res.ok) throw new Error('Network response was not ok');
            const data = await res.json();
            console.log('Training recommendations data:', data);
            
            // Only update state if component is still mounted
            if (!isMounted) return;
            
            // Extract data from inconsistent API response format
            const recos = extractData(data);
            setRecommendations(recos);
        } catch (err) {
            // Don't log or update state if request was aborted (expected on unmount)
            if (err.name === 'AbortError') {
                console.log('Recommendations fetch aborted on component unmount');
                return;
            }
            
            console.error('Error fetching recommendations:', err);
            // Only update state if component is still mounted
            if (!isMounted) return;
            setRecommendationsError('Gagal memuat rekomendasi pelatihan');
        } finally {
            // Only update state if component is still mounted
            if (!isMounted) return;
            setRecommendationsLoading(false);
        }
    };

    const fetchStats = async (isMounted, signal) => {
        try {
            const res = await fetch(`${API_BASE}${API_ENDPOINTS.DASHBOARD_STATS}`, { 
                headers: { Accept: 'application/json' },
                signal // Add AbortController signal
            });
            if (!res.ok) throw new Error('Network response was not ok');
            const data = await res.json();
            
            // Only update state if component is still mounted
            if (!isMounted) return;
            
            setStats(data);
        } catch (err) {
            // Don't log or update state if request was aborted (expected on unmount)
            if (err.name === 'AbortError') {
                console.log('Stats fetch aborted on component unmount');
                return;
            }
            
            // Only update state if component is still mounted
            if (!isMounted) return;
            setStatsError('Gagal memuat statistik');
        } finally {
            // Only update state if component is still mounted
            if (!isMounted) return;
            setStatsLoading(false);
        }
    };

    const fetchAnnouncements = async (isMounted, signal) => {
        try {
            const res = await fetch(`${API_BASE}${API_ENDPOINTS.DASHBOARD_UNIFIED_UPDATES}`, { 
                headers: { Accept: 'application/json' },
                signal // Add AbortController signal
            });
            if (!res.ok) throw new Error('Network response was not ok');
            const data = await res.json();
            console.log('Unified updates:', data);
            
            // Only update state if component is still mounted
            if (!isMounted) return;
            
            setUnifiedUpdates(data.data || []);
            setUnreadCount(data.unread_count || 0);
        } catch (err) {
            // Don't log or update state if request was aborted (expected on unmount)
            if (err.name === 'AbortError') {
                console.log('Announcements fetch aborted on component unmount');
                return;
            }
            
            console.error('Error fetching unified updates:', err);
            // Only update state if component is still mounted
            if (!isMounted) return;
            setUnifiedError('Gagal memuat update');
        } finally {
            // Only update state if component is still mounted
            if (!isMounted) return;
            setUnifiedLoading(false);
        }
    };

    const deleteNotification = async (notificationId, type) => {
        try {
            // Determine the correct endpoint
            const endpoint = type === 'announcement' 
                ? `/api/user/announcements/${notificationId}` 
                : `/api/user/notifications/${notificationId}`;
            
            console.log(`Deleting ${type} with ID ${notificationId} from endpoint: ${endpoint}`);
            
            const res = await fetch(endpoint, {
                method: 'DELETE',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content
                }
            });
            
            const data = await res.json();
            console.log(`Delete response:`, data);
            
            if (!res.ok) {
                console.error(`Delete failed with status ${res.status}:`, data);
                alert(`Gagal menghapus ${type === 'announcement' ? 'pengumuman' : 'notifikasi'}: ${data.message || 'Unknown error'}`);
                return;
            }
            
            // Remove from UI immediately (optimistic update)
            setUnifiedUpdates(prev => prev.filter(u => !(u.id === notificationId && u.type === type)));
            console.log(`Successfully deleted ${type} ID ${notificationId}`);
            
            // Refresh to sync with backend after a short delay
            setTimeout(() => fetchAnnouncements(), 500);
        } catch (err) {
            console.error('Error deleting notification:', err);
            alert(`Gagal menghapus: ${err.message}`);
        }
    };

    const fetchRecent = async (isMounted, signal) => {
        try {
            const params = new URLSearchParams();
            params.append('page', recentPagination.page);
            params.append('per_page', recentPagination.pageSize);
            
            const res = await fetch(`${API_BASE}${API_ENDPOINTS.USER_ACTIVITY}?${params.toString()}`, { 
                headers: { Accept: 'application/json' },
                signal // Add AbortController signal
            });
            if (!res.ok) throw new Error('Network response was not ok');
            const data = await res.json();
            
            // Only update state if component is still mounted
            if (!isMounted) return;
            
            const activityData = Array.isArray(data) ? data : (data.data || []);
            setRecentActivities(activityData);
            
            // Update pagination meta if available
            if (data.meta) {
                setRecentActivityMeta(data.meta);
                recentPagination.updateMeta(activityData, data.meta);
            }
        } catch (err) {
            // Don't log or update state if request was aborted (expected on unmount)
            if (err.name === 'AbortError') {
                console.log('Recent activity fetch aborted on component unmount');
                return;
            }
            
            // Only update state if component is still mounted
            if (!isMounted) return;
            setRecentError('Gagal memuat aktivitas terbaru');
        } finally {
            // Only update state if component is still mounted
            if (!isMounted) return;
            setRecentLoading(false);
        }
    };

    // Handle pagination page changes for recent activity
    useEffect(() => {
        let isMounted = true;
        const abortController = new AbortController();
        const signal = abortController.signal;
        
        fetchRecent(isMounted, signal);
        
        return () => { 
            isMounted = false;
            abortController.abort(); // Cancel fetch if component unmounts
        };
    }, [recentPagination.page]);

    const handleRecentActivityPageChange = (newPage) => {
        recentPagination.setPage(newPage);
    };

    useEffect(() => {
        // Track if component is still mounted to prevent setState on unmounted component
        let isMounted = true;
        
        // Create an AbortController for all fetch requests in this effect
        const abortController = new AbortController();
        const signal = abortController.signal;
        
        // Fetch all data on mount using concurrent requests
        const loadAllData = async () => {
            try {
                // Use Promise.all for concurrent requests (better performance)
                await Promise.all([
                    fetchAnnouncements(isMounted, signal),
                    fetchRecent(isMounted, signal),
                    fetchSchedules(isMounted, signal),
                    fetchRecommendations(isMounted, signal),
                    fetchStats(isMounted, signal)
                ]);
            } catch (error) {
                // Log error but don't crash - individual fetch functions handle errors
                // AbortError is expected on unmount, so don't log it
                if (error?.name !== 'AbortError') {
                    console.error('Error loading dashboard data:', error);
                }
            }
        };
        
        // Load data immediately on mount
        loadAllData();

        // Auto-refresh announcements every 30 seconds (only if mounted)
        // This keeps the updates and unread count fresh
        const refreshInterval = setInterval(() => {
            if (isMounted && !signal.aborted) {
                fetchAnnouncements(isMounted, signal);
            }
        }, 30000); // 30 second polling interval

        // Listen for storage changes (when user deletes from another tab/window)
        const handleStorageChange = (e) => {
            if (!isMounted || signal.aborted) return;
            if (e.key === 'notification-refresh' || e.key === 'announcement-refresh') {
                console.log('Detected change from another tab, refreshing...');
                fetchAnnouncements(isMounted, signal);
            }
        };

        // Listen for custom events (when user deletes from same tab)
        const handleCustomEvent = () => {
            if (!isMounted || signal.aborted) return;
            console.log('Custom event triggered, refreshing...');
            fetchAnnouncements(isMounted, signal);
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('notification-updated', handleCustomEvent);

        // Cleanup function - called when component unmounts
        return () => {
            // Mark component as unmounted to prevent setState
            isMounted = false;
            
            // Abort all pending fetch requests to prevent memory leaks and zombie requests
            abortController.abort();
            
            // Clear interval to prevent memory leaks
            clearInterval(refreshInterval);
            
            // Remove event listeners
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('notification-updated', handleCustomEvent);
            
            console.log('Dashboard cleanup: all polling and requests cancelled');
        };
    }, []);

    // Debounced search function with AbortController support
    const performSearch = async (query, signal) => {
        if (!query.trim()) {
            setSearchResults(null);
            setSearchError(null);
            return;
        }

        setIsSearching(true);
        setSearchError(null);

        try {
            const res = await fetch(`${API_BASE}${API_ENDPOINTS.USER_TRAININGS}?search=${encodeURIComponent(query)}&per_page=50`, {
                headers: { Accept: 'application/json' },
                signal // Add AbortController signal
            });

            if (!res.ok) throw new Error('Network response was not ok');

            const responseData = await res.json();
            // Handle both paginated and direct array responses
            const data = responseData.data || (Array.isArray(responseData) ? responseData : []);
            setSearchResults(Array.isArray(data) ? data : []);
        } catch (err) {
            // Don't log or show error if request was aborted (expected on new search or unmount)
            if (err.name === 'AbortError') {
                console.log('Search request cancelled');
                return;
            }
            
            console.error('Search error:', err);
            setSearchError('Gagal mencari. Menggunakan pencarian lokal...');
            // Fallback: client-side filter
            const fallback = (Array.isArray(trainings) ? trainings : Object.values(trainings || {})).filter(t => 
                (t.title || '').toLowerCase().includes(query.toLowerCase()) ||
                (t.description || '').toLowerCase().includes(query.toLowerCase())
            );
            setSearchResults(fallback);
        } finally {
            setIsSearching(false);
        }
    };

    // Debounce search with useEffect and AbortController
    const searchTimeoutRef = React.useRef(null);
    const searchAbortControllerRef = React.useRef(null);

    React.useEffect(() => {
        // Abort any previous search request
        if (searchAbortControllerRef.current) {
            searchAbortControllerRef.current.abort();
        }
        
        // Clear existing timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Only search if query is not empty
        if (searchQuery.trim()) {
            setIsSearching(true);
            searchTimeoutRef.current = setTimeout(() => {
                // Create new AbortController for this search
                searchAbortControllerRef.current = new AbortController();
                performSearch(searchQuery, searchAbortControllerRef.current.signal);
            }, 300); // 300ms debounce
        } else {
            setSearchResults(null);
            setSearchError(null);
            setIsSearching(false);
        }

        return () => {
            // Cleanup: abort search and clear timeout on unmount or query change
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            if (searchAbortControllerRef.current) {
                searchAbortControllerRef.current.abort();
            }
        };
    }, [searchQuery]);

    const handleSearch = (e) => {
        e?.preventDefault?.();
        if (!searchQuery.trim()) {
            setSearchResults(null);
            return;
        }
        
        // Abort any previous search
        if (searchAbortControllerRef.current) {
            searchAbortControllerRef.current.abort();
        }
        
        // Create new AbortController for this search
        searchAbortControllerRef.current = new AbortController();
        performSearch(searchQuery, searchAbortControllerRef.current.signal);
    };

    // Ensure trainings is always an array
    const trainingsArray = Array.isArray(trainings) ? trainings : Object.values(trainings || {});
    const assignedArray = Array.isArray(assignedTrainings) ? assignedTrainings : Object.values(assignedTrainings || {});
    const completedArray = Array.isArray(completedTrainings) ? completedTrainings : Object.values(completedTrainings || {});

    // Calculate statistics
    const totalTrainings = trainingsArray.length || 0;
    const completedCount = completedArray.length || 0;
    const inProgressCount = trainingsArray.filter(t => t?.status === 'in_progress').length || 0;
    const certifications = trainingsArray.filter(t => t?.is_certified === 1 || t?.is_certified === true).length || 0;
    
    // Get active courses (sorted by progress, highest first)
    const activeCourses = trainingsArray
        .sort((a, b) => (b.progress || 0) - (a.progress || 0));

    // Build assigned list (trainings that haven't been started)
    const assignedList = assignedArray || [];

    // Get first active course for "Continue Learning"
    const continueCourse = activeCourses[0] || trainingsArray[0] || assignedList[0];
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
                                        autoComplete="off"
                                        className="pl-10 pr-20 py-2 bg-white/10 border border-white/10 rounded-full text-white placeholder-white/50 text-sm focus:outline-none focus:bg-white/20 transition-all w-48 focus:w-64"
                                    />
                                    <button type="submit" aria-label="Cari kursus" title="Submit search" className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs transition">Cari</button>
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                                    
                                    {/* Search Dropdown */}
                                    {(searchQuery || isSearching) && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto border border-slate-200">
                                            {isSearching ? (
                                                <div className="p-4 text-center">
                                                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-[#005E54]"></div>
                                                    <p className="text-sm text-slate-600 mt-2">Mencari...</p>
                                                </div>
                                            ) : searchError ? (
                                                <div className="p-4 text-center text-yellow-600 text-sm">{searchError}</div>
                                            ) : searchResults && searchResults.length > 0 ? (
                                                <div className="divide-y divide-slate-100">
                                                    <div className="p-3 bg-slate-50 text-xs font-bold text-slate-500">
                                                        Ditemukan {searchResults.length} kursus
                                                    </div>
                                                    {searchResults.slice(0, 5).map(result => (
                                                        <Link
                                                            key={`${result.id}`}
                                                            href={`/training/${result.id}`}
                                                            className="block p-3 hover:bg-slate-50 transition"
                                                        >
                                                            <p className="font-bold text-sm text-slate-900 line-clamp-1">{result.title}</p>
                                                            <p className="text-xs text-slate-600 line-clamp-1">{result.description || 'Tidak ada deskripsi'}</p>
                                                            {result.progress > 0 && (
                                                                <div className="mt-2 w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-[#005E54]" style={{ width: `${result.progress}%` }}></div>
                                                                </div>
                                                            )}
                                                        </Link>
                                                    ))}
                                                    {searchResults.length > 5 && (
                                                        <div className="p-3 text-center">
                                                            <Link href={`/my-trainings?search=${encodeURIComponent(searchQuery)}`} className="text-sm font-bold text-[#005E54] hover:underline">
                                                                Lihat semua ({searchResults.length})
                                                            </Link>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : searchQuery && !isSearching ? (
                                                <div className="p-4 text-center text-slate-600 text-sm">
                                                    Tidak ada kursus ditemukan untuk "{searchQuery}"
                                                </div>
                                            ) : null}
                                        </div>
                                    )}
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
                            {recommendationsLoading ? (
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-4">Rekomendasi Untuk Anda</h3>
                                    <SkeletonCards count={3} />
                                </div>
                            ) : recommendations.length > 0 && (
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-4">Rekomendasi Untuk Anda</h3>
                                    <div className="space-y-4 animate-enter" style={{ animationDelay: '400ms' }}>
                                        {recommendations.slice(0, 3).map(course => (
                                            <CourseCard key={course.id} course={course} type="list" />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 4. New Dashboard Features */}
                            
                            {/* Learning Statistics Cards */}
                            <ErrorBoundary label="Kartu Statistik">
                                <div style={{ animationDelay: '500ms' }} className="animate-enter">
                                    <LearningStatsCards />
                                </div>
                            </ErrorBoundary>

                            {/* Goal Tracker Widget */}
                            <ErrorBoundary label="Pelacak Tujuan">
                                <div style={{ animationDelay: '600ms' }} className="animate-enter">
                                    <GoalTrackerWidget />
                                </div>
                            </ErrorBoundary>

                            {/* Leaderboard Widget */}
                            <ErrorBoundary label="Papan Peringkat">
                                <div style={{ animationDelay: '700ms' }} className="animate-enter">
                                    <LeaderboardWidget />
                                </div>
                            </ErrorBoundary>

                        </div>

                        {/* Right Column (Sidebar) - 4 cols */}
                        <div className="lg:col-span-4 space-y-6">
                            
                            {/* Unified Updates & Announcements (Tabbed) */}
                            <ErrorBoundary label="Notifikasi & Pengumuman">
                                <UnifiedUpdates 
                                    updates={unifiedUpdates} 
                                    tab={updatesTab}
                                    onTabChange={setUpdatesTab}
                                    loading={unifiedLoading}
                                    error={unifiedError}
                                    unreadCount={unreadCount}
                                    onDelete={deleteNotification}
                                />
                            </ErrorBoundary>

                            {/* Recent Activity */}
                            <ErrorBoundary label="Aktivitas Terbaru">
                                <RecentActivity activities={recentActivities} loading={recentLoading} error={recentError} onRefresh={() => { setRecentLoading(true); const isMounted = true; fetchRecent(isMounted); }} pagination={recentPagination} onPageChange={handleRecentActivityPageChange} />
                            </ErrorBoundary>

                            {/* Calendar / Upcoming Widget */}
                            <div className="glass-card rounded-[24px] p-6">
                                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-[#005E54]" /> Jadwal Mendatang
                                </h3>
                                <div className="space-y-4">
                                    {schedulesLoading ? (
                                        Array.from({ length: 2 }).map((_, i) => (
                                            <div key={i} className="flex gap-4 items-center animate-pulse">
                                                <div className="bg-slate-200 rounded-xl p-2 text-center min-w-[3.5rem] h-16" />
                                                <div className="flex-1">
                                                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                                                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                                                </div>
                                            </div>
                                        ))
                                    ) : schedulesError ? (
                                        <p className="text-sm text-red-500 text-center py-4">{schedulesError}</p>
                                    ) : schedules.length > 0 ? (
                                        schedules.slice(0, 2).map((event, idx) => {
                                            // Support both 'start' (ISO format from backend) and 'start_date'
                                            const eventDate = event.start ? new Date(event.start) : (event.start_date ? new Date(event.start_date) : new Date());
                                            return (
                                                <div key={idx} className="flex gap-4 items-center">
                                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-center min-w-[3.5rem]">
                                                        <span className="block text-xs font-bold text-slate-400 uppercase">
                                                            {eventDate.toLocaleDateString('id-ID', { month: 'short' })}
                                                        </span>
                                                        <span className="block text-xl font-extrabold text-[#002824]">
                                                            {eventDate.getDate()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h5 className="font-bold text-slate-800 text-sm line-clamp-1">{event.title}</h5>
                                                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                                                            {event.type === 'deadline' ? 'Deadline' : event.program ? 'Training' : 'Jadwal'}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-sm text-slate-400 text-center py-4">Tidak ada jadwal mendatang</p>
                                    )}
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <Link href="/training-calendar" className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-slate-50 rounded-xl hover:bg-slate-100 transition text-center">Buka Kalender</Link>
                                    <button onClick={fetchSchedules} className="px-3 py-2 rounded-xl bg-[#D6F84C] text-[#002824] font-bold">Segarkan</button>
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
