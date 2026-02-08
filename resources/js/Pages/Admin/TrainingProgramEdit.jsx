import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, Save, AlertCircle, CheckCircle, 
    Clock, BookOpen, Users, Calendar, Shield, 
    Sparkles, ChevronRight, Zap, Info 
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';

// --- Wondr Style Injector ---
const WondrStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F8F9FA; }
        
        .wondr-dark { background-color: #002824; }
        .wondr-green { color: #005E54; }
        .wondr-lime { color: #D6F84C; }
        .bg-wondr-lime { background-color: #D6F84C; }
        
        .glass-panel {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 20px 40px -10px rgba(0, 40, 36, 0.08);
        }

        .input-wondr {
            background: #F8F9FA;
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .input-wondr:focus {
            background: #FFFFFF;
            border-color: #005E54;
            box-shadow: 0 0 0 4px rgba(0, 94, 84, 0.1);
            outline: none;
        }

        /* Modern Toggle Switch */
        .toggle-checkbox:checked {
            right: 0;
            border-color: #005E54;
        }
        .toggle-checkbox:checked + .toggle-label {
            background-color: #005E54;
        }
        
        .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `}</style>
);

// --- Component: Toggle Switch ---
const ToggleSwitch = ({ label, checked, onChange, description }) => (
    <div className="flex items-start justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
        <div>
            <div className="font-bold text-slate-800 text-sm mb-1">{label}</div>
            <div className="text-xs text-slate-500 font-medium">{description}</div>
        </div>
        <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
            <input 
                type="checkbox" 
                name="toggle" 
                id={`toggle-${label}`} 
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-all duration-300 left-0 checked:left-6 checked:bg-[#D6F84C] checked:border-[#005E54]"
                checked={checked}
                onChange={onChange}
            />
            <label 
                htmlFor={`toggle-${label}`} 
                className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-300 ${checked ? 'bg-[#005E54]' : 'bg-slate-300'}`}
            ></label>
        </div>
    </div>
);

// --- Main Component ---
export default function TrainingProgramEdit({ program: initialProgram, auth }) {
    // Mock Data for Preview
    const programData = initialProgram || {
        id: 1,
        title: 'Mastering Wondr Financial Suite',
        description: 'Pelatihan komprehensif mengenai fitur-fitur terbaru Wondr by BNI, mencakup investasi, transaksi harian, dan keamanan digital.',
        duration_minutes: 120,
        passing_grade: 80,
        category: 'Product',
        is_active: true,
        expiry_date: '2025-12-31',
        allow_retake: true,
        max_retake_attempts: 3,
        enrollment_count: 1450
    };

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('general');
    const [formData, setFormData] = useState(programData);

    // Must match backend allowed categories
    const categories = [
        'Core Business & Product',
        'Credit & Risk Management',
        'Collection & Recovery',
        'Compliance & Regulatory',
        'Sales & Marketing',
        'Service Excellence',
        'Leadership & Soft Skills',
        'IT & Digital Security',
        'Onboarding'
    ];

    const showNotification = (msg, type = 'success') => {
        setMessage({ text: msg, type });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // For draft programs: only require title & description
        // For published programs: require all fields
        if (!formData.title.trim()) {
            showNotification('Nama program tidak boleh kosong', 'error');
            return;
        }
        
        if (!formData.description.trim()) {
            showNotification('Deskripsi tidak boleh kosong', 'error');
            return;
        }
        
        // Only validate these fields if program is being published
        if (formData.is_active) {
            if (!formData.duration_minutes || formData.duration_minutes < 1) {
                showNotification('Durasi harus minimal 1 menit', 'error');
                return;
            }
            
            if (formData.passing_grade === null || formData.passing_grade === undefined || formData.passing_grade < 0 || formData.passing_grade > 100) {
                showNotification('Nilai lulus harus antara 0-100', 'error');
                return;
            }
            
            if (!formData.category) {
                showNotification('Kategori harus dipilih untuk program yang dipublikasikan', 'error');
                return;
            }
        }
        
        setLoading(true);
        
        try {
            // Prepare data: only send required fields for draft, all fields for published
            const sendData = {
                title: formData.title,
                description: formData.description,
                is_active: formData.is_active,
            };
            
            // If publishing or updating published program: include all fields
            if (formData.is_active) {
                sendData.duration_minutes = formData.duration_minutes || 1;
                sendData.passing_grade = formData.passing_grade !== null ? formData.passing_grade : 0;
                sendData.category = formData.category || 'Core Business & Product';
                sendData.allow_retake = formData.allow_retake || false;
                sendData.max_retake_attempts = formData.allow_retake ? formData.max_retake_attempts : null;
                sendData.expiry_date = formData.expiry_date || null;
            } else {
                // For draft: send optional fields if they exist
                if (formData.duration_minutes) sendData.duration_minutes = formData.duration_minutes;
                if (formData.passing_grade !== null && formData.passing_grade !== undefined) sendData.passing_grade = formData.passing_grade;
                if (formData.category) sendData.category = formData.category;
                if (formData.allow_retake !== undefined) sendData.allow_retake = formData.allow_retake;
                if (formData.allow_retake && formData.max_retake_attempts) sendData.max_retake_attempts = formData.max_retake_attempts;
                if (formData.expiry_date) sendData.expiry_date = formData.expiry_date;
            }
            
            const response = await fetch(`/api/admin/training-programs/${initialProgram.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                    'Accept': 'application/json',
                },
                body: JSON.stringify(sendData),
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                if (result.errors) {
                    const errorMessages = Object.values(result.errors).flat().join(', ');
                    showNotification(`Error: ${errorMessages}`, 'error');
                } else {
                    showNotification(result.message || 'Gagal memperbarui program', 'error');
                }
                return;
            }
            
            showNotification('Program berhasil diperbarui!', 'success');
            setTimeout(() => {
                router.visit('/admin/training-programs');
            }, 1500);
        } catch (error) {
            console.error('Error:', error);
            showNotification('Terjadi kesalahan: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Mock Navigation
    const handleBack = () => {
        router.visit('/admin/training-programs');
    };

    return (
        <AdminLayout user={auth?.user}>
            <Head title="Edit Training Program - HCMS E-Learning" />
            <div className="min-h-screen bg-[#F8F9FA] pb-20 font-sans text-slate-900">
                <WondrStyles />

            {/* Notification Toast */}
            {message && (
                <div className={`fixed top-6 right-6 z-[60] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-slide-up ${
                    message.type === 'success' ? 'bg-[#002824] text-[#D6F84C]' : 'bg-red-500 text-white'
                }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="font-bold text-sm tracking-wide">{message.text}</span>
                </div>
            )}

            {/* --- Hero Section --- */}
            <div className="relative bg-[#002824] pt-8 pb-32 px-6 overflow-hidden">
                {/* Abstract Decor */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#005E54] rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/4"></div>
                
                <div className="relative z-10 max-w-5xl mx-auto">
                    {/* Nav Bar */}
                    <div className="flex items-center justify-between mb-8">
                        <button 
                            onClick={handleBack}
                            className="group flex items-center gap-3 text-white/80 hover:text-[#D6F84C] transition-colors"
                        >
                            <div className="p-2 rounded-full bg-white/10 group-hover:bg-[#D6F84C] group-hover:text-[#002824] transition-all">
                                <ArrowLeft className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-sm tracking-wide">Kembali ke Dashboard</span>
                        </button>
                        <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border ${formData.is_active ? 'bg-[#D6F84C] text-[#002824] border-[#D6F84C]' : 'bg-transparent text-slate-400 border-slate-600'}`}>
                                {formData.is_active ? 'PUBLISHED' : 'DRAFT'}
                            </span>
                        </div>
                    </div>

                    {/* Title Area */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 leading-tight">
                                Edit Program
                            </h1>
                            <p className="text-slate-400 font-medium flex items-center gap-2">
                                <span className="text-[#D6F84C]">{formData.title}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                                <span>Terakhir diupdate hari ini</span>
                            </p>
                        </div>
                        
                        {/* Quick Stats */}
                        <div className="flex gap-4">
                            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                <div className="text-xs text-slate-400 mb-1">Peserta</div>
                                <div className="text-lg font-bold text-white flex items-center gap-1">
                                    <Users className="w-4 h-4 text-[#D6F84C]" /> {formData.enrollment_count}
                                </div>
                            </div>
                            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                <div className="text-xs text-slate-400 mb-1">Durasi</div>
                                <div className="text-lg font-bold text-white flex items-center gap-1">
                                    <Clock className="w-4 h-4 text-[#D6F84C]" /> {Math.round(formData.duration_minutes / 60)} Jam
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Main Content (Floating Card) --- */}
            <div className="relative z-20 max-w-5xl mx-auto px-6 -mt-20">
                <div className="glass-panel rounded-[32px] overflow-hidden animate-slide-up">
                    
                    {/* Tabs Navigation */}
                    <div className="flex border-b border-slate-100 bg-white/50 backdrop-blur-sm">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`flex-1 py-5 text-sm font-bold text-center transition-all relative ${
                                activeTab === 'general' ? 'text-[#005E54]' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            Informasi Umum
                            {activeTab === 'general' && <span className="absolute bottom-0 left-0 w-full h-1 bg-[#005E54] rounded-t-full"></span>}
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`flex-1 py-5 text-sm font-bold text-center transition-all relative ${
                                activeTab === 'settings' ? 'text-[#005E54]' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            Konfigurasi & Akses
                            {activeTab === 'settings' && <span className="absolute bottom-0 left-0 w-full h-1 bg-[#005E54] rounded-t-full"></span>}
                        </button>
                    </div>

                    {/* Form Area */}
                    <form onSubmit={handleSubmit} className="p-8 md:p-10 bg-white">
                        
                        {activeTab === 'general' && (
                            <div className="space-y-8 animate-slide-up">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Left Column */}
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Nama Program Training</label>
                                            <input
                                                type="text"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                className="w-full px-5 py-4 input-wondr font-bold text-lg text-slate-800 placeholder-slate-300"
                                                placeholder="Contoh: Kepatuhan Dasar 2025"
                                                required
                                            />
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Kategori</label>
                                                <div className="relative">
                                                    <select
                                                        value={formData.category}
                                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                        className="w-full px-5 py-3 input-wondr font-bold text-slate-700 appearance-none"
                                                    >
                                                        <option value="">Pilih...</option>
                                                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                        <ChevronRight className="w-4 h-4 rotate-90" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">KKM (Nilai Lulus)</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={formData.passing_grade}
                                                        onChange={(e) => setFormData({ ...formData, passing_grade: parseInt(e.target.value) })}
                                                        className="w-full px-5 py-3 input-wondr font-bold text-slate-800"
                                                        min="0" max="100"
                                                    />
                                                    <span className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Durasi Estimasi (Menit)</label>
                                            <div className="relative">
                                                <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                                <input
                                                    type="number"
                                                    value={formData.duration_minutes}
                                                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                                                    className="w-full pl-12 pr-5 py-3 input-wondr font-bold text-slate-800"
                                                    placeholder="60"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column */}
                                    <div className="space-y-6">
                                        <div className="h-full flex flex-col">
                                            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1 flex justify-between">
                                                Deskripsi Program
                                                <button type="button" className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-purple-100 transition">
                                                    <Sparkles className="w-3 h-3" /> AI Assist
                                                </button>
                                            </label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full px-5 py-4 input-wondr text-slate-600 leading-relaxed font-medium resize-none flex-1 min-h-[200px]"
                                                placeholder="Jelaskan tujuan dan materi yang akan dipelajari..."
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="space-y-8 animate-slide-up max-w-3xl mx-auto">
                                
                                <div className="p-6 bg-blue-50 rounded-[24px] border border-blue-100 flex gap-4">
                                    <div className="p-3 bg-white rounded-full h-fit text-blue-600 shadow-sm">
                                        <Info className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-blue-900 text-lg mb-1">Pengaturan Akses</h4>
                                        <p className="text-sm text-blue-700 leading-relaxed">
                                            Konfigurasi ini menentukan bagaimana peserta dapat mengakses, menyelesaikan, dan mengulang materi pembelajaran ini.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="block text-sm font-bold text-slate-700 ml-1">Batas Waktu Akses</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                            <input
                                                type="date"
                                                value={formData.expiry_date}
                                                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                                className="w-full pl-12 pr-5 py-3 input-wondr font-bold text-slate-800"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <label className="block text-sm font-bold text-slate-700 ml-1">Limit Percobaan Ulang</label>
                                        <input
                                            type="number"
                                            value={formData.max_retake_attempts}
                                            onChange={(e) => setFormData({ ...formData, max_retake_attempts: parseInt(e.target.value) })}
                                            className="w-full px-5 py-3 input-wondr font-bold text-slate-800"
                                            min="1"
                                            disabled={!formData.allow_retake}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <ToggleSwitch 
                                        label="Status Publikasi"
                                        description="Aktifkan agar program ini muncul di dashboard peserta."
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    />
                                    
                                    <ToggleSwitch 
                                        label="Izinkan Mengulang (Retake)"
                                        description="Peserta dapat mengulang kuis jika nilai di bawah KKM."
                                        checked={formData.allow_retake}
                                        onChange={(e) => setFormData({ ...formData, allow_retake: e.target.checked })}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Sticky Action Footer */}
                        <div className="mt-12 pt-6 border-t border-slate-100 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={handleBack}
                                className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative px-8 py-4 bg-[#002824] text-[#D6F84C] rounded-[20px] font-extrabold shadow-xl shadow-[#005E54]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    {loading ? 'Menyimpan...' : (
                                        <>
                                            <Save className="w-5 h-5" /> Simpan Perubahan
                                        </>
                                    )}
                                </span>
                                {/* Hover Effect */}
                                <div className="absolute inset-0 bg-[#00403a] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                            </button>
                        </div>

                    </form>
                </div>
            </div>
            </div>
        </AdminLayout>
    );
}
