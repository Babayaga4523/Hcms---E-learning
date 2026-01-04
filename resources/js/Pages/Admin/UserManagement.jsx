import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Users, Plus, Search, Filter, Edit3, Trash2, Download,
    AlertCircle, CheckCircle, ChevronLeft, ChevronRight,
    MoreHorizontal, Shield, UserCheck, UserX, Upload,
    Eye, Lock, Calendar, ArrowUpDown, X, Zap, Mail, Phone,
    FileText, RefreshCw, Briefcase
} from 'lucide-react';

// --- Wondr Style System ---
const WondrStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F8F9FA; color: #1e293b; }
        
        .wondr-dark { background-color: #002824; }
        .wondr-green { color: #005E54; }
        .wondr-lime-bg { background-color: #D6F84C; color: #002824; }
        .wondr-lime-text { color: #D6F84C; }
        
        /* Glass & Floating Effects */
        .glass-panel {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.6);
            box-shadow: 0 10px 40px -10px rgba(0, 40, 36, 0.08);
        }

        /* Table Styling */
        .table-spacing { border-collapse: separate; border-spacing: 0 8px; }
        .row-card {
            background: white;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .row-card:hover {
            transform: scale(1.005);
            box-shadow: 0 10px 20px -5px rgba(0, 94, 84, 0.1);
            border-left: 4px solid #005E54;
        }
        .row-card td:first-child { border-top-left-radius: 12px; border-bottom-left-radius: 12px; }
        .row-card td:last-child { border-top-right-radius: 12px; border-bottom-right-radius: 12px; }

        /* Custom Inputs */
        .input-wondr {
            background: #F1F5F9;
            border: 1px solid transparent;
            border-radius: 12px;
            transition: all 0.3s ease;
        }
        .input-wondr:focus {
            background: #FFFFFF;
            border-color: #005E54;
            box-shadow: 0 0 0 4px rgba(0, 94, 84, 0.1);
            outline: none;
        }

        /* Slide Over Animation */
        .slide-over { transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .slide-over-open { transform: translateX(0); }
        .slide-over-closed { transform: translateX(100%); }

        /* Custom Checkbox */
        .wondr-checkbox {
            appearance: none;
            width: 1.25em;
            height: 1.25em;
            border: 2px solid #CBD5E1;
            border-radius: 6px;
            display: grid;
            place-content: center;
            transition: all 0.2s;
            cursor: pointer;
        }
        .wondr-checkbox::before {
            content: "";
            width: 0.65em;
            height: 0.65em;
            transform: scale(0);
            transition: 120ms transform ease-in-out;
            box-shadow: inset 1em 1em white;
            background-color: white;
            transform-origin: center;
            clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
        }
        .wondr-checkbox:checked { background-color: #005E54; border-color: #005E54; }
        .wondr-checkbox:checked::before { transform: scale(1); }

        .animate-fade-up { animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `}</style>
);

// --- Components ---

const StatCard = ({ label, value, icon: Icon, trend, delay }) => (
    <div 
        className="glass-panel p-5 rounded-[24px] flex items-center justify-between animate-fade-up"
        style={{ animationDelay: `${delay}ms` }}
    >
        <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
            <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-extrabold text-slate-900">{value}</h3>
                {trend && <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">{trend}</span>}
            </div>
        </div>
        <div className="p-3 rounded-2xl bg-[#E6FFFA] text-[#005E54]">
            <Icon className="w-6 h-6" />
        </div>
    </div>
);

const UserAvatar = ({ name, url }) => (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#005E54] to-[#002824] text-white flex items-center justify-center font-bold shadow-md border-2 border-white">
        {url ? <img src={url} alt={name} className="w-full h-full rounded-full object-cover" /> : name.charAt(0)}
    </div>
);

const StatusBadge = ({ status }) => {
    const isActive = status === 'active';
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-600' : 'bg-red-600'}`}></span>
            {status === 'active' ? 'Aktif' : 'Nonaktif'}
        </span>
    );
};

// --- Main Layout ---

export default function UserManagement({ users: initialUsers, stats: initialStats, filters }) {
    // Mock Data Generator (Safety Fallback)
    const mockUsers = (initialUsers && initialUsers.data) ? initialUsers.data : Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: ['Sarah Wijaya', 'Budi Santoso', 'Dewi Putri', 'Andi Pratama', 'Eko Patrio'][i % 5] + ` ${i+1}`,
        email: `user${i+1}@bni.co.id`,
        role: i % 5 === 0 ? 'Admin' : 'Employee',
        status: i % 4 === 3 ? 'inactive' : 'active',
        department: ['IT', 'HR', 'Finance', 'Marketing'][i % 4],
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        phone: '08123456789'
    }));

    const mockStats = initialStats || {
        total_users: 1250,
        active_users: 1180,
        admin_users: 12,
        new_this_month: 45
    };

    // State
    const [users, setUsers] = useState(mockUsers);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState('all');
    const [drawerUser, setDrawerUser] = useState(null); // For slide-over
    const [showImport, setShowImport] = useState(false);
    const [loading, setLoading] = useState(false);

    // Filter Logic
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  user.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = selectedRole === 'all' || user.role.toLowerCase() === selectedRole.toLowerCase();
            return matchesSearch && matchesRole;
        });
    }, [users, searchQuery, selectedRole]);

    // Handlers
    const handleSelectAll = (e) => {
        if (e.target.checked) setSelectedUsers(filteredUsers.map(u => u.id));
        else setSelectedUsers([]);
    };

    const handleSelectUser = (id) => {
        if (selectedUsers.includes(id)) setSelectedUsers(selectedUsers.filter(uid => uid !== id));
        else setSelectedUsers([...selectedUsers, id]);
    };

    const handleDelete = (id) => {
        if(confirm('Hapus user ini?')) {
            setUsers(users.filter(u => u.id !== id));
            setDrawerUser(null);
        }
    };

    const handleBulkDelete = () => {
        if(confirm(`Hapus ${selectedUsers.length} user?`)) {
            setUsers(users.filter(u => !selectedUsers.includes(u.id)));
            setSelectedUsers([]);
        }
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-[#F8F9FA] pb-20 font-sans overflow-hidden">
                <WondrStyles />

            {/* --- Hero Header --- */}
            <div className="bg-[#002824] pt-8 pb-36 px-6 lg:px-12 relative">
                {/* Abstract Background */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#005E54] rounded-full blur-[120px] opacity-20 -translate-y-1/2 translate-x-1/4"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#D6F84C] rounded-full blur-[150px] opacity-10 translate-y-1/3"></div>

                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-2 text-[#D6F84C] mb-2 font-bold text-xs tracking-widest uppercase">
                            <Users className="w-4 h-4" /> People Operations
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight">
                            User Management <br /> System
                        </h1>
                    </div>
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowImport(true)}
                            className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold backdrop-blur-md transition border border-white/10"
                        >
                            <Upload className="w-4 h-4" /> Import CSV
                        </button>
                        <button 
                            className="flex items-center gap-2 px-6 py-3 bg-[#D6F84C] hover:bg-[#c2e43c] text-[#002824] rounded-2xl font-bold shadow-lg shadow-[#D6F84C]/20 transition hover:scale-105"
                        >
                            <Plus className="w-5 h-5" /> Tambah User
                        </button>
                    </div>
                </div>
            </div>

            {/* --- Floating Stats & Content --- */}
            <div className="max-w-7xl mx-auto px-6 -mt-24 relative z-20">
                
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard label="Total User" value={mockStats.total_users} icon={Users} trend="+12%" delay={0} />
                    <StatCard label="User Aktif" value={mockStats.active_users} icon={UserCheck} delay={100} />
                    <StatCard label="Administrator" value={mockStats.admin_users} icon={Shield} delay={200} />
                    <StatCard label="New Users" value={mockStats.new_this_month} icon={Zap} trend="+5" delay={300} />
                </div>

                {/* Main Content Card */}
                <div className="glass-panel rounded-[32px] p-6 lg:p-8 min-h-[600px] animate-fade-up" style={{ animationDelay: '400ms' }}>
                    
                    {/* Toolbar */}
                    <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-8">
                        <div className="flex gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar pb-2 lg:pb-0">
                            {['All', 'Admin', 'Employee'].map((role) => (
                                <button
                                    key={role}
                                    onClick={() => setSelectedRole(role.toLowerCase())}
                                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                                        selectedRole === role.toLowerCase() 
                                        ? 'bg-[#002824] text-[#D6F84C] shadow-lg' 
                                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                    }`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full lg:w-80 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#005E54] transition-colors w-5 h-5" />
                            <input 
                                type="text" 
                                placeholder="Cari nama, email, NIP..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 input-wondr font-bold text-slate-700"
                            />
                        </div>
                    </div>

                    {/* Advanced Table */}
                    <div className="overflow-x-auto pb-24">
                        <table className="w-full table-spacing">
                            <thead>
                                <tr>
                                    <th className="w-12 px-4">
                                        <input 
                                            type="checkbox" 
                                            className="wondr-checkbox"
                                            checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">User Profile</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Role & Dept</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Last Activity</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className={`row-card group ${selectedUsers.includes(user.id) ? 'bg-[#F0FDF4] ring-1 ring-[#005E54]' : ''}`}>
                                        <td className="px-4 py-4 text-center">
                                            <input 
                                                type="checkbox" 
                                                className="wondr-checkbox"
                                                checked={selectedUsers.includes(user.id)}
                                                onChange={() => handleSelectUser(user.id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <UserAvatar name={user.name} />
                                                <div>
                                                    <div className="font-bold text-slate-900 group-hover:text-[#005E54] transition-colors">{user.name}</div>
                                                    <div className="text-xs text-slate-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700">{user.department}</span>
                                                <span className="text-xs text-slate-500">{user.role}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={user.status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                                {new Date(user.last_login).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => setDrawerUser(user)}
                                                className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-[#005E54] transition-colors"
                                            >
                                                <MoreHorizontal className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {filteredUsers.length === 0 && (
                            <div className="text-center py-20">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                    <Search className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">User tidak ditemukan</h3>
                                <p className="text-slate-500">Coba ubah kata kunci pencarian atau filter Anda.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- Floating Bulk Action Bar --- */}
            <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-[#002824] text-white px-6 py-4 rounded-[24px] shadow-2xl z-40 flex items-center gap-6 w-[90%] max-w-2xl border border-[#D6F84C]/20 transition-all duration-300 ${selectedUsers.length > 0 ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'}`}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#D6F84C] flex items-center justify-center text-[#002824] font-bold">
                        {selectedUsers.length}
                    </div>
                    <span className="font-semibold text-sm">User Dipilih</span>
                </div>
                
                <div className="h-8 w-[1px] bg-white/20"></div>

                <div className="flex items-center gap-2 flex-1 justify-end">
                    <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-xl transition-colors text-sm font-bold text-white">
                        <RefreshCw className="w-4 h-4 text-[#D6F84C]" /> Reset Password
                    </button>
                    <button 
                        onClick={handleBulkDelete}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors text-sm font-bold border border-red-500/20"
                    >
                        <Trash2 className="w-4 h-4" /> Hapus
                    </button>
                    <button 
                        onClick={() => setSelectedUsers([])}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors ml-2"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* --- Slide-Over Drawer (Inspector) --- */}
            <div className={`fixed inset-0 z-50 pointer-events-none ${drawerUser ? 'bg-[#002824]/40 backdrop-blur-sm pointer-events-auto' : ''} transition-colors duration-300`}>
                <div className={`absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl slide-over ${drawerUser ? 'slide-over-open' : 'slide-over-closed'} flex flex-col`}>
                    {drawerUser && (
                        <>
                            {/* Drawer Header */}
                            <div className="bg-[#002824] p-8 pb-16 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-[#005E54] rounded-full blur-[60px] opacity-30"></div>
                                <div className="relative z-10 flex justify-between items-start">
                                    <h2 className="text-2xl font-extrabold text-white">User Detail</h2>
                                    <button 
                                        onClick={() => setDrawerUser(null)}
                                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="absolute -bottom-10 left-8 flex items-end">
                                    <div className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
                                        <UserAvatar name={drawerUser.name} />
                                    </div>
                                </div>
                            </div>

                            {/* Drawer Content */}
                            <div className="flex-1 overflow-y-auto p-8 pt-12">
                                <div className="mb-6">
                                    <h3 className="text-2xl font-bold text-slate-900">{drawerUser.name}</h3>
                                    <p className="text-slate-500 font-medium">{drawerUser.email}</p>
                                    <div className="flex gap-2 mt-3">
                                        <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">{drawerUser.role}</span>
                                        <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">{drawerUser.department}</span>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Informasi Kontak</h4>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
                                                <Phone className="w-5 h-5 text-slate-400" />
                                                <span className="font-bold text-slate-700">{drawerUser.phone}</span>
                                            </div>
                                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
                                                <Briefcase className="w-5 h-5 text-slate-400" />
                                                <span className="font-bold text-slate-700">{drawerUser.department}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Aktivitas Terakhir</h4>
                                        <div className="flex items-center gap-3 text-sm text-slate-600">
                                            <Calendar className="w-4 h-4" />
                                            Login: <span className="font-bold">{new Date(drawerUser.last_login).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Drawer Footer Actions */}
                            <div className="p-6 border-t border-slate-100 bg-slate-50">
                                <div className="grid grid-cols-2 gap-4">
                                    <button className="py-3 px-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition flex justify-center items-center gap-2">
                                        <Edit3 className="w-4 h-4" /> Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(drawerUser.id)}
                                        className="py-3 px-4 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition flex justify-center items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" /> Hapus
                                    </button>
                                </div>
                                <button className="w-full mt-3 py-3 px-4 bg-[#002824] text-[#D6F84C] font-bold rounded-xl hover:scale-[1.02] transition-transform flex justify-center items-center gap-2">
                                    <Lock className="w-4 h-4" /> Reset Password
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* --- Import Modal --- */}
            {showImport && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-[#002824]/60 backdrop-blur-sm transition-opacity" onClick={() => setShowImport(false)}></div>
                    <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-lg p-8 animate-fade-up">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-extrabold text-[#005E54]">Import User</h2>
                            <button onClick={() => setShowImport(false)} className="p-2 bg-slate-50 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#005E54] hover:bg-[#F0FDF4] transition-all group">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <FileText className="w-8 h-8 text-slate-400 group-hover:text-[#005E54]" />
                            </div>
                            <p className="font-bold text-slate-700">Klik untuk upload file CSV</p>
                            <p className="text-xs text-slate-400 mt-2">Format: Nama, Email, Role, Dept</p>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setShowImport(false)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition">Batal</button>
                            <button className="flex-1 py-3 bg-[#002824] text-[#D6F84C] font-bold rounded-xl shadow-lg hover:scale-105 transition-transform">
                                Proses Import
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    </AdminLayout>
    );
}
