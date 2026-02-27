import React, { useState, useMemo } from 'react';
import { 
    BookOpen, Search, Filter, Download, Calendar, 
    Clock, Award, AlertCircle, Check, ChevronDown, 
    MoreHorizontal, User, RefreshCw, X 
} from 'lucide-react';
import axios from 'axios';

// --- Wondr Style System ---
const WondrStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F8F9FA; color: #1e293b; }
        
        .wondr-dark { background-color: #002824; }
        .wondr-green { color: #005E54; }
        .wondr-lime-bg { background-color: #D6F84C; color: #002824; }
        .wondr-lime-text { color: #D6F84C; }
        
        .glass-panel {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.6);
            box-shadow: 0 10px 30px -10px rgba(0, 40, 36, 0.05);
        }

        /* Floating Table Rows */
        .table-spacing { border-collapse: separate; border-spacing: 0 12px; }
        .table-row-card {
            background: white;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .table-row-card td { border-top: 1px solid #F1F5F9; border-bottom: 1px solid #F1F5F9; }
        .table-row-card td:first-child { 
            border-left: 1px solid #F1F5F9; 
            border-top-left-radius: 16px; 
            border-bottom-left-radius: 16px; 
        }
        .table-row-card td:last-child { 
            border-right: 1px solid #F1F5F9; 
            border-top-right-radius: 16px; 
            border-bottom-right-radius: 16px; 
        }
        .table-row-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(0, 94, 84, 0.05);
            border-color: #005E54;
        }
        .table-row-card:hover td { border-color: #E2E8F0; }

        .input-wondr {
            background: #F8F9FA;
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            transition: all 0.3s ease;
        }
        .input-wondr:focus {
            background: #FFFFFF;
            border-color: #005E54;
            box-shadow: 0 0 0 4px rgba(0, 94, 84, 0.1);
            outline: none;
        }

        .animate-fade-up { animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `}</style>
);

// --- Components ---

const StatCard = ({ label, value, icon: Icon, colorClass, delay }) => (
    <div 
        className="glass-panel p-5 rounded-[24px] flex items-center justify-between animate-fade-up"
        style={{ animationDelay: `${delay}ms` }}
    >
        <div>
            <p className="text-sm font-bold text-slate-500 mb-1">{label}</p>
            <h3 className="text-3xl font-extrabold text-slate-900">{value}</h3>
        </div>
        <div className={`p-3 rounded-2xl ${colorClass}`}>
            <Icon className="w-6 h-6" />
        </div>
    </div>
);

const StatusBadge = ({ status }) => {
    const configs = {
        enrolled: { bg: 'bg-blue-50', text: 'text-blue-700', icon: Clock, label: 'Terdaftar' },
        in_progress: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: RefreshCw, label: 'Berjalan' },
        completed: { bg: 'bg-green-50', text: 'text-green-700', icon: Check, label: 'Selesai' },
        failed: { bg: 'bg-red-50', text: 'text-red-700', icon: AlertCircle, label: 'Gagal' },
    };
    
    const config = configs[status] || configs.enrolled;
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${config.bg} ${config.text}`}>
            <Icon className="w-3.5 h-3.5" />
            {config.label}
        </span>
    );
};

// --- Main Layout ---

export default function UserEnrollmentHistory({ enrollments: initialEnrollments, users, stats: initialStats, filters }) {
    // State with Real API Data
    const [enrollments, setEnrollments] = useState(initialEnrollments || []);
    const [stats, setStats] = useState(initialStats || {
        total_enrollments: 0,
        completed: 0,
        in_progress: 0,
        failed: 0,
        enrolled: 0,
        completion_rate: 0,
        certified_users: 0,
        avg_score: 0
    });
    const [pagination, setPagination] = useState({ current_page: 1, total: 0, per_page: 20, last_page: 1 });

    // State for filters
    const [searchUser, setSearchUser] = useState(filters?.search || '');
    const [filterStatus, setFilterStatus] = useState(filters?.status || 'all');
    const [dateFrom, setDateFrom] = useState(filters?.dateFrom || '');
    const [dateTo, setDateTo] = useState(filters?.dateTo || '');
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // Fetch enrollment data from API
    const fetchEnrollments = async (page = 1) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                searchUser,
                filterStatus,
                dateFrom,
                dateTo,
                page,
                perPage: 20
            });

            const response = await fetch(`/api/admin/enrollment-history?${params}`);
            if (response.ok) {
                const data = await response.json();
                setEnrollments(data.enrollments || []);
                setStats(data.stats || {});
                setPagination(data.pagination || {});
                setCurrentPage(page);
            }
        } catch (error) {
            console.error('Error fetching enrollment history:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch on component mount and when filters change
    useEffect(() => {
        fetchEnrollments(1);
    }, [searchUser, filterStatus, dateFrom, dateTo]);

    // Handlers
    const handleExport = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 1500);
    };

    const handleClearFilters = () => {
        setSearchUser('');
        setFilterStatus('all');
        setDateFrom('');
        setDateTo('');
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-20 font-sans">
            <WondrStyles />

            {/* --- Hero Header --- */}
            <div className="bg-[#002824] pt-8 pb-32 px-6 lg:px-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#005E54] rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/4"></div>
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#D6F84C] rounded-full blur-[120px] opacity-10 translate-y-1/4 -translate-x-1/4"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-2 text-[#D6F84C] mb-2 font-bold text-xs tracking-widest uppercase">
                            <BookOpen className="w-4 h-4" /> Learning Ledger
                        </div>
                        <h1 className="text-4xl font-extrabold text-white leading-tight">
                            Enrollment <br /> History
                        </h1>
                    </div>
                    
                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 px-6 py-3 bg-[#D6F84C] hover:bg-[#c2e43c] text-[#002824] rounded-2xl font-bold shadow-lg shadow-[#D6F84C]/20 transition-all hover:scale-105"
                    >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Export Data
                    </button>
                </div>
            </div>

            {/* --- Floating Stats Grid --- */}
            <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard 
                        label="Total Enrollments" 
                        value={(stats.total_enrollments || 0).toLocaleString()} 
                        icon={BookOpen} 
                        colorClass="bg-blue-100 text-blue-700"
                        delay={0}
                    />
                    <StatCard 
                        label="Selesai" 
                        value={(stats.completed || 0).toLocaleString()} 
                        icon={Check} 
                        colorClass="bg-green-100 text-green-700"
                        delay={100}
                    />
                    <StatCard 
                        label="Sedang Berjalan" 
                        value={(stats.in_progress || 0).toLocaleString()} 
                        icon={Clock} 
                        colorClass="bg-yellow-100 text-yellow-700"
                        delay={200}
                    />
                    <StatCard 
                        label="Tingkat Kelulusan" 
                        value={`${stats.completion_rate || 0}%`} 
                        icon={Award} 
                        colorClass="bg-[#002824] text-[#D6F84C]"
                        delay={300}
                    />
                </div>

                {/* --- Filters Panel --- */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 mb-8 animate-fade-up flex flex-col xl:flex-row gap-4 justify-between items-center" style={{ animationDelay: '400ms' }}>
                    <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input 
                                type="text" 
                                placeholder="Cari nama atau email..." 
                                value={searchUser}
                                onChange={(e) => setSearchUser(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 input-wondr font-bold text-slate-700"
                            />
                        </div>
                        
                        <div className="relative w-full md:w-48">
                            <select 
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full pl-4 pr-10 py-3 input-wondr font-bold text-slate-700 appearance-none cursor-pointer"
                            >
                                <option value="all">Semua Status</option>
                                <option value="enrolled">Terdaftar</option>
                                <option value="in_progress">Berjalan</option>
                                <option value="completed">Selesai</option>
                                <option value="failed">Gagal</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto items-center">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:block">Filter Tanggal:</span>
                        <input 
                            type="date" 
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="px-4 py-2.5 input-wondr text-sm font-bold text-slate-600 w-full md:w-auto"
                        />
                        <span className="text-slate-300 hidden md:block">—</span>
                        <input 
                            type="date" 
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="px-4 py-2.5 input-wondr text-sm font-bold text-slate-600 w-full md:w-auto"
                        />
                        {(searchUser || filterStatus !== 'all' || dateFrom) && (
                            <button 
                                onClick={handleClearFilters}
                                className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition ml-auto md:ml-0"
                                title="Reset Filter"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* --- Data Table --- */}
                <div className="overflow-x-auto pb-20 animate-fade-up" style={{ animationDelay: '500ms' }}>
                    <table className="w-full table-spacing">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Peserta</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Modul Training</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Tanggal Masuk</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Nilai</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-8 text-slate-400">Loading...</td></tr>
                            ) : enrollments.length > 0 ? (
                                enrollments.map((enrollment, index) => (
                                    <tr key={enrollment.id} className="table-row-card group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 border border-slate-200">
                                                    {enrollment.user_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 group-hover:text-[#005E54] transition-colors">{enrollment.user_name}</div>
                                                    <div className="text-xs text-slate-500">{enrollment.user_email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-slate-800 text-sm">{enrollment.module_title}</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <StatusBadge status={enrollment.status} />
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                {new Date(enrollment.enrolled_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            {enrollment.final_score !== null ? (
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-sm font-extrabold ${enrollment.final_score >= 70 ? 'text-[#005E54]' : 'text-red-500'}`}>
                                                        {enrollment.final_score}
                                                    </span>
                                                    {enrollment.is_certified && (
                                                        <div className="p-1 rounded-full bg-yellow-100 text-yellow-600" title="Certified">
                                                            <Award className="w-3 h-3" />
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-slate-300 text-sm">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-[#005E54] transition-colors">
                                                <MoreHorizontal className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-20">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                <Search className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900">Data tidak ditemukan</h3>
                                            <p className="text-slate-500 text-sm">Coba sesuaikan filter pencarian Anda.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- Summary Footer Stats --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-8 animate-fade-up" style={{ animationDelay: '600ms' }}>
                    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Status Breakdown</h3>
                        <div className="space-y-3">
                            {[
                                { status: 'enrolled', count: stats.enrolled || 0, color: 'bg-blue-100 text-blue-700' },
                                { status: 'in_progress', count: stats.in_progress, color: 'bg-yellow-100 text-yellow-700' },
                                { status: 'completed', count: stats.completed, color: 'bg-green-100 text-green-700' },
                                { status: 'failed', count: stats.failed, color: 'bg-red-100 text-red-700' },
                            ].map(item => (
                                <div key={item.status} className="flex items-center justify-between">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${item.color}`}>
                                        {item.status.replace('_', ' ')}
                                    </span>
                                    <span className="text-sm font-bold text-slate-700">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100 lg:col-span-3">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Quick Insights</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                                <div className="p-3 bg-white rounded-full text-blue-600 shadow-sm">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase">Completion Rate</p>
                                    <p className="text-xl font-extrabold text-slate-900">{stats.completion_rate || 0}%</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                                <div className="p-3 bg-white rounded-full text-green-600 shadow-sm">
                                    <Award className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase">Certified Users</p>
                                    <p className="text-xl font-extrabold text-slate-900">{stats.certified_users}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                                <div className="p-3 bg-white rounded-full text-purple-600 shadow-sm">
                                    <Check className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase">Average Score</p>
                                    <p className="text-xl font-extrabold text-slate-900">{stats.avg_score}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
