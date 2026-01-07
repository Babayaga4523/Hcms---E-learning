import React from 'react';
import { Link } from '@inertiajs/react';
import { Play, Lock, CheckCircle, AlertCircle } from 'lucide-react';

export default function TrainingCard({ training, user }) {
    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Selesai
                    </span>
                );
            case 'in_progress':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                        <Play className="w-3 h-3" />
                        Sedang Belajar
                    </span>
                );
            case 'enrolled':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">
                        <Lock className="w-3 h-3" />
                        Terdaftar
                    </span>
                );
            case 'not_started':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">
                        <Lock className="w-3 h-3" />
                        Belum Mulai
                    </span>
                );
            case 'failed':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                        <AlertCircle className="w-3 h-3" />
                        Perlu Retry
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">
                        <Lock className="w-3 h-3" />
                        Belum Mulai
                    </span>
                );
        }
    };

    const getProgressColor = (percentage) => {
        if (percentage === 100) return 'bg-green-500';
        if (percentage >= 75) return 'bg-blue-500';
        if (percentage >= 50) return 'bg-amber-500';
        return 'bg-red-500';
    };

    const progress = training.module_progress?.progress_percentage || 0;
    const finalScore = training.final_score || 0;

    return (
        <Link href={`/trainings/${training.id}`}>
            <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition transform hover:scale-105 overflow-hidden cursor-pointer border border-gray-100">
                {/* Header with gradient background */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-24 relative">
                    <div className="absolute top-3 right-3">
                        {getStatusBadge(training.status)}
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 -mt-8 relative z-10">
                    {/* Card body with white background */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                        <h3 className="font-bold text-lg text-gray-800 line-clamp-2">
                            {training.title}
                        </h3>
                        
                        <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                            {training.description}
                        </p>

                        {/* Divider */}
                        <div className="my-3 border-t border-gray-200"></div>

                        {/* Progress Section */}
                        <div className="mb-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-gray-700">Progress Materi</span>
                                <span className="text-xs font-bold text-blue-600">{Math.round(progress || 0)}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${getProgressColor(progress || 0)} transition-all duration-300`}
                                    style={{ width: `${progress || 0}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Score Section (if completed) */}
                        {training.status === 'completed' && finalScore > 0 && (
                            <div className="mb-3 p-3 bg-green-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-gray-700">Nilai Ujian</span>
                                    <span className={`text-lg font-bold ${
                                        finalScore >= (training.passing_grade || 70) 
                                            ? 'text-green-600' 
                                            : 'text-red-600'
                                    }`}>
                                        {finalScore}
                                    </span>
                                </div>
                                {training.is_certified && (
                                    <p className="text-xs text-green-700 mt-2 flex items-center gap-1">
                                        ✓ Sertifikat diterima
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Passing Grade Info */}
                        <div className="mb-3 flex items-center justify-between text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            <span>KKM (Passing Grade)</span>
                            <span className="font-semibold">{training.passing_grade || 70}%</span>
                        </div>

                        {/* Meta Info */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>
                                {training.enrolled_at && 
                                    new Date(training.enrolled_at).toLocaleDateString('id-ID')
                                }
                            </span>
                            <span className="text-right">
                                {training.status === 'completed' && training.completed_at &&
                                    `Selesai: ${new Date(training.completed_at).toLocaleDateString('id-ID')}`
                                }
                            </span>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button className="w-full mt-3 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition text-sm">
                        {training.status === 'completed' ? 'Lihat Hasil' : 'Lanjutkan'}
                    </button>
                </div>
            </div>
        </Link>
    );
}
