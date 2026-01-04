import React, { useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, AlertTriangle } from 'lucide-react';
import axios from 'axios';

export default function ReportingAnalytics({ programId }) {
  const [activeTab, setActiveTab] = useState('effectiveness');
  const [reportData, setReportData] = useState(null);
  const [questionAnalysis, setQuestionAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = async (tab) => {
    try {
      setLoading(true);
      setError(null);

      if (tab === 'effectiveness') {
        const res = await axios.get(`/api/admin/reporting/learning-effectiveness/${programId}`);
        setReportData(res.data.data);
      } else if (tab === 'questions') {
        const res = await axios.get(`/api/admin/reporting/question-analysis/${programId}`);
        setQuestionAnalysis(res.data.data);
      } else if (tab === 'complete') {
        const res = await axios.get(`/api/admin/reporting/program-report/${programId}`);
        setReportData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    fetchReport(tab);
  };

  const handleExportPDF = () => {
    window.location.href = `/api/admin/reporting/export-pdf/${programId}`;
  };

  const handleExportExcel = () => {
    window.location.href = `/api/admin/reporting/export-excel/${programId}`;
  };

  const tabs = [
    { id: 'effectiveness', label: 'Efektivitas Pembelajaran' },
    { id: 'questions', label: 'Analisis Pertanyaan' },
    { id: 'complete', label: 'Laporan Lengkap' },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-4 py-2 font-medium text-sm transition ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Memuat laporan...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Effectiveness Tab */}
      {activeTab === 'effectiveness' && reportData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Effectiveness Score Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-gray-600 text-sm font-medium">Skor Efektivitas</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">
                {reportData.effectiveness_score || 0}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Rating: <span className="font-semibold">{reportData.rating}</span>
              </p>
            </div>

            {/* Completion Rate Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-gray-600 text-sm font-medium">Tingkat Penyelesaian</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">
                {reportData.completion_rate || 0}%
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {reportData.completed} dari {reportData.total_enrolled} peserta
              </p>
            </div>

            {/* Average Score Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-gray-600 text-sm font-medium">Nilai Rata-rata</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">
                {reportData.average_score || 0}
              </p>
              <p className="text-sm text-gray-500 mt-2">Dari 100</p>
            </div>
          </div>

          {/* Pie Chart */}
          {reportData.total_enrolled > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Distribusi Status Peserta
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: 'Selesai',
                        value: reportData.completed || 0,
                      },
                      {
                        name: 'Sedang Berlangsung',
                        value:
                          (reportData.total_enrolled || 0) - (reportData.completed || 0),
                      },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#10B981" />
                    <Cell fill="#F59E0B" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Questions Tab */}
      {activeTab === 'questions' && questionAnalysis && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-gray-600 text-sm font-medium">Total Pertanyaan</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {questionAnalysis.total_questions || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-gray-600 text-sm font-medium">Persentase Benar Rata-rata</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {questionAnalysis.average_difficulty_percentage || 0}%
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-gray-600 text-sm font-medium">Tingkat Kesulitan</p>
              <p className="text-sm text-gray-500 mt-2">
                Lihat tabel di bawah untuk rincian per pertanyaan
              </p>
            </div>
          </div>

          {/* Questions Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">
                    Pertanyaan
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">
                    Tipe
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">
                    Tingkat Kesulitan
                  </th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-700">
                    % Benar
                  </th>
                </tr>
              </thead>
              <tbody>
                {questionAnalysis.questions?.map((q) => (
                  <tr key={q.question_id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-900 truncate">
                      {q.question_text}
                    </td>
                    <td className="px-6 py-3 text-gray-600">{q.type}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          q.difficulty_level === 'Mudah'
                            ? 'bg-green-100 text-green-800'
                            : q.difficulty_level === 'Sedang'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {q.difficulty_level}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="font-semibold">{q.correct_percentage}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Complete Report Tab */}
      {activeTab === 'complete' && reportData && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-6">
            {/* Program Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Program</h3>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-600">Judul Program</dt>
                  <dd className="text-gray-900 mt-1">{reportData.program?.title}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Durasi</dt>
                  <dd className="text-gray-900 mt-1">{reportData.program?.duration}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Nilai Kelulusan</dt>
                  <dd className="text-gray-900 mt-1">{reportData.program?.passing_grade}</dd>
                </div>
              </dl>
            </div>

            {/* Summary */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Hasil</h3>
              <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <dt className="text-xs font-medium text-gray-600">Total Peserta</dt>
                  <dd className="text-2xl font-bold text-gray-900 mt-1">
                    {reportData.enrollment_metrics?.total_enrolled}
                  </dd>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <dt className="text-xs font-medium text-gray-600">Selesai</dt>
                  <dd className="text-2xl font-bold text-gray-900 mt-1">
                    {reportData.enrollment_metrics?.completed}
                  </dd>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <dt className="text-xs font-medium text-gray-600">Penyelesaian</dt>
                  <dd className="text-2xl font-bold text-gray-900 mt-1">
                    {reportData.enrollment_metrics?.completion_rate}%
                  </dd>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <dt className="text-xs font-medium text-gray-600">Nilai Rata-rata</dt>
                  <dd className="text-2xl font-bold text-gray-900 mt-1">
                    {reportData.enrollment_metrics?.average_score}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}

      {/* Export Buttons */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={handleExportPDF}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          <Download className="w-4 h-4" />
          Ekspor PDF
        </button>
        <button
          onClick={handleExportExcel}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Download className="w-4 h-4" />
          Ekspor Excel
        </button>
      </div>
    </div>
  );
}
