import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { 
    User, Lock, Trash2, Camera, Mail, Save, 
    Shield, ChevronRight, AlertTriangle, CheckCircle2,
    Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

// --- Wondr Style System ---
const WondrStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F8F9FA; color: #1e293b; }
        
        .wondr-dark { background-color: #002824; }
        .wondr-green { color: #005E54; }
        
        .glass-card {
            background: rgba(255, 255, 255, 0.95);
            border: 1px solid rgba(226, 232, 240, 0.8);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .input-wondr {
            background: #F8F9FA;
            border: 2px solid transparent;
            border-radius: 16px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .input-wondr:focus {
            background: #FFFFFF;
            border-color: #005E54;
            box-shadow: 0 0 0 4px rgba(0, 94, 84, 0.1);
            outline: none;
        }

        .nav-item {
            transition: all 0.3s ease;
        }
        .nav-item.active {
            background-color: #E6FFFA;
            color: #005E54;
            border-right: 4px solid #005E54;
        }
    `}</style>
);

// --- Main Layout ---

export default function Edit({ auth, mustVerifyEmail, status }) {
    const user = auth?.user || { name: 'User', email: 'user@example.com', avatar: null };
    const [activeTab, setActiveTab] = useState('profile');

    const tabs = [
        { id: 'profile', label: 'Profil Saya', icon: User, desc: 'Kelola informasi pribadi' },
        { id: 'security', label: 'Keamanan', icon: Shield, desc: 'Password & autentikasi' },
        { id: 'danger', label: 'Zona Bahaya', icon: Trash2, desc: 'Hapus akun permanen' },
    ];

    return (
        <AppLayout user={user}>
            <WondrStyles />
            <Head title="Pengaturan Akun" />

            {/* Header Background */}
            <div className="bg-[#002824] h-64 w-full absolute top-0 left-0 z-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#005E54] rounded-full blur-[100px] opacity-30 -translate-y-1/2 translate-x-1/4"></div>
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
                
                {/* Header Title */}
                <div className="mb-8 text-white">
                    <h1 className="text-3xl font-black mb-2">Pengaturan Akun</h1>
                    <p className="text-blue-100 opacity-80">Kelola profil dan preferensi keamanan Anda.</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    
                    {/* Sidebar Navigation */}
                    <div className="w-full lg:w-80 flex-shrink-0">
                        <div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/50 overflow-hidden sticky top-6">
                            {/* User Mini Profile */}
                            <div className="p-6 bg-gradient-to-br from-[#002824] to-[#00403a] text-center text-white">
                                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#D6F84C] to-[#005E54] p-[2px] rounded-full mb-3">
                                    <div className="w-full h-full bg-slate-800 rounded-full flex items-center justify-center text-2xl font-bold">
                                        {user.name.charAt(0)}
                                    </div>
                                </div>
                                <h3 className="font-bold text-lg">{user.name}</h3>
                                <p className="text-sm text-slate-300 opacity-80">{user.email}</p>
                            </div>

                            {/* Nav Items */}
                            <div className="p-2 space-y-1">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-4 p-4 rounded-xl text-left nav-item ${
                                            activeTab === tab.id ? 'active' : 'hover:bg-slate-50 text-slate-600'
                                        }`}
                                    >
                                        <tab.icon size={20} className={activeTab === tab.id ? 'text-[#005E54]' : 'text-slate-400'} />
                                        <div className="flex-1">
                                            <p className="font-bold text-sm">{tab.label}</p>
                                            <p className="text-xs opacity-70 font-medium">{tab.desc}</p>
                                        </div>
                                        {activeTab === tab.id && (
                                            <ChevronRight className="ml-auto text-[#005E54]" size={16} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1">
                        <AnimatePresence mode="wait">
                            
                            {/* --- PROFILE TAB --- */}
                            {activeTab === 'profile' && (
                                <motion.div
                                    key="profile"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-200">
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <h2 className="text-xl font-bold text-slate-900">Informasi Profil</h2>
                                                <p className="text-slate-500 text-sm">Perbarui detail akun dan alamat email Anda.</p>
                                            </div>
                                        </div>

                                        <UpdateProfileInformationForm
                                            mustVerifyEmail={mustVerifyEmail}
                                            status={status}
                                            className="max-w-full"
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {/* --- SECURITY TAB --- */}
                            {activeTab === 'security' && (
                                <motion.div
                                    key="security"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-200">
                                        <div className="mb-6">
                                            <h2 className="text-xl font-bold text-slate-900">Ubah Password</h2>
                                            <p className="text-slate-500 text-sm">Pastikan akun Anda aman dengan password yang kuat.</p>
                                        </div>

                                        <UpdatePasswordForm className="max-w-lg" />
                                    </div>
                                </motion.div>
                            )}

                            {/* --- DANGER ZONE --- */}
                            {activeTab === 'danger' && (
                                <motion.div
                                    key="danger"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-red-50 rounded-[32px] p-8 border border-red-100"
                                >
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className="p-3 bg-red-100 rounded-full text-red-600">
                                            <AlertTriangle size={32} />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-xl font-bold text-red-900 mb-2">Hapus Akun</h2>
                                            <p className="text-red-700 text-sm leading-relaxed">
                                                Setelah akun Anda dihapus, semua sumber daya dan data akan dihapus secara permanen. 
                                                Tindakan ini tidak dapat dibatalkan. Harap unduh data penting sebelum melanjutkan.
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <DeleteUserForm className="max-w-full" />
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>

                </div>
            </div>
            
            <div className="h-20"></div>
        </AppLayout>
    );
}
