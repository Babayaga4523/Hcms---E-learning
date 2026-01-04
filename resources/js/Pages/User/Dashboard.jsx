import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import DashboardCard from '@/Components/Dashboard/DashboardCard';
import TrainingCard from '@/Components/Dashboard/TrainingCard';
import ProgressStats from '@/Components/Dashboard/ProgressStats';
import CertificateCard from '@/Components/Dashboard/CertificateCard';
import AnnouncementBanner from '@/Components/Announcement/AnnouncementBanner';
import AnnouncementModal from '@/Components/Announcement/AnnouncementModal';
import NotificationDropdown from '@/Components/Notification/NotificationDropdown';
import { 
    BarChart3, 
    TrendingUp, 
    Award, 
    BookOpen,
    Target,
    Clock
} from 'lucide-react';

export default function Dashboard({ auth, trainings = [], completedTrainings = [], upcomingTrainings = [], recentActivity = [] }) {
    const user = auth?.user || {};
    const [selectedFilter, setSelectedFilter] = useState('all');

    // Ensure trainings is always an array
    const trainingsArray = Array.isArray(trainings) ? trainings : Object.values(trainings || {});
    const completedArray = Array.isArray(completedTrainings) ? completedTrainings : Object.values(completedTrainings || {});
    const upcomingArray = Array.isArray(upcomingTrainings) ? upcomingTrainings : Object.values(upcomingTrainings || {});
    const activityArray = Array.isArray(recentActivity) ? recentActivity : Object.values(recentActivity || {});

    // Calculate statistics
    const totalTrainings = trainingsArray.length || 0;
    const completedCount = completedArray.length || 0;
    const inProgressCount = trainingsArray.filter(t => t?.status === 'in_progress').length || 0;
    const completionPercentage = totalTrainings > 0 ? Math.round((completedCount / totalTrainings) * 100) : 0;
    const certifications = trainingsArray.filter(t => t?.is_certified).length || 0;

    // Filter trainings
    const filteredTrainings = selectedFilter === 'all' 
        ? trainingsArray 
        : trainingsArray.filter(t => t?.status === selectedFilter);

    return (
        <AppLayout user={user}>
            <Head title="Dashboard Pembelajaran" />

            {/* Announcement Banner */}
            <AnnouncementBanner />

            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 px-6 py-12 rounded-lg shadow-lg mb-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">
                                Selamat Datang Kembali, {user.name}!
                            </h1>
                            <p className="text-blue-100 text-lg">
                                {user.department} • NIP: {user.nip}
                            </p>
                            <p className="text-blue-100 mt-2">
                                Terus tingkatkan kompetensi Anda melalui program pelatihan kami
                            </p>
                        </div>
                        <div className="hidden md:block">
                            <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-full p-8">
                                <BookOpen className="w-16 h-16 text-white" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <DashboardCard
                    icon={<Target className="w-8 h-8" />}
                    title="Total Training"
                    value={totalTrainings}
                    subtitle="Program pelatihan"
                    bgGradient="from-blue-500 to-blue-600"
                />
                <DashboardCard
                    icon={<TrendingUp className="w-8 h-8" />}
                    title="Sedang Diikuti"
                    value={inProgressCount}
                    subtitle="In Progress"
                    bgGradient="from-amber-500 to-amber-600"
                />
                <DashboardCard
                    icon={<Award className="w-8 h-8" />}
                    title="Selesai"
                    value={completedCount}
                    subtitle={`${completionPercentage}% selesai`}
                    bgGradient="from-green-500 to-green-600"
                />
                <DashboardCard
                    icon={<BarChart3 className="w-8 h-8" />}
                    title="Sertifikat"
                    value={certifications}
                    subtitle="Diterima"
                    bgGradient="from-purple-500 to-purple-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Progress Overview */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Progres Keseluruhan</h2>
                            <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                {completionPercentage}%
                            </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mb-6">
                            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                                    style={{ width: `${completionPercentage}%` }}
                                ></div>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">
                                {completedCount} dari {totalTrainings} training selesai
                            </p>
                        </div>

                        {/* Stats Grid */}
                        <ProgressStats 
                            totalTrainings={totalTrainings}
                            completedCount={completedCount}
                            inProgressCount={inProgressCount}
                            certifications={certifications}
                        />
                    </div>
                </div>

                {/* Quick Actions / Certificate Preview */}
                <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Pencapaian Terbaru</h3>
                    
                    {certifications > 0 ? (
                        <div className="space-y-3">
                            {trainingsArray.filter(t => t?.is_certified).slice(0, 3).map((training, idx) => (
                                <CertificateCard key={idx} training={training} />
                            ))}
                            {certifications > 3 && (
                                <p className="text-sm text-center text-gray-500 pt-2">
                                    +{certifications - 3} sertifikat lainnya
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">Belum ada sertifikat</p>
                            <p className="text-sm text-gray-400">Selesaikan training untuk mendapat sertifikat</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Training Programs Section */}
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100 mb-8">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                    <h2 className="text-2xl font-bold text-gray-800">Program Pelatihan</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectedFilter('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition ${
                                selectedFilter === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Semua
                        </button>
                        <button
                            onClick={() => setSelectedFilter('in_progress')}
                            className={`px-4 py-2 rounded-lg font-medium transition ${
                                selectedFilter === 'in_progress'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Aktif
                        </button>
                        <button
                            onClick={() => setSelectedFilter('completed')}
                            className={`px-4 py-2 rounded-lg font-medium transition ${
                                selectedFilter === 'completed'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Selesai
                        </button>
                    </div>
                </div>

                {filteredTrainings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTrainings.map((training) => (
                            <TrainingCard key={training.id} training={training} user={user} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">Tidak ada training</p>
                        <p className="text-gray-400">Lihat semua training yang tersedia</p>
                    </div>
                )}
            </div>

            {/* Upcoming Trainings Section */}
            {upcomingArray.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100 mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Training Mendatang</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {upcomingArray.slice(0, 4).map((training) => (
                            <div key={training.id} className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition">
                                <div className="flex-shrink-0">
                                    <Clock className="w-6 h-6 text-amber-500" />
                                </div>
                                <div className="ml-4 flex-grow">
                                    <h3 className="font-semibold text-gray-800">{training.title}</h3>
                                    <p className="text-sm text-gray-600">{training.description}</p>
                                </div>
                                <button className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                                    Lihat
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Activity Section */}
            {activityArray.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Aktivitas Terbaru</h2>
                    <div className="space-y-3">
                        {activityArray.slice(0, 5).map((activity, idx) => (
                            <div key={idx} className="flex items-center py-3 border-b border-gray-100 last:border-0">
                                <div className="flex-shrink-0">
                                    <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                                </div>
                                <div className="ml-4 flex-grow">
                                    <p className="text-gray-800 font-medium">{activity.title}</p>
                                    <p className="text-sm text-gray-500">{activity.time}</p>
                                </div>
                                {activity.score && (
                                    <span className={`px-3 py-1 rounded text-sm font-semibold ${
                                        activity.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {activity.score}%
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Announcement Modal */}
            <AnnouncementModal />

            {/* Notification Bell - Fixed Position */}
            <div className="fixed top-20 right-6 z-40">
                <NotificationDropdown user={user} />
            </div>
        </AppLayout>
    );
}
