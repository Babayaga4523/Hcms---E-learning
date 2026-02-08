import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import axios from 'axios';
import { Download, AlertCircle, TrendingUp, Award, BookOpen, CheckCircle, Clock } from 'lucide-react';

const LearnerReportCard = ({ userId }) => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchReportCard();
    }, [userId]);

    const fetchReportCard = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/admin/learner-reportcard/${userId}`);
            setReportData(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load report card');
        } finally {
            setLoading(false);
        }
    };

    const exportPDF = () => {
        // PDF export logic akan ditambahkan
        alert('PDF export akan diimplementasikan');
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

    if (!reportData) return null;

    const {
        user,
        learning_agility,
        skill_mastery,
        engagement,
        credentials,
        overall_metrics
    } = reportData;

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Rapor Karyawan</h1>
                        <p className="text-gray-600 mt-2">Laporan lengkap pembelajaran dan pengembangan kompetensi</p>
                    </div>
                    <button
                        onClick={exportPDF}
                        className="bg-[#005E54] hover:bg-[#004a45] text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold"
                    >
                        <Download className="w-5 h-5" />
                        Export PDF
                    </button>
                </div>

                {/* User Info Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                            <p className="text-gray-600">{user.nip || 'N/A'}</p>
                            <p className="text-gray-600 mt-1">{user.department}</p>
                            <p className="text-gray-600 mt-1">{user.email}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-4xl font-bold text-[#005E54]">
                                {overall_metrics.completion_rate}%
                            </div>
                            <p className="text-gray-600 text-sm">Completion Rate</p>
                        </div>
                    </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <MetricCard
                        icon={BookOpen}
                        label="Program Selesai"
                        value={overall_metrics.total_completed}
                        subtext={`dari ${overall_metrics.total_enrolled}`}
                    />
                    <MetricCard
                        icon={TrendingUp}
                        label="Rata-rata Skor"
                        value={`${overall_metrics.avg_exam_score}%`}
                        subtext="Exam score"
                    />
                    <MetricCard
                        icon={Clock}
                        label="Kecepatan Belajar"
                        value={learning_agility.speed_index}
                        subtext={learning_agility.performance}
                        color={learning_agility.performance === 'excellent' ? 'green' : 'blue'}
                    />
                    <MetricCard
                        icon={Award}
                        label="Sertifikat Aktif"
                        value={credentials.active}
                        subtext={`${credentials.expired} expired`}
                    />
                </div>

                {/* Learning Agility Section */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-[#005E54]" />
                        Kecepatan Pembelajaran (Learning Agility)
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                            <span className="font-semibold text-gray-900">Rata-rata penyelesaian modul:</span>
                            <span className="text-lg font-bold text-blue-600">{learning_agility.user_avg_days} hari</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                            <span className="font-semibold text-gray-900">Rata-rata perusahaan:</span>
                            <span className="text-lg font-bold text-gray-600">{learning_agility.company_avg_days} hari</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                            <span className="font-semibold text-gray-900">Indeks kecepatan vs rata-rata:</span>
                            <span className="text-lg font-bold text-green-600">{learning_agility.speed_index}%</span>
                        </div>
                    </div>
                </div>

                {/* Skill Mastery Section */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Award className="w-5 h-5 text-[#005E54]" />
                        Penguasaan Kompetensi (Skill Mastery)
                    </h3>
                    {skill_mastery.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {skill_mastery.map((skill, idx) => (
                                <div
                                    key={idx}
                                    className="p-4 rounded-lg border-2"
                                    style={{ borderColor: skill.color, backgroundColor: skill.color + '15' }}
                                >
                                    <p className="font-semibold" style={{ color: skill.color }}>
                                        {skill.tag_name}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-2">
                                        Level: {skill.mastery_level}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">Belum ada skill yang dikuasai</p>
                    )}
                </div>

                {/* Engagement Section */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-[#005E54]" />
                        Engagement & Aktivitas
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
                                <span className="font-semibold text-gray-900">Total jam belajar:</span>
                                <span className="text-lg font-bold text-orange-600">{engagement.total_learning_hours}h</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                                <span className="font-semibold text-gray-900">Hari terakhir login:</span>
                                <span className="text-lg font-bold text-purple-600">{engagement.last_login_days} hari lalu</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-indigo-50 rounded-lg">
                                <span className="font-semibold text-gray-900">Rata-rata login/bulan:</span>
                                <span className="text-lg font-bold text-indigo-600">{engagement.monthly_login_avg}x</span>
                            </div>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 mb-4">Login Trend (30 hari terakhir)</p>
                            <div className="bg-gray-50 p-4 rounded-lg h-48">
                                {engagement.login_trend.length > 0 ? (
                                    <div className="flex items-end justify-between h-full">
                                        {engagement.login_trend.slice(-7).map((day, idx) => (
                                            <div key={idx} className="flex flex-col items-center">
                                                <div
                                                    className="bg-[#005E54] rounded-t w-8 opacity-70 hover:opacity-100"
                                                    style={{ height: `${(day.login_count / 5) * 100}px` }}
                                                />
                                                <p className="text-xs text-gray-600 mt-2">
                                                    {new Date(day.login_date).getDate()}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 flex items-center justify-center h-full">Tidak ada data</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Credentials Section */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-[#005E54]" />
                        Sertifikat & Kredensial
                    </h3>
                    {credentials.details.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Pelatihan</th>
                                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">No Sertifikat</th>
                                        <th className="px-6 py-3 text-center text-sm font-bold text-gray-900">Skor</th>
                                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Tanggal Terbit</th>
                                        <th className="px-6 py-3 text-center text-sm font-bold text-gray-900">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {credentials.details.map((cert, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-6 py-3 text-sm font-medium text-gray-900">{cert.training_title}</td>
                                            <td className="px-6 py-3 text-sm text-gray-600">{cert.certificate_number}</td>
                                            <td className="px-6 py-3 text-sm text-center font-bold text-[#005E54]">{cert.score}</td>
                                            <td className="px-6 py-3 text-sm text-gray-600">
                                                {new Date(cert.issued_at).toLocaleDateString('id-ID')}
                                            </td>
                                            <td className="px-6 py-3 text-sm text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                    cert.credential_status === 'active'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {cert.credential_status === 'active' ? '✓ Aktif' : '○ Expired'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500">Belum ada sertifikat</p>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

const MetricCard = ({ icon: Icon, label, value, subtext, color = 'blue' }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-gray-600 text-sm font-medium">{label}</p>
                <p className={`text-3xl font-bold mt-2 text-${color}-600`}>{value}</p>
                <p className="text-xs text-gray-500 mt-1">{subtext}</p>
            </div>
            <Icon className={`w-10 h-10 text-${color}-300 opacity-50`} />
        </div>
    </div>
);

export default LearnerReportCard;
