import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { Target, CheckCircle, AlertCircle, Clock, Zap, X } from 'lucide-react';
import axios from 'axios';

const GoalTrackerWidget = () => {
    const [goals, setGoals] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/user/dashboard/goals');
            setGoals(response.data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch goals:', err);
            setError('Gagal memuat target pembelajaran');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="glass-card rounded-2xl p-6 mb-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-200 rounded w-1/3"></div>
                    <div className="h-4 bg-slate-100 rounded w-full"></div>
                    <div className="h-4 bg-slate-100 rounded w-2/3"></div>
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

    if (!goals || !goals.monthly_target) {
        return null;
    }

    const { monthly_target, completion_bonus } = goals;
    const progressPercent = monthly_target.progress_percentage;
    const isCompleted = monthly_target.completed >= monthly_target.target;
    const remaining = Math.max(0, monthly_target.target - monthly_target.completed);

    // Determine urgency level based on days remaining
    const getUrgencyColor = () => {
        if (monthly_target.days_remaining < 7) return 'red';
        if (monthly_target.days_remaining < 14) return 'yellow';
        return 'green';
    };

    const urgencyColor = getUrgencyColor();
    const urgencyColors = {
        red: 'bg-red-50 border-red-200 text-red-700',
        yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
        green: 'bg-green-50 border-green-200 text-green-700',
    };

    const progressBarColors = {
        red: 'bg-red-500',
        yellow: 'bg-yellow-500',
        green: 'bg-green-500',
    };

    return (
        <div className="glass-card rounded-2xl p-6 mb-6 border border-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg">
                        <Target className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">{monthly_target.label}</h3>
                        <p className="text-xs text-slate-500 mt-1">
                            {monthly_target.days_remaining} hari tersisa
                        </p>
                    </div>
                </div>
                {completion_bonus.awarded && (
                    <div className="flex items-center gap-1 px-3 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-bold">
                        <Zap className="w-4 h-4" />
                        Selesai!
                    </div>
                )}
            </div>

            {/* Progress Section */}
            <div className="space-y-4 mb-6">
                {/* Progress Bar */}
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-semibold text-slate-900">
                            {monthly_target.completed} / {monthly_target.target}
                        </span>
                        <span className={`text-xs font-bold ${
                            urgencyColor === 'red' ? 'text-red-600' : 
                            urgencyColor === 'yellow' ? 'text-yellow-600' : 
                            'text-green-600'
                        }`}>
                            {progressPercent}%
                        </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className={`h-full ${progressBarColors[urgencyColor]} transition-all duration-500 ease-out rounded-full`}
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                </div>

                {/* Urgency Alert */}
                <div className={`p-3 rounded-lg border flex items-start gap-3 ${urgencyColors[urgencyColor]}`}>
                    {urgencyColor === 'red' && (
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    )}
                    {urgencyColor === 'yellow' && (
                        <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    )}
                    {urgencyColor === 'green' && (
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                        <p className="text-xs font-semibold">
                            {isCompleted ? (
                                <>🎉 Target tercapai! Bonus achievement unlock</>
                            ) : (
                                <>
                                    Selesaikan {remaining} lagi untuk mencapai target
                                </>
                            )}
                        </p>
                        <p className="text-xs opacity-75 mt-1">
                            {urgencyColor === 'red' && 'Target deadline sudah dekat!'}
                            {urgencyColor === 'yellow' && 'Percepat pembelajaran untuk memenuhi target'}
                            {urgencyColor === 'green' && `Masih ada ${monthly_target.days_remaining} hari, Anda masih punya waktu`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Action Button */}
            <div className="flex gap-2">
                <Link 
                    href="/my-trainings"
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#005E54] to-[#003d35] text-white font-semibold rounded-lg hover:shadow-lg transition-all text-sm text-center"
                >
                    ▶ Lanjutkan Belajar
                </Link>
                <button 
                    onClick={() => setShowDetailModal(true)}
                    className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-all text-sm"
                >
                    📊 Lihat Detail
                </button>
            </div>

            {/* Detail Modal */}
            {showDetailModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="glass-card rounded-2xl p-6 max-w-md w-full border border-slate-100 shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-slate-900">Rincian Target Pembelajaran</h2>
                            <button 
                                onClick={() => setShowDetailModal(false)}
                                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-600" />
                            </button>
                        </div>

                        {/* Content */}
                        {goals && goals.monthly_target && (
                            <div className="space-y-4">
                                {/* Target Section */}
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                    <p className="text-xs font-semibold text-blue-700 mb-2">TARGET BULANAN</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold text-blue-700">{goals.monthly_target.completed}</span>
                                        <span className="text-lg text-blue-600">/ {goals.monthly_target.target}</span>
                                    </div>
                                    <p className="text-xs text-blue-600 mt-2">Selesaikan {Math.max(0, goals.monthly_target.target - goals.monthly_target.completed)} lagi untuk mencapai target</p>
                                </div>

                                {/* Progress Section */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm font-semibold text-slate-900">Progress:</p>
                                        <span className="text-sm font-bold text-[#005E54]">{goals.monthly_target.progress_percentage}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-[#005E54] to-[#00897b] transition-all duration-500"
                                            style={{ width: `${goals.monthly_target.progress_percentage}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Timeline Section */}
                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <p className="text-xs font-semibold text-slate-700 mb-2">WAKTU TERSISA</p>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-slate-600" />
                                        <span className="text-sm font-bold text-slate-900">
                                            {goals.monthly_target.days_remaining} hari
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-600 mt-2">
                                        Sampe akhir bulan ini
                                    </p>
                                </div>

                                {/* Upcoming Section */}
                                {goals.upcoming_deadlines && goals.upcoming_deadlines.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-slate-700">TRAINING MENDATANG</p>
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {goals.upcoming_deadlines.map((deadline, idx) => (
                                                <div key={idx} className="p-2 bg-slate-50 rounded-lg text-xs">
                                                    <p className="font-medium text-slate-900">{deadline.module_title}</p>
                                                    <p className="text-slate-600 mt-1">
                                                        {deadline.days_remaining > 0 
                                                            ? `${deadline.days_remaining} hari lagi` 
                                                            : 'Overdue'
                                                        }
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Bonus Section */}
                                {goals.completion_bonus && goals.completion_bonus.awarded && (
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                        <p className="text-sm font-bold text-amber-700">
                                            🎉 Target tercapai! Bonus achievement unlock
                                        </p>
                                    </div>
                                )}

                                {/* Action Button */}
                                <Link 
                                    href="/my-trainings"
                                    className="w-full px-4 py-2.5 bg-gradient-to-r from-[#005E54] to-[#003d35] text-white font-semibold rounded-lg hover:shadow-lg transition-all text-center text-sm"
                                >
                                    Lanjutkan Belajar →
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Info Footer */}
            <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-600 text-center">
                    Capai target untuk membuka achievement badge dan bonus poin
                </p>
            </div>
        </div>
    );
};

export default GoalTrackerWidget;
