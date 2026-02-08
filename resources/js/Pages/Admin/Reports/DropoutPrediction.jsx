import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import axios from 'axios';
import { AlertCircle, TrendingDown, Users, Activity, Clock } from 'lucide-react';

const DropoutPredictionDashboard = () => {
    const [predictions, setPredictions] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // all, high, medium, low

    useEffect(() => {
        fetchPredictions();
    }, []);

    const fetchPredictions = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/admin/dropout-predictions');
            setPredictions(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load predictions');
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (level) => {
        switch (level) {
            case 'high':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'low':
                return 'bg-green-100 text-green-700 border-green-200';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const getRiskIcon = (level) => {
        switch (level) {
            case 'high':
                return '🔴';
            case 'medium':
                return '🟡';
            case 'low':
                return '🟢';
            default:
                return '⚪';
        }
    };

    const getFilteredPredictions = () => {
        if (!predictions?.predictions) return [];
        if (filter === 'all') return predictions.predictions;
        return predictions.predictions.filter(p => p.risk_level === filter);
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

    if (!predictions) return null;

    const filteredData = getFilteredPredictions();

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">🔮 Prediksi Drop-Out Risk</h1>
                    <p className="text-gray-600 mt-2">Identifikasi karyawan dengan risiko tinggi untuk intervensi proaktif</p>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        icon={Users}
                        label="Total Karyawan"
                        value={predictions.total_users}
                        color="blue"
                    />
                    <StatCard
                        icon={AlertCircle}
                        label="Risiko Tinggi"
                        value={predictions.high_risk}
                        color="red"
                        emphasis={true}
                    />
                    <StatCard
                        icon={Activity}
                        label="Risiko Sedang"
                        value={predictions.medium_risk}
                        color="yellow"
                    />
                    <StatCard
                        icon={TrendingDown}
                        label="On Track"
                        value={predictions.low_risk}
                        color="green"
                    />
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-3 mb-8 bg-white p-4 rounded-xl border border-gray-200">
                    {[
                        { key: 'all', label: 'Semua', count: predictions.total_users },
                        { key: 'high', label: '🔴 Tinggi', count: predictions.high_risk, color: 'red' },
                        { key: 'medium', label: '🟡 Sedang', count: predictions.medium_risk, color: 'yellow' },
                        { key: 'low', label: '🟢 Rendah', count: predictions.low_risk, color: 'green' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                                filter === tab.key
                                    ? `bg-${tab.color || 'blue'}-600 text-white`
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {tab.label} ({tab.count})
                        </button>
                    ))}
                </div>

                {/* Predictions Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-[#005E54] to-[#008060] text-white">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-bold">Risk</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold">Nama</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold">Departemen</th>
                                    <th className="px-6 py-4 text-center text-sm font-bold">Risk Score</th>
                                    <th className="px-6 py-4 text-center text-sm font-bold">Hari Sejak Login</th>
                                    <th className="px-6 py-4 text-center text-sm font-bold">Kegagalan Quiz</th>
                                    <th className="px-6 py-4 text-center text-sm font-bold">Durasi Session</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold">Rekomendasi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredData.length > 0 ? filteredData.map((user, idx) => (
                                    <tr key={idx} className={`hover:bg-${user.risk_level === 'high' ? 'red' : user.risk_level === 'medium' ? 'yellow' : 'green'}-50 transition-colors`}>
                                        <td className="px-6 py-4 text-2xl font-bold">
                                            {getRiskIcon(user.risk_level)}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{user.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{user.department}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${getRiskColor(user.risk_level)}`}>
                                                {user.risk_percentage}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                                            {user.factors.days_since_login}d
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                                            {user.factors.failed_attempts_week}x
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                                            {user.factors.avg_session_minutes}min
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            <p className="line-clamp-2">{user.recommendation}</p>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                                            Tidak ada data untuk filter ini
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* High Risk Alert */}
                {predictions.high_risk > 0 && (
                    <div className="mt-8 bg-red-50 border-2 border-red-200 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-bold text-red-900 mb-2">⚠️ Alert: Pengguna Berisiko Tinggi</h3>
                                <p className="text-red-800 mb-4">
                                    {predictions.high_risk} pengguna memiliki risiko dropout tinggi. HR harus melakukan intervensi segera untuk mencegah disengagemen lebih lanjut.
                                </p>
                                <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                                    <li>Hubungi pengguna untuk memahami kendala mereka</li>
                                    <li>Tawarkan dukungan atau pelatihan tambahan</li>
                                    <li>Pertimbangkan penjadwalan ulang program training</li>
                                    <li>Monitor progress secara regular</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

const StatCard = ({ icon: Icon, label, value, color = 'blue', emphasis = false }) => (
    <div className={`rounded-xl border-2 p-6 ${
        emphasis
            ? 'bg-red-50 border-red-200'
            : 'bg-white border-gray-200'
    }`}>
        <div className="flex items-center justify-between">
            <div>
                <p className={`text-sm font-medium ${emphasis ? 'text-red-600' : 'text-gray-600'}`}>
                    {label}
                </p>
                <p className={`text-3xl font-bold mt-2 ${
                    emphasis
                        ? 'text-red-700'
                        : `text-${color}-600`
                }`}>
                    {value}
                </p>
            </div>
            <Icon className={`w-10 h-10 ${
                emphasis
                    ? 'text-red-300'
                    : `text-${color}-300`
            } opacity-50`} />
        </div>
    </div>
);

export default DropoutPredictionDashboard;
