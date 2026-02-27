import React, { useState, useEffect, useMemo } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Trophy, Medal, Users, Search, Filter, ChevronDown, ChevronUp,
    Award, TrendingUp, BookOpen, Target, ArrowLeft,
    Zap, Clock, CheckCircle, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Leaderboard = () => {
    const { auth } = usePage().props;
    const user = auth?.user || { name: 'Admin', role: 'Super Admin' };

    const [leaderboard, setLeaderboard] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDept, setFilterDept] = useState('all');
    const [loading, setLoading] = useState(true);
    const [expandedUser, setExpandedUser] = useState(null);
    const [userHistory, setUserHistory] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Fetch leaderboard data
    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                if (filterDept !== 'all') params.append('department', filterDept);
                params.append('limit', 10000); // Fetch all users

                const res = await fetch(`/api/admin/leaderboard?${params}`, {
                    headers: { 'Accept': 'application/json' },
                    credentials: 'include',
                });
                if (!res.ok) throw new Error('Failed to fetch leaderboard');
                const data = await res.json();
                setLeaderboard(data.leaderboard || []);

                // Extract unique departments
                const depts = [...new Set(data.leaderboard.map(u => u.department))].filter(Boolean);
                setDepartments(depts);
            } catch (err) {
                console.error('Leaderboard fetch error:', err);
                setLeaderboard([]);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [filterDept]);

    // Reset current page when search query or filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterDept]);

    // Fetch user history when expanding
    const fetchUserHistory = async (userId) => {
        try {
            setHistoryLoading(true);
            const res = await fetch(`/api/admin/leaderboard/user/${userId}/history`, {
                headers: { 'Accept': 'application/json' },
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Failed to fetch user history');
            const data = await res.json();
            setUserHistory(data);
        } catch (err) {
            console.error('User history fetch error:', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleUserClick = (userId) => {
        if (expandedUser === userId) {
            setExpandedUser(null);
            setUserHistory(null);
        } else {
            setExpandedUser(userId);
            fetchUserHistory(userId);
        }
    };

    // Filter and search with pagination
    const filteredAndPaginatedLeaderboard = useMemo(() => {
        const filtered = leaderboard.filter(u => {
            const matchSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchDept = filterDept === 'all' || u.department === filterDept;
            return matchSearch && matchDept;
        });
        
        // Calculate pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedData = filtered.slice(startIndex, endIndex);
        
        return {
            data: paginatedData,
            filtered: filtered,
            total: filtered.length,
            totalPages: Math.ceil(filtered.length / itemsPerPage)
        };
    }, [leaderboard, searchQuery, filterDept, currentPage, itemsPerPage]);

    // Badge colors
    const getBadgeColor = (badge) => {
        switch (badge) {
            case 'PRO':
                return 'bg-[#D6F84C] text-black';
            case 'ADVANCED':
                return 'bg-blue-100 text-blue-700';
            default:
                return 'bg-slate-100 text-slate-600';
        }
    };

    const getRankColor = (rank) => {
        if (rank === 1) return 'bg-yellow-100 text-yellow-700';
        if (rank === 2) return 'bg-gray-200 text-gray-700';
        if (rank === 3) return 'bg-orange-100 text-orange-700';
        return 'bg-slate-100 text-slate-600';
    };

    return (
        <AdminLayout user={user}>
            <Head title="Leaderboard" />

            <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-[#002824] to-[#005E54] p-8 rounded-[32px] relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#D6F84C] rounded-full blur-[100px] opacity-10 -translate-y-1/2 translate-x-1/4"></div>

                    <div className="relative z-10">
                        <button onClick={() => router.visit('/admin/dashboard')} className="inline-flex items-center gap-2 text-white/70 hover:text-[#D6F84C] mb-4 transition font-bold text-sm group">
                            <div className="p-1.5 bg-white/10 rounded-full group-hover:bg-[#D6F84C] group-hover:text-[#002824] transition-all">
                                <ArrowLeft size={16} />
                            </div>
                            Kembali
                        </button>
                        <h1 className="text-4xl font-extrabold text-white leading-tight mb-2">
                            🏆 <span className="text-[#D6F84C]">Leaderboard</span>
                        </h1>
                        <p className="text-blue-100 max-w-lg">Lihat peringkat pengguna berdasarkan poin dan pencapaian mereka</p>
                    </div>

                    <div className="relative z-10 flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-6 py-3 border border-white/20">
                        <Trophy className="text-[#D6F84C]" size={24} />
                        <div className="text-right">
                            <div className="text-2xl font-black text-[#D6F84C]">{filteredAndPaginatedLeaderboard.total}</div>
                            <div className="text-xs text-white/70">Peserta</div>
                        </div>
                    </div>
                </div>

                {/* Search & Filter */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari nama atau email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#005E54] outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-slate-400" />
                        <select
                            value={filterDept}
                            onChange={(e) => setFilterDept(e.target.value)}
                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#005E54] outline-none"
                        >
                            <option value="all">Semua Departemen</option>
                            {departments.map((dept) => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Leaderboard Table */}
                <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-[#005E54] rounded-full"></div>
                        </div>
                    ) : filteredAndPaginatedLeaderboard.total > 0 ? (
                        <>
                            <div className="divide-y divide-slate-100">
                                {filteredAndPaginatedLeaderboard.data.map((performer, idx) => {
                                    const globalIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                                    return (
                                        <motion.div key={performer.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }}>
                                            {/* Main Row */}
                                            <button
                                                onClick={() => handleUserClick(performer.id)}
                                                className="w-full p-6 hover:bg-slate-50 transition text-left flex items-center gap-4"
                                            >
                                                {/* Rank */}
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg flex-shrink-0 ${getRankColor(globalIndex)}`}>
                                                    {globalIndex === 1 ? '🥇' : globalIndex === 2 ? '🥈' : globalIndex === 3 ? '🥉' : `#${globalIndex}`}
                                                </div>

                                        {/* User Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-slate-900 truncate">{performer.name}</h3>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getBadgeColor(performer.badge)} flex-shrink-0`}>
                                                    {performer.badge}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 truncate">{performer.email}</p>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                                                <span className="flex items-center gap-1">
                                                    <BookOpen size={14} /> {performer.completed_modules} Modul
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Award size={14} /> {performer.certifications} Sertifikat
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Target size={14} /> Rata-rata: {performer.avg_score}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* Points & Chevron */}
                                        <div className="flex items-center gap-4 flex-shrink-0">
                                            <div className="text-right">
                                                <div className="text-2xl font-black text-[#005E54]">{performer.total_points.toLocaleString()}</div>
                                                <div className="text-xs text-slate-400">Poin</div>
                                            </div>
                                            <ChevronDown
                                                size={20}
                                                className={`text-slate-400 transition ${expandedUser === performer.id ? 'transform rotate-180' : ''}`}
                                            />
                                        </div>
                                    </button>

                                    {/* Expanded History Section */}
                                    <AnimatePresence>
                                        {expandedUser === performer.id && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="bg-slate-50 border-t border-slate-100 overflow-hidden"
                                            >
                                                <div className="p-6 space-y-6">
                                                    {historyLoading ? (
                                                        <div className="flex items-center justify-center py-8">
                                                            <div className="animate-spin w-6 h-6 border-4 border-slate-200 border-t-[#005E54] rounded-full"></div>
                                                        </div>
                                                    ) : userHistory ? (
                                                        <>
                                                            {/* Points Summary */}
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                                                                    <div className="text-xs font-bold text-blue-600 mb-1">Penyelesaian Modul</div>
                                                                    <div className="text-2xl font-black text-blue-700">
                                                                        +{userHistory.points_summary.module_completion_points}
                                                                    </div>
                                                                </div>

                                                                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                                                                    <div className="text-xs font-bold text-emerald-600 mb-1">Bonus Sertifikasi</div>
                                                                    <div className="text-2xl font-black text-emerald-700">
                                                                        +{userHistory.points_summary.certification_bonus_points}
                                                                    </div>
                                                                </div>

                                                                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                                                                    <div className="text-xs font-bold text-amber-600 mb-1">Poin Nilai</div>
                                                                    <div className="text-2xl font-black text-amber-700">
                                                                        +{userHistory.points_summary.score_points}
                                                                    </div>
                                                                </div>

                                                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                                                                    <div className="text-xs font-bold text-purple-600 mb-1">Total Poin</div>
                                                                    <div className="text-2xl font-black text-purple-700">
                                                                        {userHistory.points_summary.total_points}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Training History */}
                                                            <div>
                                                                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                                    <BookOpen size={18} className="text-[#005E54]" />
                                                                    Riwayat Pelatihan ({userHistory.trainings.length})
                                                                </h4>
                                                                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                                                                    {userHistory.trainings.length > 0 ? (
                                                                        userHistory.trainings.map((training, idx) => (
                                                                            <div key={idx} className="bg-white rounded-lg p-4 border border-slate-200 hover:shadow-md transition">
                                                                                <div className="flex items-start justify-between mb-3">
                                                                                    <div className="flex-1">
                                                                                        <h5 className="font-bold text-slate-900 mb-1">{training.module_title}</h5>
                                                                                        <div className="flex items-center gap-4 text-xs text-slate-600">
                                                                                            <span className="flex items-center gap-1">
                                                                                                <Clock size={12} /> {training.completed_date || 'Belum selesai'}
                                                                                            </span>
                                                                                            {training.is_certified && (
                                                                                                <span className="flex items-center gap-1 text-emerald-600 font-bold">
                                                                                                    <CheckCircle size={12} /> Tersertifikasi
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="text-right flex-shrink-0">
                                                                                        <div className="text-lg font-black text-[#005E54]">{training.final_score}%</div>
                                                                                        <div className="text-xs text-slate-400">Nilai</div>
                                                                                    </div>
                                                                                </div>

                                                                                {/* Points Breakdown for this training */}
                                                                                <div className="grid grid-cols-3 gap-2 text-xs">
                                                                                    <div className="bg-blue-50 rounded px-2 py-1 text-blue-700 font-bold">
                                                                                        Modul: +{training.points_breakdown.module_completion}
                                                                                    </div>
                                                                                    <div className="bg-emerald-50 rounded px-2 py-1 text-emerald-700 font-bold">
                                                                                        Sertif: +{training.points_breakdown.certification_bonus}
                                                                                    </div>
                                                                                    <div className="bg-purple-50 rounded px-2 py-1 text-purple-700 font-bold">
                                                                                        Total: +{training.points_breakdown.total}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <div className="text-center py-8 text-slate-400">
                                                                            <BookOpen size={40} className="mx-auto mb-3 opacity-50" />
                                                                            <p>Belum ada riwayat pelatihan</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="text-center py-8 text-slate-400">
                                                            <AlertCircle size={40} className="mx-auto mb-3 opacity-50" />
                                                            <p>Gagal memuat riwayat</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                                    );
                                })}
                            </div>

                            {/* Pagination Controls */}
                            <div className="flex items-center justify-between p-6 border-t border-slate-100 bg-slate-50">
                                <div className="text-sm text-slate-600 font-semibold">
                                    Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredAndPaginatedLeaderboard.total)} dari {filteredAndPaginatedLeaderboard.total} peserta
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="flex items-center gap-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    >
                                        <ChevronUp size={16} className="rotate-90" />
                                        Sebelumnya
                                    </button>

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, filteredAndPaginatedLeaderboard.totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (filteredAndPaginatedLeaderboard.totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else {
                                                if (currentPage <= 3) {
                                                    pageNum = i + 1;
                                                } else if (currentPage >= filteredAndPaginatedLeaderboard.totalPages - 2) {
                                                    pageNum = filteredAndPaginatedLeaderboard.totalPages - 4 + i;
                                                } else {
                                                    pageNum = currentPage - 2 + i;
                                                }
                                            }
                                            
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`w-10 h-10 rounded-lg font-bold transition ${
                                                        currentPage === pageNum
                                                            ? 'bg-[#005E54] text-white'
                                                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, filteredAndPaginatedLeaderboard.totalPages))}
                                        disabled={currentPage === filteredAndPaginatedLeaderboard.totalPages}
                                        className="flex items-center gap-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    >
                                        Berikutnya
                                        <ChevronDown size={16} className="-rotate-90" />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-20">
                            <Users size={48} className="mx-auto mb-4 text-slate-300" />
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Tidak ada data</h3>
                            <p className="text-slate-500">Coba ubah filter atau kata kunci pencarian Anda.</p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
            `}</style>
        </AdminLayout>
    );
};

export default Leaderboard;
