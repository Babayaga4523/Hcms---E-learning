import React, { useState, useEffect } from 'react';
import { BarChart3, BookOpen, CheckCircle, Zap, TrendingUp, TrendingDown } from 'lucide-react';
import axios from 'axios';

const StatCard = ({ icon: Icon, title, value, unit, trend, period, color = 'blue' }) => {
    const colorClasses = {
        blue: 'from-blue-500 to-cyan-500',
        green: 'from-green-500 to-emerald-500',
        orange: 'from-orange-500 to-amber-500',
        purple: 'from-purple-500 to-pink-500',
    };

    const trendIsPositive = typeof trend === 'string' 
        ? trend.startsWith('+') 
        : trend >= 0;

    return (
        <div className="glass-card rounded-xl p-4 border border-slate-100 hover:border-slate-200 transition-all">
            <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 bg-gradient-to-br ${colorClasses[color]} rounded-lg shadow-lg`}>
                    <Icon className="w-4 h-4 text-white" />
                </div>
                {typeof trend !== 'undefined' && trend !== '↑' && trend !== '↓' && (
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded ${
                        trendIsPositive 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                    }`}>
                        {trendIsPositive ? (
                            <TrendingUp className="w-3 h-3" />
                        ) : (
                            <TrendingDown className="w-3 h-3" />
                        )}
                        {trend}
                    </div>
                )}
            </div>

            <div className="mb-2">
                <p className="text-xs text-slate-600 font-medium uppercase tracking-wider">{title}</p>
                <div className="flex items-baseline gap-1 mt-1">
                    <p className="text-2xl font-bold text-slate-900">{value}</p>
                    {unit && <p className="text-sm text-slate-500 font-medium">{unit}</p>}
                </div>
            </div>

            {period && (
                <p className="text-xs text-slate-500">{period}</p>
            )}
        </div>
    );
};

const LearningStatsCards = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStatistics();
    }, []);

    const fetchStatistics = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/user/dashboard/statistics');
            setStats(response.data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch statistics:', err);
            setError('Gagal memuat statistik pembelajaran');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="glass-card rounded-xl p-4 animate-pulse">
                            <div className="h-8 bg-slate-200 rounded w-1/2 mb-4"></div>
                            <div className="h-6 bg-slate-100 rounded w-3/4"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-700 text-sm">{error}</p>
            </div>
        );
    }

    if (!stats) return null;

    const {
        learning_hours = {},
        materials_studied = {},
        quiz_success = {},
        average_score = {},
    } = stats;

    return (
        <div className="mb-6">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900">Statistik Pembelajaran</h3>
                    <p className="text-xs text-slate-500">Progress & performance overview</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Learning Hours */}
                <StatCard
                    icon={BookOpen}
                    title="Total Jam Belajar"
                    value={learning_hours.value || 0}
                    unit={learning_hours.unit}
                    trend={learning_hours.trend}
                    period={`${learning_hours.period}`}
                    color="blue"
                />

                {/* Materials Studied */}
                <StatCard
                    icon={CheckCircle}
                    title="Materi Dipelajari"
                    value={materials_studied.value || 0}
                    unit={materials_studied.unit}
                    trend={materials_studied.trend}
                    period={`${materials_studied.period}`}
                    color="green"
                />

                {/* Quiz Success Rate */}
                <StatCard
                    icon={Zap}
                    title="Tingkat Keberhasilan"
                    value={`${quiz_success.percentage || 0}%`}
                    unit={`(${quiz_success.passed}/${quiz_success.total})`}
                    trend={quiz_success.trend}
                    period="Quiz selesai"
                    color="orange"
                />

                {/* Average Score */}
                <StatCard
                    icon={TrendingUp}
                    title="Rata-rata Nilai"
                    value={average_score.value || 0}
                    unit={average_score.unit}
                    trend={average_score.trend}
                    period={average_score.period}
                    color="purple"
                />
            </div>

            {/* Summary Info */}
            <div className="mt-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-blue-100 rounded-lg mt-0.5">
                        <BarChart3 className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">💡 Insight</p>
                        <p className="text-xs text-slate-600 mt-1">
                            {quiz_success.percentage >= 80 
                                ? '🔥 Performa Anda luar biasa! Pertahankan momentum ini.'
                                : quiz_success.percentage >= 60 
                                ? '👍 Anda melakukan dengan baik. Fokus pada area yang perlu improvement.'
                                : '📈 Tingkatkan usaha Anda - lebih banyak latihan membuat lebih sempurna!'
                            }
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LearningStatsCards;
