import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import axios from 'axios';
import { AlertCircle, TrendingUp, Calendar, Clock } from 'lucide-react';

const PeakPerformanceHeatmap = () => {
    const [heatmapData, setHeatmapData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [department, setDepartment] = useState('all');
    const [departments, setDepartments] = useState([]);

    useEffect(() => {
        fetchHeatmapData();
    }, [department]);

    const fetchHeatmapData = async () => {
        try {
            setLoading(true);
            const url = department && department !== 'all'
                ? `/api/admin/peak-performance/${department}`
                : '/api/admin/peak-performance';
            const response = await axios.get(url);
            setHeatmapData(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load heatmap data');
        } finally {
            setLoading(false);
        }
    };

    const getIntensityColor = (intensity) => {
        if (intensity >= 0.8) return 'bg-green-600';
        if (intensity >= 0.6) return 'bg-green-500';
        if (intensity >= 0.4) return 'bg-yellow-400';
        if (intensity >= 0.2) return 'bg-orange-400';
        return 'bg-red-400';
    };

    const getIntensityLabel = (intensity) => {
        if (intensity >= 0.8) return 'Optimal';
        if (intensity >= 0.6) return 'Good';
        if (intensity >= 0.4) return 'Medium';
        if (intensity >= 0.2) return 'Low';
        return 'Very Low';
    };

    if (loading) return (
        <AdminLayout>
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#005E54]"></div>
            </div>
        </AdminLayout>
    );

    if (error) return (
        <AdminLayout>
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
                <AlertCircle className="inline-block w-5 h-5 mr-2" />
                {error}
            </div>
        </AdminLayout>
    );

    if (!heatmapData) return null;

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">🕰️ Peak Performance Time Analytics</h1>
                    <p className="text-gray-600 mt-2">Analisis pola pembelajaran berdasarkan jam dan hari untuk optimasi penjadwalan training</p>
                </div>

                {/* Insight Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                            <TrendingUp className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-bold text-green-900 mb-2">✅ Waktu Optimal Pembelajaran</h3>
                                <p className="text-green-800 font-semibold">
                                    {heatmapData.insight}
                                </p>
                                {heatmapData.peak_times && heatmapData.peak_times[0] && (
                                    <div className="mt-3 text-sm text-green-700">
                                        <p>Rata-rata skor: <span className="font-bold">{heatmapData.peak_times[0].avg_score}%</span></p>
                                        <p>Jumlah attempt: <span className="font-bold">{heatmapData.peak_times[0].attempts}</span></p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-bold text-red-900 mb-2">❌ Hindari Waktu Ini</h3>
                                <p className="text-red-800 font-semibold">
                                    {heatmapData.warning}
                                </p>
                                {heatmapData.low_performance_times && heatmapData.low_performance_times[0] && (
                                    <div className="mt-3 text-sm text-red-700">
                                        <p>Rata-rata skor: <span className="font-bold">{heatmapData.low_performance_times[0].avg_score}%</span></p>
                                        <p>Jumlah attempt: <span className="font-bold">{heatmapData.low_performance_times[0].attempts}</span></p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Heatmap Legend */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Legenda Intensitas</h3>
                    <div className="flex gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-green-600"></div>
                            <span className="text-sm font-medium">Optimal (80-100%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-green-500"></div>
                            <span className="text-sm font-medium">Baik (60-79%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-yellow-400"></div>
                            <span className="text-sm font-medium">Sedang (40-59%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-orange-400"></div>
                            <span className="text-sm font-medium">Rendah (20-39%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-red-400"></div>
                            <span className="text-sm font-medium">Sangat Rendah (&lt;20%)</span>
                        </div>
                    </div>
                </div>

                {/* Main Heatmap */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 overflow-x-auto mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-[#005E54]" />
                        Learning Performance Heatmap (Last 60 Days)
                    </h3>

                    <div className="inline-block min-w-full">
                        <div className="flex gap-2">
                            {/* Hour labels */}
                            <div className="flex flex-col">
                                <div className="w-12 h-8"></div>
                                {Array.from({ length: 24 }, (_, i) => (
                                    <div key={i} className="w-12 h-8 text-xs font-bold text-gray-600 flex items-center justify-center border border-gray-200">
                                        {i}:00
                                    </div>
                                ))}
                            </div>

                            {/* Days and hours grid */}
                            {heatmapData.heatmap_grid?.map((dayData, dayIdx) => (
                                <div key={dayIdx} className="flex flex-col">
                                    <div className="w-20 h-8 text-xs font-bold text-gray-900 flex items-center justify-center border border-gray-200 bg-gray-50">
                                        {dayData.day}
                                    </div>
                                    {dayData.hours?.map((cell, hourIdx) => (
                                        <div
                                            key={hourIdx}
                                            className={`w-20 h-8 border border-gray-200 flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-[#005E54] transition-all ${getIntensityColor(cell.intensity)}`}
                                            title={`${cell.day} ${cell.hour}:00 - Skor: ${cell.avg_score}% (${cell.attempt_count} attempts)`}
                                        >
                                            {cell.attempt_count > 0 ? cell.avg_score : '-'}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 text-xs text-gray-500 italic">
                        Hover pada cell untuk melihat detail. Angka menunjukkan rata-rata skor ujian.
                    </div>
                </div>

                {/* Top Performance Times */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            5 Waktu Terbaik untuk Training
                        </h3>
                        <div className="space-y-3">
                            {heatmapData.peak_times?.map((time, idx) => (
                                <div key={idx} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-gray-900">#{idx + 1}</p>
                                            <p className="text-sm text-gray-600">{time.day}</p>
                                            <p className="text-sm font-semibold text-gray-900 mt-1">{time.time}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-green-600">{time.avg_score}%</p>
                                            <p className="text-xs text-gray-600">{time.attempts} attempts</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            5 Waktu Terburuk untuk Training
                        </h3>
                        <div className="space-y-3">
                            {heatmapData.low_performance_times?.map((time, idx) => (
                                <div key={idx} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-gray-900">#{idx + 1}</p>
                                            <p className="text-sm text-gray-600">{time.day}</p>
                                            <p className="text-sm font-semibold text-gray-900 mt-1">{time.time}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-red-600">{time.avg_score}%</p>
                                            <p className="text-xs text-gray-600">{time.attempts} attempts</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default PeakPerformanceHeatmap;
