import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    Bell, Save, Mail, MessageSquare, Phone, Moon, 
    Check, X, Smartphone, Clock, Zap, Shield, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import showToast from '@/Utils/toast';

// --- REUSABLE COMPONENTS ---

const IOSSwitch = ({ checked, onChange, disabled }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={!disabled ? onChange : undefined}
        className={`
            relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
            transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2
            ${checked ? 'bg-[#D6FF59]' : 'bg-slate-200'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
    >
        <span
            className={`
                pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 
                transition duration-200 ease-in-out
                ${checked ? 'translate-x-5' : 'translate-x-0'}
            `}
        />
    </button>
);

const ChannelHeader = ({ icon: Icon, title, description, isActive, onToggle, colorClass }) => (
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isActive ? colorClass : 'bg-slate-100 text-slate-400'}`}>
                <Icon size={24} />
            </div>
            <div>
                <h3 className="font-bold text-lg text-slate-900">{title}</h3>
                <p className="text-xs text-slate-500 font-medium">{description}</p>
            </div>
        </div>
        <IOSSwitch checked={isActive} onChange={onToggle} />
    </div>
);

const ConfigRow = ({ label, description, checked, onChange, disabled }) => (
    <div className={`flex items-center justify-between py-3 group ${disabled ? 'opacity-50' : ''}`}>
        <div className="pr-4">
            <p className="font-semibold text-sm text-slate-700 group-hover:text-slate-900 transition-colors">{label}</p>
            <p className="text-[10px] text-slate-400">{description}</p>
        </div>
        <IOSSwitch checked={checked} onChange={onChange} disabled={disabled} />
    </div>
);

// --- MAIN COMPONENT ---

export default function NotificationPreferences() {
    const { auth } = usePage().props;
    const user = auth.user;

    const [preferences, setPreferences] = useState({
        // Master Toggles
        email_enabled: true,
        app_enabled: true,
        sms_enabled: false,

        // Email
        email_user_registration: true,
        email_program_enrollment: true,
        email_program_completion: true,
        email_quiz_reminder: false,
        email_approval_request: true,

        // App
        app_user_registration: true,
        app_program_enrollment: true,
        app_program_completion: true,
        app_quiz_reminder: true,
        app_approval_request: true,

        // SMS
        sms_quiz_reminder: false,
        sms_deadline_reminder: false,
        sms_approval_alert: true,

        // Quiet Hours
        quiet_hours_enabled: true,
        quiet_hours_start: '22:00',
        quiet_hours_end: '07:00',
    });

    const [saving, setSaving] = useState(false);
    const [activePreview, setActivePreview] = useState('app');

    // Load preferences on mount
    useEffect(() => {
        const loadPreferences = async () => {
            try {
                const res = await fetch('/api/admin/notification-preferences', {
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                    }
                });
                
                if (res.ok) {
                    const data = await res.json();
                    setPreferences(data);
                }
            } catch (err) {
                console.error('Failed to load preferences:', err);
            }
        };

        loadPreferences();
    }, []);

    const handleToggle = (key) => {
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleChange = (key, value) => {
        setPreferences(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/notification-preferences', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                body: JSON.stringify(preferences),
            });

            if (res.ok) {
                showToast('Preferensi notifikasi berhasil disimpan', 'success');
            } else {
                showToast('Gagal menyimpan preferensi notifikasi', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Gagal menyimpan preferensi notifikasi', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout user={user}>
            <Head title="Notification Preferences" />

            <div className="pb-20">
                
                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-slate-900 text-[#D6FF59] text-[10px] font-bold uppercase tracking-wider rounded-full">
                                System Settings
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Notification Center</h1>
                        <p className="text-slate-500 font-medium mt-1">Atur saluran komunikasi, trigger event, dan jadwal pengiriman.</p>
                    </div>
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-8 py-3 bg-[#D6FF59] text-slate-900 rounded-xl font-bold shadow-lg shadow-lime-200 hover:bg-[#cbf542] transition hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-900 border-t-transparent" /> : <Save size={18} />}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    
                    {/* --- LEFT COLUMN: CHANNELS --- */}
                    <div className="xl:col-span-2 space-y-8">
                        
                        {/* 1. EMAIL CHANNEL */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[100px] opacity-10 pointer-events-none"></div>

                            <ChannelHeader 
                                icon={Mail} 
                                title="Email Notifications" 
                                description="Kirim notifikasi transaksional via SMTP."
                                isActive={preferences.email_enabled}
                                onToggle={() => handleToggle('email_enabled')}
                                colorClass="bg-blue-100 text-blue-600"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                                <ConfigRow 
                                    label="User Registration" 
                                    description="Alert saat user baru mendaftar."
                                    checked={preferences.email_user_registration}
                                    onChange={() => handleToggle('email_user_registration')}
                                    disabled={!preferences.email_enabled}
                                />
                                <ConfigRow 
                                    label="Program Enrollment" 
                                    description="Konfirmasi pendaftaran course."
                                    checked={preferences.email_program_enrollment}
                                    onChange={() => handleToggle('email_program_enrollment')}
                                    disabled={!preferences.email_enabled}
                                />
                                <ConfigRow 
                                    label="Program Completion" 
                                    description="Sertifikat & ucapan selamat."
                                    checked={preferences.email_program_completion}
                                    onChange={() => handleToggle('email_program_completion')}
                                    disabled={!preferences.email_enabled}
                                />
                                <ConfigRow 
                                    label="Approval Request" 
                                    description="Notifikasi butuh persetujuan."
                                    checked={preferences.email_approval_request}
                                    onChange={() => handleToggle('email_approval_request')}
                                    disabled={!preferences.email_enabled}
                                />
                            </div>
                        </motion.div>

                        {/* 2. IN-APP CHANNEL */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-10 pointer-events-none"></div>

                            <ChannelHeader 
                                icon={Bell} 
                                title="Push Notifications" 
                                description="Notifikasi real-time di aplikasi & web."
                                isActive={preferences.app_enabled}
                                onToggle={() => handleToggle('app_enabled')}
                                colorClass="bg-indigo-100 text-indigo-600"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                                <ConfigRow 
                                    label="Quiz Reminder" 
                                    description="Pengingat harian quiz."
                                    checked={preferences.app_quiz_reminder}
                                    onChange={() => handleToggle('app_quiz_reminder')}
                                    disabled={!preferences.app_enabled}
                                />
                                <ConfigRow 
                                    label="System Updates" 
                                    description="Informasi maintenance/fitur baru."
                                    checked={true}
                                    disabled={true}
                                />
                                <ConfigRow 
                                    label="Approval Status" 
                                    description="Update status request approval."
                                    checked={preferences.app_approval_request}
                                    onChange={() => handleToggle('app_approval_request')}
                                    disabled={!preferences.app_enabled}
                                />
                            </div>
                        </motion.div>

                        {/* 3. SMS CHANNEL */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-10 pointer-events-none"></div>

                            <ChannelHeader 
                                icon={MessageSquare} 
                                title="SMS / WhatsApp" 
                                description="Pesan singkat untuk alert urgent."
                                isActive={preferences.sms_enabled}
                                onToggle={() => handleToggle('sms_enabled')}
                                colorClass="bg-emerald-100 text-emerald-600"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                                <ConfigRow 
                                    label="Deadline Critical" 
                                    description="H-1 sebelum deadline expired."
                                    checked={preferences.sms_deadline_reminder}
                                    onChange={() => handleToggle('sms_deadline_reminder')}
                                    disabled={!preferences.sms_enabled}
                                />
                                <ConfigRow 
                                    label="Security Alert" 
                                    description="Login mencurigakan / OTP."
                                    checked={preferences.sms_approval_alert}
                                    onChange={() => handleToggle('sms_approval_alert')}
                                    disabled={!preferences.sms_enabled}
                                />
                            </div>
                        </motion.div>

                    </div>

                    {/* --- RIGHT COLUMN: QUIET HOURS & PREVIEW --- */}
                    <div className="space-y-8">
                        
                        {/* 4. QUIET HOURS WIDGET */}
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                            
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="font-bold text-lg flex items-center gap-2">
                                        <Moon size={20} className="text-[#D6FF59]" /> Quiet Hours
                                    </h3>
                                    <p className="text-slate-400 text-xs mt-1">Pause notifikasi non-urgent.</p>
                                </div>
                                <IOSSwitch 
                                    checked={preferences.quiet_hours_enabled} 
                                    onChange={() => handleToggle('quiet_hours_enabled')} 
                                />
                            </div>

                            <div className={`space-y-4 transition-opacity duration-300 ${preferences.quiet_hours_enabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/10 rounded-2xl p-4 border border-white/5">
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Start Time</label>
                                        <input 
                                            type="time" 
                                            value={preferences.quiet_hours_start}
                                            onChange={(e) => handleChange('quiet_hours_start', e.target.value)}
                                            className="bg-transparent text-2xl font-black text-white outline-none w-full p-0 border-none focus:ring-0"
                                        />
                                    </div>
                                    <div className="bg-white/10 rounded-2xl p-4 border border-white/5">
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">End Time</label>
                                        <input 
                                            type="time" 
                                            value={preferences.quiet_hours_end}
                                            onChange={(e) => handleChange('quiet_hours_end', e.target.value)}
                                            className="bg-transparent text-2xl font-black text-white outline-none w-full p-0 border-none focus:ring-0"
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 flex items-center gap-2 bg-white/5 p-3 rounded-xl">
                                    <Clock size={12} />
                                    Notifikasi akan ditunda selama jam ini.
                                </p>
                            </div>
                        </motion.div>

                        {/* 5. LIVE PREVIEW */}
                        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
                            <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-bold text-sm text-slate-700">Live Preview</h3>
                                <div className="flex bg-white rounded-lg p-1 border border-slate-200">
                                    <button 
                                        onClick={() => setActivePreview('app')}
                                        className={`p-1.5 rounded-md transition ${activePreview === 'app' ? 'bg-slate-100 text-slate-900' : 'text-slate-400'}`}
                                    >
                                        <Smartphone size={16} />
                                    </button>
                                    <button 
                                        onClick={() => setActivePreview('email')}
                                        className={`p-1.5 rounded-md transition ${activePreview === 'email' ? 'bg-slate-100 text-slate-900' : 'text-slate-400'}`}
                                    >
                                        <Mail size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 bg-[#F2F2F7] p-6 flex flex-col items-center justify-center relative">
                                {activePreview === 'app' ? (
                                    <motion.div 
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        className="w-full bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/50 max-w-[280px]"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-5 h-5 bg-[#D6FF59] rounded-md flex items-center justify-center text-[10px] font-bold">W</div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Wondr Learning • Now</span>
                                        </div>
                                        <p className="font-bold text-sm text-slate-900">Quiz Reminder 🧠</p>
                                        <p className="text-xs text-slate-600 mt-1">Jangan lupa selesaikan kuis "Cyber Security" sebelum jam 17:00!</p>
                                    </motion.div>
                                ) : (
                                    <motion.div 
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        className="w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden max-w-[280px]"
                                    >
                                        <div className="bg-slate-900 p-4">
                                            <h4 className="text-white text-xs font-bold">Wondr Learning</h4>
                                        </div>
                                        <div className="p-4">
                                            <p className="font-bold text-sm text-slate-800 mb-2">Konfirmasi Pendaftaran</p>
                                            <div className="h-2 w-full bg-slate-100 rounded mb-1"></div>
                                            <div className="h-2 w-2/3 bg-slate-100 rounded mb-3"></div>
                                            <button className="w-full py-1.5 bg-[#D6FF59] rounded text-[10px] font-bold">Lihat Detail</button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
