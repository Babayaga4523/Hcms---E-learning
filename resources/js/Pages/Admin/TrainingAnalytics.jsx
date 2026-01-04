import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    ArrowLeft, Users, CheckCircle, BarChart3, 
    TrendingUp, Award, Clock, Zap
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function TrainingAnalytics({ program, stats, auth }) {
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        // Simulate chart data
        setChartData({
            enrollment: stats.enrollment_count,
            completion: stats.completion_count,
            completion_rate: stats.completion_rate,
            avg_score: stats.avg_score,
            pass_count: stats.pass_count,
            pass_rate: stats.pass_rate,
        });
    }, [stats]);

    const StatCard = ({ icon: Icon, label, value, unit = '', color = 'blue' }) => {
        const colors = {
            blue: 'bg-blue-50 text-blue-600 border-blue-200',
            emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
            amber: 'bg-amber-50 text-amber-600 border-amber-200',
            purple: 'bg-purple-50 text-purple-600 border-purple-200',
            red: 'bg-red-50 text-red-600 border-red-200',
        };

        return (
            <div className={`p-6 rounded-xl border ${colors[color]} backdrop-blur-sm`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900">{label}</h3>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="flex items-baseline gap-2">
                    <div className="text-4xl font-bold text-slate-900">{value}</div>
                    {unit && <span className="text-sm font-bold text-slate-600">{unit}</span>}
                </div>
            </div>
        );
    };

    const ProgressBar = ({ label, current, total, color = 'blue' }) => {
        const percentage = total > 0 ? (current / total) * 100 : 0;
        const colors = {
            blue: 'bg-blue-500',
            emerald: 'bg-emerald-500',
            amber: 'bg-amber-500',
            red: 'bg-red-500',
        };

        return (
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900">{label}</span>
                    <span className="text-sm font-bold text-slate-600">
                        {current} dari {total} ({percentage.toFixed(1)}%)
                    </span>
                </div>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${colors[color]} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
        );
    };

    return (
        <AdminLayout user={auth?.user}>
            <Head title={`Analytics - ${program.title}`} />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-20">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-8 px-6">
                    <div className="max-w-7xl mx-auto">
                        <button
                            onClick={() => router.visit('/admin/training-programs')}
                            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-bold">Kembali</span>
                        </button>
                        <div>
                            <span className="inline-block bg-white/20 text-white px-3 py-1 rounded-full text-sm font-bold mb-2">
                                Analytics Dashboard
                            </span>
                            <h1 className="text-4xl font-bold text-white mb-2">{program.title}</h1>
                            <p className="text-indigo-100">Analisis performa program pelatihan</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <StatCard
                            icon={Users}
                            label="Total Peserta"
                            value={stats.enrollment_count}
                            color="blue"
                        />
                        <StatCard
                            icon={CheckCircle}
                            label="Sudah Selesai"
                            value={stats.completion_count}
                            color="emerald"
                        />
                        <StatCard
                            icon={TrendingUp}
                            label="Tingkat Selesai"
                            value={stats.completion_rate}
                            unit="%"
                            color="amber"
                        />
                        <StatCard
                            icon={BarChart3}
                            label="Rata-rata Skor"
                            value={Math.round(stats.avg_score)}
                            unit="%"
                            color="purple"
                        />
                        <StatCard
                            icon={Award}
                            label="Lulus"
                            value={stats.pass_count}
                            color="emerald"
                        />
                        <StatCard
                            icon={Zap}
                            label="Tingkat Lulus"
                            value={stats.pass_rate}
                            unit="%"
                            color="indigo"
                        />
                    </div>

                    {/* Progress Bars */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                        <h2 className="text-2xl font-bold text-slate-900 mb-8">Progress Pengguna</h2>

                        <ProgressBar
                            label="Penyelesaian Program"
                            current={stats.completion_count}
                            total={stats.enrollment_count}
                            color="emerald"
                        />

                        <ProgressBar
                            label="Kelulusan (KKM ≥ {program.passing_grade}%)"
                            current={stats.pass_count}
                            total={stats.enrollment_count}
                            color="blue"
                        />

                        {/* Additional Info */}
                        <div className="mt-8 pt-8 border-t border-slate-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <p className="text-sm text-slate-600 mb-1">Belum Selesai</p>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {stats.enrollment_count - stats.completion_count}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600 mb-1">Belum Lulus</p>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {stats.enrollment_count - stats.pass_count}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600 mb-1">KKM Program</p>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {program.passing_grade}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Program Info */}
                    <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Informasi Program</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm text-slate-600 mb-2">Durasi Program</p>
                                <p className="text-lg font-bold text-slate-900">
                                    {program.duration_minutes} menit
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 mb-2">Kategori</p>
                                <p className="text-lg font-bold text-slate-900">
                                    {program.category || 'Tidak ditentukan'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 mb-2">Status</p>
                                <p className="inline-flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${program.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                    <span className="font-bold text-slate-900">
                                        {program.is_active ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 mb-2">Dibuat Pada</p>
                                <p className="text-lg font-bold text-slate-900">
                                    {new Date(program.created_at).toLocaleDateString('id-ID')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
