import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import axios from 'axios';
import {
    Users, Plus, Search, Edit3, Trash2,
    AlertCircle, CheckCircle, ChevronLeft, ChevronRight,
    MoreHorizontal, Shield, UserCheck, Upload,
    MapPin, Smartphone, Mail, X, Briefcase
} from 'lucide-react';

// --- STYLES & ASSETS (Lightweight CSS-in-JS) ---
const styles = `
    .input-focus {
        background: #FFFFFF;
        border-color: #005E54;
        box-shadow: 0 0 0 3px rgba(0, 94, 84, 0.05);
        outline: none;
    }

    .card-hover { 
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); 
    }
    .card-hover:hover { 
        transform: translateY(-2px); 
    }
`;

// --- SUB-COMPONENTS (Memoized for Performance) ---

const StatCard = React.memo(({ label, value, icon: Icon }) => (
    <div className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-sm hover:shadow-md transition-all card-hover">
        <div className="flex items-start justify-between">
            <div className="flex-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</p>
                <h3 className="text-3xl font-extrabold text-slate-900">{value}</h3>
            </div>
            <div className="p-3 rounded-xl bg-[#E6FFFA] text-[#005E54]">
                <Icon className="w-6 h-6" />
            </div>
        </div>
    </div>
));

const UserAvatar = React.memo(({ name }) => (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#005E54] to-[#002824] text-white flex items-center justify-center font-bold shadow-md">
        {name.charAt(0).toUpperCase()}
    </div>
));

const StatusBadge = React.memo(({ status }) => (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
        status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}>
        <span className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-green-600' : 'bg-red-600'}`}></span>
        {status === 'active' ? 'Aktif' : 'Nonaktif'}
    </span>
));

// Helper functions
const getRelativeTime = (dateString) => {
    if (!dateString) return 'Tidak diketahui';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Tidak diketahui';
    
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

const isUserOnline = (lastLogin) => {
    if (!lastLogin) return false;
    const date = new Date(lastLogin);
    if (isNaN(date.getTime())) return false;
    const now = new Date();
    const diffMins = (now - date) / 60000;
    return diffMins < 5;
};

// --- Main Component ---

export default function UserManagementLight({ users: initialUsers, stats: initialStats, departments: initialDepartments = [] }) {
    // Initialize stats and users from backend props
    const [stats] = useState(initialStats || {
        total_users: 0,
        active_users: 0,
        inactive_users: 0,
        admin_users: 0
    });

    const [users, setUsers] = useState(Array.isArray(initialUsers) ? initialUsers : []);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState('all');
    const [drawerUser, setDrawerUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createFormData, setCreateFormData] = useState({ name: '', email: '', password: '', role: 'user', status: 'active', nip: '', location: '', department: '' });
    const [importLoading, setImportLoading] = useState(false);
    const [emailTaken, setEmailTaken] = useState(false);
    const [emailCheckLoading, setEmailCheckLoading] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const fileInputRef = useRef(null);
    const searchTimeoutRef = useRef(null);

    // Debounce Logic
    useEffect(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1);
        }, 300);
        return () => clearTimeout(searchTimeoutRef.current);
    }, [searchQuery]);

    // Track changes in edit mode
    useEffect(() => {
        if (editMode && drawerUser) {
            const hasAnyChange = 
                editData.nip !== (drawerUser.nip || '') ||
                editData.phone !== (drawerUser.phone || '') ||
                editData.location !== (drawerUser.location || '') ||
                editData.department !== (drawerUser.department || '');
            setHasChanges(hasAnyChange);
        }
    }, [editData, editMode, drawerUser]);

    // Filtering Logic
    const filteredUsers = useMemo(() => {
        const usersArray = Array.isArray(users) ? users : [];
        return usersArray.filter(user => {
            const searchLower = debouncedSearch.toLowerCase();
            const matchesSearch = 
                user.name.toLowerCase().includes(searchLower) || 
                user.email.toLowerCase().includes(searchLower) ||
                (user.nip?.toLowerCase().includes(searchLower));
            const matchesRole = selectedRole === 'all' || user.role.toLowerCase() === selectedRole;
            return matchesSearch && matchesRole;
        });
    }, [users, debouncedSearch, selectedRole]);

    // Pagination Logic
    const ITEMS_PER_PAGE = 25;
    const paginatedUsers = useMemo(() => {
        const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredUsers.slice(startIdx, startIdx + ITEMS_PER_PAGE);
    }, [filteredUsers, currentPage]);
    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

    // Handlers
    const handleDelete = useCallback(async (id) => {
        if (!confirm('Hapus user ini?')) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/admin/users/${id}`, {
                method: 'DELETE',
                headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') }
            });
            if (response.ok) {
                setUsers(prev => prev.filter(u => u.id !== id));
                setDrawerUser(null);
            }
        } catch (error) {
            console.error('Error deleting user:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSaveUser = useCallback(async () => {
        if (!drawerUser) return;
        setLoading(true);
        try {
            const response = await axios.put(`/api/admin/users/${drawerUser.id}/info`, editData);
            if (response.ok || response.status === 200) {
                setUsers(prev => prev.map(u => u.id === drawerUser.id ? { ...u, ...editData } : u));
                setDrawerUser(prev => ({ ...prev, ...editData }));
                setEditMode(false);
            }
        } catch (error) {
            console.error('Error saving user:', error);
        } finally {
            setLoading(false);
        }
    }, [drawerUser, editData]);

    const handleToggleStatus = useCallback(async (userId, currentStatus) => {
        if (!confirm(`Yakin ingin ${currentStatus === 'active' ? 'menonaktifkan' : 'mengaktifkan'} user ini?`)) return;
        
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        const oldStatus = currentStatus;
        
        // Optimistic update
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
        if (drawerUser?.id === userId) {
            setDrawerUser(prev => ({ ...prev, status: newStatus }));
        }
        
        setLoading(true);
        try {
            const response = await axios.put(`/api/admin/users/${userId}/status`, { status: newStatus });
            if (response.ok || response.status === 200) {
                // Success - optimistic update already applied
            }
        } catch (error) {
            console.error('Error toggling status:', error);
            // Rollback on error
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: oldStatus } : u));
            if (drawerUser?.id === userId) {
                setDrawerUser(prev => ({ ...prev, status: oldStatus }));
            }
            alert('Gagal mengubah status user');
        } finally {
            setLoading(false);
        }
    }, [drawerUser]);

    const handleCreateUser = useCallback(async () => {
        if (!createFormData.name || !createFormData.email || !createFormData.password) {
            alert('Semua field harus diisi');
            return;
        }

        if (emailTaken) {
            alert('❌ Email sudah terdaftar. Gunakan email lain.');
            return;
        }
        
        if (createFormData.password.length < 8) {
            alert('❌ Password minimal 8 karakter');
            return;
        }

        // Validate password requirements
        if (!/[A-Z]/.test(createFormData.password)) {
            alert('❌ Password harus mengandung huruf besar (A-Z)');
            return;
        }
        if (!/[a-z]/.test(createFormData.password)) {
            alert('❌ Password harus mengandung huruf kecil (a-z)');
            return;
        }
        if (!/[0-9]/.test(createFormData.password)) {
            alert('❌ Password harus mengandung angka (0-9)');
            return;
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(createFormData.password)) {
            alert('❌ Password harus mengandung special character (!@#$%^&*...)');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post('/api/admin/users', createFormData);
            if (response.status === 201 || response.data.success) {
                setUsers(prev => [...prev, response.data.user]);
                setShowCreateModal(false);
                setCreateFormData({ name: '', email: '', password: '', role: 'user', status: 'active', nip: '', location: '', department: '' });
                setEmailTaken(false);
                alert('✅ User berhasil dibuat');
            }
        } catch (error) {
            console.error('Error creating user:', error);
            const errorMsg = error.response?.data?.messages || error.response?.data?.error || 'Gagal membuat user';
            alert(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
        } finally {
            setLoading(false);
        }
    }, [createFormData, emailTaken]);

    const handleImportCSV = useCallback(async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // File type validation
        if (!file.name.endsWith('.csv') && file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
            alert('❌ Hanya file CSV yang diizinkan');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        // File size validation (max 1MB)
        const maxSize = 1 * 1024 * 1024; // 1MB
        if (file.size > maxSize) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
            alert(`❌ Ukuran file terlalu besar: ${sizeMB}MB (maksimal 1MB)`);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setImportLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('/api/admin/users/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            if (response.data.success) {
                alert(`✅ Import berhasil: ${response.data.imported} user ditambahkan`);
                // Reload users from server
                window.location.reload();
            } else {
                const errorMsg = response.data.error_details?.join('\n') || response.data.message || 'Import gagal';
                alert(errorMsg);
            }
        } catch (error) {
            console.error('Error importing CSV:', error);
            const errorMsg = error.response?.data?.message || 'Gagal mengimport CSV';
            alert(errorMsg);
        } finally {
            setImportLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, []);


    const handleEmailChange = useCallback(async (email) => {
        setCreateFormData(prev => ({ ...prev, email }));
        
        // Only check if email has @ and .
        if (!email.includes('@') || !email.includes('.')) {
            setEmailTaken(false);
            return;
        }

        setEmailCheckLoading(true);
        try {
            const response = await axios.post('/api/admin/users/check-email', { email });
            setEmailTaken(response.data.exists || false);
        } catch (error) {
            console.error('Error checking email:', error);
            setEmailTaken(false);
        } finally {
            setEmailCheckLoading(false);
        }
    }, []);

    const openDrawer = (user) => {
        setDrawerUser(user);
        setEditMode(false);
        setHasChanges(false);
        setEditData({
            nip: user.nip || '',
            phone: user.phone || '',
            location: user.location || '',
            department: user.department || ''
        });
    };

    const handleDrawerClose = useCallback(() => {
        if (editMode && hasChanges) {
            if (confirm('Ada perubahan yang belum disimpan. Tutup tanpa menyimpan?')) {
                setDrawerUser(null);
                setEditMode(false);
                setHasChanges(false);
            }
        } else {
            setDrawerUser(null);
            setEditMode(false);
            setHasChanges(false);
        }
    }, [editMode, hasChanges]);

    return (
        <AdminLayout>
            <style>{styles}</style>
            <div className="min-h-screen bg-slate-50">
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
                            <p className="text-slate-600">
                                Kelola user dan akses sistem HCMS Elearning
                            </p>
                        </div>
                        
                        <div className="flex gap-3 flex-col sm:flex-row">
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={importLoading}
                                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl font-semibold transition text-sm whitespace-nowrap"
                            >
                                <Upload className="w-4 h-4" /> {importLoading ? 'Importing...' : 'Import CSV'}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.txt"
                                onChange={handleImportCSV}
                                className="hidden"
                            />
                            <button 
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#002824] hover:bg-[#001f1c] text-white rounded-xl font-semibold shadow-md transition text-sm whitespace-nowrap"
                            >
                                <Plus className="w-5 h-5" /> Tambah User
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- Stats & Content --- */}
                <div className="max-w-full mx-auto px-6 lg:px-12 py-8">
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatCard label="Total User" value={stats.total_users} icon={Users} />
                        <StatCard label="User Aktif" value={stats.active_users} icon={UserCheck} />
                        <StatCard label="Administrator" value={stats.admin_users} icon={Shield} />
                        <StatCard label="Nonaktif" value={stats.inactive_users} icon={AlertCircle} />
                    </div>

                    {/* Main Content Card */}
                    <div className="bg-white rounded-[24px] p-6 lg:p-8 border border-slate-100 shadow-sm">
                        
                        {/* Toolbar */}
                        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                            <div className="flex gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar">
                                {['all', 'admin', 'employee'].map((role) => (
                                    <button
                                        key={role}
                                        onClick={() => { setSelectedRole(role); setCurrentPage(1); }}
                                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                                            selectedRole === role 
                                            ? 'bg-[#002824] text-white shadow-md' 
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        {role === 'all' ? 'Semua' : role === 'admin' ? 'Admin' : 'Karyawan'}
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
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:input-focus placeholder-slate-400"
                                />
                            </div>
                        </div>

                        {/* Table */}
                        <div className="w-full overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/50">
                                        <th className="px-4 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wide min-w-max">User</th>
                                        <th className="px-4 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wide">{''}</th>
                                        <th className="px-4 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wide">NIP</th>
                                        <th className="px-4 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wide">Lokasi</th>
                                        <th className="px-4 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wide">Role</th>
                                        <th className="px-4 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wide">Divisi</th>
                                        <th className="px-4 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wide">Terakhir Aktif</th>
                                        <th className="px-4 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wide">Status</th>
                                        <th className="px-4 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wide">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedUsers.map((user) => (
                                        <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <UserAvatar name={user.name} />
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-slate-900 truncate">{user.name}</div>
                                                        <div className="text-xs text-slate-500 mt-0.5 truncate">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3"></td>
                                            <td className="px-4 py-3 text-xs text-slate-600 font-mono">{user.nip || '-'}</td>
                                            <td className="px-4 py-3 text-xs text-slate-600">{user.location || '-'}</td>
                                            <td className="px-4 py-3 text-xs text-slate-700 font-semibold uppercase">{user.role}</td>
                                            <td className="px-4 py-3 text-xs text-slate-600">{user.department || '-'}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-start gap-1">
                                                    <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${isUserOnline(user.last_login) ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-slate-900">{getRelativeTime(user.last_login)}</p>
                                                        <p className="text-xs text-slate-500 truncate">{user.last_login ? new Date(user.last_login).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Tidak diketahui'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge status={user.status} />
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button 
                                                    onClick={() => openDrawer(user)}
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
                        
                        {/* Pagination */}
                        {filteredUsers.length > 0 && (
                            <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100 relative z-50">
                                <span className="text-sm font-medium text-slate-600">
                                    Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} dari {filteredUsers.length}
                                </span>
                                <div className="flex gap-2 pointer-events-auto">
                                    <button 
                                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
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
                                                className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors cursor-pointer ${
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
                                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
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

                {/* Drawer */}
                {drawerUser && (
                    <>
                        <div 
                            className="fixed inset-0 z-30 bg-black/30 pointer-events-auto"
                            onClick={handleDrawerClose}
                            style={{pointerEvents: 'auto'}}
                        ></div>
                        <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl overflow-auto flex flex-col z-40 pointer-events-auto">
                            {/* Header */}
                            <div className="p-8 bg-[#002824] border-b border-slate-200 sticky top-0">
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <h2 className="font-bold text-xl text-white mb-1">{drawerUser.name}</h2>
                                        <p className="text-xs text-[#D6F84C]">{drawerUser.email}</p>
                                    </div>
                                    <button 
                                        onClick={handleDrawerClose}
                                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors flex-shrink-0"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-6 overflow-y-auto">
                                {editMode ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-2">NIP</label>
                                            <input 
                                                type="text"
                                                value={editData.nip}
                                                onChange={(e) => setEditData({...editData, nip: e.target.value})}
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:input-focus"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-2">No Telepon</label>
                                            <input 
                                                type="text"
                                                value={editData.phone}
                                                onChange={(e) => setEditData({...editData, phone: e.target.value})}
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:input-focus"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-2">Lokasi Kantor</label>
                                            <input 
                                                type="text"
                                                value={editData.location}
                                                onChange={(e) => setEditData({...editData, location: e.target.value})}
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:input-focus"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-2">Divisi</label>
                                            <select 
                                                value={editData.department}
                                                onChange={(e) => setEditData({...editData, department: e.target.value})}
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:input-focus"
                                            >
                                                <option value="">Pilih Divisi...</option>
                                                {initialDepartments.map((dept) => (
                                                    <option key={dept.id} value={dept.name}>
                                                        {dept.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-xs text-slate-500 font-semibold mb-3 uppercase">Identitas</p>
                                            <div className="space-y-3">
                                                <div className="flex justify-between py-2 border-b border-slate-100">
                                                    <span className="text-sm text-slate-600">NIP</span>
                                                    <span className="font-semibold text-slate-900">{drawerUser.nip || '-'}</span>
                                                </div>
                                                <div className="flex justify-between py-2 border-b border-slate-100">
                                                    <span className="text-sm text-slate-600">Lokasi</span>
                                                    <span className="font-semibold text-slate-900">{drawerUser.location || '-'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-semibold mb-3 uppercase">Kontak</p>
                                            <div className="space-y-3">
                                                <div className="flex justify-between py-2 border-b border-slate-100">
                                                    <span className="text-sm text-slate-600">Telepon</span>
                                                    <span className="font-semibold text-slate-900">{drawerUser.phone || '-'}</span>
                                                </div>
                                                <div className="flex justify-between py-2 border-b border-slate-100">
                                                    <span className="text-sm text-slate-600">Divisi</span>
                                                    <span className="font-semibold text-slate-900">{drawerUser.department || '-'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-semibold mb-3 uppercase">Akun</p>
                                            <div className="space-y-3">
                                                <div className="flex justify-between py-2 border-b border-slate-100">
                                                    <span className="text-sm text-slate-600">Role</span>
                                                    <span className="font-semibold text-slate-900 uppercase text-xs">{drawerUser.role}</span>
                                                </div>
                                                <div className="flex justify-between py-2 border-b border-slate-100">
                                                    <span className="text-sm text-slate-600">Status</span>
                                                    <StatusBadge status={drawerUser.status} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-slate-200 bg-slate-50 sticky bottom-0 space-y-2">
                                {editMode ? (
                                    <>
                                        <button 
                                            onClick={() => {
                                                if (hasChanges && !confirm('Discard unsaved changes?')) return;
                                                setEditMode(false);
                                                setHasChanges(false);
                                            }}
                                            className="w-full py-2.5 px-4 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition"
                                        >
                                            Batal
                                        </button>
                                        <button 
                                            onClick={handleSaveUser}
                                            disabled={loading}
                                            className="w-full py-2.5 px-4 bg-[#005E54] text-white font-semibold rounded-lg hover:bg-[#003f38] transition disabled:opacity-50"
                                        >
                                            {loading ? 'Menyimpan...' : 'Simpan'}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button 
                                            onClick={handleDrawerClose}
                                            className="w-full py-2.5 px-4 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition"
                                        >
                                            Tutup
                                        </button>
                                        <button 
                                            onClick={() => setEditMode(true)}
                                            className="w-full py-2.5 px-4 bg-[#005E54] text-white font-semibold rounded-lg hover:bg-[#003f38] flex items-center justify-center gap-2 transition"
                                        >
                                            <Edit3 className="w-4 h-4" /> Edit
                                        </button>
                                        <button 
                                            onClick={() => handleToggleStatus(drawerUser.id, drawerUser.status)}
                                            disabled={loading}
                                            className={`w-full py-2.5 px-4 font-semibold rounded-lg flex items-center justify-center gap-2 transition ${
                                                drawerUser.status === 'active'
                                                    ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                                                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                                            }`}
                                        >
                                            {drawerUser.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(drawerUser.id)}
                                            className="w-full py-2.5 px-4 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 flex items-center justify-center gap-2 transition"
                                        >
                                            <Trash2 className="w-4 h-4" /> Hapus
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">Tambah User Baru</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Nama *</label>
                                <input
                                    type="text"
                                    placeholder="Masukkan nama lengkap"
                                    value={createFormData.name}
                                    onChange={(e) => setCreateFormData({...createFormData, name: e.target.value})}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:input-focus"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Email *</label>
                                <input
                                    type="email"
                                    placeholder="email@example.com"
                                    value={createFormData.email}
                                    onChange={(e) => handleEmailChange(e.target.value)}
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:input-focus ${
                                        emailTaken ? 'border-red-400 bg-red-50' : 'border-slate-200'
                                    }`}
                                />
                                {emailCheckLoading && <p className="text-xs text-slate-500 mt-1">🔄 Checking...</p>}
                                {!emailCheckLoading && emailTaken && (
                                    <p className="text-xs text-red-600 mt-1">❌ Email sudah terdaftar</p>
                                )}
                                {!emailCheckLoading && !emailTaken && createFormData.email && (
                                    <p className="text-xs text-green-600 mt-1">✅ Email tersedia</p>
                                )}
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Password *</label>
                                <input
                                    type="password"
                                    placeholder="Min. 8 karakter"
                                    value={createFormData.password}
                                    onChange={(e) => setCreateFormData({...createFormData, password: e.target.value})}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:input-focus"
                                />
                                <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <p className="text-xs font-semibold text-slate-600 mb-2">📋 Password Requirements:</p>
                                    <ul className="space-y-1 text-xs text-slate-600">
                                        <li className={createFormData.password.length >= 8 ? 'text-green-600' : ''}>
                                            {createFormData.password.length >= 8 ? '✅' : '○'} Min. 8 karakter
                                        </li>
                                        <li className={/[A-Z]/.test(createFormData.password) ? 'text-green-600' : ''}>
                                            {/[A-Z]/.test(createFormData.password) ? '✅' : '○'} Huruf besar (A-Z)
                                        </li>
                                        <li className={/[a-z]/.test(createFormData.password) ? 'text-green-600' : ''}>
                                            {/[a-z]/.test(createFormData.password) ? '✅' : '○'} Huruf kecil (a-z)
                                        </li>
                                        <li className={/[0-9]/.test(createFormData.password) ? 'text-green-600' : ''}>
                                            {/[0-9]/.test(createFormData.password) ? '✅' : '○'} Angka (0-9)
                                        </li>
                                        <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(createFormData.password) ? 'text-green-600' : ''}>
                                            {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(createFormData.password) ? '✅' : '○'} Special character (!@#$%^&*...)
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">NIP</label>
                                <input
                                    type="text"
                                    placeholder="Nomor Induk Pegawai"
                                    value={createFormData.nip}
                                    onChange={(e) => setCreateFormData({...createFormData, nip: e.target.value})}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:input-focus"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Lokasi</label>
                                <input
                                    type="text"
                                    placeholder="Lokasi kerja"
                                    value={createFormData.location}
                                    onChange={(e) => setCreateFormData({...createFormData, location: e.target.value})}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:input-focus"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Divisi</label>
                                <select
                                    value={createFormData.department}
                                    onChange={(e) => setCreateFormData({...createFormData, department: e.target.value})}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:input-focus"
                                >
                                    <option value="">Pilih Divisi...</option>
                                    {initialDepartments.map((dept) => (
                                        <option key={dept.id} value={dept.name}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Role</label>
                                <select
                                    value={createFormData.role}
                                    onChange={(e) => setCreateFormData({...createFormData, role: e.target.value})}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:input-focus"
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Status</label>
                                <select
                                    value={createFormData.status}
                                    onChange={(e) => setCreateFormData({...createFormData, status: e.target.value})}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:input-focus"
                                >
                                    <option value="active">Aktif</option>
                                    <option value="inactive">Nonaktif</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="border-t border-slate-100 p-6 flex gap-3">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleCreateUser}
                                disabled={loading || emailTaken || !createFormData.email}
                                className="flex-1 px-4 py-2.5 bg-[#005E54] text-white rounded-lg font-semibold hover:bg-[#003f38] disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                {loading ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
