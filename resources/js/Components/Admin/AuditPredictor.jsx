import React from 'react';
import { TrendingDown, Zap, AlertTriangle } from 'lucide-react';

export default function AuditPredictor({ statistics }) {
    // Simple AI Logic: prediksi berdasarkan trend completion rate
    const currentRate = statistics.completion_rate;
    const daysUntilDeadline = 45;
    
    // Simulasi tren historis (dalam real app, ini dari database)
    const historicalRate = [65, 72, 78, 82, 87, 91];
    const averageGrowthPerDay = (historicalRate[historicalRate.length - 1] - historicalRate[0]) / 30;
    
    // Prediksi compliance di hari ke-45
    const predictedRate = currentRate + (averageGrowthPerDay * daysUntilDeadline);
    const targetRate = 100;
    const isOnTrack = predictedRate >= targetRate;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">AI Audit Predictor</h3>
                <Zap className="w-5 h-5 text-yellow-500" />
            </div>

            {/* Prediction Card */}
            <div className={`p-4 rounded-lg mb-6 ${isOnTrack ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-3 mb-3">
                    {isOnTrack ? (
                        <div className="p-2 bg-emerald-100 rounded-full">
                            <Zap className="w-5 h-5 text-emerald-600" />
                        </div>
                    ) : (
                        <div className="p-2 bg-red-100 rounded-full">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                    )}
                    <div>
                        <p className="text-sm font-semibold text-gray-900">
                            {isOnTrack ? '✅ Prediksi: ON TRACK' : '⚠️ Prediksi: AT RISK'}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                            Berdasarkan tren pertumbuhan 30 hari terakhir
                        </p>
                    </div>
                </div>

                {/* Forecast Details */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="p-3 bg-white rounded border border-gray-200">
                        <p className="text-xs text-gray-600">Current Rate</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{Math.round(currentRate)}%</p>
                    </div>
                    <div className="p-3 bg-white rounded border border-gray-200">
                        <p className="text-xs text-gray-600">Predicted (45 hari)</p>
                        <p className={`text-2xl font-bold mt-1 ${predictedRate >= 100 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {Math.round(Math.min(predictedRate, 100))}%
                        </p>
                    </div>
                </div>

                {/* Gap Analysis */}
                <div className="mt-4 p-3 bg-white rounded border border-gray-200">
                    <p className="text-xs text-gray-600">Gap to Target</p>
                    <p className={`text-sm font-bold mt-2 ${isOnTrack ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isOnTrack ? '✓' : '✗'} {Math.abs(100 - Math.round(Math.min(predictedRate, 150)))}% tersisa
                    </p>
                    {!isOnTrack && (
                        <p className="text-xs text-red-600 mt-2">
                            ⚡ Rekomendasi: Kirim reminder batch sekarang untuk akselerasi 15% poin
                        </p>
                    )}
                </div>
            </div>

            {/* Growth Trend Chart (Simplified) */}
            <div className="mt-6">
                <p className="text-sm font-semibold text-gray-900 mb-3">30-Day Trend</p>
                <div className="flex items-end gap-1 h-20">
                    {historicalRate.map((rate, idx) => (
                        <div key={idx} className="flex-1 group">
                            <div 
                                className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm hover:opacity-80 transition cursor-pointer h-full"
                                style={{ height: `${(rate / 100) * 80}px` }}
                            >
                                <div className="opacity-0 group-hover:opacity-100 transition absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                    {rate}%
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-2">
                    <p className="text-xs text-gray-600">Hari 1</p>
                    <p className="text-xs text-gray-600">Hari 30</p>
                </div>
            </div>

            {/* Action Button */}
            <button className="w-full mt-6 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition">
                Lihat Detail Prediksi Lengkap →
            </button>
        </div>
    );
}
