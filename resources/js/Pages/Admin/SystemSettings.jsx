import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Save, RefreshCw, Database, Shield, Globe,
    Smartphone, Lock, Clock, HardDrive,
    CheckCircle2
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import axios from 'axios';
import showToast from '@/Utils/toast';

// --- TIMEZONE CONFIGURATION ---
const TIMEZONES = [
    // Asia
    { value: 'Asia/Jakarta', label: 'Jakarta (UTC+7)' },
    { value: 'Asia/Makassar', label: 'Makassar (UTC+8)' },
    { value: 'Asia/Jayapura', label: 'Jayapura (UTC+9)' },
    { value: 'Asia/Bangkok', label: 'Bangkok (UTC+7)' },
    { value: 'Asia/Ho_Chi_Minh', label: 'Ho Chi Minh City (UTC+7)' },
    { value: 'Asia/Singapore', label: 'Singapore (UTC+8)' },
    { value: 'Asia/Hong_Kong', label: 'Hong Kong (UTC+8)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (UTC+8)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' },
    { value: 'Asia/Seoul', label: 'Seoul (UTC+9)' },
    { value: 'Asia/Manila', label: 'Manila (UTC+8)' },
    { value: 'Asia/Kolkata', label: 'India (UTC+5:30)' },
    { value: 'Asia/Karachi', label: 'Karachi (UTC+5)' },
    { value: 'Asia/Dubai', label: 'Dubai (UTC+4)' },
    
    // Americas
    { value: 'America/New_York', label: 'New York (UTC-5)' },
    { value: 'America/Chicago', label: 'Chicago (UTC-6)' },
    { value: 'America/Denver', label: 'Denver (UTC-7)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (UTC-8)' },
    { value: 'America/Toronto', label: 'Toronto (UTC-5)' },
    { value: 'America/Mexico_City', label: 'Mexico City (UTC-6)' },
    { value: 'America/Bogota', label: 'Bogota (UTC-5)' },
    { value: 'America/Sao_Paulo', label: 'São Paulo (UTC-3)' },
    { value: 'America/Buenos_Aires', label: 'Buenos Aires (UTC-3)' },
    
    // Europe
    { value: 'Europe/London', label: 'London (UTC+0)' },
    { value: 'Europe/Paris', label: 'Paris (UTC+1)' },
    { value: 'Europe/Berlin', label: 'Berlin (UTC+1)' },
    { value: 'Europe/Amsterdam', label: 'Amsterdam (UTC+1)' },
    { value: 'Europe/Brussels', label: 'Brussels (UTC+1)' },
    { value: 'Europe/Vienna', label: 'Vienna (UTC+1)' },
    { value: 'Europe/Istanbul', label: 'Istanbul (UTC+3)' },
    { value: 'Europe/Moscow', label: 'Moscow (UTC+3)' },
    
    // Africa
    { value: 'Africa/Cairo', label: 'Cairo (UTC+2)' },
    { value: 'Africa/Johannesburg', label: 'Johannesburg (UTC+2)' },
    { value: 'Africa/Lagos', label: 'Lagos (UTC+1)' },
    
    // Oceania
    { value: 'Australia/Sydney', label: 'Sydney (UTC+10)' },
    { value: 'Australia/Melbourne', label: 'Melbourne (UTC+10)' },
    { value: 'Australia/Perth', label: 'Perth (UTC+8)' },
    { value: 'Pacific/Auckland', label: 'Auckland (UTC+12)' },
    { value: 'Pacific/Fiji', label: 'Fiji (UTC+12)' },
];

// --- BACKUP CONFIGURATION ---
const getBackupDiskLocation = () => {
    // Try to get from Vite environment variables
    const backupDisk = import.meta.env.VITE_BACKUP_DISK;
    if (backupDisk) {
        return backupDisk === 's3' ? 'AWS S3 (Cloud)' : backupDisk;
    }
    return 'Local Storage';
};

const BACKUP_CONFIG = {
    location: getBackupDiskLocation(),
    max_backups: 7,
    retention_days: 30,
    size_limit_gb: 5,
    auto_backup_enabled: true,
};

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
    const [loadingBackups, setLoadingBackups] = useState(false);
    const [errors, setErrors] = useState({});
    const [backups, setBackups] = useState([]);
    const [settings, setSettings] = useState({
        app_name: '',
        app_url: '',
        timezone: 'Asia/Jakarta',
        max_upload_size: 50,
        session_timeout: 30,
        enable_two_factor: false,
    });

    // Load settings on mount
    useEffect(() => {
        loadSettings();
        loadBackups();
    }, []);

    // Session timeout warning
    useEffect(() => {
        if (!settings.session_timeout) return;
        
        const timeoutMinutes = parseInt(settings.session_timeout);
        const warningAt = (timeoutMinutes - 5) * 60 * 1000; // 5 min before timeout
        
        if (warningAt <= 0) return; // Don't set warning if timeout is 5 minutes or less
        
        const timeoutId = setTimeout(() => {
            showToast('⏳ Your session will expire in 5 minutes due to inactivity', 'warning');
        }, warningAt);
        
        // Cleanup timeout when component unmounts or settings change
        return () => clearTimeout(timeoutId);
    }, [settings.session_timeout]);

    const loadSettings = async () => {
        try {
            setLoadingData(true);
            const response = await axios.get('/api/admin/settings');
            setSettings(response.data);
        } catch (error) {
            console.error('Gagal load settings:', error);
            showToast('Gagal load settings', 'error');
        } finally {
            setLoadingData(false);
        }
    };

    const loadBackups = async () => {
        try {
            setLoadingBackups(true);
            const response = await axios.get('/api/admin/backups');
            if (response.data.backups) {
                setBackups(response.data.backups);
            }
        } catch (error) {
            console.error('Gagal load backups:', error);
        } finally {
            setLoadingBackups(false);
        }
    };

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        // Clear error for this field when user starts typing
        if (errors[key]) {
            setErrors(prev => ({ ...prev, [key]: undefined }));
        }
        
        // Add upload size validation warnings
        if (key === 'max_upload_size') {
            const sizeNum = parseInt(value);
            if (sizeNum > 100) {
                showToast('⚠️ Very large files may cause issues with browser performance', 'warning');
            }
            if (sizeNum > 500) {
                showToast('❌ Warning: Maximum recommended size is 100-500 MB', 'error');
            }
        }
    };

    const testConnection = async () => {
        if (!settings.app_url) {
            showToast('⚠️ Please enter an App URL first', 'warning');
            return;
        }
        
        try {
            setLoading(true);
            const response = await fetch(settings.app_url, { 
                method: 'HEAD',
                mode: 'no-cors'
            });
            
            // For no-cors requests, we can't check status, so just check if it didn't error
            showToast('✅ URL is reachable and responding', 'success');
        } catch (err) {
            showToast(`❌ Cannot reach ${settings.app_url} - Please verify the URL is correct and accessible`, 'error');
            console.error('Connection test failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const ErrorMessage = ({ fieldName }) => {
        if (!errors[fieldName]) return null;
        return (
            <p className="text-red-500 text-sm mt-2 font-medium">
                ⚠️ {Array.isArray(errors[fieldName]) ? errors[fieldName][0] : errors[fieldName]}
            </p>
        );
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            setErrors({});
            
            const response = await axios.post('/api/admin/settings', settings);
            
            // Reload settings dari database untuk verify
            await loadSettings();
            
            // Show success message
            showToast('Settings berhasil disimpan!', 'success');
        } catch (error) {
            if (error.response?.status === 422) {
                // Validation errors
                const validationErrors = error.response.data.errors || {};
                setErrors(validationErrors);
                
                const errorMessages = Object.entries(validationErrors)
                    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
                    .join(' | ');
                
                showToast(`Validation error: ${errorMessages}`, 'error');
            } else {
                console.error('Gagal simpan settings:', error);
                const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
                showToast(`Gagal simpan settings: ${errorMsg}`, 'error');
            }
        } finally {
            setLoading(false);
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
                    <TabButton active={activeTab === 'data'} label="Storage" icon={Database} onClick={() => setActiveTab('data')} />
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
                                            maxLength={255}
                                            className={`w-full p-4 bg-slate-50 border-none rounded-xl font-bold text-slate-900 outline-none focus:ring-2 ${errors.app_name ? 'focus:ring-red-500' : 'focus:ring-[#D6FF59]'}`}
                                        />
                                        <ErrorMessage fieldName="app_name" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">App URL</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={settings.app_url}
                                                onChange={(e) => handleChange('app_url', e.target.value)}
                                                placeholder="https://example.com"
                                                className={`flex-1 p-4 bg-slate-50 border-none rounded-xl font-mono text-sm text-slate-700 outline-none focus:ring-2 ${errors.app_url ? 'focus:ring-red-500' : 'focus:ring-[#D6FF59]'}`}
                                            />
                                            <button
                                                type="button"
                                                onClick={testConnection}
                                                disabled={loading}
                                                className="px-6 py-4 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {loading ? '🔄' : '🔗'} Test
                                            </button>
                                        </div>
                                        <ErrorMessage fieldName="app_url" />
                                    </div>
                                </div>
                            </SettingCard>

                            {/* Localization */}
                            <SettingCard 
                                icon={Globe} 
                                title="Localization" 
                                description="Zona waktu default sistem untuk timestamp."
                            >
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Timezone (UTC/GMT)</label>
                                        <select 
                                            value={settings.timezone}
                                            onChange={(e) => handleChange('timezone', e.target.value)}
                                            className={`w-full p-4 bg-slate-50 border-none rounded-xl font-medium text-slate-700 outline-none focus:ring-2 ${errors.timezone ? 'focus:ring-red-500' : 'focus:ring-[#D6FF59]'}`}
                                        >
                                            <optgroup label="--- ASIA ---">
                                                {TIMEZONES.filter(tz => tz.value.startsWith('Asia')).map(tz => (
                                                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="--- AMERICAS ---">
                                                {TIMEZONES.filter(tz => tz.value.startsWith('America')).map(tz => (
                                                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="--- EUROPE ---">
                                                {TIMEZONES.filter(tz => tz.value.startsWith('Europe')).map(tz => (
                                                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="--- AFRICA ---">
                                                {TIMEZONES.filter(tz => tz.value.startsWith('Africa')).map(tz => (
                                                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="--- OCEANIA ---">
                                                {TIMEZONES.filter(tz => tz.value.startsWith('Australia') || tz.value.startsWith('Pacific')).map(tz => (
                                                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                                                ))}
                                            </optgroup>
                                        </select>
                                        <ErrorMessage fieldName="timezone" />
                                    </div>

                                </div>
                            </SettingCard>
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
                                    {errors.enable_two_factor && <ErrorMessage fieldName="enable_two_factor" />}

                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Session Timeout (Minutes)</label>
                                        <div className="relative">
                                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input 
                                                type="number" 
                                                value={settings.session_timeout}
                                                onChange={(e) => handleChange('session_timeout', e.target.value)}
                                                min={1}
                                                max={1440}
                                                className={`w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-xl font-bold text-slate-900 outline-none focus:ring-2 ${errors.session_timeout ? 'focus:ring-red-500' : 'focus:ring-[#D6FF59]'}`}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2">⏰ Users will receive a warning 5 minutes before session expires</p>
                                        <ErrorMessage fieldName="session_timeout" />
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
                                            className={`flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-${errors.max_upload_size ? 'red' : 'slate'}-900`}
                                        />
                                        <span className="font-mono font-bold text-lg bg-slate-100 px-3 py-1 rounded-lg w-24 text-center">
                                            {settings.max_upload_size} MB
                                        </span>
                                    </div>
                                    <ErrorMessage fieldName="max_upload_size" />
                                </div>
                            </SettingCard>
                            {/* Backup Configuration Info */}
                            <SettingCard 
                                icon={Database} 
                                title="Backup Configuration" 
                                description="Backup strategy and retention policy."
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                        <p className="text-xs font-bold uppercase text-slate-500 mb-1">Storage Location</p>
                                        <p className="font-bold text-slate-900">{BACKUP_CONFIG.location}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                        <p className="text-xs font-bold uppercase text-slate-500 mb-1">Max Backups Kept</p>
                                        <p className="font-bold text-slate-900">{BACKUP_CONFIG.max_backups} backups</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                        <p className="text-xs font-bold uppercase text-slate-500 mb-1">Retention Period</p>
                                        <p className="font-bold text-slate-900">{BACKUP_CONFIG.retention_days} days</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                        <p className="text-xs font-bold uppercase text-slate-500 mb-1">Max Backup Size</p>
                                        <p className="font-bold text-slate-900">{BACKUP_CONFIG.size_limit_gb} GB</p>
                                    </div>
                                </div>
                                {BACKUP_CONFIG.auto_backup_enabled && (
                                    <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                                        <p className="text-sm font-bold text-emerald-800">✅ Automatic daily backups are enabled</p>
                                    </div>
                                )}
                            </SettingCard>
                            {/* Backup Management */}
                            <SettingCard 
                                icon={HardDrive} 
                                title="Manajemen Backup" 
                                description="Lihat dan kelola system backups."
                            >
                                {loadingBackups ? (
                                    <div className="flex items-center justify-center py-8">
                                        <RefreshCw className="animate-spin text-slate-400 mr-2" size={18} />
                                        <p className="text-slate-500">Loading backups...</p>
                                    </div>
                                ) : backups.length > 0 ? (
                                    <div className="space-y-3">
                                        {backups.map((backup) => (
                                            <div key={backup.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition">
                                                <div className="flex-1">
                                                    <p className="font-bold text-slate-900">{backup.id}</p>
                                                    <p className="text-sm text-slate-500 mt-1">
                                                        {new Date(backup.created_at).toLocaleString('id-ID')} • {backup.size_formatted}
                                                    </p>
                                                    <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-bold ${
                                                        backup.status === 'valid' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                        {backup.status}
                                                    </span>
                                                </div>
                                                <a 
                                                    href={backup.download_url}
                                                    className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition"
                                                    download
                                                >
                                                    Download
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center">
                                        <p className="text-slate-500">Tidak ada backup tersedia</p>
                                    </div>
                                )}
                            </SettingCard>

                            {/* Backup Status Summary */}
                            {backups.length > 0 && (
                                <SettingCard 
                                    icon={HardDrive} 
                                    title="Backup Status" 
                                    description="Informasi backup terbaru."
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-slate-50 rounded-xl p-4">
                                            <p className="text-xs font-bold uppercase text-slate-500 mb-1">Total Backups</p>
                                            <p className="font-bold text-lg text-slate-900">{backups.length}</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-4">
                                            <p className="text-xs font-bold uppercase text-slate-500 mb-1">Last Backup</p>
                                            <p className="font-bold text-lg text-slate-900">{new Date(backups[0].created_at).toLocaleString('id-ID')}</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-4">
                                            <p className="text-xs font-bold uppercase text-slate-500 mb-1">Total Size</p>
                                            <p className="font-bold text-lg text-slate-900">{backups.reduce((sum, b) => sum + b.size, 0) / (1024 * 1024 * 1024) > 1 ? (backups.reduce((sum, b) => sum + b.size, 0) / (1024 * 1024 * 1024)).toFixed(2) + ' GB' : (backups.reduce((sum, b) => sum + b.size, 0) / (1024 * 1024)).toFixed(2) + ' MB'}</p>
                                        </div>
                                    </div>
                                </SettingCard>
                            )}
                        </motion.div>
                    )}


                </>
            )}
        </div>

            </div>
        </AdminLayout>
    );
}
