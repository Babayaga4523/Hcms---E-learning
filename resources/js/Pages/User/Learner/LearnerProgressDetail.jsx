import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    ChevronDown,
    Clock,
    CheckCircle,
    AlertCircle,
    Target,
    BookOpen,
    Video,
    FileText,
    Edit3,
    Download,
    Share2,
    ArrowRight,
    Calendar,
    User,
    Zap,
    TrendingUp
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

export default function LearnerProgressDetail() {
    const { auth } = usePage().props;
    const user = auth.user;
    const [loading, setLoading] = useState(true);
    const [progressData, setProgressData] = useState(null);
    const [expandedModule, setExpandedModule] = useState(null);
    const [selectedProgram, setSelectedProgram] = useState(null);

    useEffect(() => {
        fetchProgressData();
    }, [selectedProgram]);

    const fetchProgressData = async () => {
        try {
            setLoading(true);
            const url = selectedProgram
                ? `/api/learner/progress/${selectedProgram}`
                : '/api/learner/progress';
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                },
            });
            const data = await response.json();
            setProgressData(data);
        } catch (error) {
            console.error('Error fetching progress data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AppLayout user={user}>
                <Head title="Detail Progres Pembelajaran" />
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </AppLayout>
        );
    }

    const data = progressData || {};

    // Mock data for demonstration
    const programs = data.programs || [
        {
            id: 1,
            name: 'Advanced Analytics',
            progress: 85,
            status: 'in_progress',
            startDate: '2024-01-15',
            dueDate: '2024-12-31',
            totalHours: 40,
            completedHours: 34,
            modules: [
                {
                    id: 1,
                    name: 'Data Collection Strategies',
                    progress: 100,
                    status: 'completed',
                    duration: 8,
                    materials: [
                        { id: 1, name: 'Introduction Video', type: 'video', duration: 2 },
                        { id: 2, name: 'Case Studies PDF', type: 'pdf', duration: null },
                        { id: 3, name: 'Quiz', type: 'quiz', score: 95 },
                    ]
                },
                {
                    id: 2,
                    name: 'Data Analysis Fundamentals',
                    progress: 100,
                    status: 'completed',
                    duration: 8,
                    materials: [
                        { id: 4, name: 'Analytics Tools Video', type: 'video', duration: 3 },
                        { id: 5, name: 'Hands-on Workshop', type: 'workshop', duration: 4 },
                        { id: 6, name: 'Final Quiz', type: 'quiz', score: 92 },
                    ]
                },
                {
                    id: 3,
                    name: 'Advanced Visualization',
                    progress: 65,
                    status: 'in_progress',
                    duration: 12,
                    materials: [
                        { id: 7, name: 'Visualization Techniques', type: 'video', duration: 3, completed: true },
                        { id: 8, name: 'Dashboard Creation', type: 'practical', duration: 5, completed: true },
                        { id: 9, name: 'Portfolio Project', type: 'project', duration: 4, completed: false },
                        { id: 10, name: 'Assessment', type: 'quiz', score: null },
                    ]
                },
                {
                    id: 4,
                    name: 'Real-world Applications',
                    progress: 0,
                    status: 'locked',
                    duration: 12,
                    materials: []
                }
            ]
        },
        {
            id: 2,
            name: 'Digital Marketing Essentials',
            progress: 45,
            status: 'in_progress',
            startDate: '2024-03-01',
            dueDate: '2024-09-30',
            totalHours: 30,
            completedHours: 14,
            modules: []
        },
        {
            id: 3,
            name: 'Python for Data Science',
            progress: 100,
            status: 'completed',
            startDate: '2023-09-01',
            dueDate: '2024-02-28',
            totalHours: 50,
            completedHours: 50,
            modules: []
        }
    ];

    const selectedProgramData = selectedProgram
        ? programs.find(p => p.id === selectedProgram)
        : programs[0];

    // Progress chart data
    const progressChartData = selectedProgramData?.modules?.map((module, index) => ({
        name: `Modul ${index + 1}`,
        progress: module.progress,
        target: 100
    })) || [];

    // Time spent data
    const timeSpentData = [
        { week: 'Minggu 1', hours: 8 },
        { week: 'Minggu 2', hours: 12 },
        { week: 'Minggu 3', hours: 10 },
        { week: 'Minggu 4', hours: 14 },
        { week: 'Minggu 5', hours: 9 },
        { week: 'Minggu 6', hours: 11 },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-700';
            case 'in_progress':
                return 'bg-blue-100 text-blue-700';
            case 'locked':
                return 'bg-gray-100 text-gray-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <CheckCircle size={16} />;
            case 'in_progress':
                return <Zap size={16} />;
            case 'locked':
                return <AlertCircle size={16} />;
            default:
                return <AlertCircle size={16} />;
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'completed':
                return 'Selesai';
            case 'in_progress':
                return 'Sedang Berlangsung';
            case 'locked':
                return 'Terkunci';
            default:
                return 'Belum Dimulai';
        }
    };

    const getMaterialIcon = (type) => {
        switch (type) {
            case 'video':
                return <Video size={16} className="text-red-500" />;
            case 'pdf':
                return <FileText size={16} className="text-orange-500" />;
            case 'quiz':
            case 'assessment':
                return <Target size={16} className="text-purple-500" />;
            case 'workshop':
            case 'practical':
                return <Edit3 size={16} className="text-blue-500" />;
            case 'project':
                return <BookOpen size={16} className="text-green-500" />;
            default:
                return <FileText size={16} />;
        }
    };

    return (
        <AppLayout user={user}>
            <Head title="Detail Progres Pembelajaran" />

            <div className="space-y-6">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8 rounded-lg shadow-lg text-white">
                    <h1 className="text-3xl font-bold mb-2">Detail Progres Pembelajaran</h1>
                    <p className="text-indigo-100">Pantau perkembangan detail setiap program dan modul pembelajaran Anda</p>
                </div>

                {/* Program Selection */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Program Pembelajaran</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {programs.map((program) => (
                            <button
                                key={program.id}
                                onClick={() => setSelectedProgram(program.id)}
                                className={`p-4 rounded-lg border-2 text-left transition ${
                                    selectedProgram === program.id
                                        ? 'border-indigo-600 bg-indigo-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <h3 className="font-semibold text-gray-900">{program.name}</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-indigo-600 h-2 rounded-full transition"
                                            style={{ width: `${program.progress}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-600">{program.progress}%</span>
                                </div>
                                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(program.status)}`}>
                                    {getStatusLabel(program.status)}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {selectedProgramData && (
                    <>
                        {/* Program Overview */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">{selectedProgramData.name}</h2>
                                    <p className="text-gray-600 mt-1">Progres pembelajaran: <span className="font-semibold">{selectedProgramData.progress}%</span></p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                                        <Download size={18} />
                                        Sertifikat
                                    </button>
                                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                                        <Share2 size={18} />
                                        Bagikan
                                    </button>
                                </div>
                            </div>

                            {/* Program Details Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                                    <p className="text-gray-600 text-sm">Waktu Pembelajaran</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{selectedProgramData.completedHours}/{selectedProgramData.totalHours}h</p>
                                    <p className="text-xs text-gray-500 mt-1">jam</p>
                                </div>

                                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                                    <p className="text-gray-600 text-sm">Status</p>
                                    <p className="text-lg font-bold text-gray-900 mt-1 flex items-center gap-2">
                                        {getStatusIcon(selectedProgramData.status)}
                                        {getStatusLabel(selectedProgramData.status)}
                                    </p>
                                </div>

                                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg">
                                    <p className="text-gray-600 text-sm">Tanggal Mulai</p>
                                    <p className="text-lg font-bold text-gray-900 mt-1">
                                        {new Date(selectedProgramData.startDate).toLocaleDateString('id-ID')}
                                    </p>
                                </div>

                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                                    <p className="text-gray-600 text-sm">Batas Akhir</p>
                                    <p className="text-lg font-bold text-gray-900 mt-1">
                                        {new Date(selectedProgramData.dueDate).toLocaleDateString('id-ID')}
                                    </p>
                                </div>
                            </div>

                            {/* Overall Progress Bar */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-gray-700 font-semibold">Progress Keseluruhan</p>
                                    <p className="text-lg font-bold text-indigo-600">{selectedProgramData.progress}%</p>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-gradient-to-r from-indigo-600 to-purple-600 h-3 rounded-full transition-all duration-500"
                                        style={{ width: `${selectedProgramData.progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Module Progress Chart */}
                            <div className="bg-white rounded-lg shadow-lg p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <TrendingUp size={20} className="text-indigo-600" />
                                    Progress Per Modul
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={progressChartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis domain={[0, 100]} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="progress" fill="#3b82f6" name="Progress %" />
                                        <Bar dataKey="target" fill="#e5e7eb" name="Target %" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Time Spent Chart */}
                            <div className="bg-white rounded-lg shadow-lg p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Clock size={20} className="text-indigo-600" />
                                    Waktu Pembelajaran Minggu-an
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={timeSpentData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="week" />
                                        <YAxis />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="hours" fill="#3b82f6" stroke="#1e40af" name="Jam" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Modules List */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <BookOpen size={20} className="text-indigo-600" />
                                Modul Pembelajaran ({selectedProgramData.modules.length})
                            </h3>

                            <div className="space-y-4">
                                {selectedProgramData.modules.map((module, index) => (
                                    <div key={module.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                                        {/* Module Header */}
                                        <button
                                            onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                                            className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition"
                                        >
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold">
                                                    {index + 1}
                                                </div>
                                                <div className="text-left">
                                                    <h4 className="font-semibold text-gray-900">{module.name}</h4>
                                                    <p className="text-sm text-gray-500">{module.duration} jam pembelajaran</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-indigo-600 h-2 rounded-full"
                                                        style={{ width: `${module.progress}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-semibold text-gray-600 min-w-12">{module.progress}%</span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(module.status)}`}>
                                                    {getStatusIcon(module.status)}
                                                    {getStatusLabel(module.status)}
                                                </span>
                                                <ChevronDown
                                                    size={20}
                                                    className={`text-gray-400 transition ${expandedModule === module.id ? 'rotate-180' : ''}`}
                                                />
                                            </div>
                                        </button>

                                        {/* Module Details */}
                                        {expandedModule === module.id && (
                                            <div className="border-t border-gray-200 px-6 py-4 bg-white">
                                                <h5 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                    <FileText size={18} />
                                                    Materi Pembelajaran
                                                </h5>
                                                <div className="space-y-3">
                                                    {module.materials.map((material) => (
                                                        <div key={material.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                                                            <div className="flex items-center gap-4 flex-1">
                                                                <div className="flex-shrink-0">
                                                                    {getMaterialIcon(material.type)}
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-gray-900">{material.name}</p>
                                                                    <p className="text-sm text-gray-500 capitalize">{material.type}</p>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-4">
                                                                {material.duration && (
                                                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                                                        <Clock size={16} />
                                                                        {material.duration}h
                                                                    </div>
                                                                )}
                                                                {material.score && (
                                                                    <div className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-sm">
                                                                        {material.score}%
                                                                    </div>
                                                                )}
                                                                {material.completed && (
                                                                    <div className="text-green-600">
                                                                        <CheckCircle size={20} />
                                                                    </div>
                                                                )}
                                                                {!material.completed && !material.score && (
                                                                    <button className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition">
                                                                        Buka
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recommendations */}
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg shadow-lg p-6 border border-amber-200">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Target size={20} className="text-orange-600" />
                                Rekomendasi untuk Anda
                            </h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <div className="text-orange-600 mt-1">✓</div>
                                    <div>
                                        <p className="font-medium text-gray-900">Lanjutkan modul "Advanced Visualization"</p>
                                        <p className="text-sm text-gray-600">Anda sudah 65% menyelesaikan modul ini, tinggal 35% lagi</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="text-orange-600 mt-1">✓</div>
                                    <div>
                                        <p className="font-medium text-gray-900">Tingkatkan waktu pembelajaran</p>
                                        <p className="text-sm text-gray-600">Target 40 jam/minggu untuk menyelesaikan lebih cepat</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="text-orange-600 mt-1">✓</div>
                                    <div>
                                        <p className="font-medium text-gray-900">Manfaatkan sumber daya tambahan</p>
                                        <p className="text-sm text-gray-600">Akses forum diskusi dan mentor untuk bantuan</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
