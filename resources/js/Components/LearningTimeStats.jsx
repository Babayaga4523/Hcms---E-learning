import React, { useState, useEffect } from 'react';
import { Clock, TrendingUp, Zap, Calendar, Target, Award } from 'lucide-react';
import axios from 'axios';

/**
 * Learning Time Statistics Component
 * Menampilkan jam belajar dengan logic sempurna
 */
export default function LearningTimeStats() {
    const [stats, setStats] = useState({
        total_hours: 0,
        total_minutes: 0,
        total_sessions: 0,
        average_session_minutes: 0,
    });
    const [dailyActivity, setDailyActivity] = useState([]);
    const [byModule, setByModule] = useState([]);
    const [byActivityType, setByActivityType] = useState([]);
    const [streak, setStreak] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLearningStats();
    }, []);

    const fetchLearningStats = async () => {
        try {
            const response = await axios.get('/api/learner/learning-stats');
            setStats(response.data.stats);
            setDailyActivity(response.data.daily_activity || []);
            setByModule(response.data.by_module || []);
            setByActivityType(response.data.by_activity_type || []);
            setStreak(response.data.learning_streak || 0);
        } catch (error) {
            console.error('Failed to load learning stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-20 bg-slate-200 rounded-lg"></div>
                <div className="h-64 bg-slate-200 rounded-lg"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 font-sans">
            {/* Key Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Total Hours */}
                <div className="glass-panel p-6 rounded-[20px] bg-gradient-to-br from-blue-50 to-blue-100">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-blue-900">Total Jam Belajar</h3>
                        <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-3xl font-black text-blue-600">{stats.total_hours}h</div>
                    <p className="text-xs text-blue-700 mt-2">{stats.total_minutes} menit</p>
                </div>

                {/* Total Sessions */}
                <div className="glass-panel p-6 rounded-[20px] bg-gradient-to-br from-purple-50 to-purple-100">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-purple-900">Total Sesi</h3>
                        <Zap className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-3xl font-black text-purple-600">{stats.total_sessions}</div>
                    <p className="text-xs text-purple-700 mt-2">Sesi pembelajaran</p>
                </div>

                {/* Average Session */}
                <div className="glass-panel p-6 rounded-[20px] bg-gradient-to-br from-emerald-50 to-emerald-100">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-emerald-900">Rata-rata Sesi</h3>
                        <Target className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="text-3xl font-black text-emerald-600">{stats.average_session_minutes}m</div>
                    <p className="text-xs text-emerald-700 mt-2">per sesi</p>
                </div>

                {/* Learning Streak */}
                <div className="glass-panel p-6 rounded-[20px] bg-gradient-to-br from-orange-50 to-orange-100">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-orange-900">Konsistensi</h3>
                        <TrendingUp className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="text-3xl font-black text-orange-600">{streak}</div>
                    <p className="text-xs text-orange-700 mt-2">hari berturut-turut</p>
                </div>
            </div>

            {/* Daily Activity Chart */}
            {dailyActivity.length > 0 && (
                <div className="glass-panel p-6 rounded-[20px]">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-[#005E54]" />
                        Aktivitas 7 Hari Terakhir
                    </h3>
                    <div className="space-y-3">
                        {dailyActivity.map((day, idx) => (
                            <div key={idx} className="flex items-center gap-4">
                                <div className="w-12 text-sm font-bold text-slate-600">{day.day}</div>
                                <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-[#005E54] to-[#D6F84C] transition-all"
                                        style={{ width: `${Math.min(100, (day.hours / 4) * 100)}%` }}
                                    ></div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-slate-900">{day.hours}h</div>
                                    <div className="text-xs text-slate-500">{day.sessions} sesi</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Hours by Activity Type */}
            {byActivityType.length > 0 && (
                <div className="glass-panel p-6 rounded-[20px]">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-[#005E54]" />
                        Waktu Belajar per Jenis Aktivitas
                    </h3>
                    <div className="space-y-3">
                        {byActivityType.map((activity, idx) => {
                            const totalHours = byActivityType.reduce((sum, a) => sum + a.hours, 0) || 1;
                            const percentage = (activity.hours / totalHours) * 100;
                            
                            const colors = [
                                'from-blue-500 to-blue-600',
                                'from-purple-500 to-purple-600',
                                'from-emerald-500 to-emerald-600',
                                'from-orange-500 to-orange-600',
                                'from-pink-500 to-pink-600',
                                'from-teal-500 to-teal-600',
                            ];

                            return (
                                <div key={idx} className="bg-slate-50 p-4 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-semibold text-slate-900">{activity.label}</span>
                                        <span className="text-sm font-bold text-slate-600">{activity.hours}h</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                        <div 
                                            className={`h-full bg-gradient-to-r ${colors[idx % colors.length]}`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Hours by Module */}
            {byModule.length > 0 && (
                <div className="glass-panel p-6 rounded-[20px]">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Jam Belajar per Program</h3>
                    <div className="space-y-3">
                        {byModule.slice(0, 5).map((module, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                <span className="font-medium text-slate-900 truncate">{module.module_name}</span>
                                <span className="font-bold text-[#005E54]">{module.hours}h</span>
                            </div>
                        ))}
                        {byModule.length > 5 && (
                            <p className="text-xs text-slate-500 text-center pt-2">
                                dan {byModule.length - 5} program lainnya
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-[20px] p-4">
                <p className="text-sm text-blue-900">
                    ℹ️ <strong>Informasi Perhitungan:</strong> Jam belajar dihitung berdasarkan waktu aktual yang Anda habiskan di setiap material, kuis, dan aktivitas pembelajaran. Setiap sesi di-track secara real-time.
                </p>
            </div>
        </div>
    );
}
