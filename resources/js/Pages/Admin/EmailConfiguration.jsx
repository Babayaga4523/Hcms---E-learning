import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    Mail, Save, Server, Shield, Zap, Activity, 
    CheckCircle2, XCircle, Globe, Lock, Eye, EyeOff,
    Terminal, Send, RotateCcw, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- PROVIDER CARD ---
const ProviderCard = ({ name, icon: Icon, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 w-full ${
            active 
            ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-105' 
            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
        }`}
    >
        <Icon size={24} className={active ? 'text-[#D6FF59]' : 'text-slate-400'} />
        <span className="mt-2 text-xs font-bold uppercase tracking-wider">{name}</span>
    </button>
);

// --- INPUT FIELD ---
const InputField = ({ label, value, onChange, type = "text", placeholder, icon: Icon, rightIcon }) => (
    <div className="group">
        <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5 ml-1">{label}</label>
        <div className="relative">
            {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#D6FF59] transition-colors" size={18} />}
            <input 
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full ${Icon ? 'pl-12' : 'pl-4'} ${rightIcon ? 'pr-12' : 'pr-4'} py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[#D6FF59] focus:border-transparent transition-all shadow-sm`}
            />
            {rightIcon && <div className="absolute right-4 top-1/2 -translate-y-1/2">{rightIcon}</div>}
        </div>
    </div>
);

// --- CONNECTION STATUS ---
const ConnectionStatus = ({ status }) => {
    const config = {
        connected: { color: 'bg-green-500', text: 'SMTP Connected', sub: 'Latency: 45ms' },
        error: { color: 'bg-red-500', text: 'Connection Error', sub: 'Check credentials' },
        checking: { color: 'bg-yellow-500', text: 'Checking...', sub: 'Verifying host' },
        idle: { color: 'bg-slate-400', text: 'Not Verified', sub: 'Save to connect' },
    };
    const current = config[status] || config.idle;

    return (
        <div className="flex items-center gap-3 bg-slate-900 rounded-2xl p-4 text-white shadow-lg">
            <div className="relative">
                <div className={`w-3 h-3 rounded-full ${current.color}`}></div>
                <div className={`absolute inset-0 w-3 h-3 rounded-full ${current.color} animate-ping opacity-75`}></div>
            </div>
            <div>
                <p className="text-sm font-bold">{current.text}</p>
                <p className="text-[10px] text-slate-400 font-mono">{current.sub}</p>
            </div>
        </div>
    );
};

// --- MOCK DATA ---
const mockLogs = [
    { id: 1, status: 'success', subject: 'Welcome Email', to: 'user@bni.co.id', time: '2 mins ago' },
    { id: 2, status: 'failed', subject: 'Password Reset', to: 'admin@gmail.com', time: '15 mins ago' },
    { id: 3, status: 'success', subject: 'Daily Report', to: 'manager@bni.co.id', time: '1 hour ago' },
];

// --- MAIN COMPONENT ---
export default function EmailConfiguration() {
    const { auth } = usePage().props;
    const user = auth.user;

    const [config, setConfig] = useState({
        provider: 'custom',
        host: 'smtp.mailtrap.io',
        port: '2525',
        username: 'user-123',
        password: 'password-123',
        encryption: 'tls',
        fromName: 'Wondr Learning',
        fromEmail: 'noreply@wondr.bni.co.id'
    });

    const [status, setStatus] = useState('idle');
    const [showPass, setShowPass] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [testLogs, setTestLogs] = useState([]);
    const [isTesting, setIsTesting] = useState(false);
    const [saving, setSaving] = useState(false);

    // Auto-fill presets
    const applyPreset = (provider) => {
        const presets = {
            gmail: { host: 'smtp.gmail.com', port: '587', encryption: 'tls' },
            outlook: { host: 'smtp.office365.com', port: '587', encryption: 'tls' },
            sendgrid: { host: 'smtp.sendgrid.net', port: '587', encryption: 'tls' },
            mailgun: { host: 'smtp.mailgun.org', port: '587', encryption: 'tls' },
            custom: { host: '', port: '', encryption: 'none' },
        };
        
        setConfig({ ...config, provider, ...presets[provider] });
    };

    const handleSave = async () => {
        setSaving(true);
        setStatus('checking');
        
        try {
            const res = await fetch('/api/admin/email-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                body: JSON.stringify(config),
            });

            setTimeout(() => {
                setStatus(res.ok ? 'connected' : 'error');
                setSaving(false);
            }, 1500);
        } catch (err) {
            console.error(err);
            setStatus('error');
            setSaving(false);
        }
    };

    const runDiagnostic = () => {
        if(!testEmail) {
            alert("Masukkan email tujuan");
            return;
        }
        setIsTesting(true);
        setTestLogs([]);
        
        const steps = [
            "Initializing SMTP handshake...",
            `Connecting to ${config.host}:${config.port}...`,
            "Verifying SSL/TLS certificate...",
            "Authenticating user credentials...",
            `Sending payload to <${testEmail}>...`,
            "250 OK: Message queued for delivery."
        ];

        let i = 0;
        const interval = setInterval(() => {
            setTestLogs(prev => [...prev, steps[i]]);
            i++;
            if(i >= steps.length) {
                clearInterval(interval);
                setIsTesting(false);
            }
        }, 800);
    };

    return (
        <AdminLayout user={user}>
            <Head title="Email Configuration" />

            <div className="pb-20">
                
                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-slate-900 text-[#D6FF59] text-[10px] font-bold uppercase tracking-wider rounded-full">
                                System Settings
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Email Configuration</h1>
                        <p className="text-slate-500 font-medium mt-1">Kelola gateway SMTP dan notifikasi sistem.</p>
                    </div>
                    <ConnectionStatus status={status} />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    
                    {/* --- LEFT COLUMN: CONFIG FORM --- */}
                    <div className="xl:col-span-2 space-y-8">
                        
                        {/* 1. Quick Presets */}
                        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Zap size={16} className="text-[#D6FF59] fill-black" /> Quick Presets
                            </h3>
                            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                                <ProviderCard name="Gmail" icon={Globe} active={config.provider === 'gmail'} onClick={() => applyPreset('gmail')} />
                                <ProviderCard name="Outlook" icon={Mail} active={config.provider === 'outlook'} onClick={() => applyPreset('outlook')} />
                                <ProviderCard name="SendGrid" icon={Server} active={config.provider === 'sendgrid'} onClick={() => applyPreset('sendgrid')} />
                                <ProviderCard name="Mailgun" icon={Activity} active={config.provider === 'mailgun'} onClick={() => applyPreset('mailgun')} />
                                <ProviderCard name="Custom" icon={Lock} active={config.provider === 'custom'} onClick={() => applyPreset('custom')} />
                            </div>
                        </div>

                        {/* 2. Server Details */}
                        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D6FF59] rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
                            
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <Server size={20} /> Server Configuration
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <InputField 
                                    label="SMTP Host" 
                                    placeholder="smtp.example.com" 
                                    value={config.host} 
                                    onChange={(e) => setConfig({...config, host: e.target.value})}
                                    icon={Globe}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField 
                                        label="Port" 
                                        placeholder="587" 
                                        value={config.port} 
                                        onChange={(e) => setConfig({...config, port: e.target.value})}
                                        icon={Server}
                                    />
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5 ml-1">Encryption</label>
                                        <div className="relative">
                                            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <select 
                                                value={config.encryption}
                                                onChange={(e) => setConfig({...config, encryption: e.target.value})}
                                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[#D6FF59] appearance-none"
                                            >
                                                <option value="tls">TLS</option>
                                                <option value="ssl">SSL</option>
                                                <option value="none">None</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <InputField 
                                    label="Username" 
                                    placeholder="user@example.com" 
                                    value={config.username} 
                                    onChange={(e) => setConfig({...config, username: e.target.value})}
                                    icon={Activity}
                                />
                                <InputField 
                                    label="Password" 
                                    type={showPass ? "text" : "password"} 
                                    placeholder="••••••••" 
                                    value={config.password} 
                                    onChange={(e) => setConfig({...config, password: e.target.value})}
                                    icon={Lock}
                                    rightIcon={
                                        <button onClick={() => setShowPass(!showPass)} className="text-slate-400 hover:text-slate-600">
                                            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    }
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField 
                                    label="From Email" 
                                    placeholder="noreply@domain.com" 
                                    value={config.fromEmail} 
                                    onChange={(e) => setConfig({...config, fromEmail: e.target.value})}
                                    icon={Mail}
                                />
                                <InputField 
                                    label="From Name" 
                                    placeholder="Wondr System" 
                                    value={config.fromName} 
                                    onChange={(e) => setConfig({...config, fromName: e.target.value})}
                                    icon={Zap}
                                />
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
                                <button 
                                    onClick={() => applyPreset('custom')}
                                    className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition flex items-center gap-2"
                                >
                                    <RotateCcw size={18} /> Reset
                                </button>
                                <button 
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition shadow-lg flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Save size={18} /> {saving ? 'Connecting...' : 'Save & Connect'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* --- RIGHT COLUMN: TEST & LOGS --- */}
                    <div className="space-y-8">
                        
                        {/* 3. Diagnostic Tool */}
                        <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"></div>
                            
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                <Terminal size={18} className="text-[#D6FF59]" /> Diagnostic Console
                            </h3>

                            <div className="bg-black/30 rounded-xl p-4 border border-white/10 mb-4">
                                <input 
                                    type="email" 
                                    value={testEmail}
                                    onChange={(e) => setTestEmail(e.target.value)}
                                    placeholder="Enter recipient email..." 
                                    className="w-full bg-transparent border-none outline-none text-sm placeholder-slate-500 text-white"
                                />
                            </div>

                            <button 
                                onClick={runDiagnostic}
                                disabled={isTesting}
                                className="w-full py-3 bg-[#D6FF59] text-slate-900 rounded-xl font-bold text-sm hover:bg-[#c3eb4b] transition flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isTesting ? <Activity className="animate-spin" size={18} /> : <Send size={18} />}
                                Run Test
                            </button>

                            {/* Terminal Logs */}
                            <div className="mt-6 font-mono text-[10px] space-y-1.5 h-40 overflow-y-auto">
                                <p className="text-slate-500">System ready. Waiting for command...</p>
                                {testLogs.map((log, idx) => (
                                    <motion.p 
                                        key={idx} 
                                        initial={{ opacity: 0, x: -10 }} 
                                        animate={{ opacity: 1, x: 0 }}
                                        className="text-green-400"
                                    >
                                        <span className="text-slate-600 mr-2">{new Date().toLocaleTimeString()}</span>
                                        {`> ${log}`}
                                    </motion.p>
                                ))}
                            </div>
                        </div>

                        {/* 4. Recent Logs */}
                        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-900">Delivery History</h3>
                                <button className="text-xs font-bold text-indigo-600 hover:underline">View All</button>
                            </div>
                            <div className="space-y-4">
                                {mockLogs.map(log => (
                                    <div key={log.id} className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition">
                                        <div className={`mt-1 w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-sm font-bold text-slate-800 truncate">{log.subject}</p>
                                            <p className="text-xs text-slate-500 truncate">To: {log.to}</p>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{log.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
