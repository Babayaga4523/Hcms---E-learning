import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    ChevronLeft, Save, X, AlertCircle, CheckCircle, 
    BookOpen, Clock, Users, FileText, PlayCircle, 
    HelpCircle, BarChart2, MoreHorizontal, Edit3, 
    UploadCloud, Sparkles, Layout, Zap, ArrowRight,
    Calendar, Shield, Award, Trash2
} from 'lucide-react';

// --- Wondr Styles & Utilities ---
const WondrStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F8F9FA; color: #1e293b; }
        
        .wondr-dark { background-color: #002824; }
        .wondr-green { color: #005E54; }
        .wondr-lime-bg { background-color: #D6F84C; color: #002824; }
        .wondr-lime-text { color: #D6F84C; }
        
        .glass-panel {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.5);
            box-shadow: 0 20px 40px -10px rgba(0, 40, 36, 0.08);
        }

        .input-wondr {
            background: #F1F5F9;
            border: 2px solid transparent;
            border-radius: 16px;
            transition: all 0.3s ease;
        }
        .input-wondr:focus {
            background: #FFFFFF;
            border-color: #005E54;
            box-shadow: 0 0 0 4px rgba(0, 94, 84, 0.1);
            outline: none;
        }

        .tab-active {
            background-color: #002824;
            color: #D6F84C;
            box-shadow: 0 8px 16px -4px rgba(0, 40, 36, 0.2);
        }
        
        .animate-enter { animation: enter 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes enter {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
    `}</style>
);

// --- Components ---

const StatBadge = ({ icon: Icon, label, value, colorClass = "bg-slate-100 text-slate-600" }) => (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl ${colorClass} font-semibold text-sm`}>
        <Icon className="w-4 h-4" />
        <span className="opacity-70">{label}:</span>
        <span>{value}</span>
    </div>
);

const SectionHeader = ({ title, subtitle, icon: Icon, action }) => (
    <div className="flex items-center justify-between mb-6">
        <div className="flex items-start gap-4">
            <div className="p-3 bg-[#E6FFFA] rounded-2xl text-[#005E54]">
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-slate-900">{title}</h2>
                <p className="text-sm text-slate-500 font-medium">{subtitle}</p>
            </div>
        </div>
        {action}
    </div>
);

const MaterialCard = ({ material }) => (
    <div className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-lg hover:border-[#005E54]/30 transition-all cursor-pointer">
        <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                material.type === 'video' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
            }`}>
                {material.type === 'video' ? <PlayCircle className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
            </div>
            <div>
                <h4 className="font-bold text-slate-800 group-hover:text-[#005E54] transition-colors">{material.title}</h4>
                <p className="text-xs text-slate-500 font-medium">{material.size || '12 MB'} • {material.duration || '5 min read'}</p>
            </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                <Edit3 className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    </div>
);

// --- Main Component ---

export default function TrainingProgramDetail({ program: initialProgram, materials: initialMaterials = [], quizzes: initialQuizzes = [] }) {
    // Mock Data if props are empty for preview
    const program = initialProgram || {
        id: 1,
        name: 'Wondr Service Excellence 2025',
        description: 'Comprehensive training designed to elevate customer service standards across all BNI branches. Includes modules on empathy, digital handling, and conflict resolution.',
        duration_hours: 12.5,
        target_audience: 'Frontliners & CS',
        instructor_name: 'Dr. Sarah Wijaya',
        status: 'published',
        category: 'Soft Skills',
        created_at: '2024-01-20',
        enrollment_count: 1250,
        completion_rate: 82,
        rating: 4.8
    };

    const materials = initialMaterials.length ? initialMaterials : [
        { id: 1, title: 'Modul 1: Dasar Pelayanan', type: 'pdf', size: '2.4 MB' },
        { id: 2, title: 'Video: Roleplay Skenario Sulit', type: 'video', duration: '15:20' },
        { id: 3, title: 'Panduan Teknis Wondr App', type: 'pdf', size: '5.1 MB' },
    ];

    const quizzes = initialQuizzes.length ? initialQuizzes : [
        { id: 1, title: 'Pre-Test: Knowledge Check', questions: 10, passing: 70 },
        { id: 2, title: 'Final Assessment', questions: 50, passing: 85 },
    ];

    // State
    const [activeTab, setActiveTab] = useState('overview');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [formData, setFormData] = useState({ ...program });

    // Handlers
    const showToast = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            setIsEditing(false);
            showToast('success', 'Perubahan berhasil disimpan!');
        }, 1200);
    };

    const handleBack = () => {
        showToast('success', 'Navigasi kembali (Simulasi)');
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-[#F8F9FA] pb-20">
                <WondrStyles />
                
                {/* Toast Notification */}
                {message && (
                    <div className={`fixed top-8 right-8 z-[60] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-enter ${
                        message.type === 'success' ? 'bg-[#002824] text-[#D6F84C]' : 'bg-red-500 text-white'
                    }`}>
                        {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="font-bold">{message.text}</span>
                    </div>
                )}

                {/* --- Hero Header Section --- */}
                <div className="relative bg-[#002824] pt-8 pb-32 px-6 lg:px-12 overflow-hidden">
                    {/* Abstract Background Elements */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#005E54] rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/4"></div>
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#D6F84C] rounded-full blur-3xl opacity-10 translate-y-1/4 -translate-x-1/4"></div>

                    {/* Navbar Mock (Back Button) */}
                    <div className="relative z-10 flex items-center justify-between mb-10">
                        <button 
                            onClick={handleBack}
                            className="group flex items-center gap-2 text-white/70 hover:text-[#D6F84C] transition-colors"
                        >
                            <div className="p-2 rounded-full bg-white/10 group-hover:bg-[#D6F84C] group-hover:text-[#002824] transition-all">
                                <ChevronLeft className="w-5 h-5" />
                            </div>
                            <span className="font-semibold tracking-wide text-sm">Kembali ke Daftar</span>
                        </button>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold border border-white/10">
                                Terakhir diupdate: {new Date().toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    {/* Header Content */}
                    <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                        <div className="max-w-3xl">
                            <div className="flex gap-3 mb-4">
                                <span className="px-4 py-1.5 rounded-full bg-[#D6F84C] text-[#002824] text-xs font-extrabold uppercase tracking-wider">
                                    {formData.category}
                                </span>
                                <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                                    formData.status === 'published' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-300'
                                }`}>
                                    {formData.status}
                                </span>
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
                                {formData.name}
                            </h1>
                            <div className="flex flex-wrap gap-6 text-slate-300 font-medium">
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-[#D6F84C]" />
                                    {(Number(formData.enrollment_count ?? 0) || 0).toLocaleString()} Peserta
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-[#D6F84C]" />
                                    {formData.duration_hours ? formData.duration_hours : 0} Jam Pembelajaran
                                </div>
                                <div className="flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-[#D6F84C]" />
                                    {formData.instructor_name || '-'}
                                </div>
                            </div>
                        </div>
                        
                        {/* Header Action */}
                        <div className="flex gap-3">
                            {!isEditing && (
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold backdrop-blur-md transition-all border border-white/10"
                                >
                                    <Edit3 className="w-4 h-4" />
                                    Edit Program
                                </button>
                            )}
                            <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#D6F84C] hover:bg-[#c2e43c] text-[#002824] font-bold shadow-lg shadow-[#D6F84C]/20 transition-all hover:scale-105">
                                <Zap className="w-4 h-4" />
                                Preview Course
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- Main Content Container (Overlapping Hero) --- */}
                <div className="relative z-20 max-w-7xl mx-auto px-6 -mt-20">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        
                        {/* Left Column: Main Content (8 cols) */}
                        <div className="lg:col-span-8 space-y-6">
                            
                            {/* Custom Tabs */}
                            <div className="bg-white/90 backdrop-blur-md p-2 rounded-[20px] shadow-lg border border-white flex gap-1 overflow-x-auto no-scrollbar">
                                {['overview', 'materials', 'quizzes', 'statistics'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`flex-1 px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap capitalize ${
                                            activeTab === tab ? 'tab-active' : 'text-slate-500 hover:bg-slate-50'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* Content Panel */}
                            <div className="glass-panel rounded-[32px] p-8 min-h-[500px]">
                                {activeTab === 'overview' && (
                                    <div className="space-y-8 animate-enter">
                                        {isEditing ? (
                                            <form onSubmit={handleSave} className="space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Judul Program</label>
                                                        <input 
                                                            type="text" 
                                                            value={formData.name}
                                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                            className="w-full px-5 py-3 input-wondr font-bold text-lg"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Kategori</label>
                                                        <select 
                                                            value={formData.category}
                                                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                                                            className="w-full px-5 py-3 input-wondr font-bold text-slate-700"
                                                        >
                                                            <option>Compliance</option>
                                                            <option>Soft Skills</option>
                                                            <option>Technical</option>
                                                            <option>Leadership</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                                                        Deskripsi
                                                        <span className="ml-2 text-xs font-normal text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                                            <Sparkles className="w-3 h-3" /> AI Enhanced
                                                        </span>
                                                    </label>
                                                    <textarea 
                                                        rows="6"
                                                        value={formData.description}
                                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                                        className="w-full px-5 py-4 input-wondr text-slate-600 leading-relaxed font-medium resize-none"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div>
                                                        <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Durasi (Jam)</label>
                                                        <input type="number" step="0.5" value={formData.duration_hours} onChange={(e) => setFormData({...formData, duration_hours: e.target.value})} className="w-full px-5 py-3 input-wondr font-bold" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Instruktur</label>
                                                        <input type="text" value={formData.instructor_name} onChange={(e) => setFormData({...formData, instructor_name: e.target.value})} className="w-full px-5 py-3 input-wondr font-bold" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Status</label>
                                                        <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-5 py-3 input-wondr font-bold">
                                                            <option value="draft">Draft</option>
                                                            <option value="published">Published</option>
                                                            <option value="archived">Archived</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="flex gap-4 pt-4 border-t border-slate-100">
                                                    <button type="button" onClick={() => setIsEditing(false)} className="px-8 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition">Batal</button>
                                                    <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-8 py-3 rounded-xl bg-[#002824] text-[#D6F84C] font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                                                        {isSaving ? 'Menyimpan...' : (
                                                            <>
                                                                <Save className="w-4 h-4" /> Simpan Perubahan
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            <>
                                                <SectionHeader 
                                                    title="Tentang Program" 
                                                    subtitle="Detail dan tujuan pembelajaran" 
                                                    icon={BookOpen}
                                                />
                                                <div className="prose prose-slate max-w-none">
                                                    <p className="text-lg text-slate-600 leading-relaxed">
                                                        {formData.description}
                                                    </p>
                                                </div>

                                                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="p-6 bg-[#F8F9FA] rounded-[24px]">
                                                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                            <Users className="w-5 h-5 text-[#005E54]" /> Target Audience
                                                        </h3>
                                                        <div className="flex flex-wrap gap-2">
                                                            {(formData.target_audience ? formData.target_audience.split('&') : []).map((tag, i) => (
                                                                <span key={i} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600">
                                                                    {tag.trim()}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="p-6 bg-[#F8F9FA] rounded-[24px]">
                                                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                            <Award className="w-5 h-5 text-amber-500" /> Sertifikasi
                                                        </h3>
                                                        <p className="text-sm text-slate-600">
                                                            Program ini diakui untuk poin pengembangan karir (CPD) internal BNI sebesar 25 poin.
                                                        </p>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'materials' && (
                                    <div className="space-y-6 animate-enter">
                                        <SectionHeader 
                                            title="Materi Pembelajaran" 
                                            subtitle={`${materials.length} file tersedia untuk peserta`} 
                                            icon={Layout}
                                            action={
                                                <button className="flex items-center gap-2 px-4 py-2 bg-[#002824] text-white rounded-xl text-sm font-bold hover:bg-[#00403a] transition">
                                                    <UploadCloud className="w-4 h-4" /> Upload
                                                </button>
                                            }
                                        />
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {materials.map(material => (
                                                <MaterialCard key={material.id} material={material} />
                                            ))}
                                            {/* Add New Placeholder */}
                                            <div className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 text-slate-400 hover:border-[#005E54] hover:text-[#005E54] hover:bg-[#F0FDF4] transition-all cursor-pointer min-h-[100px]">
                                                <UploadCloud className="w-8 h-8 mb-2" />
                                                <span className="font-bold text-sm">Tambah Materi Baru</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'quizzes' && (
                                    <div className="space-y-6 animate-enter">
                                        <SectionHeader 
                                            title="Kuis & Evaluasi" 
                                            subtitle="Pengaturan soal dan nilai kelulusan" 
                                            icon={HelpCircle}
                                            action={
                                                <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition">
                                                    <Save className="w-4 h-4" /> Kelola Bank Soal
                                                </button>
                                            }
                                        />

                                        <div className="space-y-4">
                                            {quizzes.map((quiz, idx) => (
                                                <div key={quiz.id} className="flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-[24px] shadow-sm">
                                                    <div className="w-10 h-10 rounded-full bg-[#D6F84C] flex items-center justify-center font-bold text-[#002824]">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-slate-900 text-lg">{quiz.title}</h4>
                                                        <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                                            <span className="flex items-center gap-1"><HelpCircle className="w-4 h-4" /> {quiz.questions} Soal</span>
                                                            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> Passing: {quiz.passing}%</span>
                                                        </div>
                                                    </div>
                                                    <button className="p-2 bg-slate-50 rounded-xl hover:bg-[#002824] hover:text-white transition-colors">
                                                        <ArrowRight className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'statistics' && (
                                    <div className="animate-enter text-center py-20">
                                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <BarChart2 className="w-10 h-10 text-slate-300" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">Analitik Detail</h3>
                                        <p className="text-slate-500">Dashboard statistik sedang diproses oleh tim data.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Sticky Sidebar (4 cols) */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* Status Card */}
                            <div className="bg-white rounded-[24px] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 sticky top-6">
                                <h3 className="font-bold text-slate-900 mb-4">Aksi Cepat</h3>
                                <div className="space-y-3">
                                    <button className="w-full py-3 px-4 bg-[#D6F84C] text-[#002824] rounded-xl font-bold shadow-lg shadow-[#D6F84C]/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                                        <Zap className="w-4 h-4" /> Publikasikan Perubahan
                                    </button>
                                    <button className="w-full py-3 px-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition flex items-center justify-center gap-2">
                                        <MoreHorizontal className="w-4 h-4" /> Opsi Lainnya
                                    </button>
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-100">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">AI Insights</h4>
                                    <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                                        <div className="flex gap-3">
                                            <Sparkles className="w-5 h-5 text-purple-600 shrink-0" />
                                            <div>
                                                <p className="text-xs font-bold text-purple-800 mb-1">Rekomendasi</p>
                                                <p className="text-xs text-purple-700 leading-relaxed">
                                                    Tingkat kelulusan kuis "Pre-Test" rendah (45%). Pertimbangkan menyederhanakan soal #4 dan #8.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Info List */}
                            <div className="bg-[#002824] rounded-[24px] p-6 text-white shadow-xl">
                                <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-[#D6F84C]" /> Compliance Check
                                </h3>
                                <ul className="space-y-4 text-sm">
                                    <li className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                                            <CheckCircle className="w-4 h-4" />
                                        </div>
                                        <span className="opacity-80">Materi tersertifikasi</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                                            <CheckCircle className="w-4 h-4" />
                                        </div>
                                        <span className="opacity-80">Audit trail aktif</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/50">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <span className="opacity-50">Review Q3 pending</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
