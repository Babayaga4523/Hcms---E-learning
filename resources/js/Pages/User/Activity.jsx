import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { CheckCircle, AlertCircle, Clock, FileText } from 'lucide-react';

const Activity = ({ auth }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/user/recent-activity', {
                headers: {
                    'Accept': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setActivities(Array.isArray(data) ? data : []);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch activities:', err);
            setError('Gagal memuat aktivitas. Silakan coba lagi.');
            setActivities([]);
        } finally {
            setLoading(false);
        }
    };

    const getActivityIcon = (activity) => {
        const lower = activity.title.toLowerCase();
        
        if (lower.includes('selesai')) {
            return (
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
            );
        }
        
        if (lower.includes('pre-test') || lower.includes('post-test')) {
            if (activity.passed) {
                return (
                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-blue-100">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                    </div>
                );
            } else {
                return (
                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-yellow-100">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                    </div>
                );
            }
        }

        return (
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100">
                <FileText className="w-5 h-5 text-gray-600" />
            </div>
        );
    };

    return (
        <AppLayout user={auth.user}>
            <Head title="Semua Aktivitas" />

            <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center text-sm font-medium text-[#002824] hover:opacity-80 mb-4"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Kembali ke Dashboard
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">Semua Aktivitas</h1>
                        <p className="mt-2 text-gray-600">Riwayat lengkap aktivitas pembelajaran Anda</p>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D6F84C]"></div>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                            <p className="text-red-800">{error}</p>
                            <button
                                onClick={fetchActivities}
                                className="mt-4 px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700"
                            >
                                Coba Lagi
                            </button>
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-12 text-center">
                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">Tidak ada aktivitas untuk ditampilkan</p>
                            <p className="text-gray-400 text-sm mt-2">Mulai dengan menyelesaikan pelatihan untuk melihat aktivitas Anda di sini.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {activities.map((activity, index) => (
                                <div key={index} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
                                    <div className="flex items-start space-x-4">
                                        {getActivityIcon(activity)}
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900">{activity.title}</h3>
                                            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                                                <div className="flex items-center space-x-1">
                                                    <Clock className="w-4 h-4" />
                                                    <span>{activity.time}</span>
                                                </div>
                                                {typeof activity.score === 'number' && (
                                                    <div className="flex items-center space-x-1">
                                                        <span>Skor: <strong className={activity.passed ? 'text-green-600' : 'text-red-600'}>
                                                            {activity.score}%
                                                        </strong></span>
                                                    </div>
                                                )}
                                            </div>
                                            {typeof activity.passed === 'boolean' && (
                                                <div className="mt-3">
                                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                                        activity.passed
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {activity.passed ? '✓ Lulus' : '✗ Tidak Lulus'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default Activity;
