import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, Award, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function DashboardMetrics() {
  const [stats, setStats] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const [statsRes, trendRes] = await Promise.all([
          axios.get('/api/admin/metrics/dashboard-stats'),
          axios.get('/api/admin/metrics/enrollment-trend'),
        ]);

        setStats(statsRes.data.data);
        setTrendData(trendRes.data.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching metrics:', err);
        setError('Gagal memuat metrik dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Memuat data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Peserta Terdaftar',
      value: stats?.total_enrolled_learners || 0,
      icon: Users,
      color: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Tingkat Penyelesaian Rata-rata',
      value: `${stats?.average_completion_rate || 0}%`,
      icon: TrendingUp,
      color: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Sertifikasi Tertunda',
      value: stats?.pending_certifications || 0,
      icon: Award,
      color: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
    },
    {
      title: 'Program Kadaluarsa',
      value: stats?.expired_programs || 0,
      icon: AlertCircle,
      color: 'bg-red-50',
      iconColor: 'text-red-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`${card.color} rounded-lg p-6 border border-gray-200`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
                </div>
                <Icon className={`${card.iconColor} w-12 h-12 opacity-80`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Enrollment Trend Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tren Pendaftaran (30 Hari Terakhir)</h3>
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="total_enrolled"
                stroke="#3B82F6"
                name="Total Terdaftar"
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#10B981"
                name="Selesai"
              />
              <Line
                type="monotone"
                dataKey="in_progress"
                stroke="#F59E0B"
                name="Sedang Berlangsung"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            Tidak ada data tren
          </div>
        )}
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <a
          href="/api/admin/metrics/export?type=dashboard"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Ekspor Laporan
        </a>
      </div>
    </div>
  );
}
