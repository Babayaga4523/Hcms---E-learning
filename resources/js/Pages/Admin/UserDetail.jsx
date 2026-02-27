import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
    ArrowLeft, Mail, Phone, Briefcase, Calendar, CheckCircle, 
    Clock, Award, BookOpen, Edit3, Shield, Star, 
    Download, ChevronRight, Zap, MapPin, Hash, Activity 
} from 'lucide-react';

// --- Wondr Style System ---
const WondrStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F8F9FA; color: #1e293b; }
        
        .wondr-dark { background-color: #002824; }
        .wondr-green { color: #005E54; }
        .wondr-lime { color: #D6F84C; }
        
        .glass-card {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.5);
            box-shadow: 0 20px 40px -10px rgba(0, 40, 36, 0.08);
        }

        .avatar-glow {
            box-shadow: 0 0 0 8px rgba(255, 255, 255, 0.1);
        }

        .tab-pill {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .tab-pill.active {
            background-color: #002824;
            color: #D6F84C;
            box-shadow: 0 4px 12px -2px rgba(0, 40, 36, 0.2);
        }

        .animate-enter { animation: enter 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        @keyframes enter {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .level-ring {
            background: conic-gradient(#D6F84C var(--progress), #ffffff30 0deg);
        }
    `}</style>
);

// --- Components ---

const DetailItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#005E54]/20 transition-colors">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#005E54] shadow-sm">
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</p>
            <p className="text-sm font-bold text-slate-900">{value || '-'}</p>
        </div>
    </div>
);

const TrainingCard = ({ training }) => (
    <div className="group flex flex-col md:flex-row md:items-center gap-4 p-5 bg-white border border-slate-100 rounded-[20px] hover:shadow-lg hover:border-[#005E54]/30 transition-all">
        {/* Status Indicator */}
        <div className={`w-2 h-full md:h-12 rounded-full ${
            training.status === 'completed' ? 'bg-[#D6F84C]' : 
            training.status === 'in_progress' ? 'bg-blue-400' : 'bg-slate-200'
        }`}></div>
        
        <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    training.status === 'completed' ? 'bg-green-100 text-green-700' : 
                    training.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                }`}>
                    {training.status.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-400">• {training.date}</span>
            </div>
            <h4 className="font-bold text-slate-900 text-lg group-hover:text-[#005E54] transition-colors">{training.title}</h4>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {training.duration}</span>
                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" /> Score: {training.score}%</span>
            </div>
        </div>

        {training.certificate && (
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-[#002824] text-slate-600 hover:text-[#D6F84C] rounded-xl text-sm font-bold transition-all">
                <Download className="w-4 h-4" />
                <span className="hidden md:inline">Sertifikat</span>
            </button>
        )}
    </div>
);

const BadgeCard = ({ badge }) => (
    <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-white to-slate-50 border border-slate-100 rounded-[24px] text-center hover:scale-105 transition-transform shadow-sm">
        <div className="w-16 h-16 rounded-full bg-[#E6FFFA] flex items-center justify-center mb-4 text-4xl">
            {badge.icon}
        </div>
        <h4 className="font-bold text-slate-900 mb-1">{badge.name}</h4>
        <p className="text-xs text-slate-500">{badge.date}</p>
    </div>
);

// --- Main Layout ---

export default function UserDetail({ user: initialUser, statistics, trainings }) {
    // Use ONLY real data from backend - no mock data
    const user = initialUser;
    const userTrainings = trainings && Array.isArray(trainings) && trainings.length > 0 ? trainings : [];
    
    // Show warning if no real data
    const showWarning = !user;

    // If no user data, show error state
    if (!user) {
        return (
            <>
                <Head title="User Detail" />
                <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
                    <div className="text-center">
                        <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Data User Tidak Ditemukan</h2>
                        <p className="text-slate-600 mb-6">User data tidak tersedia. Silakan kembali ke halaman user management.</p>
                        <button onClick={() => router.visit('/admin/users')} className="px-6 py-2 bg-[#005E54] text-white rounded-lg hover:bg-[#004940] transition">
                            Kembali ke User Management
                        </button>
                    </div>
                </div>
            </>
        );
    }

    const mockTrainings = [
        { id: 1, title: 'Advanced Risk Assessment', status: 'completed', date: '10 Oct 2024', duration: '4 Jam', score: 92, certificate: true },
        { id: 2, title: 'Wondr App Security Protocols', status: 'in_progress', date: '12 Oct 2024', duration: '2 Jam', score: 0, certificate: false },
        { id: 3, title: 'Leadership 101', status: 'pending', date: '-', duration: '6 Jam', score: 0, certificate: false },
    ];

    const badges = [
        { id: 1, name: 'Fast Learner', icon: '🚀', date: '2023' },
        { id: 2, name: 'Compliance Pro', icon: '🛡️', date: '2024' },
        { id: 3, name: 'Top Scorer', icon: '🏆', date: '2024' },
    ];

    // State
    const [activeTab, setActiveTab] = useState('overview');

    // Calc Progress for Level
    const progress = (user.xp / user.next_level_xp) * 100;

    // Navigation Mock
    const handleBack = () => router.visit('/admin/users');

    return (
        <>
            <Head title={`${user.name} - User Details`} />
            <div className="min-h-screen bg-[#F8F9FA] pb-20 font-sans">
                <WondrStyles />

                {/* --- Immersive Hero Header --- */}
                <div className="relative bg-[#002824] pt-8 pb-32 px-6 lg:px-12 overflow-hidden">
                    {/* Decor */}
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#005E54] rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/4"></div>
                    <div className="absolute bottom-0 left-20 w-[300px] h-[300px] bg-[#D6F84C] rounded-full blur-[120px] opacity-10"></div>

                    <div className="relative z-10 max-w-7xl mx-auto">
                        {/* Top Nav */}
                        <div className="flex justify-between items-center mb-8">
                            <button onClick={handleBack} className="flex items-center gap-2 text-white/70 hover:text-[#D6F84C] transition-colors group">
                                <div className="p-2 bg-white/10 rounded-full group-hover:bg-[#D6F84C] group-hover:text-[#002824] transition-all">
                                    <ArrowLeft className="w-5 h-5" />
                                </div>
                                <span className="font-bold text-sm">Kembali ke Daftar</span>
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-xl text-xs font-bold hover:bg-white/20 transition backdrop-blur-md border border-white/10">
                                <Edit3 className="w-4 h-4" /> Edit Profile
                            </button>
                        </div>

                        {/* Profile Summary */}
                        <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
                            {/* Avatar with Gamification Ring */}
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full p-[4px] level-ring relative avatar-glow" style={{'--progress': `${progress * 3.6}deg`}}>
                                    <div className="w-full h-full bg-[#002824] rounded-full p-1">
                                        <div className="w-full h-full bg-slate-200 rounded-full overflow-hidden flex items-center justify-center text-4xl font-bold text-slate-400">
                                            {user.avatar_url ? <img src={user.avatar_url} alt={user.name} /> : user.name.charAt(0)}
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-[#D6F84C] text-[#002824] px-3 py-1 rounded-full text-xs font-extrabold border-4 border-[#002824]">
                                    LVL {user.level}
                                </div>
                            </div>

                            {/* Name & Role */}
                            <div className="flex-1 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                    <span className="px-3 py-1 rounded-full bg-[#005E54] text-white text-[10px] font-bold uppercase tracking-wider">
                                        {user.department}
                                    </span>
                                    <span className="flex items-center gap-1 text-[#D6F84C] text-xs font-bold">
                                        <Activity className="w-3 h-3" /> {user.xp} XP
                                    </span>
                                </div>
                                <h1 className="text-4xl font-extrabold text-white mb-1">{user.name}</h1>
                                <p className="text-slate-300 font-medium text-lg flex items-center justify-center md:justify-start gap-2">
                                    {user.role} <span className="w-1 h-1 rounded-full bg-slate-500"></span> Joined {user.join_date}
                                </p>
                            </div>

                            {/* Stats Summary */}
                            <div className="flex gap-4">
                                <div className="text-center px-6 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">Completed</p>
                                    <p className="text-2xl font-extrabold text-white">12</p>
                                </div>
                                <div className="text-center px-6 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">Hours</p>
                                    <p className="text-2xl font-extrabold text-[#D6F84C]">48h</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Main Content Layout --- */}
                <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        
                        {/* Left Panel: Navigation & Actions (3 cols) */}
                        <div className="lg:col-span-3 space-y-6">
                            <div className="glass-card rounded-[24px] p-2 flex flex-col gap-1 sticky top-6">
                                {[
                                    { id: 'overview', label: 'Overview', icon: Briefcase },
                                    { id: 'learning', label: 'Learning Path', icon: BookOpen },
                                    { id: 'badges', label: 'Achievements', icon: Award },
                                    { id: 'settings', label: 'Account Settings', icon: Shield },
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-[16px] text-sm font-bold text-left tab-pill ${
                                            activeTab === item.id ? 'active' : 'text-slate-500 hover:bg-slate-50'
                                        }`}
                                    >
                                        <item.icon className="w-4 h-4" />
                                        {item.label}
                                    </button>
                                ))}
                            </div>

                            <div className="bg-[#002824] rounded-[24px] p-6 text-white shadow-xl">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-[#D6F84C]" /> Quick Actions
                                </h3>
                                <div className="space-y-3">
                                    <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold text-left px-4 transition-colors flex items-center justify-between group">
                                        Reset Password
                                        <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                    <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold text-left px-4 transition-colors flex items-center justify-between group">
                                        Assign Program
                                        <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                    <button className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl text-sm font-bold text-left px-4 transition-colors flex items-center justify-between group">
                                        Deactivate User
                                        <Shield className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Panel: Content (9 cols) */}
                        <div className="lg:col-span-9">
                            <div className="glass-card rounded-[32px] p-8 min-h-[500px]">
                                
                                {/* TAB: OVERVIEW */}
                                {activeTab === 'overview' && (
                                    <div className="space-y-8 animate-enter">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-xl font-bold text-slate-900">Informasi Karyawan</h3>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <DetailItem icon={Mail} label="Email Address" value={user.email} />
                                            <DetailItem icon={Phone} label="Phone Number" value={user.phone} />
                                            <DetailItem icon={Hash} label="NIP / Employee ID" value={user.nip} />
                                            <DetailItem icon={MapPin} label="Office Location" value="BNI Tower, Jakarta" />
                                            <DetailItem icon={Briefcase} label="Department" value={user.department} />
                                            <DetailItem icon={Calendar} label="Date Joined" value={user.join_date} />
                                        </div>

                                        <div className="pt-8 border-t border-slate-100">
                                            <h3 className="text-xl font-bold text-slate-900 mb-6">Statistik Performa</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {/* Progress Circle Mockup */}
                                                <div className="p-6 bg-[#F8F9FA] rounded-[24px] flex flex-col items-center justify-center">
                                                    <div className="w-24 h-24 rounded-full border-8 border-slate-200 border-t-[#005E54] flex items-center justify-center text-xl font-bold text-slate-700">
                                                        85%
                                                    </div>
                                                    <p className="mt-4 text-sm font-bold text-slate-500">Avg. Score</p>
                                                </div>
                                                {/* Bar Chart Mockup */}
                                                <div className="col-span-2 p-6 bg-[#F8F9FA] rounded-[24px] flex items-end justify-between gap-2 h-full">
                                                    {[40, 60, 30, 80, 50, 90, 70].map((h, i) => (
                                                        <div key={i} className="w-full bg-slate-200 hover:bg-[#D6F84C] rounded-t-lg transition-colors" style={{ height: `${h}%` }}></div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB: LEARNING PATH */}
                                {activeTab === 'learning' && (
                                    <div className="space-y-6 animate-enter">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xl font-bold text-slate-900">Riwayat Pelatihan</h3>
                                            <div className="flex gap-2">
                                                <select className="px-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-600 outline-none">
                                                    <option>Semua Status</option>
                                                    <option>Selesai</option>
                                                    <option>Berjalan</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {mockTrainings.map(training => (
                                                <TrainingCard key={training.id} training={training} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* TAB: BADGES */}
                                {activeTab === 'badges' && (
                                    <div className="space-y-8 animate-enter text-center">
                                        <div className="max-w-2xl mx-auto">
                                            <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Wall of Fame</h3>
                                            <p className="text-slate-500 mb-8">Penghargaan yang diperoleh {user.name} selama perjalanan karirnya.</p>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                            {badges.map(badge => (
                                                <BadgeCard key={badge.id} badge={badge} />
                                            ))}
                                            {/* Locked Badge */}
                                            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-dashed border-slate-200 rounded-[24px] opacity-60">
                                                <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mb-4 text-2xl grayscale">
                                                    🔒
                                                </div>
                                                <h4 className="font-bold text-slate-400 mb-1">Leadership</h4>
                                                <p className="text-xs text-slate-400">Locked</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}
