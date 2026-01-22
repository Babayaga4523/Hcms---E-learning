import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { 
    Plus, Search, Edit2, Trash2, Eye, BookOpen, Clock, 
    CheckCircle, AlertCircle, Copy, Upload, Zap, Users, 
    TrendingUp, Shield, MoreHorizontal, X, Sparkles, 
    LayoutGrid, List, Filter, ChevronDown, Award, 
    BarChart3, FileCheck, Clipboard, Brain
} from 'lucide-react';
import axios from 'axios';
import AdminLayout from '@/Layouts/AdminLayout';

// --- Gaya & Utilitas Khusus (Wondr Style) ---
const WondrStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #FAFAFA; }
        
        .wondr-gradient { background: linear-gradient(135deg, #005E54 0%, #004D44 100%); }
        .wondr-accent { color: #D6F84C; }
        .wondr-bg-accent { background-color: #D6F84C; color: #004D44; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        
        .glass-nav { 
            background: rgba(255, 255, 255, 0.85); 
            backdrop-filter: blur(12px); 
            border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        
        .card-hover { transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 12px 24px -8px rgba(0, 94, 84, 0.15); }
        
        @keyframes slideDown {
            from { transform: translate(-50%, -100%); opacity: 0; }
            to { transform: translate(-50%, 0); opacity: 1; }
        }
        
        .animate-slide-down { animation: slideDown 0.3s ease-out; }
    `}</style>
);

// --- Komponen UI Premium ---

// 1. Modal Modern (Bottom Sheet style on Mobile, Centered on Desktop)
const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    if (!isOpen) return null;
    
    const sizes = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-[#002824]/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className={`relative bg-white rounded-[2rem] shadow-2xl w-full ${sizes[size]} transform transition-all overflow-hidden border border-white/20`}>
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white">
                    <h3 className="text-2xl font-extrabold text-[#005E54] tracking-tight">{title}</h3>
                    <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-red-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
};

// 2. Stat Card (Wondr Style: Clean, Big Numbers, Lime Accents)
const StatCard = ({ title, value, icon: Icon, trend, trendUp, index }) => {
    return (
        <div className="relative overflow-hidden bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm card-hover group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
                <Icon className="w-24 h-24 text-[#005E54]" />
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-2xl ${index === 0 ? 'wondr-bg-accent' : 'bg-[#F0FDF4] text-[#005E54]'}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">{title}</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
                </div>
                {trend && (
                    <div className={`mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${trendUp ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        <TrendingUp className={`w-3 h-3 mr-1 ${!trendUp && 'rotate-180'}`} />
                        {trend}
                    </div>
                )}
            </div>
        </div>
    );
};

// 3. Program Card (The Hero Component - Redesigned)
const ProgramCard = ({ program, onAction, isSelected, onSelect }) => {
    return (
        <div className={`group relative bg-white rounded-[28px] overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50 border ${isSelected ? 'border-[#005E54] ring-2 ring-[#005E54]' : 'border-slate-100'}`}>
            
            {/* Cover Image Section */}
            <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-[#005E54] via-[#004D44] to-[#003833]">
                {program.cover_image ? (
                    <>
                        <img 
                            src={`/storage/${program.cover_image}`}
                            alt={program.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        />
                        {/* Overlay gradient untuk readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20"></div>
                    </>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center transform group-hover:scale-110 transition-transform duration-500">
                            {program.category === 'Compliance' ? (
                                <Shield className="w-20 h-20 text-[#D6F84C] mx-auto mb-2 opacity-60" />
                            ) : program.category === 'Technical' ? (
                                <Zap className="w-20 h-20 text-[#D6F84C] mx-auto mb-2 opacity-60" />
                            ) : (
                                <BookOpen className="w-20 h-20 text-[#D6F84C] mx-auto mb-2 opacity-60" />
                            )}
                            <p className="text-[#D6F84C]/70 text-xs font-bold tracking-wider uppercase">No Cover</p>
                        </div>
                    </div>
                )}
                
                {/* Status Pill - Overlay on Image */}
                <div className="absolute top-3 right-3 z-20">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-md border ${
                        program.is_active 
                        ? 'bg-emerald-500/95 text-white border-emerald-400/50' 
                        : 'bg-slate-700/95 text-slate-200 border-slate-600/50'
                    }`}>
                        {program.is_active ? '✓ Aktif' : 'Draft'}
                    </span>
                </div>

                {/* Category Badge - Bottom Left */}
                <div className="absolute bottom-3 left-3 z-20">
                    <div className="px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md shadow-xl flex items-center gap-2 border border-white/50">
                        {program.category === 'Compliance' ? <Shield className="w-4 h-4 text-[#005E54]" /> : 
                         program.category === 'Technical' ? <Zap className="w-4 h-4 text-amber-500" /> :
                         <BookOpen className="w-4 h-4 text-blue-500" />}
                        <span className="text-xs font-extrabold text-slate-900">{program.category || 'General'}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 flex flex-col relative">
                {/* Content */}
                <div className="flex-1">
                    <h3 className="text-xl font-extrabold text-slate-900 mb-2 leading-tight group-hover:text-[#005E54] transition-colors line-clamp-2">
                        {program.title}
                    </h3>
                    <p className="text-sm text-slate-600 font-medium mb-5 line-clamp-2 leading-relaxed">
                        {program.description}
                    </p>

                    {/* Meta Data Pill Grid */}
                    <div className="flex flex-wrap gap-2 mb-5">
                        <div className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-200 transition-colors">
                            <Clock className="w-3.5 h-3.5 text-[#005E54]" /> 
                            <span>{program.duration_minutes}m</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-200 transition-colors">
                            <Users className="w-3.5 h-3.5 text-blue-600" /> 
                            <span>{program.enrollment_count}</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-200 transition-colors">
                            <Award className="w-3.5 h-3.5 text-amber-600" /> 
                            <span>{program.passing_grade}%</span>
                        </div>
                    </div>
                </div>

                {/* Progress & Action */}
                <div className="pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Penyelesaian</span>
                        <span className="text-sm font-extrabold text-[#005E54]">{program.completion_rate}%</span>
                    </div>
                    <div className="w-full bg-slate-200/80 rounded-full h-2.5 mb-5 overflow-hidden shadow-inner">
                        <div 
                            className="bg-gradient-to-r from-[#005E54] to-[#D6F84C] h-2.5 rounded-full transition-all duration-500 shadow-sm" 
                            style={{width: `${program.completion_rate}%`}}
                        ></div>
                    </div>

                    <div className="flex gap-2">
                        <button 
                            onClick={() => onAction(program, 'edit')}
                            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#005E54] to-[#004D44] text-white text-sm font-bold hover:shadow-xl hover:shadow-[#005E54]/30 hover:-translate-y-0.5 transition-all duration-200 active:translate-y-0"
                        >
                            <span className="flex items-center justify-center gap-2">
                                <Edit2 className="w-4 h-4" />
                                Edit Program
                            </span>
                        </button>
                        <button 
                            onClick={() => onAction(program, 'menu')}
                            className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 hover:border-[#005E54] hover:text-[#005E54] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Application Component ---

export default function TrainingProgram({ programs = [], stats = {}, categories = [], auth }) {
    // Gunakan sessionStorage sebagai persistent cache (survives tab switches)
    const [programsData, setProgramsData] = useState(() => {
        try {
            // Cek apakah ada programs dari props
            if (Array.isArray(programs) && programs.length > 0) {
                // Simpan ke sessionStorage
                sessionStorage.setItem('trainingPrograms', JSON.stringify(programs));
                return programs;
            }
            
            // Jika tidak ada, ambil dari sessionStorage
            const cached = sessionStorage.getItem('trainingPrograms');
            if (cached) {
                return JSON.parse(cached);
            }
            
            return [];
        } catch (e) {
            console.error('Error loading programs:', e);
            return Array.isArray(programs) ? programs : [];
        }
    });

    // Sync programs prop ke state dan sessionStorage
    useEffect(() => {
        if (Array.isArray(programs) && programs.length > 0) {
            setProgramsData(programs);
            sessionStorage.setItem('trainingPrograms', JSON.stringify(programs));
            console.log('Programs loaded:', programs.length);
        }
    }, [programs]);

    // Gunakan realPrograms dari state
    const realPrograms = useMemo(() => {
        return Array.isArray(programsData) ? programsData : [];
    }, [programsData]);
    
    // State
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentTab, setCurrentTab] = useState('programs');
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    const [selectedPrograms, setSelectedPrograms] = useState([]);
    const [activeModal, setActiveModal] = useState(null);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    // Guard to prevent duplicate delete requests
    const [deletingId, setDeletingId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '', 
        description: '', 
        duration_minutes: 60, 
        passing_grade: 70, 
        category: '', 
        is_active: true,
        allow_retake: true,
        max_retake_attempts: 3
    });

    const availableCategories = categories && categories.length > 0 ? categories : ['Core Business & Product', 'Credit & Risk Management', 'Collection & Recovery', 'Compliance & Regulatory', 'Sales & Marketing', 'Service Excellence', 'Leadership & Soft Skills', 'IT & Digital Security', 'Onboarding'];

    // Filter Logic - gunakan real data dengan filter
    const filteredPrograms = realPrograms.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             p.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || 
                             (filterStatus === 'active' && p.is_active) ||
                             (filterStatus === 'inactive' && !p.is_active);
        const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
        
        return matchesSearch && matchesStatus && matchesCategory;
    });

    // Helpers
    const showToast = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const refreshData = () => {
        router.reload({ only: ['programs', 'stats'] });
    };

    const handleAction = (program, action) => {
        setSelectedProgram(program);
        if (action === 'edit') {
            window.location.href = `/admin/training-programs/${program.id}/edit`;
        } else {
            setActiveModal('menu');
        }
    };

    const handleSubmitForm = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = activeModal === 'edit' 
                ? `/api/admin/training-programs/${selectedProgram.id}`
                : '/api/admin/training-programs';
            
            const method = activeModal === 'edit' ? 'put' : 'post';

            // Convert string values to correct types
            const payload = {
                ...formData,
                duration_minutes: parseInt(formData.duration_minutes),
                passing_grade: parseInt(formData.passing_grade),
                max_retake_attempts: formData.allow_retake ? parseInt(formData.max_retake_attempts) : null,
                category: formData.category || null,
            };

            const response = await axios[method](url, payload);

            if (response.data.success) {
                showToast(response.data.message || 'Berhasil disimpan!', 'success');
                setActiveModal(null);
                refreshData();
            }
        } catch (error) {
            console.error('Error saving program:', error);
            showToast(error.response?.data?.message || 'Gagal menyimpan program', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDuplicate = async () => {
        if (!selectedProgram) return;
        
        setLoading(true);
        try {
            const response = await axios.post(`/api/admin/training-programs/${selectedProgram.id}/duplicate`);
            if (response.data.success) {
                showToast('Program berhasil diduplikasi!', 'success');
                setActiveModal(null);
                refreshData();
            }
        } catch (error) {
            console.error('Error duplicating:', error);
            showToast('Gagal menduplikasi program', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedProgram) return;

        if (!confirm('Apakah Anda yakin ingin menghapus program ini?')) return;

        // Prevent duplicate delete for same program
        if (deletingId === selectedProgram?.id) return;
        setDeletingId(selectedProgram?.id);
        // Close modal early so user can't press multiple times
        setActiveModal(null);
        setLoading(true);
        try {
            // 1. Kirim request hapus ke backend
            await axios.delete(`/api/admin/training-programs/${selectedProgram.id}`);

            // 2. JIKA SUKSES (200): Hapus item dari State React secara manual
            // Ini membuat UI langsung berubah tanpa reload halaman
            setProgramsData((prevPrograms) => {
                const updatedPrograms = prevPrograms.filter(program => program.id !== selectedProgram.id);
                sessionStorage.setItem('trainingPrograms', JSON.stringify(updatedPrograms));
                return updatedPrograms;
            });

            showToast('Program berhasil dihapus!', 'success');

        } catch (error) {
            // 3. JIKA ERROR 404 (Data sudah hilang duluan di database)
            if (error.response && error.response.status === 404) {
                // Tetap hapus dari UI agar sinkron dengan database
                setProgramsData((prevPrograms) => {
                    const updatedPrograms = prevPrograms.filter(program => program.id !== selectedProgram.id);
                    sessionStorage.setItem('trainingPrograms', JSON.stringify(updatedPrograms));
                    return updatedPrograms;
                });

                // Don't log this as an unexpected error; user intent was achieved
                showToast('Data sudah tidak ditemukan di server (mungkin sudah dihapus). Tampilan telah diperbarui.', 'warning');
            } else {
                // Error lain (500, 403, dll)
                console.error('Error deleting:', error);
                showToast('Gagal menghapus program. Silakan coba lagi.', 'error');
            }
        } finally {
            setDeletingId(null);
            setLoading(false);
        }
    };

    const handleUploadMaterial = () => {
        if (!selectedProgram) return;
        window.location.href = `/admin/training-programs/${selectedProgram.id}/materials`;
    };

    const handleAssignUsers = () => {
        if (!selectedProgram) return;
        window.location.href = `/admin/training-programs/${selectedProgram.id}/assign-users`;
    };

    const handleViewPretest = () => {
        if (!selectedProgram) return;
        window.location.href = `/admin/training-programs/${selectedProgram.id}/pretest`;
    };

    const handleViewPosttest = () => {
        if (!selectedProgram) return;
        window.location.href = `/admin/training-programs/${selectedProgram.id}/posttest`;
    };

    const handleViewExamAttempts = () => {
        if (!selectedProgram) return;
        window.location.href = `/admin/training-programs/${selectedProgram.id}/exam-attempts`;
    };

    const handleViewAnalytics = () => {
        if (!selectedProgram) return;
        window.location.href = `/admin/training-programs/${selectedProgram.id}/analytics`;
    };

    useEffect(() => { 
        document.title = "Wondr Learning Center"; 
    }, []);

    // Debug: Log data saat tab berubah
    useEffect(() => {
        if (currentTab === 'programs') {
            console.log('Tab: programs, realPrograms count:', realPrograms.length, 'data:', realPrograms);
        }
    }, [currentTab, realPrograms]);

    // Populate form when opening edit modal
    useEffect(() => {
        if (activeModal === 'edit' && selectedProgram) {
            setFormData({
                title: selectedProgram.title || '',
                description: selectedProgram.description || '',
                duration_minutes: selectedProgram.duration_minutes || 60,
                passing_grade: selectedProgram.passing_grade || 70,
                category: selectedProgram.category || '',
                is_active: selectedProgram.is_active || true,
                allow_retake: selectedProgram.allow_retake !== undefined ? selectedProgram.allow_retake : true,
                max_retake_attempts: selectedProgram.max_retake_attempts || 3
            });
        } else if (activeModal === 'create') {
            // Reset form for new program
            setFormData({
                title: '',
                description: '',
                duration_minutes: 60,
                passing_grade: 70,
                category: '',
                is_active: true,
                allow_retake: true,
                max_retake_attempts: 3
            });
        }
    }, [activeModal, selectedProgram]);

    return (
        <AdminLayout user={auth?.user}>
            <Head title="Kelola Training Program - HCMS E-Learning" />
            <WondrStyles />
            
            {/* Toast Notification */}
            {notification && (
                <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl z-[70] flex items-center gap-3 animate-slide-down ${
                    notification.type === 'success' ? 'bg-[#002824] text-white' : 
                    notification.type === 'error' ? 'bg-red-600 text-white' : 
                    'bg-blue-600 text-white'
                }`}>
                    {notification.type === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-[#D6F84C]" />
                    ) : notification.type === 'error' ? (
                        <AlertCircle className="w-5 h-5" />
                    ) : (
                        <Sparkles className="w-5 h-5" />
                    )}
                    <span className="font-bold text-sm">{notification.msg}</span>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-6 space-y-10">
                
                {/* 1. Hero Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-[#002824] tracking-tight mb-2">
                            Kelola <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#005E54] to-[#00A99D]">Training</span>
                        </h1>
                        <p className="text-slate-500 text-lg font-medium max-w-xl">
                            Pantau performa pembelajaran dan kembangkan potensi tim BNI Anda di sini.
                        </p>
                    </div>
                    <div>
                        <Link 
                            href="/admin/training-programs/create-with-steps"
                            className="group flex items-center gap-3 bg-[#002824] hover:bg-[#004D44] text-white pl-6 pr-8 py-4 rounded-full shadow-xl shadow-[#005E54]/20 transition-all hover:scale-105 active:scale-95"
                        >
                            <div className="w-8 h-8 rounded-full bg-[#D6F84C] flex items-center justify-center text-[#002824]">
                                <Plus className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-lg">Buat Program</span>
                        </Link>
                    </div>
                </div>

                {/* 2. Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard 
                        title="Total Program" 
                        value={stats.total_programs || filteredPrograms.length} 
                        icon={BookOpen} 
                        index={0}
                        trend={stats.program_growth ? `${stats.program_growth}% bulan ini` : null}
                        trendUp={stats.program_growth >= 0}
                    />
                    <StatCard 
                        title="Total Enrollment" 
                        value={stats.total_enrollments || 0} 
                        icon={Users} 
                        index={1}
                        trend={stats.enrollment_growth ? `${stats.enrollment_growth}% growth` : null}
                        trendUp={stats.enrollment_growth >= 0}
                    />
                    <StatCard 
                        title="Rata-rata Selesai" 
                        value={stats.avg_completion_rate ? `${stats.avg_completion_rate}%` : '0%'} 
                        icon={Zap} 
                        index={2}
                        trend={stats.avg_completion_rate >= 70 ? 'Sangat Baik' : 'Perlu ditingkatkan'}
                        trendUp={stats.avg_completion_rate >= 70}
                    />
                    <StatCard 
                        title="Programs Aktif" 
                        value={stats.active_programs || 0} 
                        icon={Shield} 
                        index={3}
                        trend={stats.total_programs ? `${Math.round((stats.active_programs / stats.total_programs) * 100)}% aktif` : null}
                        trendUp={true}
                    />
                </div>

                {/* 3. Filter & Search Bar Floating */}
                <div className="sticky top-24 z-30">
                    <div className="bg-white/80 backdrop-blur-xl p-2 rounded-[24px] shadow-lg border border-white flex flex-wrap items-center justify-between gap-2">
                        {/* Tabs */}
                        <div className="flex bg-slate-100/50 p-1.5 rounded-[20px] overflow-x-auto no-scrollbar">
                            {[
                                { label: 'Program', value: 'programs' },
                                { label: 'Analitik', value: 'analitik' },
                                { label: 'Laporan', value: 'laporan' },
                                { label: 'Kepatuhan', value: 'kepatuhan' }
                            ].map((tab) => (
                                <button
                                    key={tab.value}
                                    onClick={() => setCurrentTab(tab.value)}
                                    className={`px-6 py-2.5 rounded-[16px] text-sm font-bold transition-all whitespace-nowrap ${
                                        currentTab === tab.value
                                        ? 'bg-white text-[#005E54] shadow-md' 
                                        : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Search & Filter Tools */}
                        <div className="flex items-center gap-2 flex-1 justify-end min-w-[300px]">
                            <div className="relative group flex-1 max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#005E54] transition-colors w-5 h-5" />
                                <input 
                                    type="text" 
                                    placeholder="Cari materi training..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-[18px] text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#005E54]/20 focus:bg-white transition-all placeholder:font-medium"
                                />
                            </div>
                            
                            {/* Status Filter */}
                            <select 
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 py-3 bg-white border border-slate-200 rounded-[18px] text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#005E54]/20 transition-all"
                            >
                                <option value="all">Semua Status</option>
                                <option value="active">Aktif</option>
                                <option value="inactive">Draft</option>
                            </select>
                            
                            {/* Category Filter */}
                            <select 
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="px-4 py-3 bg-white border border-slate-200 rounded-[18px] text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#005E54]/20 transition-all"
                            >
                                <option value="all">Semua Kategori</option>
                                {availableCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            
                            <div className="hidden md:flex bg-slate-100 p-1 rounded-[18px]">
                                <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-[14px] transition-all ${viewMode === 'grid' ? 'bg-white shadow text-[#005E54]' : 'text-slate-400'}`}>
                                    <LayoutGrid className="w-5 h-5" />
                                </button>
                                <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-[14px] transition-all ${viewMode === 'list' ? 'bg-white shadow text-[#005E54]' : 'text-slate-400'}`}>
                                    <List className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Content Grid */}
                {currentTab === 'programs' ? (
                    <>
                        {/* Filter Results Count */}
                        {(searchQuery || filterStatus !== 'all' || filterCategory !== 'all') && (
                            <div className="flex items-center justify-between px-2">
                                <p className="text-sm font-bold text-slate-600">
                                    Menampilkan <span className="text-[#005E54]">{filteredPrograms.length}</span> dari {realPrograms.length} program
                                </p>
                                {(searchQuery || filterStatus !== 'all' || filterCategory !== 'all') && (
                                    <button 
                                        onClick={() => {
                                            setSearchQuery('');
                                            setFilterStatus('all');
                                            setFilterCategory('all');
                                        }}
                                        className="text-sm font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
                                    >
                                        <X className="w-4 h-4" />
                                        Reset Filter
                                    </button>
                                )}
                            </div>
                        )}
                        
                        {filteredPrograms.length === 0 ? (
                            <div className="py-20 text-center">
                                <div className="inline-block p-6 rounded-full bg-slate-100 mb-4">
                                    <BookOpen className="w-12 h-12 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-600 mb-2">
                                    {realPrograms.length === 0 ? 'Belum Ada Program' : 'Tidak Ada Hasil'}
                                </h3>
                                <p className="text-slate-500 mb-6">
                                    {realPrograms.length === 0 
                                        ? 'Mulai dengan membuat program training pertama Anda'
                                        : 'Coba ubah filter atau kata kunci pencarian'
                                    }
                                </p>
                                {realPrograms.length === 0 && (
                                    <Link 
                                        href="/admin/training-programs/create-with-steps"
                                        className="inline-flex items-center gap-2 bg-[#002824] text-white px-6 py-3 rounded-full font-bold hover:bg-[#004D44] transition-colors"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Buat Program
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}>
                                {filteredPrograms.map(program => (
                                    <ProgramCard 
                                        key={program.id} 
                                        program={program}
                                        onAction={handleAction}
                                        isSelected={selectedPrograms.includes(program.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                ) : currentTab === 'analitik' ? (
                    <div className="space-y-8">
                        {/* Analytics Overview Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-[24px] p-6 text-white shadow-lg">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-3 bg-white/20 rounded-2xl">
                                                <Users className="w-6 h-6" />
                                            </div>
                                            <TrendingUp className="w-5 h-5 opacity-70" />
                                        </div>
                                        <p className="text-sm font-medium opacity-90 mb-1">Total Peserta</p>
                                        <h3 className="text-3xl font-extrabold">{stats.total_enrollments || 0}</h3>
                                        <p className="text-xs mt-2 opacity-80">Terdaftar di semua program</p>
                                    </div>
                                    
                                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-[24px] p-6 text-white shadow-lg">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-3 bg-white/20 rounded-2xl">
                                                <CheckCircle className="w-6 h-6" />
                                            </div>
                                            <TrendingUp className="w-5 h-5 opacity-70" />
                                        </div>
                                        <p className="text-sm font-medium opacity-90 mb-1">Completion Rate</p>
                                        <h3 className="text-3xl font-extrabold">{stats.avg_completion_rate || 0}%</h3>
                                        <p className="text-xs mt-2 opacity-80">Rata-rata penyelesaian</p>
                                    </div>
                                    
                                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-[24px] p-6 text-white shadow-lg">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-3 bg-white/20 rounded-2xl">
                                                <BookOpen className="w-6 h-6" />
                                            </div>
                                            <TrendingUp className="w-5 h-5 opacity-70" />
                                        </div>
                                        <p className="text-sm font-medium opacity-90 mb-1">Aktif Program</p>
                                        <h3 className="text-3xl font-extrabold">{stats.active_programs || 0}</h3>
                                        <p className="text-xs mt-2 opacity-80">Dari {stats.total_programs || 0} total</p>
                                    </div>
                                    
                                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-[24px] p-6 text-white shadow-lg">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-3 bg-white/20 rounded-2xl">
                                                <Award className="w-6 h-6" />
                                            </div>
                                            <TrendingUp className="w-5 h-5 opacity-70" />
                                        </div>
                                        <p className="text-sm font-medium opacity-90 mb-1">Avg Score</p>
                                        <h3 className="text-3xl font-extrabold">{Math.round(stats.avg_score || 0)}%</h3>
                                        <p className="text-xs mt-2 opacity-80">Nilai rata-rata</p>
                                    </div>
                                </div>

                                {/* Top Programs */}
                                <div className="bg-white rounded-[24px] p-8 border border-slate-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="text-2xl font-extrabold text-slate-900">Top Performing Programs</h3>
                                            <p className="text-sm text-slate-500 mt-1">Program dengan engagement tertinggi</p>
                                        </div>
                                        <div className="px-4 py-2 bg-green-50 rounded-full">
                                            <TrendingUp className="w-5 h-5 text-green-600" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {filteredPrograms.slice(0, 5).map((prog, idx) => (
                                            <div key={idx} className="flex items-center gap-4 p-5 bg-gradient-to-r from-slate-50 to-white rounded-[20px] border border-slate-100 hover:shadow-md transition-all group">
                                                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#005E54] to-[#00A99D] text-white font-extrabold text-lg shadow-lg">
                                                    #{idx + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-extrabold text-slate-900 text-lg group-hover:text-[#005E54] transition-colors">{prog.title}</p>
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <span className="text-sm text-slate-600 font-medium flex items-center gap-1">
                                                            <Users className="w-4 h-4" /> {prog.enrollment_count} peserta
                                                        </span>
                                                        <span className="text-sm text-slate-600 font-medium flex items-center gap-1">
                                                            <Clock className="w-4 h-4" /> {prog.duration_minutes}m
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="px-4 py-2 bg-green-100 rounded-full mb-2">
                                                        <p className="font-extrabold text-green-700 text-xl">{prog.completion_rate}%</p>
                                                    </div>
                                                    <p className="text-xs text-slate-500 font-bold">Completion</p>
                                                </div>
                                            </div>
                                        ))}
                                        {filteredPrograms.length === 0 && (
                                            <div className="py-12 text-center">
                                                <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                                <p className="text-slate-500 font-medium">Belum ada data program</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Category Performance */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-[24px] p-8 border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-3 bg-[#005E54] rounded-2xl">
                                                <Shield className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-extrabold text-slate-900">Program by Category</h3>
                                                <p className="text-sm text-slate-500">Distribusi kategori</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            {availableCategories.map((cat, idx) => {
                                                const catCount = realPrograms.filter(p => p.category === cat).length;
                                                const percentage = realPrograms.length > 0 ? Math.round((catCount / realPrograms.length) * 100) : 0;
                                                return (
                                                    <div key={idx} className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <p className="font-bold text-slate-800">{cat}</p>
                                                            <span className="text-sm font-extrabold text-[#005E54]">{catCount} program ({percentage}%)</span>
                                                        </div>
                                                        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                                            <div 
                                                                className="bg-gradient-to-r from-[#005E54] to-[#00A99D] h-3 rounded-full transition-all duration-500"
                                                                style={{width: `${percentage}%`}}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-[24px] p-8 border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-3 bg-blue-500 rounded-2xl">
                                                <Zap className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-extrabold text-slate-900">Status Overview</h3>
                                                <p className="text-sm text-slate-500">Program aktif vs draft</p>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-[20px] border border-green-200">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="font-bold text-green-800">Program Aktif</span>
                                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                                </div>
                                                <p className="text-4xl font-extrabold text-green-900">{stats.active_programs || 0}</p>
                                                <p className="text-sm text-green-700 mt-2">Dapat diakses peserta</p>
                                            </div>
                                            <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-[20px] border border-slate-200">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="font-bold text-slate-800">Draft Program</span>
                                                    <AlertCircle className="w-5 h-5 text-slate-600" />
                                                </div>
                                                <p className="text-4xl font-extrabold text-slate-900">{(stats.total_programs || 0) - (stats.active_programs || 0)}</p>
                                                <p className="text-sm text-slate-700 mt-2">Belum dipublikasikan</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                    </div>
                ) : currentTab === 'laporan' ? (
                    <div className="space-y-8">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white rounded-[24px] p-8 border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                                                <Users className="w-8 h-8 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Total Enrollments</p>
                                                <p className="text-4xl font-extrabold text-slate-900 mt-1">{stats.total_enrollments || 0}</p>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-blue-100">
                                            <p className="text-sm text-slate-600 font-medium">Total pendaftaran di semua program</p>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white rounded-[24px] p-8 border-2 border-green-100 shadow-lg hover:shadow-xl transition-all">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg">
                                                <CheckCircle className="w-8 h-8 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Total Completions</p>
                                                <p className="text-4xl font-extrabold text-green-600 mt-1">
                                                    {Math.round((stats.total_enrollments || 0) * ((stats.avg_completion_rate || 0) / 100))}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-green-100">
                                            <p className="text-sm text-slate-600 font-medium">Program yang diselesaikan</p>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white rounded-[24px] p-8 border-2 border-purple-100 shadow-lg hover:shadow-xl transition-all">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg">
                                                <Award className="w-8 h-8 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Avg Completion</p>
                                                <p className="text-4xl font-extrabold text-purple-600 mt-1">{stats.avg_completion_rate || 0}%</p>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-purple-100">
                                            <p className="text-sm text-slate-600 font-medium">Rata-rata tingkat penyelesaian</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Program Performance Table */}
                                <div className="bg-white rounded-[24px] p-8 border border-slate-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="text-2xl font-extrabold text-slate-900">Program Performance Report</h3>
                                            <p className="text-sm text-slate-500 mt-1">Detail performa setiap program training</p>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b-2 border-slate-200">
                                                    <th className="text-left py-4 px-4 text-xs font-extrabold text-slate-600 uppercase tracking-wider">Program</th>
                                                    <th className="text-center py-4 px-4 text-xs font-extrabold text-slate-600 uppercase tracking-wider">Kategori</th>
                                                    <th className="text-center py-4 px-4 text-xs font-extrabold text-slate-600 uppercase tracking-wider">Peserta</th>
                                                    <th className="text-center py-4 px-4 text-xs font-extrabold text-slate-600 uppercase tracking-wider">Completion</th>
                                                    <th className="text-center py-4 px-4 text-xs font-extrabold text-slate-600 uppercase tracking-wider">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredPrograms.length > 0 ? filteredPrograms.map((prog, idx) => (
                                                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                                        <td className="py-4 px-4">
                                                            <p className="font-extrabold text-slate-900">{prog.title}</p>
                                                            <p className="text-sm text-slate-500 mt-1 line-clamp-1">{prog.description}</p>
                                                        </td>
                                                        <td className="text-center py-4 px-4">
                                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                                                                {prog.category || 'General'}
                                                            </span>
                                                        </td>
                                                        <td className="text-center py-4 px-4">
                                                            <span className="font-bold text-slate-900">{prog.enrollment_count}</span>
                                                        </td>
                                                        <td className="text-center py-4 px-4">
                                                            <div className="flex items-center justify-center gap-3">
                                                                <div className="flex-1 max-w-[100px]">
                                                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                                                        <div 
                                                                            className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full"
                                                                            style={{width: `${prog.completion_rate}%`}}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                                <span className="font-extrabold text-green-600">{prog.completion_rate}%</span>
                                                            </div>
                                                        </td>
                                                        <td className="text-center py-4 px-4">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                                prog.is_active 
                                                                    ? 'bg-green-100 text-green-700' 
                                                                    : 'bg-slate-200 text-slate-600'
                                                            }`}>
                                                                {prog.is_active ? 'Aktif' : 'Draft'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan="5" className="py-12 text-center">
                                                            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                                            <p className="text-slate-500 font-medium">Belum ada data program</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                    </div>
                ) : currentTab === 'kepatuhan' ? (
                    <div className="space-y-8">
                        {/* Compliance Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-[24px] p-8 text-white shadow-xl">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                                                <CheckCircle className="w-10 h-10" />
                                            </div>
                                            <Shield className="w-12 h-12 opacity-20" />
                                        </div>
                                        <p className="text-sm font-bold opacity-90 uppercase tracking-wide mb-2">Program Aktif</p>
                                        <p className="text-5xl font-extrabold mb-2">{stats.active_programs || 0}</p>
                                        <p className="text-sm opacity-80">Dari {stats.total_programs || 0} total program</p>
                                    </div>
                                    
                                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-[24px] p-8 text-white shadow-xl">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                                                <Users className="w-10 h-10" />
                                            </div>
                                            <TrendingUp className="w-12 h-12 opacity-20" />
                                        </div>
                                        <p className="text-sm font-bold opacity-90 uppercase tracking-wide mb-2">Total Enrollment</p>
                                        <p className="text-5xl font-extrabold mb-2">{stats.total_enrollments || 0}</p>
                                        <p className="text-sm opacity-80">Peserta terdaftar</p>
                                    </div>
                                    
                                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-[24px] p-8 text-white shadow-xl">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                                                <Award className="w-10 h-10" />
                                            </div>
                                            <Sparkles className="w-12 h-12 opacity-20" />
                                        </div>
                                        <p className="text-sm font-bold opacity-90 uppercase tracking-wide mb-2">Avg Completion</p>
                                        <p className="text-5xl font-extrabold mb-2">{stats.avg_completion_rate || 0}%</p>
                                        <p className="text-sm opacity-80">Tingkat kepatuhan</p>
                                    </div>
                                </div>

                                {/* Program Status Overview */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-[24px] p-8 border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-3 bg-green-500 rounded-2xl shadow-lg">
                                                <CheckCircle className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-extrabold text-slate-900">Program Compliance</h3>
                                                <p className="text-sm text-slate-500">Status kepatuhan program</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            {filteredPrograms.slice(0, 5).map((prog, idx) => (
                                                <div key={idx} className="p-5 bg-gradient-to-r from-slate-50 to-white rounded-[16px] border border-slate-100">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <p className="font-bold text-slate-900">{prog.title}</p>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                            prog.completion_rate >= 80 
                                                                ? 'bg-green-100 text-green-700' 
                                                                : prog.completion_rate >= 60 
                                                                ? 'bg-yellow-100 text-yellow-700' 
                                                                : 'bg-red-100 text-red-700'
                                                        }`}>
                                                            {prog.completion_rate}%
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm text-slate-600">
                                                        <Users className="w-4 h-4" />
                                                        <span>{prog.enrollment_count} peserta</span>
                                                    </div>
                                                    <div className="mt-3 w-full bg-slate-200 rounded-full h-2">
                                                        <div 
                                                            className={`h-2 rounded-full ${
                                                                prog.completion_rate >= 80 
                                                                    ? 'bg-green-500' 
                                                                    : prog.completion_rate >= 60 
                                                                    ? 'bg-yellow-500' 
                                                                    : 'bg-red-500'
                                                            }`}
                                                            style={{width: `${prog.completion_rate}%`}}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-[24px] p-8 border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-3 bg-orange-500 rounded-2xl shadow-lg">
                                                <AlertCircle className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-extrabold text-slate-900">Performance Alerts</h3>
                                                <p className="text-sm text-slate-500">Program yang perlu perhatian</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            {filteredPrograms
                                                .filter(p => p.completion_rate < 60)
                                                .slice(0, 5)
                                                .map((prog, idx) => (
                                                    <div key={idx} className="p-5 bg-gradient-to-r from-orange-50 to-white rounded-[16px] border border-orange-100">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                                                                <AlertCircle className="w-4 h-4 text-orange-600" />
                                                            </div>
                                                            <p className="font-bold text-slate-900 flex-1">{prog.title}</p>
                                                            <span className="text-sm font-extrabold text-orange-600">{prog.completion_rate}%</span>
                                                        </div>
                                                        <p className="text-xs text-slate-600">Tingkat penyelesaian rendah, perlu evaluasi</p>
                                                    </div>
                                                ))}
                                            {filteredPrograms.filter(p => p.completion_rate < 60).length === 0 && (
                                                <div className="py-8 text-center">
                                                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                                    <p className="text-green-600 font-bold">Semua program dalam kondisi baik</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                    </div>
                ) : null}
            </div>

            {/* --- Modals (Wondr Style) --- */}

            {/* Create/Edit Modal */}
            <Modal 
                isOpen={activeModal === 'create' || activeModal === 'edit'} 
                onClose={() => setActiveModal(null)}
                title={activeModal === 'create' ? "Buat Program Baru" : "Edit Program"}
                size="lg"
            >
                <form className="space-y-8" onSubmit={handleSubmitForm}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-extrabold text-slate-700 mb-2 ml-1">Judul Program</label>
                            <input 
                                type="text" 
                                required
                                className="w-full px-6 py-4 bg-slate-50 border-transparent rounded-[20px] focus:ring-2 focus:ring-[#005E54] focus:bg-white transition-all font-bold text-lg placeholder:font-medium placeholder:text-slate-400"
                                placeholder="Contoh: Kepatuhan Dasar 2025"
                                value={formData.title}
                                onChange={e => setFormData({...formData, title: e.target.value})}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <label className="block text-sm font-extrabold text-slate-700 mb-2 ml-1">Kategori</label>
                                <div className="relative">
                                    <select 
                                        className="w-full px-6 py-4 bg-slate-50 border-transparent rounded-[20px] focus:ring-2 focus:ring-[#005E54] appearance-none font-bold text-slate-700"
                                        value={formData.category}
                                        onChange={e => setFormData({...formData, category: e.target.value})}
                                    >
                                        <option value="">Pilih Kategori</option>
                                        {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-extrabold text-slate-700 mb-2 ml-1">Durasi (Menit)</label>
                                <input 
                                    type="number" 
                                    required
                                    min="1"
                                    className="w-full px-6 py-4 bg-slate-50 border-transparent rounded-[20px] focus:ring-2 focus:ring-[#005E54] font-bold"
                                    value={formData.duration_minutes}
                                    onChange={e => setFormData({...formData, duration_minutes: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-extrabold text-slate-700 mb-2 ml-1">Passing Grade (%)</label>
                                <input 
                                    type="number" 
                                    required
                                    min="0"
                                    max="100"
                                    className="w-full px-6 py-4 bg-slate-50 border-transparent rounded-[20px] focus:ring-2 focus:ring-[#005E54] font-bold"
                                    value={formData.passing_grade}
                                    onChange={e => setFormData({...formData, passing_grade: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-extrabold text-slate-700 mb-2 ml-1">Max Percobaan Ulang</label>
                                <input 
                                    type="number" 
                                    min="1"
                                    disabled={!formData.allow_retake}
                                    className="w-full px-6 py-4 bg-slate-50 border-transparent rounded-[20px] focus:ring-2 focus:ring-[#005E54] font-bold disabled:opacity-50"
                                    value={formData.max_retake_attempts}
                                    onChange={e => setFormData({...formData, max_retake_attempts: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-extrabold text-slate-700 mb-2 ml-1">Deskripsi & Tujuan</label>
                            <textarea 
                                rows="4"
                                required
                                className="w-full px-6 py-4 bg-slate-50 border-transparent rounded-[20px] focus:ring-2 focus:ring-[#005E54] transition-all font-medium text-slate-700 resize-none"
                                placeholder="Jelaskan tujuan pembelajaran program ini..."
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                            ></textarea>
                        </div>

                        {/* Toggles */}
                        <div className="p-6 bg-slate-50 rounded-[24px] flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-slate-800">Status Program</h4>
                                <p className="text-sm text-slate-500 font-medium">Aktifkan agar dapat diakses peserta</p>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setFormData({...formData, is_active: !formData.is_active})}
                                className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${formData.is_active ? 'bg-[#005E54]' : 'bg-slate-300'}`}
                            >
                                <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${formData.is_active ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </button>
                        </div>

                        <div className="p-6 bg-slate-50 rounded-[24px] flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-slate-800">Izinkan Mengulang (Retake)</h4>
                                <p className="text-sm text-slate-500 font-medium">Peserta dapat mengulang jika skor di bawah KKM</p>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setFormData({...formData, allow_retake: !formData.allow_retake})}
                                className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${formData.allow_retake ? 'bg-[#005E54]' : 'bg-slate-300'}`}
                            >
                                <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${formData.allow_retake ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button 
                            type="button" 
                            onClick={() => setActiveModal(null)} 
                            disabled={loading}
                            className="flex-1 py-4 text-slate-600 font-bold hover:bg-slate-50 rounded-[20px] transition-colors disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="flex-1 py-4 bg-[#002824] text-[#D6F84C] font-extrabold rounded-[20px] shadow-xl shadow-[#005E54]/20 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
                        >
                            {loading ? 'Menyimpan...' : 'Simpan Program'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Menu Modal (Quick Actions) */}
            <Modal isOpen={activeModal === 'menu'} onClose={() => setActiveModal(null)} title="Menu Cepat" size="lg">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <button 
                        onClick={() => window.location.href = `/admin/training-materials-manager/${selectedProgram?.id}`}
                        className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-[24px] hover:bg-slate-100 transition-colors group"
                    >
                        <Eye className="w-8 h-8 text-violet-600 mb-3 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-slate-700 text-sm text-center">Lihat Materi</span>
                    </button>
                    <button 
                        onClick={handleUploadMaterial}
                        className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-[24px] hover:bg-slate-100 transition-colors group"
                    >
                        <Upload className="w-8 h-8 text-[#005E54] mb-3 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-slate-700 text-sm text-center">Upload Materi</span>
                    </button>
                    <button 
                        onClick={handleAssignUsers}
                        className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-[24px] hover:bg-slate-100 transition-colors group"
                    >
                        <Users className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-slate-700 text-sm text-center">Assign Peserta</span>
                    </button>
                    <button 
                        onClick={handleViewPretest}
                        className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-[24px] hover:bg-slate-100 transition-colors group"
                    >
                        <Brain className="w-8 h-8 text-cyan-600 mb-3 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-slate-700 text-sm text-center">Pretest</span>
                    </button>
                    <button 
                        onClick={handleViewPosttest}
                        className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-[24px] hover:bg-slate-100 transition-colors group"
                    >
                        <FileCheck className="w-8 h-8 text-emerald-600 mb-3 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-slate-700 text-sm text-center">Posttest</span>
                    </button>
                    <button 
                        onClick={handleViewExamAttempts}
                        className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-[24px] hover:bg-slate-100 transition-colors group"
                    >
                        <Clipboard className="w-8 h-8 text-orange-600 mb-3 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-slate-700 text-sm text-center">Attempts</span>
                    </button>
                    <button 
                        onClick={handleViewAnalytics}
                        className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-[24px] hover:bg-slate-100 transition-colors group"
                    >
                        <BarChart3 className="w-8 h-8 text-indigo-600 mb-3 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-slate-700 text-sm text-center">Analytics</span>
                    </button>
                    <button 
                        onClick={handleDuplicate}
                        disabled={loading}
                        className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-[24px] hover:bg-slate-100 transition-colors group disabled:opacity-50"
                    >
                        <Copy className="w-8 h-8 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-slate-700 text-sm text-center">Duplikasi</span>
                    </button>
                    <button 
                        onClick={handleDelete}
                        disabled={loading || deletingId === selectedProgram?.id}
                        className="flex flex-col items-center justify-center p-6 bg-red-50 rounded-[24px] hover:bg-red-100 transition-colors group disabled:opacity-50"
                    >
                        <Trash2 className="w-8 h-8 text-red-500 mb-3 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-red-700 text-sm text-center">Hapus</span>
                    </button>
                </div>
            </Modal>

        </AdminLayout>
    );
}
