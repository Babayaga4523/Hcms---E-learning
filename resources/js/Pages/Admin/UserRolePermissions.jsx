import React, { useState, useMemo } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Shield, Plus, Edit3, Trash2, X, Check, Search,
    ChevronRight, Lock, AlertCircle, Copy, Save,
    LayoutGrid, List, Key, Users, Settings, Zap
} from 'lucide-react';

// --- Wondr Style System ---
const WondrStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F8F9FA; color: #1e293b; }
        
        .wondr-dark { background-color: #002824; }
        .wondr-green { color: #005E54; }
        .wondr-lime { color: #D6F84C; }
        
        .glass-panel {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.6);
            box-shadow: 0 10px 40px -10px rgba(0, 40, 36, 0.08);
        }

        .role-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid transparent;
        }
        .role-card:hover, .role-card.active {
            transform: translateY(-4px);
            box-shadow: 0 20px 25px -5px rgba(0, 94, 84, 0.1);
            border-color: #005E54;
        }
        .role-card.active {
            background-color: #F0FDF4;
            border-color: #005E54;
        }

        /* Modern Toggle Switch */
        .toggle-checkbox:checked {
            right: 0;
            border-color: #005E54;
        }
        .toggle-checkbox:checked + .toggle-label {
            background-color: #005E54;
        }
        .toggle-checkbox {
            right: 0;
            z-index: 1;
            border-color: #e2e8f0;
            transition: all 0.3s;
        }
        .toggle-label {
            width: 3rem;
            height: 1.5rem;
            background-color: #e2e8f0;
            transition: background-color 0.3s;
        }
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }

        .animate-slide-in { animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `}</style>
);

// --- Components ---

const StatCard = ({ label, value, icon: Icon, colorClass }) => (
    <div className="glass-panel p-5 rounded-[24px] flex items-center justify-between">
        <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
            <h3 className="text-3xl font-extrabold text-slate-900">{value}</h3>
        </div>
        <div className={`p-3 rounded-2xl ${colorClass}`}>
            <Icon className="w-6 h-6" />
        </div>
    </div>
);

const PermissionToggle = ({ label, checked, onChange, description }) => (
    <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-[#005E54]/30 transition-all">
        <div className="flex-1 pr-4">
            <h4 className="text-sm font-bold text-slate-800">{label}</h4>
            {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
        <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
            <input 
                type="checkbox" 
                id={`toggle-${label}`} 
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 right-6"
                checked={checked}
                onChange={onChange}
            />
            <label 
                htmlFor={`toggle-${label}`} 
                className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${checked ? 'bg-[#005E54]' : 'bg-slate-300'}`}
            ></label>
        </div>
    </div>
);

// --- Main Layout ---

export default function UserRolePermissions({ roles: initialRoles, permissions: initialPermissions, stats: initialStats }) {
    // --- Mock Data Generators (Safety) ---
    const mockPermissions = initialPermissions || [
        { id: 1, name: 'View Users', slug: 'users.view', category: 'User Management', description: 'Can view list of users' },
        { id: 2, name: 'Create Users', slug: 'users.create', category: 'User Management', description: 'Can create new users' },
        { id: 3, name: 'Edit Users', slug: 'users.edit', category: 'User Management', description: 'Can edit existing users' },
        { id: 4, name: 'Delete Users', slug: 'users.delete', category: 'User Management', description: 'Can remove users' },
        { id: 5, name: 'View Roles', slug: 'roles.view', category: 'Security', description: 'Can view roles' },
        { id: 6, name: 'Manage Roles', slug: 'roles.manage', category: 'Security', description: 'Can manage system roles' },
        { id: 7, name: 'View Reports', slug: 'reports.view', category: 'Reporting', description: 'Access to analytics' },
        { id: 8, name: 'Export Data', slug: 'reports.export', category: 'Reporting', description: 'Can export CSV data' },
    ];

    const mockRoles = initialRoles || [
        { id: 1, name: 'Super Admin', description: 'Full access to everything', is_active: true, permissions: mockPermissions, users_count: 3 },
        { id: 2, name: 'HR Manager', description: 'Can manage users and view reports', is_active: true, permissions: mockPermissions.filter(p => p.category !== 'Security'), users_count: 5 },
        { id: 3, name: 'Staff', description: 'Limited access', is_active: true, permissions: [mockPermissions[0]], users_count: 42 },
    ];

    const mockStats = initialStats || {
        total_roles: mockRoles.length,
        active_roles: mockRoles.filter(r => r.is_active).length,
        total_permissions: mockPermissions.length
    };

    // --- State ---
    const [roles, setRoles] = useState(mockRoles);
    const [selectedRole, setSelectedRole] = useState(null); // The role currently being edited in the sidebar
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null);

    // Group Permissions by Category
    const groupedPermissions = useMemo(() => {
        return mockPermissions.reduce((acc, perm) => {
            if (!acc[perm.category]) acc[perm.category] = [];
            acc[perm.category].push(perm);
            return acc;
        }, {});
    }, [mockPermissions]);

    // Filter Roles
    const filteredRoles = useMemo(() => {
        return roles.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [roles, searchQuery]);

    // --- Handlers ---

    const showToast = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleCreateRole = () => {
        const newRole = {
            id: Date.now(),
            name: 'New Role',
            description: 'Description here...',
            is_active: false,
            permissions: [],
            users_count: 0
        };
        setRoles([newRole, ...roles]);
        setSelectedRole(newRole);
    };

    const handleDuplicateRole = (role) => {
        const newRole = {
            ...role,
            id: Date.now(),
            name: `${role.name} (Copy)`,
            users_count: 0
        };
        setRoles([newRole, ...roles]);
        showToast('Role berhasil diduplikasi');
    };

    const handleDeleteRole = (id) => {
        if(confirm('Hapus role ini? User yang memiliki role ini akan kehilangan akses.')) {
            setRoles(roles.filter(r => r.id !== id));
            if (selectedRole?.id === id) setSelectedRole(null);
            showToast('Role dihapus', 'error');
        }
    };

    const handlePermissionToggle = (roleId, permission) => {
        setRoles(roles.map(r => {
            if (r.id !== roleId) return r;
            
            const hasPermission = r.permissions.some(p => p.id === permission.id);
            let newPermissions;
            
            if (hasPermission) {
                newPermissions = r.permissions.filter(p => p.id !== permission.id);
            } else {
                newPermissions = [...r.permissions, permission];
            }

            // Update selected role state immediately to reflect in UI
            if (selectedRole?.id === roleId) {
                setSelectedRole({ ...r, permissions: newPermissions });
            }

            return { ...r, permissions: newPermissions };
        }));
    };

    const handleSaveRole = (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API
        setTimeout(() => {
            setRoles(roles.map(r => r.id === selectedRole.id ? selectedRole : r));
            setLoading(false);
            showToast('Perubahan berhasil disimpan');
        }, 1000);
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-[#F8F9FA] pb-20 font-sans overflow-hidden">
                <WondrStyles />
                {/* Notification */}
                {notification && (
                    <div className={`fixed top-6 right-6 z-[70] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-slide-in ${
                        notification.type === 'success' ? 'bg-[#002824] text-[#D6F84C]' : 'bg-red-500 text-white'
                    }`}>
                        {notification.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="font-bold text-sm">{notification.msg}</span>
                    </div>
                )}

                {/* --- Hero Header --- */}
                <div className="bg-[#002824] pt-8 pb-32 px-6 lg:px-12 relative">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#005E54] rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                        <div>
                            <div className="flex items-center gap-2 text-[#D6F84C] mb-2 font-bold text-xs tracking-widest uppercase">
                                <Shield className="w-4 h-4" /> Identity Access Management
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight">
                                Role & Permission <br /> Control
                            </h1>
                        </div>
                        
                        <button 
                            onClick={handleCreateRole}
                            className="flex items-center gap-2 px-6 py-3 bg-[#D6F84C] hover:bg-[#c2e43c] text-[#002824] rounded-2xl font-bold shadow-lg shadow-[#D6F84C]/20 transition-all hover:scale-105"
                        >
                            <Plus className="w-5 h-5" />
                            Buat Role Baru
                        </button>
                    </div>
                </div>

                {/* --- Floating Stats --- */}
                <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-20">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <StatCard 
                            label="Total Roles" 
                            value={mockStats.total_roles} 
                            icon={Users} 
                            colorClass="bg-blue-100 text-blue-600" 
                        />
                        <StatCard 
                            label="Permission Points" 
                            value={mockStats.total_permissions} 
                            icon={Key} 
                            colorClass="bg-purple-100 text-purple-600" 
                        />
                        <StatCard 
                            label="System Health" 
                            value="Secure" 
                            icon={Shield} 
                            colorClass="bg-green-100 text-green-600" 
                        />
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8 items-start h-full">
                        
                        {/* LEFT: Role List */}
                        <div className="w-full lg:w-1/3 space-y-6">
                            <div className="bg-white rounded-[24px] p-2 shadow-sm border border-slate-100">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <input 
                                        type="text" 
                                        placeholder="Cari role..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-[#005E54]/20 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar pr-2">
                                {filteredRoles.map(role => (
                                    <div 
                                        key={role.id}
                                        onClick={() => setSelectedRole(role)}
                                        className={`role-card bg-white p-6 rounded-[24px] shadow-sm cursor-pointer relative group ${selectedRole?.id === role.id ? 'active' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedRole?.id === role.id ? 'bg-[#005E54] text-[#D6F84C]' : 'bg-slate-100 text-slate-500'}`}>
                                                    <Shield className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900">{role.name}</h3>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                                        <Users className="w-3 h-3" /> {role.users_count} Users
                                                    </div>
                                                </div>
                                            </div>
                                            {role.is_active ? (
                                                <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
                                            ) : (
                                                <span className="w-2.5 h-2.5 bg-slate-300 rounded-full"></span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                                            {role.description}
                                        </p>
                                        
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                            <span className="text-xs font-bold text-slate-400">
                                                {role.permissions?.length} Permissions
                                            </span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDuplicateRole(role); }}
                                                    className="p-2 hover:bg-purple-50 text-slate-400 hover:text-purple-600 rounded-lg transition"
                                                    title="Duplicate"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.id); }}
                                                    className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT: Role Inspector / Editor */}
                        <div className="flex-1 w-full bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden flex flex-col h-[calc(100vh-150px)] sticky top-6">
                            {selectedRole ? (
                                <>
                                    {/* Editor Header */}
                                    <div className="bg-slate-50 p-8 border-b border-slate-200">
                                        <div className="flex justify-between items-start mb-6">
                                            <h2 className="text-2xl font-extrabold text-[#005E54]">
                                                Konfigurasi Role
                                            </h2>
                                            <button 
                                                onClick={() => setSelectedRole(null)}
                                                className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nama Role</label>
                                                <input 
                                                    type="text" 
                                                    value={selectedRole.name}
                                                    onChange={(e) => setSelectedRole({...selectedRole, name: e.target.value})}
                                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-[#005E54] outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Deskripsi</label>
                                                <input 
                                                    type="text" 
                                                    value={selectedRole.description}
                                                    onChange={(e) => setSelectedRole({...selectedRole, description: e.target.value})}
                                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-600 focus:ring-2 focus:ring-[#005E54] outline-none"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="mt-6 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${selectedRole.is_active ? 'bg-[#005E54]' : 'bg-slate-300'}`} onClick={() => setSelectedRole({...selectedRole, is_active: !selectedRole.is_active})}>
                                                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${selectedRole.is_active ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                                </div>
                                                <span className="text-sm font-bold text-slate-700">Status Aktif</span>
                                            </div>
                                            
                                            {/* Security Meter */}
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-lg border border-orange-100">
                                                <AlertCircle className="w-4 h-4 text-orange-500" />
                                                <span className="text-xs font-bold text-orange-700">High Privilege Access</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Permissions Matrix */}
                                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#FAFAFA]">
                                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                            <Key className="w-5 h-5 text-[#005E54]" /> Akses & Izin
                                        </h3>

                                        <div className="space-y-8">
                                            {Object.entries(groupedPermissions).map(([category, permissions]) => (
                                                <div key={category} className="animate-slide-in">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <span className="px-3 py-1 bg-slate-200 rounded-lg text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                                                            {category}
                                                        </span>
                                                        <div className="h-px bg-slate-200 flex-1"></div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {permissions.map(perm => (
                                                            <PermissionToggle 
                                                                key={perm.id}
                                                                label={perm.name}
                                                                description={perm.description}
                                                                checked={selectedRole.permissions.some(p => p.id === perm.id)}
                                                                onChange={() => handlePermissionToggle(selectedRole.id, perm)}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Footer Action */}
                                    <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3">
                                        <button 
                                            onClick={() => setSelectedRole(null)}
                                            className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition"
                                        >
                                            Batal
                                        </button>
                                        <button 
                                            onClick={handleSaveRole}
                                            disabled={loading}
                                            className="flex items-center gap-2 px-8 py-3 bg-[#002824] text-[#D6F84C] rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-70"
                                        >
                                            {loading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> : <Save className="w-4 h-4" />}
                                            Simpan Perubahan
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-50">
                                    <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                                        <Settings className="w-12 h-12 text-slate-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">Pilih Role untuk Mengedit</h3>
                                    <p className="text-slate-500 max-w-xs">
                                        Klik salah satu kartu role di sebelah kiri untuk melihat detail dan mengubah izin akses.
                                    </p>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
