import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    ArrowLeft, Download, Eye, Trash2, CheckCircle, 
    AlertCircle, Clock, User, Award
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import axios from 'axios';

export default function ExamAttempts({ program, attempts, auth }) {
    const [allAttempts, setAllAttempts] = useState(attempts.data || []);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null);

    const showNotification = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleDelete = async (attemptId) => {
        if (!confirm('Hapus percobaan ini?')) return;

        setLoading(true);
        try {
            await axios.delete(`/api/admin/exam-attempts/${attemptId}`);
            setAllAttempts(allAttempts.filter(a => a.id !== attemptId));
            showNotification('Percobaan berhasil dihapus', 'success');
        } catch (error) {
            showNotification('Error menghapus percobaan', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (attemptId) => {
        window.location.href = `/admin/exam-attempts/${attemptId}`;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (attempt) => {
        const isPassed = attempt.score >= program.passing_grade;
        return {
            color: isPassed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700',
            icon: isPassed ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />,
            label: isPassed ? 'LULUS' : 'BELUM LULUS'
        };
    };

    return (
        <AdminLayout user={auth?.user}>
            <Head title={`Exam Attempts - ${program.title}`} />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-20">
                {/* Notification */}
                {notification && (
                    <div className={`fixed top-6 right-6 px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 ${
                        notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                        {notification.type === 'success' ? (
                            <CheckCircle className="w-5 h-5" />
                        ) : (
                            <AlertCircle className="w-5 h-5" />
                        )}
                        {notification.msg}
                    </div>
                )}

                {/* Header */}
                <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white py-8 px-6">
                    <div className="max-w-7xl mx-auto">
                        <button
                            onClick={() => router.visit('/admin/training-programs')}
                            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-bold">Kembali</span>
                        </button>
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="inline-block bg-white/20 text-white px-3 py-1 rounded-full text-sm font-bold mb-2">
                                    Exam Attempts
                                </span>
                                <h1 className="text-4xl font-bold text-white mb-2">{program.title}</h1>
                                <p className="text-orange-100">Kelola semua percobaan ujian peserta</p>
                            </div>
                            <div className="text-right">
                                <div className="text-4xl font-bold text-white">{allAttempts.length}</div>
                                <p className="text-orange-100 text-sm">Total Percobaan</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {allAttempts.length > 0 ? (
                        <div className="space-y-4">
                            {allAttempts.map((attempt) => {
                                const status = getStatusBadge(attempt);
                                return (
                                    <div
                                        key={attempt.id}
                                        className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg transition overflow-hidden"
                                    >
                                        <div className="flex items-center p-6 gap-6">
                                            {/* User Info */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <User className="w-5 h-5 text-slate-500" />
                                                    <h3 className="text-lg font-bold text-slate-900">
                                                        {attempt.user?.name || 'Unknown'}
                                                    </h3>
                                                </div>
                                                <p className="text-sm text-slate-600 mb-3">
                                                    {attempt.user?.email || 'N/A'}
                                                </p>
                                                <div className="flex items-center gap-4 text-sm text-slate-600">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {formatDate(attempt.created_at)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Score & Status */}
                                            <div className="text-right border-r border-slate-200 pr-6">
                                                <div className="text-4xl font-bold text-slate-900 mb-1">
                                                    {Math.round(attempt.score)}%
                                                </div>
                                                <p className="text-sm text-slate-600 mb-3">
                                                    KKM: {program.passing_grade}%
                                                </p>
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold ${status.color}`}>
                                                    {status.icon}
                                                    {status.label}
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleViewDetails(attempt.id)}
                                                    className="p-3 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                                                    title="Lihat Detail"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(attempt.id)}
                                                    disabled={loading}
                                                    className="p-3 hover:bg-red-50 text-red-600 rounded-lg transition disabled:opacity-50"
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                            <Award className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Belum ada percobaan ujian</h3>
                            <p className="text-slate-600">Percobaan ujian peserta akan muncul di sini</p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
