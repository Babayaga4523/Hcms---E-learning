import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Award, Zap } from 'lucide-react';
import axios from 'axios';

const LeaderboardWidget = () => {
    const [leaderboard, setLeaderboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeframe, setTimeframe] = useState('monthly');

    useEffect(() => {
        fetchLeaderboard();
    }, [timeframe]);

    const fetchLeaderboard = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/user/leaderboard/monthly');
            console.log('Leaderboard data loaded:', response.data);
            setLeaderboard(response.data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch leaderboard:', err);
            setError('Gagal memuat leaderboard');
        } finally {
            setLoading(false);
        }
    };

    const getBadgeColor = (rank) => {
        switch (rank) {
            case 1: return 'text-yellow-500';
            case 2: return 'text-gray-400';
            case 3: return 'text-orange-500';
            default: return 'text-slate-400';
        }
    };

    const getBadgeIcon = (rank) => {
        const medals = ['🥇', '🥈', '🥉'];
        return medals[rank - 1] || `#${rank}`;
    };

    const getBadgeLabel = (badge) => {
        const badges = {
            'PLATINUM': { color: 'from-purple-500 to-indigo-500', label: '⭐ Platinum' },
            'GOLD': { color: 'from-yellow-500 to-orange-500', label: '✨ Gold' },
            'SILVER': { color: 'from-gray-400 to-slate-500', label: '◆ Silver' },
            'BRONZE': { color: 'from-orange-600 to-red-600', label: '⬥ Bronze' },
        };
        return badges[badge] || badges['BRONZE'];
    };

    if (loading) {
        return (
            <div className="glass-card rounded-2xl p-6 mb-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-200 rounded w-1/3"></div>
                    <div className="space-y-2">
                        <div className="h-12 bg-slate-100 rounded"></div>
                        <div className="h-12 bg-slate-100 rounded"></div>
                        <div className="h-12 bg-slate-100 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass-card rounded-2xl p-6 mb-6 border border-red-200 bg-red-50">
                <p className="text-red-700 text-center">{error}</p>
            </div>
        );
    }

    const { leaderboard: topPerformers = [], user_rank, total_participants } = leaderboard || {};

    return (
        <div className="glass-card rounded-2xl p-6 mb-6 border border-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-lg">
                        <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            Leaderboard - Top Performers
                            <span className="text-xs font-medium px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                                Bulan Ini
                            </span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            {total_participants} peserta
                        </p>
                    </div>
                </div>
                <button 
                    onClick={fetchLeaderboard}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <Zap className="w-4 h-4 text-slate-600" />
                </button>
            </div>

            {/* Top Performers List */}
            <div className="space-y-3 mb-6">
                {topPerformers && topPerformers.length > 0 ? (
                    topPerformers.map((performer, index) => {
                        const badgeInfo = getBadgeLabel(performer.badge);
                        return (
                            <div key={performer.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-100 hover:border-[#005E54]/20 transition-colors">
                                <div className="flex items-center gap-3 flex-1">
                                    {/* Rank Medal */}
                                    <div className={`flex items-center justify-center w-8 h-8 font-bold text-lg ${getBadgeColor(index + 1)}`}>
                                        {getBadgeIcon(index + 1)}
                                    </div>

                                    {/* Name & Department */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-900 truncate text-sm">
                                            {performer.name}
                                            {performer.is_current_user && (
                                                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded">
                                                    You
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-xs text-slate-500">{performer.department}</p>
                                    </div>
                                </div>

                                {/* Points & Badge */}
                                <div className="flex items-center gap-3 text-right">
                                    <div>
                                        <p className="font-bold text-slate-900 text-sm">{performer.points || 0}</p>
                                        <p className="text-xs text-slate-500">XP</p>
                                    </div>
                                    <div className={`px-2 py-1 rounded-md text-xs font-bold text-white bg-gradient-to-r ${badgeInfo.color}`}>
                                        {badgeInfo.label}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-8 text-slate-500">
                        <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Belum ada data leaderboard</p>
                    </div>
                )}
            </div>

            {/* User's Rank if not in top 5 */}
            {user_rank && !user_rank.is_current_user_in_top && (
                <div className="border-t-2 border-dotted border-slate-200 pt-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="flex items-center justify-center w-8 h-8 font-bold text-sm text-blue-700">
                                #{user_rank.rank}
                            </div>
                            <div>
                                <p className="font-semibold text-slate-900 text-sm">
                                    {user_rank.name}
                                    <span className="ml-2 px-2 py-0.5 bg-blue-200 text-blue-800 text-[10px] font-bold rounded">
                                        You
                                    </span>
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-blue-700 text-sm">{user_rank.points}</p>
                            <p className="text-xs text-blue-600">XP</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer Stats */}
            <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-3 gap-3">
                <div className="text-center">
                    <p className="text-2xl font-bold text-[#005E54]">{topPerformers[0]?.modules_completed || 0}</p>
                    <p className="text-xs text-slate-600 mt-1">Modul (Top)</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-amber-600">{topPerformers[0]?.certifications || 0}</p>
                    <p className="text-xs text-slate-600 mt-1">Sertifikat</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{topPerformers[0]?.avg_score.toFixed(0) || 0}%</p>
                    <p className="text-xs text-slate-600 mt-1">Rata-rata</p>
                </div>
            </div>
        </div>
    );
};

export default LeaderboardWidget;
