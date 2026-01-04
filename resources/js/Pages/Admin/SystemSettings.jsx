import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings, Save, RefreshCw, Database, Shield, Globe,
    Smartphone, Lock, Server, Clock, Activity, HardDrive,
    CheckCircle2, AlertTriangle, Key, UploadCloud
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import axios from 'axios';

// --- REUSABLE COMPONENTS ---

const ToggleSwitch = ({ checked, onChange, disabled }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={!disabled ? () => onChange(!checked) : undefined}
        className={`
            relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
            transition-colors duration-200 ease-in-out focus:outline-none 
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

const SettingCard = ({ icon: Icon, title, description, children, action }) => (
    <div className="bg-white rounded-[24px] p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all">
        <div className="flex justify-between items-start mb-6">
            <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-700">
                    <Icon size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                    <p className="text-sm text-slate-500">{description}</p>
                </div>
            </div>
            {action}
        </div>
        {children}
    </div>
);

const TabButton = ({ active, label, icon: Icon, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
            active 
            ? 'bg-slate-900 text-white shadow-lg' 
            : 'bg-white text-slate-500 hover:bg-slate-50'
        }`}
    >
        <Icon size={18} className={active ? 'text-[#D6FF59]' : ''} />
        {label}
    </button>
);

// --- MAIN COMPONENT ---

export default function SystemSettings() {
    const { auth } = usePage().props;
    const user = auth?.user || {};

    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [settings, setSettings] = useState({
        app_name: '',
        app_url: '',
        timezone: 'Asia/Jakarta',
        locale: 'id',
        max_upload_size: 50,
        session_timeout: 30,
        enable_two_factor: false,
        enable_api: false,
        api_rate_limit: 1000,
        maintenance_mode: false,
        backup_enabled: false,
        backup_frequency: 'daily',
    });

    // Backup State
    const [showBackupModal, setShowBackupModal] = useState(false);
    const [backupProgress, setBackupProgress] = useState(0);
    const [backupMessage, setBackupMessage] = useState('');

    // Load settings on mount
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoadingData(true);
            const response = await axios.get('/api/admin/settings');
            setSettings(response.data);
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setLoadingData(false);
        }
    };

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const response = await axios.post('/api/admin/settings', settings);
            
            // Reload settings from database to reflect changes
            await loadSettings();
            
            // Show success message
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save settings. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const startBackup = async () => {
        try {
            setBackupProgress(10);
            setBackupMessage('Initializing backup...');
            
            const response = await axios.post('/api/admin/backup');
            
            setBackupProgress(50);
            setBackupMessage('Creating database dump...');
            
            setTimeout(() => {
                setBackupProgress(100);
                setBackupMessage('Backup completed successfully!');
                
                setTimeout(() => {
                    setShowBackupModal(false);
                    setBackupProgress(0);
                    setBackupMessage('');
                }, 1500);
            }, 1000);
        } catch (error) {
            console.error('Backup failed:', error);
            setBackupMessage('Backup failed. Please try again.');
            setBackupProgress(0);
        }
    };

    return (
        <AdminLayout user={user}>
            <Head title="Wondr System Control" />

            <div className="pb-20">

                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-slate-900 text-[#D6FF59] text-[10px] font-bold uppercase tracking-wider rounded-full">
                                Configuration
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Settings</h1>
                        <p className="text-slate-500 font-medium mt-1">Kelola preferensi global, keamanan, dan pemeliharaan sistem.</p>
                    </div>
                    <button 
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 px-8 py-4 bg-[#D6FF59] text-slate-900 rounded-2xl font-bold shadow-lg shadow-lime-200 hover:bg-[#cbf542] transition hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                        {loading ? 'Saving Changes...' : 'Save Configuration'}
                    </button>
                </div>

                {/* --- TABS --- */}
                <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                    <TabButton active={activeTab === 'general'} label="General" icon={Globe} onClick={() => setActiveTab('general')} />
                    <TabButton active={activeTab === 'security'} label="Security & Access" icon={Shield} onClick={() => setActiveTab('security')} />
                    <TabButton active={activeTab === 'data'} label="Data & Backup" icon={Database} onClick={() => setActiveTab('data')} />
                    <TabButton active={activeTab === 'api'} label="API Integration" icon={Server} onClick={() => setActiveTab('api')} />
                </div>

                {/* --- CONTENT AREA --- */}
                <div className="space-y-8">
                    {/* Loading State */}
                    {loadingData ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <RefreshCw className="animate-spin text-slate-400 mb-4" size={48} />
                            <p className="text-slate-500 font-medium">Loading settings...</p>
                        </div>
                    ) : (
                        <>
                            {/* GENERAL SETTINGS */}
                            {activeTab === 'general' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

                            {/* App Identity */}
                            <SettingCard 
                                icon={Smartphone} 
                                title="App Identity" 
                                description="Nama aplikasi dan URL utama sistem."
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">App Name</label>
                                        <input 
                                            type="text" 
                                            value={settings.app_name}
                                            onChange={(e) => handleChange('app_name', e.target.value)}
                                            className="w-full p-4 bg-slate-50 border-none rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#D6FF59]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">App URL</label>
                                        <input 
                                            type="text" 
                                            value={settings.app_url}
                                            onChange={(e) => handleChange('app_url', e.target.value)}
                                            className="w-full p-4 bg-slate-50 border-none rounded-xl font-mono text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#D6FF59]"
                                        />
                                    </div>
                                </div>
                            </SettingCard>

                            {/* Localization */}
                            <SettingCard 
                                icon={Globe} 
                                title="Localization" 
                                description="Zona waktu dan bahasa default sistem."
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Timezone</label>
                                        <select 
                                            value={settings.timezone}
                                            onChange={(e) => handleChange('timezone', e.target.value)}
                                            className="w-full p-4 bg-slate-50 border-none rounded-xl font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[#D6FF59]"
                                        >
                                            <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                                            <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                                            <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Default Language</label>
                                        <div className="flex bg-slate-50 p-1 rounded-xl">
                                            {['id', 'en'].map(lang => (
                                                <button
                                                    key={lang}
                                                    onClick={() => handleChange('locale', lang)}
                                                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${
                                                        settings.locale === lang 
                                                        ? 'bg-white shadow-sm text-slate-900' 
                                                        : 'text-slate-400 hover:text-slate-600'
                                                    }`}
                                                >
                                                    {lang === 'id' ? '🇮🇩 Indonesia' : '🇺🇸 English'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </SettingCard>

                            {/* Maintenance Toggle */}
                            <div className="bg-slate-900 rounded-[24px] p-6 text-white flex items-center justify-between shadow-lg">
                                <div className="flex gap-4 items-center">
                                    <div className="p-3 bg-white/10 rounded-xl">
                                        <AlertTriangle className="text-yellow-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">Maintenance Mode</h3>
                                        <p className="text-slate-400 text-sm">Hanya admin yang bisa mengakses sistem saat aktif.</p>
                                    </div>
                                </div>
                                <ToggleSwitch 
                                    checked={settings.maintenance_mode} 
                                    onChange={(val) => handleChange('maintenance_mode', val)} 
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* SECURITY SETTINGS */}
                    {activeTab === 'security' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <SettingCard 
                                icon={Lock} 
                                title="Authentication" 
                                description="Pengaturan keamanan login dan sesi pengguna."
                            >
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div>
                                            <p className="font-bold text-slate-900">Two-Factor Authentication (2FA)</p>
                                            <p className="text-xs text-slate-500 mt-1">Wajibkan 2FA untuk semua akun admin & manager.</p>
                                        </div>
                                        <ToggleSwitch 
                                            checked={settings.enable_two_factor} 
                                            onChange={(val) => handleChange('enable_two_factor', val)} 
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Session Timeout (Minutes)</label>
                                        <div className="relative">
                                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input 
                                                type="number" 
                                                value={settings.session_timeout}
                                                onChange={(e) => handleChange('session_timeout', e.target.value)}
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#D6FF59]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </SettingCard>
                        </motion.div>
                    )}

                    {/* DATA & BACKUP */}
                    {activeTab === 'data' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            {/* Storage Config */}
                            <SettingCard 
                                icon={HardDrive} 
                                title="Storage Limits" 
                                description="Batas ukuran upload file materi dan dokumen."
                            >
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Max Upload Size (MB)</label>
                                    <div className="flex items-center gap-4">
                                        <input 
                                            type="range" 
                                            min="10" 
                                            max="500" 
                                            step="10"
                                            value={settings.max_upload_size}
                                            onChange={(e) => handleChange('max_upload_size', e.target.value)}
                                            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                                        />
                                        <span className="font-mono font-bold text-lg bg-slate-100 px-3 py-1 rounded-lg w-24 text-center">
                                            {settings.max_upload_size} MB
                                        </span>
                                    </div>
                                </div>
                            </SettingCard>

                            {/* Backup Center */}
                            <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>

                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <div>
                                        <h3 className="text-2xl font-black mb-2 flex items-center gap-2">
                                            <Database className="text-[#D6FF59]" /> Backup Center
                                        </h3>
                                        <p className="text-slate-400">Terakhir dibackup: <strong>Hari ini, 02:00 WIB</strong></p>
                                    </div>
                                    <button 
                                        onClick={() => setShowBackupModal(true)}
                                        className="bg-[#D6FF59] text-slate-900 px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#cbf542] transition shadow-lg flex items-center gap-2"
                                    >
                                        <UploadCloud size={18} /> Backup Now
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                                    <div className="bg-white/10 rounded-2xl p-4 border border-white/5">
                                        <p className="text-xs font-bold uppercase text-slate-400 mb-1">Frequency</p>
                                        <p className="font-bold text-lg">Daily (Auto)</p>
                                    </div>
                                    <div className="bg-white/10 rounded-2xl p-4 border border-white/5">
                                        <p className="text-xs font-bold uppercase text-slate-400 mb-1">Retention</p>
                                        <p className="font-bold text-lg">30 Days</p>
                                    </div>
                                    <div className="bg-white/10 rounded-2xl p-4 border border-white/5">
                                        <p className="text-xs font-bold uppercase text-slate-400 mb-1">Status</p>
                                        <p className="font-bold text-lg text-emerald-400 flex items-center gap-2">
                                            <CheckCircle2 size={16} /> Healthy
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* API SETTINGS */}
                    {activeTab === 'api' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <SettingCard 
                                icon={Server} 
                                title="API Access" 
                                description="Kontrol akses API untuk integrasi pihak ketiga."
                                action={
                                    <ToggleSwitch 
                                        checked={settings.enable_api} 
                                        onChange={(val) => handleChange('enable_api', val)} 
                                    />
                                }
                            >
                                <div className={`space-y-6 transition-opacity duration-300 ${settings.enable_api ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Rate Limit (Requests/Min)</label>
                                        <input 
                                            type="number" 
                                            value={settings.api_rate_limit}
                                            onChange={(e) => handleChange('api_rate_limit', e.target.value)}
                                            className="w-full p-4 bg-slate-50 border-none rounded-xl font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#D6FF59]"
                                        />
                                    </div>

                                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
                                        <Key className="text-amber-600 shrink-0" />
                                        <div>
                                            <h4 className="font-bold text-amber-900 text-sm">Secret Key</h4>
                                            <p className="font-mono text-xs text-amber-700 mt-1 break-all">
                                                sk_live_51Msz...x82j9s (Hidden)
                                            </p>
                                            <button className="text-xs font-bold text-amber-800 underline mt-2">Regenerate Key</button>
                                        </div>
                                    </div>
                                </div>
                            </SettingCard>
                        </motion.div>
                    )}
                </>
            )}
        </div>

                {/* --- BACKUP MODAL --- */}
                <AnimatePresence>
                    {showBackupModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl text-center"
                            >
                                {backupProgress < 100 ? (
                                    <>
                                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <RefreshCw className="animate-spin text-indigo-600" size={32} />
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 mb-2">Creating Backup...</h2>
                                        <p className="text-slate-500 mb-6">{backupMessage || 'Mohon tunggu, jangan tutup halaman ini.'}</p>
                                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div 
                                                animate={{ width: `${backupProgress}%` }}
                                                className="h-full bg-indigo-600 rounded-full"
                                            />
                                        </div>
                                        <p className="text-xs font-bold text-indigo-600 mt-2">{backupProgress}%</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <CheckCircle2 className="text-green-600" size={40} />
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 mb-2">Backup Complete!</h2>
                                        <p className="text-slate-500 mb-6">File backup aman tersimpan di server.</p>
                                        <button 
                                            onClick={() => setShowBackupModal(false)}
                                            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800"
                                        >
                                            Selesai
                                        </button>
                                    </>
                                )}

                                {backupProgress === 0 && (
                                    <div className="mt-6 flex gap-3">
                                        <button onClick={() => setShowBackupModal(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Batal</button>
                                        <button onClick={startBackup} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Mulai</button>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </div>
        </AdminLayout>
    );
}
