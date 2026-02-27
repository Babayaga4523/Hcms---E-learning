import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import axios from 'axios';
import { AlertCircle, TrendingDown, Users, Activity, Clock } from 'lucide-react';

// Helper function untuk format relative time (sama seperti UserManagementLight)
const getRelativeTime = (daysSinceLogin) => {
    if (!daysSinceLogin || daysSinceLogin <= 0) return 'Baru saja';
    if (daysSinceLogin === 1) return '1 hari lalu';
    if (daysSinceLogin < 7) return `${daysSinceLogin} hari lalu`;
    if (daysSinceLogin < 30) return `${Math.floor(daysSinceLogin / 7)} minggu lalu`;
    return `${Math.floor(daysSinceLogin / 30)} bulan lalu`;
};

const DropoutPredictionDashboard = () => {
    const [predictions, setPredictions] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // all, high, medium, low
    const [selectedUser, setSelectedUser] = useState(null); // For detail drawer

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

                {/* Methodology Explanation */}
                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 mb-8">
                    <div className="flex gap-6">
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-blue-900 mb-3">📊 METODE PENILAIAN RISIKO</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="text-xs text-blue-800">
                                    <p className="font-semibold mb-1">✓ Inaktivitas (40%)</p>
                                    <p>Hari sejak login terakhir</p>
                                </div>
                                <div className="text-xs text-blue-800">
                                    <p className="font-semibold mb-1">✓ Progress (25%)</p>
                                    <p>Completion rate vs target</p>
                                </div>
                                <div className="text-xs text-blue-800">
                                    <p className="font-semibold mb-1">✓ Ujian (20%)</p>
                                    <p>Kegagalan & nilai rata-rata</p>
                                </div>
                                <div className="text-xs text-blue-800">
                                    <p className="font-semibold mb-1">✓ Engagement (15%)</p>
                                    <p>Frekuensi & durasi session</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex-shrink-0 bg-white rounded-lg p-4">
                            <p className="text-xs font-bold text-gray-600 mb-3">THRESHOLD RISIKO</p>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                    <span className="text-xs text-gray-700"><strong>TINGGI:</strong> 75-100</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                                    <span className="text-xs text-gray-700"><strong>SEDANG:</strong> 50-74</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                    <span className="text-xs text-gray-700"><strong>RENDAH:</strong> 0-49</span>
                                </div>
                            </div>
                        </div>
                    </div>
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
                                    <th className="px-6 py-4 text-center text-sm font-bold">Terakhir Aktif</th>
                                    <th className="px-6 py-4 text-center text-sm font-bold">Kegagalan Ujian</th>
                                    <th className="px-6 py-4 text-center text-sm font-bold">Durasi Session</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold">Rekomendasi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredData.length > 0 ? filteredData.map((user, idx) => (
                                    <tr 
                                        key={idx} 
                                        onClick={() => setSelectedUser(user)}
                                        className={`hover:bg-${user.risk_level === 'high' ? 'red' : user.risk_level === 'medium' ? 'yellow' : 'green'}-50 transition-colors cursor-pointer`}>
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
                                            {getRelativeTime(user.factors.days_since_login)}
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

            {/* Detail Drawer */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setSelectedUser(null)}>
                    <div 
                        className="fixed right-0 top-0 h-full w-full md:w-96 bg-white shadow-xl overflow-y-auto z-50"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[#005E54] to-[#008060] text-white p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold">{selectedUser.name}</h2>
                                    <p className="text-sm opacity-90">{selectedUser.email}</p>
                                </div>
                                <button 
                                    onClick={() => setSelectedUser(null)}
                                    className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-4xl">{getRiskIcon(selectedUser.risk_level)}</span>
                                <div>
                                    <p className="text-sm opacity-90">Risk Level</p>
                                    <p className="text-xl font-bold uppercase">{selectedUser.risk_level}</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Overall Score */}
                            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                                <p className="text-sm font-semibold text-blue-900 mb-2">Risk Score</p>
                                <div className="flex items-end gap-3">
                                    <div className="text-4xl font-bold text-blue-600">{selectedUser.risk_percentage}%</div>
                                    <div className="flex-1">
                                        <div className="w-full bg-blue-200 rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full transition-w ${
                                                    selectedUser.risk_level === 'high' ? 'bg-red-600' :
                                                    selectedUser.risk_level === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
                                                }`}
                                                style={{width: `${selectedUser.risk_percentage}%`}}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Score Breakdown */}
                            <div>
                                <p className="text-sm font-bold text-gray-700 mb-4">📊 Breakdown Komponen Risiko</p>
                                <div className="space-y-3">
                                    {selectedUser.score_breakdown && Object.entries(selectedUser.score_breakdown).map(([key, value]) => {
                                        const labels = {
                                            'inactivity': { label: 'Inaktivitas (40%)', color: 'bg-red-500' },
                                            'progress': { label: 'Progress (25%)', color: 'bg-orange-500' },
                                            'assessment': { label: 'Ujian (20%)', color: 'bg-yellow-500' },
                                            'engagement': { label: 'Engagement (10%)', color: 'bg-blue-500' },
                                            'behavior': { label: 'Behavior (3%)', color: 'bg-purple-500' },
                                            'trend': { label: 'Trend (2%)', color: 'bg-pink-500' }
                                        };
                                        const info = labels[key];
                                        if (!info) return null;
                                        return (
                                            <div key={key}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-semibold text-gray-700">{info.label}</span>
                                                    <span className="text-xs font-bold text-gray-900">{value.toFixed(1)}/100</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className={`h-2 rounded-full ${info.color} transition-w`}
                                                        style={{width: `${Math.min(value, 100)}%`}}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Metrics */}
                            <div>
                                <p className="text-sm font-bold text-gray-700 mb-3">📈 Detail Metrik</p>
                                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Hari sejak login:</span>
                                        <span className="font-semibold">{selectedUser.metrics.days_since_login} hari</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2">
                                        <span className="text-gray-600">Completion rate:</span>
                                        <span className="font-semibold">{selectedUser.metrics.completion_rate.toFixed(1)}%</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2">
                                        <span className="text-gray-600">Nilai rata-rata:</span>
                                        <span className="font-semibold">{selectedUser.metrics.avg_score.toFixed(1)}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2">
                                        <span className="text-gray-600">Session (14 hari):</span>
                                        <span className="font-semibold">{selectedUser.metrics.sessions_last_14_days}x</span>
                                    </div>
                                </div>
                            </div>

                            {/* Recommendation */}
                            <div className={`rounded-lg p-4 ${
                                selectedUser.risk_level === 'high' ? 'bg-red-50 border border-red-200' :
                                selectedUser.risk_level === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                                'bg-green-50 border border-green-200'
                            }`}>
                                <p className="text-xs font-bold text-gray-700 mb-2">💡 Rekomendasi Aksi</p>
                                <p className="text-sm text-gray-800">{selectedUser.recommendation}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
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
