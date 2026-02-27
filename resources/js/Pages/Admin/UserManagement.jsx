import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import axios from 'axios';
import {
    Users, Plus, Search, Edit3, Trash2,
    AlertCircle, CheckCircle, ChevronLeft, ChevronRight,
    MoreHorizontal, Shield, UserCheck, Upload,
    Lock, Calendar, X, Zap, Mail, Phone,
    FileText, RefreshCw, Briefcase, MapPin, Building,
    Clock, Award, BookOpen
} from 'lucide-react';

// --- Wondr Style System (Memoized) ---
const WondrStyles = React.memo(() => (
    <style>{`
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F8F9FA; color: #1e293b; }
        
        .wondr-dark { background-color: #002824; }
        .wondr-green { color: #005E54; }
        .wondr-lime-bg { background-color: #D6F84C; color: #002824; }
        .wondr-lime-text { color: #D6F84C; }
        
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

        .input-wondr {
            background: #F3F4F6;
            border: 1px solid #E5E7EB;
            border-radius: 10px;
            transition: all 0.3s ease;
        }
        .input-wondr:focus {
            background: #FFFFFF;
            border-color: #005E54;
            box-shadow: 0 0 0 3px rgba(0, 94, 84, 0.05);
            outline: none;
        }

        .card-hover { transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1); }
        .card-hover:hover { transform: translateY(-2px); }

        /* Slide Over Animation */
        .slide-over { transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .slide-over-open { transform: translateX(0); }
        .slide-over-closed { transform: translateX(100%); }

        .animate-fade-up { animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `}</style>
));

// --- Components ---

const StatCard = React.memo(({ label, value, icon: Icon, trend, delay }) => (
    <div 
        className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-sm hover:shadow-md transition-all card-hover"
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className="flex items-start justify-between">
            <div className="flex-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</p>
                <h3 className="text-3xl font-extrabold text-slate-900">{value}</h3>
                {trend && <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full mt-2 inline-block">{trend}</span>}
            </div>
            <div className="p-3 rounded-xl bg-[#E6FFFA] text-[#005E54]">
                <Icon className="w-6 h-6" />
            </div>
        </div>
    </div>
));

const UserAvatar = React.memo(({ name, url }) => (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#005E54] to-[#002824] text-white flex items-center justify-center font-bold shadow-md border-2 border-white">
        {url ? <img src={url} alt={name} className="w-full h-full rounded-full object-cover" /> : name.charAt(0)}
    </div>
));

const StatusBadge = React.memo(({ status }) => {
    const isActive = status === 'active';
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-600' : 'bg-red-600'}`}></span>
            {status === 'active' ? 'Aktif' : 'Nonaktif'}
        </span>
    );
});

const ProgramHistoryCard = React.memo(({ program, onClick }) => {
    const percentage = Math.round((program.correct / program.total_questions) * 100);
    const scorePercentage = Math.round((program.score / program.max_score) * 100);
    
    return (
        <div 
            onClick={onClick}
            className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 hover:border-[#005E54] cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]"
        >
            <div className="flex items-start justify-between mb-3">
                <h4 className="font-bold text-slate-900 text-sm flex-1 line-clamp-1">{program.name}</h4>
                <span className={`ml-2 px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${
                    scorePercentage >= 80 ? 'bg-green-100 text-green-700' :
                    scorePercentage >= 70 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                }`}>
                    {program.score}%
                </span>
            </div>
            <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                    <span className="text-slate-600">Benar/Total:</span>
                    <span className="font-bold text-slate-900">{program.correct}/{program.total_questions}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-slate-600">Waktu:</span>
                    <span className="font-bold text-slate-900">{program.time_spent} menit</span>
                </div>
                <div className="w-full bg-slate-300 rounded-full h-1.5">
                    <div 
                        className="bg-gradient-to-r from-[#005E54] to-[#00A99D] h-1.5 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
});

// Helper function to get relative time
const getRelativeTime = (dateString) => {
    if (!dateString) return 'Tidak diketahui';
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
        return 'Tidak diketahui';
    }
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    
    return date.toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'short', 
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
};

// Helper function to get formatted datetime
const getFormattedDateTime = (dateString) => {
    if (!dateString) return 'Tidak diketahui';
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
        return 'Tidak diketahui';
    }
    
    return date.toLocaleDateString('id-ID', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Helper to determine if user is online
const isUserOnline = (lastLogin) => {
    if (!lastLogin) return false;
    
    const date = new Date(lastLogin);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
        return false;
    }
    
    const now = new Date();
    const diffMins = (now - date) / 60000;
    return diffMins < 5; // Online jika login dalam 5 menit terakhir
};

// --- Main Layout ---

export default function UserManagement({ users: initialUsers, stats: initialStats, filters }) {
    // Fetch real user statistics from API
    const [stats, setStats] = useState(initialStats || {
        total_users: 0,
        active_users: 0,
        inactive_users: 0,
        admin_users: 0,
        new_this_month: 0
    });

    // Fetch real user program history from API
    const [programHistoryCache, setProgramHistoryCache] = useState({});

    // Stats are already provided via Inertia props, no need to fetch
    // useEffect removed - stats initialized from initialStats prop

    // Function to fetch program history on demand
    const fetchProgramHistory = async (userId) => {
        if (programHistoryCache[userId]) {
            return programHistoryCache[userId];
        }

        try {
            const response = await fetch(`/api/admin/users/${userId}/program-history`);
            if (response.ok) {
                const data = await response.json();
                setProgramHistoryCache(prev => ({
                    ...prev,
                    [userId]: data
                }));
                return data;
            }
        } catch (error) {
            console.error('Error fetching program history:', error);
        }
        return [];
    };

    const [users, setUsers] = useState(Array.isArray(initialUsers) ? initialUsers : []);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState('all');
    const [drawerUser, setDrawerUser] = useState(null);
    const [showImport, setShowImport] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editNip, setEditNip] = useState('');
    const [editLocation, setEditLocation] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editDepartment, setEditDepartment] = useState('');
    const [showProgramHistory, setShowProgramHistory] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const searchTimeoutRef = useRef(null);

    // Auto-load program history when drawer opens
    useEffect(() => {
        if (drawerUser?.id) {
            fetchProgramHistory(drawerUser.id);
        }
    }, [drawerUser?.id]);

    // Debounce search input
    useEffect(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        
        searchTimeoutRef.current = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1);
        }, 300);

        return () => clearTimeout(searchTimeoutRef.current);
    }, [searchQuery]);

    // Filter Logic with Pagination
    const ITEMS_PER_PAGE = 10;
    
    const filteredUsers = useMemo(() => {
        const usersArray = Array.isArray(users) ? users : [];
        return usersArray.filter(user => {
            const searchLower = debouncedSearch.toLowerCase();
            const matchesSearch = 
                user.name.toLowerCase().includes(searchLower) || 
                user.email.toLowerCase().includes(searchLower) ||
                (user.nip && user.nip.toLowerCase().includes(searchLower)) ||
                (user.phone && user.phone.toLowerCase().includes(searchLower)) ||
                (user.department && user.department.toLowerCase().includes(searchLower)) ||
                (user.location && user.location.toLowerCase().includes(searchLower)) ||
                (user.role && user.role.toLowerCase().includes(searchLower));
            const matchesRole = selectedRole === 'all' || user.role.toLowerCase() === selectedRole.toLowerCase();
            return matchesSearch && matchesRole;
        });
    }, [users, debouncedSearch, selectedRole]);

    // Paginated users
    const paginatedUsers = useMemo(() => {
        const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredUsers.slice(startIdx, startIdx + ITEMS_PER_PAGE);
    }, [filteredUsers, currentPage]);

    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

    // Handlers
    const handleSelectAll = (e) => {
        if (e.target.checked) setSelectedUsers(paginatedUsers.map(u => u.id));
        else setSelectedUsers([]);
    };

    const handleSelectUser = (id) => {
        if (selectedUsers.includes(id)) setSelectedUsers(selectedUsers.filter(uid => uid !== id));
        else setSelectedUsers([...selectedUsers, id]);
    };

    const handleDelete = async (id) => {
        if(!confirm('Hapus user ini?')) return;
        
        setLoading(true);
        try {
            const response = await fetch(`/api/admin/users/${id}`, {
                method: 'DELETE',
                headers: { 
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content 
                }
            });
            
            if (response.ok) {
                setUsers((Array.isArray(users) ? users : []).filter(u => u.id !== id));
                setDrawerUser(null);
            } else {
                alert('Gagal menghapus user');
            }
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveUser = async () => {
        if (!drawerUser) return;
        
        setLoading(true);
        try {
            const response = await axios.put(
                `/api/admin/users/${drawerUser.id}/info`,
                {
                    nip: editNip,
                    location: editLocation,
                    phone: editPhone,
                    department: editDepartment,
                }
            );
            
            // Update local state
            const updatedUsers = (Array.isArray(users) ? users : []).map(u => 
                u.id === drawerUser.id 
                    ? { ...u, nip: editNip, location: editLocation, phone: editPhone, department: editDepartment }
                    : u
            );
            setUsers(updatedUsers);
            
            // Update drawer user
            setDrawerUser({ 
                ...drawerUser, 
                nip: editNip, 
                office_location: editLocation,
                phone: editPhone,
                department: editDepartment
            });
            
            setEditMode(false);
            alert('User information updated successfully');
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Failed to update user information');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = () => {
        if (drawerUser) {
            setEditNip(drawerUser.nip || '');
            setEditLocation(drawerUser.location || '');
            setEditPhone(drawerUser.phone || '');
            setEditDepartment(drawerUser.department || '');
            setEditMode(true);
        }
    };

    const handleBulkDelete = async () => {
        if(!confirm(`Hapus ${selectedUsers.length} user?`)) return;
        
        setLoading(true);
        try {
            const response = await fetch('/api/admin/users/bulk/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify({ user_ids: selectedUsers })
            });
            
            const result = await response.json();
            if (response.ok) {
                setUsers((Array.isArray(users) ? users : []).filter(u => !selectedUsers.includes(u.id)));
                setSelectedUsers([]);
                alert(`${result.deleted_count || selectedUsers.length} user berhasil dihapus`);
            } else {
                alert('Error: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-[#F8F9FA] pb-20 font-sans overflow-hidden">
                <WondrStyles />

            {/* --- Header Section --- */}
            <div className="px-6 lg:px-12 py-8 bg-white border-b border-slate-100">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-[#005E54] mb-2 font-bold text-xs tracking-widest uppercase">
                            <Users className="w-4 h-4" /> Manajemen
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-2">
                            User Management
                        </h1>
                        <p className="text-slate-600 flex items-center gap-2">
                            Kelola user dan akses sistem HCMS Elearning
                        </p>
                    </div>
                    
                    <div className="flex gap-3 flex-col sm:flex-row">
                        <button 
                            onClick={() => setShowImport(true)}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition text-sm whitespace-nowrap"
                        >
                            <Upload className="w-4 h-4" /> Import CSV
                        </button>
                        <button 
                            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#002824] hover:bg-[#001f1c] text-white rounded-xl font-semibold shadow-md transition text-sm whitespace-nowrap"
                        >
                            <Plus className="w-5 h-5" /> Tambah User
                        </button>
                    </div>
                </div>
            </div>

            {/* --- Floating Stats & Content --- */}
            <div className="max-w-full mx-auto px-6 lg:px-12 py-8 bg-slate-50">
                
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard label="Total User" value={stats.total_users} icon={Users} trend="+12%" delay={0} />
                    <StatCard label="User Aktif" value={stats.active_users} icon={UserCheck} delay={100} />
                    <StatCard label="Administrator" value={stats.admin_users} icon={Shield} delay={200} />
                    <StatCard label="New Users" value={stats.new_this_month} icon={Zap} trend="+5" delay={300} />
                </div>

                {/* Main Content Card */}
                <div className="bg-white rounded-[24px] p-6 lg:p-8 border border-slate-100 shadow-sm animate-fade-up" style={{ animationDelay: '400ms' }}>
                    
                    {/* Toolbar */}
                    <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                        <div className="flex gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar">
                            {['All', 'Admin', 'Employee'].map((role) => (
                                <button
                                    key={role}
                                    onClick={() => setSelectedRole(role.toLowerCase())}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                                        selectedRole === role.toLowerCase() 
                                        ? 'bg-[#002824] text-white shadow-md' 
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full lg:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input 
                                type="text" 
                                placeholder="Cari nama, email, NIP..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 input-wondr font-medium text-slate-700 placeholder-slate-400"
                            />
                        </div>
                    </div>

                    {/* Advanced Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="w-12 px-4 py-3">
                                        <input 
                                            type="checkbox" 
                                            className="wondr-checkbox"
                                            checked={paginatedUsers.length > 0 && paginatedUsers.every(u => selectedUsers.includes(u.id))}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wide">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wide">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wide">NIP</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wide">Lokasi</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wide">Divisi</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wide">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wide">Last Activity</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wide">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedUsers.map((user) => (
                                    <tr key={user.id} className={`border-b border-slate-100 hover:bg-slate-50 transition ${selectedUsers.includes(user.id) ? 'bg-blue-50' : ''}`}>
                                        <td className="px-4 py-3 text-center">
                                            <input 
                                                type="checkbox" 
                                                className="wondr-checkbox"
                                                checked={selectedUsers.includes(user.id)}
                                                onChange={() => handleSelectUser(user.id)}
                                            />
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <UserAvatar name={user.name} />
                                                <div>
                                                    <div className="font-bold text-slate-900 text-sm">{user.name}</div>
                                                    <div className="text-xs text-slate-500">{user.role.toUpperCase()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-sm text-slate-600">{user.email}</td>
                                        <td className="px-6 py-3 text-sm text-slate-600 font-mono">{user.nip || '-'}</td>
                                        <td className="px-6 py-3 text-sm text-slate-600">{user.location || '-'}</td>
                                        <td className="px-6 py-3 text-sm text-slate-600">{user.department || '-'}</td>
                                        <td className="px-6 py-3">
                                            <StatusBadge status={user.status} />
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-start gap-2">
                                                <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${isUserOnline(user.last_login) ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">{getRelativeTime(user.last_login)}</p>
                                                    <p className="text-xs text-slate-500">{user.last_login ? new Date(user.last_login).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Tidak diketahui'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <button 
                                                onClick={() => setDrawerUser(user)}
                                                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-[#005E54] transition-colors"
                                            >
                                                <MoreHorizontal className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination Controls */}
                    {filteredUsers.length > 0 && (
                        <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100">
                            <div className="text-sm font-medium text-slate-600">
                                Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} dari {filteredUsers.length} user
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                                    const page = Math.max(1, currentPage - 2) + i;
                                    if (page > totalPages) return null;
                                    return (
                                        <button 
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
                                                currentPage === page 
                                                    ? 'bg-[#005E54] text-white' 
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {filteredUsers.length === 0 && (
                        <div className="text-center py-12">
                            <Search className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <h3 className="text-lg font-bold text-slate-900">User tidak ditemukan</h3>
                            <p className="text-slate-500 text-sm">Coba ubah kata kunci pencarian atau filter Anda.</p>
                        </div>
                    )}
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

                                {editMode ? (
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Edit Informasi Identitas</h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-600 mb-2">NIP</label>
                                                    <input 
                                                        type="text"
                                                        value={editNip}
                                                        onChange={(e) => setEditNip(e.target.value)}
                                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-[#005E54]"
                                                        placeholder="Masukkan NIP"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-600 mb-2">Lokasi Kantor</label>
                                                    <select 
                                                        value={editLocation}
                                                        onChange={(e) => setEditLocation(e.target.value)}
                                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-[#005E54]"
                                                    >
                                                        <option value="">Pilih Lokasi</option>
                                                        <option value="Head Office">Head Office</option>
                                                        <option value="Palembang">Palembang</option>
                                                        <option value="Manado">Manado</option>
                                                        <option value="Jakarta">Jakarta</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-600 mb-2">No Telepon</label>
                                                    <input 
                                                        type="text"
                                                        value={editPhone}
                                                        onChange={(e) => setEditPhone(e.target.value)}
                                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-[#005E54]"
                                                        placeholder="Masukkan No Telepon"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-600 mb-2">Divisi</label>
                                                    <input 
                                                        type="text"
                                                        value={editDepartment}
                                                        onChange={(e) => setEditDepartment(e.target.value)}
                                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-[#005E54]"
                                                        placeholder="Masukkan Divisi"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Informasi Identitas</h4>
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
                                                    <FileText className="w-5 h-5 text-slate-400" />
                                                    <div>
                                                        <p className="text-xs text-slate-500 font-medium mb-0.5">NIP</p>
                                                        <span className="font-bold text-slate-700 font-mono">{drawerUser.nip}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
                                                    <Building className="w-5 h-5 text-slate-400" />
                                                    <div>
                                                        <p className="text-xs text-slate-500 font-medium mb-0.5">Lokasi Kantor</p>
                                                        <span className="font-bold text-slate-700">{drawerUser.location}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Informasi Kontak</h4>
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
                                                    <Phone className="w-5 h-5 text-slate-400" />
                                                    <div>
                                                        <p className="text-xs text-slate-500 font-medium mb-0.5">No Telepon</p>
                                                        <span className="font-bold text-slate-700">{drawerUser.phone}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
                                                    <Briefcase className="w-5 h-5 text-slate-400" />
                                                    <div>
                                                        <p className="text-xs text-slate-500 font-medium mb-0.5">Divisi</p>
                                                        <span className="font-bold text-slate-700">{drawerUser.department}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Aktivitas Terakhir</h4>
                                            <div className="space-y-3">
                                                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50">
                                                    <div className={`w-3 h-3 rounded-full mt-1.5 ${isUserOnline(drawerUser.last_login) ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                                    <div>
                                                        <p className="text-xs text-slate-500 font-medium mb-1">Terakhir Login</p>
                                                        <p className="font-bold text-slate-700">{getRelativeTime(drawerUser.last_login)}</p>
                                                        <p className="text-xs text-slate-500 mt-1">{getFormattedDateTime(drawerUser.last_login)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
                                                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                        isUserOnline(drawerUser.last_login) 
                                                            ? 'bg-green-100 text-green-700' 
                                                            : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {isUserOnline(drawerUser.last_login) ? '🟢 Online' : '⚫ Offline'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Riwayat Pengerjaan</h4>
                                                <button 
                                                    onClick={() => setShowProgramHistory(true)}
                                                    className="text-xs font-bold text-[#005E54] hover:text-[#003f38] transition"
                                                >
                                                    Lihat Semua →
                                                </button>
                                            </div>
                                            <div className="space-y-2">
                                                {programHistoryCache[drawerUser.id] ? (
                                                    programHistoryCache[drawerUser.id].slice(0, 2).map(program => (
                                                        <ProgramHistoryCard 
                                                            key={program.id}
                                                            program={program}
                                                            onClick={() => {
                                                                setSelectedProgram(program);
                                                                setShowProgramHistory(true);
                                                            }}
                                                        />
                                                    ))
                                                ) : (
                                                    <p className="text-xs text-slate-400 text-center py-4">Belum ada riwayat pengerjaan</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Drawer Footer Actions */}
                            <div className="p-6 border-t border-slate-100 bg-slate-50">
                                {editMode ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={() => setEditMode(false)}
                                            className="py-3 px-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition"
                                        >
                                            Batal
                                        </button>
                                        <button 
                                            onClick={handleSaveUser}
                                            disabled={loading}
                                            className="py-3 px-4 bg-[#005E54] text-white font-bold rounded-xl hover:bg-[#003f38] transition disabled:opacity-50"
                                        >
                                            {loading ? 'Menyimpan...' : 'Simpan'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={handleEditClick}
                                            className="py-3 px-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition flex justify-center items-center gap-2"
                                        >
                                            <Edit3 className="w-4 h-4" /> Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(drawerUser.id)}
                                            className="py-3 px-4 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition flex justify-center items-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" /> Hapus
                                        </button>
                                    </div>
                                )}
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

            {/* --- Program History Modal --- */}
            {showProgramHistory && drawerUser && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-[#002824]/60 backdrop-blur-sm transition-opacity" onClick={() => {
                        setShowProgramHistory(false);
                        setSelectedProgram(null);
                    }}></div>
                    <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-up">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-[#002824] to-[#005E54] p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-white/10 rounded-full blur-[60px]"></div>
                            <div className="relative z-10 flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-extrabold text-white mb-2">Riwayat Pengerjaan</h2>
                                    <p className="text-[#D6F84C] font-semibold">{drawerUser.name}</p>
                                </div>
                                <button 
                                    onClick={() => {
                                        setShowProgramHistory(false);
                                        setSelectedProgram(null);
                                    }}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-8">
                            {selectedProgram ? (
                                // Detail View
                                <div className="space-y-6">
                                    <button 
                                        onClick={() => setSelectedProgram(null)}
                                        className="text-sm font-bold text-[#005E54] hover:text-[#003f38] flex items-center gap-2 mb-6"
                                    >
                                        ← Kembali
                                    </button>

                                    {/* Program Title & Score */}
                                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl p-8 border border-slate-200">
                                        <h3 className="text-2xl font-extrabold text-slate-900 mb-4">{selectedProgram.name}</h3>
                                        
                                        <div className="grid grid-cols-3 gap-6">
                                            {/* Score */}
                                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nilai</span>
                                                    <Award className="w-5 h-5 text-yellow-500" />
                                                </div>
                                                <div className="flex items-baseline gap-2">
                                                    <h4 className="text-3xl font-extrabold text-slate-900">{selectedProgram.score}</h4>
                                                    <span className="text-sm text-slate-500">/ {selectedProgram.max_score}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-3 font-medium">
                                                    {Math.round((selectedProgram.score / selectedProgram.max_score) * 100)}% dari total
                                                </p>
                                            </div>

                                            {/* Time Spent */}
                                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Waktu</span>
                                                    <Clock className="w-5 h-5 text-blue-500" />
                                                </div>
                                                <div className="flex items-baseline gap-2">
                                                    <h4 className="text-3xl font-extrabold text-slate-900">{selectedProgram.time_spent}</h4>
                                                    <span className="text-sm text-slate-500">menit</span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-3 font-medium">
                                                    {Math.floor(selectedProgram.time_spent / 60)}h {selectedProgram.time_spent % 60}m
                                                </p>
                                            </div>

                                            {/* Completed Date */}
                                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</span>
                                                    <Calendar className="w-5 h-5 text-green-500" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-900">
                                                    {new Date(selectedProgram.completed_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-3 font-medium">
                                                    {getRelativeTime(selectedProgram.completed_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Questions Breakdown */}
                                    <div>
                                        <h4 className="text-lg font-extrabold text-slate-900 mb-6">Analisis Soal</h4>
                                        
                                        <div className="grid grid-cols-2 gap-6">
                                            {/* Correct */}
                                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">Jawaban Benar</p>
                                                        <div className="flex items-baseline gap-2">
                                                            <h3 className="text-4xl font-extrabold text-green-700">{selectedProgram.correct}</h3>
                                                            <span className="text-sm text-green-600 font-semibold">soal</span>
                                                        </div>
                                                    </div>
                                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-green-200">
                                                        <CheckCircle className="w-8 h-8 text-green-600" />
                                                    </div>
                                                </div>
                                                <div className="w-full bg-green-200 rounded-full h-2">
                                                    <div 
                                                        className="bg-green-600 h-2 rounded-full transition-all"
                                                        style={{ width: `${Math.round((selectedProgram.correct / selectedProgram.total_questions) * 100)}%` }}
                                                    ></div>
                                                </div>
                                                <p className="text-xs text-green-600 font-bold mt-3">
                                                    {Math.round((selectedProgram.correct / selectedProgram.total_questions) * 100)}% dari total soal
                                                </p>
                                            </div>

                                            {/* Incorrect */}
                                            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-red-200">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Jawaban Salah</p>
                                                        <div className="flex items-baseline gap-2">
                                                            <h3 className="text-4xl font-extrabold text-red-700">{selectedProgram.incorrect}</h3>
                                                            <span className="text-sm text-red-600 font-semibold">soal</span>
                                                        </div>
                                                    </div>
                                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-red-200">
                                                        <AlertCircle className="w-8 h-8 text-red-600" />
                                                    </div>
                                                </div>
                                                <div className="w-full bg-red-200 rounded-full h-2">
                                                    <div 
                                                        className="bg-red-600 h-2 rounded-full transition-all"
                                                        style={{ width: `${Math.round((selectedProgram.incorrect / selectedProgram.total_questions) * 100)}%` }}
                                                    ></div>
                                                </div>
                                                <p className="text-xs text-red-600 font-bold mt-3">
                                                    {Math.round((selectedProgram.incorrect / selectedProgram.total_questions) * 100)}% dari total soal
                                                </p>
                                            </div>
                                        </div>

                                        {/* Summary Statistics */}
                                        <div className="mt-6 bg-slate-50 rounded-2xl p-6 border border-slate-200">
                                            <h5 className="font-bold text-slate-900 mb-4">Ringkasan</h5>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="text-center">
                                                    <p className="text-xs text-slate-600 font-bold uppercase mb-2">Total Soal</p>
                                                    <p className="text-2xl font-extrabold text-slate-900">{selectedProgram.total_questions}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs text-slate-600 font-bold uppercase mb-2">Tingkat Keberhasilan</p>
                                                    <p className="text-2xl font-extrabold text-green-600">
                                                        {Math.round((selectedProgram.correct / selectedProgram.total_questions) * 100)}%
                                                    </p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs text-slate-600 font-bold uppercase mb-2">Rata-rata Waktu</p>
                                                    <p className="text-2xl font-extrabold text-blue-600">
                                                        {Math.round(selectedProgram.time_spent / selectedProgram.total_questions)}m
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // List View
                                <div className="space-y-4">
                                    {programHistoryCache[drawerUser.id] && programHistoryCache[drawerUser.id].length > 0 ? (
                                        programHistoryCache[drawerUser.id].map(program => (
                                            <div 
                                                key={program.id}
                                                onClick={() => setSelectedProgram(program)}
                                                className="p-6 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-[#005E54] cursor-pointer transition-all hover:shadow-md"
                                            >
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-slate-900 text-lg mb-2">{program.name}</h4>
                                                        <div className="flex items-center gap-6 text-sm">
                                                            <span className="text-slate-600">
                                                                <span className="font-bold text-slate-900">{program.correct}</span>/{program.total_questions} Benar
                                                            </span>
                                                            <span className="text-slate-600">
                                                                Waktu: <span className="font-bold text-slate-900">{program.time_spent} menit</span>
                                                            </span>
                                                            <span className="text-slate-600">
                                                                {new Date(program.completed_at).toLocaleDateString('id-ID')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`px-4 py-2 rounded-xl font-bold text-lg ${
                                                            program.score >= 80 ? 'bg-green-100 text-green-700' :
                                                            program.score >= 70 ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                            {program.score}%
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-4 w-full bg-slate-300 rounded-full h-2">
                                                    <div 
                                                        className="bg-gradient-to-r from-[#005E54] to-[#00A99D] h-2 rounded-full transition-all"
                                                        style={{ width: `${Math.round((program.correct / program.total_questions) * 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12">
                                            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                            <p className="text-slate-500 font-semibold">Belum ada riwayat pengerjaan</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    </AdminLayout>
    );
}
