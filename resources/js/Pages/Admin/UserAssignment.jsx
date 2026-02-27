import React, { useState, useMemo } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { 
    ArrowLeft, Plus, Trash2, Search, CheckCircle, 
    AlertCircle, Users, Building2, Filter, Send, 
    X, MoreHorizontal, Calendar, Clock, ChevronDown 
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
        
        .glass-header {
            background: rgba(0, 40, 36, 0.95);
            backdrop-filter: blur(20px);
        }

        .glass-card {
            background: white;
            border: 1px solid #E2E8F0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
            border-color: #005E54;
        }

        .input-wondr {
            background: #F8F9FA;
            border: 1px solid #E2E8F0;
            border-radius: 16px;
            transition: all 0.3s ease;
        }
        .input-wondr:focus {
            background: #FFFFFF;
            border-color: #005E54;
            box-shadow: 0 0 0 4px rgba(0, 94, 84, 0.1);
            outline: none;
        }

        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(40px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .custom-checkbox {
            appearance: none;
            background-color: #fff;
            margin: 0;
            font: inherit;
            color: currentColor;
            width: 1.25em;
            height: 1.25em;
            border: 2px solid #CBD5E1;
            border-radius: 0.35em;
            display: grid;
            place-content: center;
            transition: all 0.2s ease-in-out;
        }
        .custom-checkbox::before {
            content: "";
            width: 0.65em;
            height: 0.65em;
            transform: scale(0);
            transition: 120ms transform ease-in-out;
            box-shadow: inset 1em 1em white;
            transform-origin: center;
            clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
        }
        .custom-checkbox:checked {
            background-color: #005E54;
            border-color: #005E54;
        }
        .custom-checkbox:checked::before {
            transform: scale(1);
        }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
    `}</style>
);

// --- Components ---

const StatCard = ({ label, value, icon: Icon, colorClass }) => (
    <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${colorClass}`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="text-2xl font-extrabold text-slate-900">{value}</p>
        </div>
    </div>
);

const UserCard = ({ user, isSelected, onSelect, onReminder, onRemove }) => {
    const statusColors = {
        completed: 'bg-green-100 text-green-700',
        in_progress: 'bg-blue-100 text-blue-700',
        not_started: 'bg-slate-100 text-slate-600',
        overdue: 'bg-red-100 text-red-700'
    };

    return (
        <div className={`glass-card p-5 rounded-[20px] flex items-center gap-4 group ${isSelected ? 'ring-2 ring-[#005E54] bg-[#F0FDF4]' : ''}`}>
            <div className="flex items-center justify-center">
                <input 
                    type="checkbox" 
                    className="custom-checkbox cursor-pointer"
                    checked={isSelected}
                    onChange={() => onSelect(user.user_id)}
                />
            </div>
            
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm">
                {(user.user_name || user.nama || 'U').charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-bold text-slate-900 truncate">{user.user_name || user.nama || 'Unknown User'}</h4>
                        <p className="text-xs text-slate-500 truncate">{user.user_email || user.email || ''}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColors[user.status] || statusColors.not_started}`}>
                        {(user.status || 'not_started').replace('_', ' ')}
                    </span>
                </div>
                
                <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-[#005E54] to-[#D6F84C] rounded-full transition-all duration-500"
                            style={{ width: `${user.completion_percentage || 0}%` }}
                        />
                    </div>
                    <span className="text-xs font-bold text-slate-700">{user.completion_percentage || 0}%</span>
                </div>
            </div>

            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={() => onReminder(user.user_id)}
                    className="p-2 rounded-xl hover:bg-orange-50 text-slate-400 hover:text-orange-600 transition-colors"
                    title="Kirim Reminder"
                >
                    <Send className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => onRemove(user.user_id)}
                    className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                    title="Hapus Assignment"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// --- Main Component ---

export default function UserAssignment({ program: initialProgram, users: initialUsers = [], departments = [], auth }) {
    // Handle back navigation
    const handleBack = () => {
        router.visit('/admin/training-programs');
    };

    // Mock Data if props empty
    const program = initialProgram || {
        id: 1,
        title: 'Wondr Service Excellence 2025',
        assigned_users: [
            { user_id: 1, user_name: 'Sarah Wijaya', user_email: 'sarah@bni.co.id', status: 'in_progress', completion_percentage: 45, priority: 'high' },
            { user_id: 2, user_name: 'Budi Santoso', user_email: 'budi@bni.co.id', status: 'completed', completion_percentage: 100, priority: 'normal' },
            { user_id: 3, user_name: 'Andi Pratama', user_email: 'andi@bni.co.id', status: 'not_started', completion_percentage: 0, priority: 'normal' },
            { user_id: 4, user_name: 'Dewi Lestari', user_email: 'dewi@bni.co.id', status: 'overdue', completion_percentage: 20, priority: 'urgent' },
        ]
    };

    const usersList = initialUsers.length ? initialUsers : [
        { id: 101, name: 'Eko Patrio', email: 'eko@bni.co.id', department: 'IT' },
        { id: 102, name: 'Fina Anindya', email: 'fina@bni.co.id', department: 'HR' },
        { id: 103, name: 'Gilang Ramadhan', email: 'gilang@bni.co.id', department: 'Marketing' },
        { id: 104, name: 'Hesti Purwadinata', email: 'hesti@bni.co.id', department: 'Finance' },
    ];

    // State
    const [assignedUsers, setAssignedUsers] = useState(program.assigned_users);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedItems, setSelectedItems] = useState([]);
    
    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [assignTab, setAssignTab] = useState('individual');
    const [modalSearch, setModalSearch] = useState('');
    const [modalSelected, setModalSelected] = useState([]);
    const [selectedDepartments, setSelectedDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null);

    // Derived Data
    const filteredAssigned = useMemo(() => {
        return assignedUsers.filter(u => {
            const userName = (u.user_name || u.name || '').toLowerCase();
            const userEmail = (u.user_email || u.email || '').toLowerCase();
            const search = searchQuery.toLowerCase();
            return (userName.includes(search) || userEmail.includes(search)) &&
                (filterStatus === 'all' || u.status === filterStatus);
        });
    }, [assignedUsers, searchQuery, filterStatus]);

    const filteredModalUsers = useMemo(() => {
        return usersList.filter(u => {
            const userName = (u.name || '').toLowerCase();
            const search = modalSearch.toLowerCase();
            return userName.includes(search) &&
                !assignedUsers.find(au => au.user_id === u.id);
        });
    }, [usersList, modalSearch, assignedUsers]);

    // Actions
    const showToast = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedItems(filteredAssigned.map(u => u.user_id));
        } else {
            setSelectedItems([]);
        }
    };

    const handleSingleSelect = (id) => {
        setSelectedItems(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleDepartmentToggle = (deptName) => {
        setSelectedDepartments(prev => 
            prev.includes(deptName) ? prev.filter(d => d !== deptName) : [...prev, deptName]
        );
    };

    const handleAssign = async () => {
        setLoading(true);
        try {
            // Prepare payload based on assignment type
            const payload = {
                assigned_date: new Date().toISOString().split('T')[0],
                due_date: null
            };

            if (assignTab === 'individual') {
                payload.user_ids = modalSelected;
            } else if (assignTab === 'department') {
                payload.departments = selectedDepartments;
            }

            // Kirim data ke backend untuk disimpan
            const response = await fetch(`/api/admin/training-programs/${program.id}/assign-users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success) {
                // Ambil data terbaru dari server
                const assignedResponse = await fetch(`/api/admin/training-programs/${program.id}/assigned-users`);
                const assignedData = await assignedResponse.json();
                
                if (assignedData.success) {
                    setAssignedUsers(assignedData.data);
                    const count = assignTab === 'individual' ? modalSelected.length : 
                                  selectedDepartments.length + ' departemen';
                    showToast(`${count} berhasil ditambahkan!`);
                }
            } else {
                showToast('Gagal menambahkan user: ' + (result.message || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Error assigning users:', error);
            showToast('Terjadi kesalahan saat menambahkan user', 'error');
        } finally {
            setLoading(false);
            setShowModal(false);
            setModalSelected([]);
            setSelectedDepartments([]);
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Hapus ${selectedItems.length} user dari program?`)) return;
        
        try {
            const response = await fetch(`/api/admin/training-programs/${program.id}/remove-users`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
                },
                body: JSON.stringify({
                    user_ids: selectedItems
                })
            });

            const result = await response.json();

            if (result.success) {
                // Ambil data terbaru dari server
                const assignedResponse = await fetch(`/api/admin/training-programs/${program.id}/assigned-users`);
                const assignedData = await assignedResponse.json();
                
                if (assignedData.success) {
                    setAssignedUsers(assignedData.data);
                    setSelectedItems([]);
                    showToast('Assignment berhasil dihapus', 'error');
                }
            } else {
                showToast('Gagal menghapus user: ' + (result.message || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Error removing users:', error);
            showToast('Terjadi kesalahan saat menghapus user', 'error');
        }
    };

    return (
        <AdminLayout user={auth?.user}>
            <Head title="User Assignment - HCMS E-Learning" />
            <div className="min-h-screen bg-[#F8F9FA] pb-20 font-sans">
                <WondrStyles />

            {/* Notification */}
            {notification && (
                <div className={`fixed top-6 right-6 z-[70] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-slide-up ${
                    notification.type === 'success' ? 'bg-[#002824] text-[#D6F84C]' : 'bg-red-500 text-white'
                }`}>
                    {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="font-bold text-sm">{notification.msg}</span>
                </div>
            )}

            {/* --- Hero Header --- */}
            <div className="bg-[#002824] pt-8 pb-24 px-6 lg:px-12 sticky top-0 z-30 shadow-lg">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <button onClick={handleBack} className="flex items-center gap-2 text-white/70 hover:text-[#D6F84C] mb-4 transition-colors">
                            <ArrowLeft className="w-5 h-5" /> Kembali
                        </button>
                        <h1 className="text-3xl lg:text-4xl font-extrabold text-white mb-2 leading-tight">
                            User Assignment
                        </h1>
                        <p className="text-slate-400 font-medium">{program.title}</p>
                    </div>
                    
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setShowModal(true)}
                            className="group flex items-center gap-3 px-6 py-3 bg-[#D6F84C] text-[#002824] rounded-2xl font-bold shadow-lg shadow-[#D6F84C]/20 hover:scale-105 transition-all"
                        >
                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            <span>Assign Users</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* --- Main Content --- */}
            <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-40">
                
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard 
                        label="Total Users" 
                        value={assignedUsers.length} 
                        icon={Users} 
                        colorClass="bg-blue-50 text-blue-600" 
                    />
                    <StatCard 
                        label="Selesai" 
                        value={assignedUsers.filter(u => u.status === 'completed').length} 
                        icon={CheckCircle} 
                        colorClass="bg-green-50 text-green-600" 
                    />
                    <StatCard 
                        label="On Progress" 
                        value={assignedUsers.filter(u => u.status === 'in_progress').length} 
                        icon={Clock} 
                        colorClass="bg-orange-50 text-orange-600" 
                    />
                    <StatCard 
                        label="Overdue" 
                        value={assignedUsers.filter(u => u.status === 'overdue').length} 
                        icon={AlertCircle} 
                        colorClass="bg-red-50 text-red-600" 
                    />
                </div>

                {/* Toolbar & Filters */}
                <div className="bg-white rounded-[24px] p-4 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input 
                                type="text" 
                                placeholder="Cari user..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-[#005E54]/20 transition-all outline-none"
                            />
                        </div>
                        <div className="relative">
                            <select 
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="appearance-none pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 focus:border-[#005E54] focus:ring-0 outline-none cursor-pointer hover:bg-slate-50 transition-colors"
                            >
                                <option value="all">Semua Status</option>
                                <option value="not_started">Belum Mulai</option>
                                <option value="in_progress">Berjalan</option>
                                <option value="completed">Selesai</option>
                                <option value="overdue">Terlambat</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors">
                            <input 
                                type="checkbox" 
                                className="custom-checkbox"
                                checked={selectedItems.length === filteredAssigned.length && filteredAssigned.length > 0}
                                onChange={handleSelectAll}
                            />
                            <span className="font-bold text-slate-600 text-sm">Pilih Semua</span>
                        </label>
                    </div>
                </div>

                {/* Users Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                    {filteredAssigned.length > 0 ? (
                        filteredAssigned.map(user => (
                            <UserCard 
                                key={user.user_id} 
                                user={user} 
                                isSelected={selectedItems.includes(user.user_id)}
                                onSelect={handleSingleSelect}
                                onReminder={() => showToast('Reminder dikirim!')}
                                onRemove={(id) => {
                                    if(confirm('Hapus user ini?')) {
                                        setAssignedUsers(prev => prev.filter(u => u.user_id !== id));
                                        showToast('User dihapus', 'error');
                                    }
                                }}
                            />
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center bg-white rounded-[32px] border border-dashed border-slate-200">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Belum ada user</h3>
                            <p className="text-slate-500">Mulai dengan klik tombol "Assign Users" di atas.</p>
                        </div>
                    )}
                </div>

            </div>

            {/* --- Floating Bulk Action Bar --- */}
            {selectedItems.length > 0 && (
                <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-[#002824] text-white px-6 py-4 rounded-[24px] shadow-2xl z-50 flex items-center gap-6 animate-slide-up w-[90%] max-w-2xl border border-[#D6F84C]/20">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#D6F84C] flex items-center justify-center text-[#002824] font-bold">
                            {selectedItems.length}
                        </div>
                        <span className="font-semibold text-sm">User Dipilih</span>
                    </div>
                    
                    <div className="h-8 w-[1px] bg-white/20"></div>

                    <div className="flex items-center gap-2 flex-1 justify-end">
                        <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-xl transition-colors text-sm font-bold">
                            <Send className="w-4 h-4 text-[#D6F84C]" /> Kirim Reminder
                        </button>
                        <button 
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors text-sm font-bold border border-red-500/20"
                        >
                            <Trash2 className="w-4 h-4" /> Hapus
                        </button>
                        <button 
                            onClick={() => setSelectedItems([])}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors ml-2"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* --- Assignment Modal --- */}
            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-[#002824]/60 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)}></div>
                    <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up">
                        
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                            <div>
                                <h2 className="text-2xl font-extrabold text-[#005E54]">Tambah Peserta</h2>
                                <p className="text-slate-500 text-sm">Pilih peserta untuk program ini</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex gap-2">
                            <button 
                                onClick={() => setAssignTab('individual')}
                                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                                    assignTab === 'individual' ? 'bg-white shadow text-[#005E54] ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white/50'
                                }`}
                            >
                                <Users className="w-4 h-4 inline mr-2" /> Individual
                            </button>
                            <button 
                                onClick={() => setAssignTab('department')}
                                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                                    assignTab === 'department' ? 'bg-white shadow text-[#005E54] ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white/50'
                                }`}
                            >
                                <Building2 className="w-4 h-4 inline mr-2" /> Departemen
                            </button>
                        </div>

                        {/* Search & List */}
                        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                            <div className="relative mb-6">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input 
                                    type="text" 
                                    placeholder={assignTab === 'individual' ? "Cari nama karyawan..." : "Cari departemen..."}
                                    value={modalSearch}
                                    onChange={(e) => setModalSearch(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-[#005E54]/20 transition-all outline-none"
                                />
                            </div>

                            {assignTab === 'individual' && (
                                <div className="space-y-2">
                                    {filteredModalUsers.map(user => (
                                        <label key={user.id} className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl hover:bg-[#F0FDF4] hover:border-[#005E54]/30 cursor-pointer transition-all group">
                                            <input 
                                                type="checkbox" 
                                                className="custom-checkbox"
                                                checked={modalSelected.includes(user.id)}
                                                onChange={(e) => {
                                                    if(e.target.checked) setModalSelected([...modalSelected, user.id]);
                                                    else setModalSelected(modalSelected.filter(id => id !== user.id));
                                                }}
                                            />
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 group-hover:bg-white group-hover:text-[#005E54]">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900">{user.name}</h4>
                                                <p className="text-xs text-slate-500">{user.department} • {user.email}</p>
                                            </div>
                                        </label>
                                    ))}
                                    {filteredModalUsers.length === 0 && (
                                        <div className="text-center py-10 text-slate-400">Tidak ada user ditemukan</div>
                                    )}
                                </div>
                            )}
                            
                            {/* Department Selection */}
                            {assignTab === 'department' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-sm font-bold text-slate-600">
                                            {selectedDepartments.length} departemen dipilih
                                        </p>
                                        {selectedDepartments.length > 0 && (
                                            <button
                                                onClick={() => setSelectedDepartments([])}
                                                className="text-xs text-slate-500 hover:text-slate-700 font-bold"
                                            >
                                                Clear All
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                                        {departments && departments.length > 0 ? (
                                            departments.map((dept) => {
                                                const isSelected = selectedDepartments.includes(dept.name);
                                                const usersInDept = usersList.filter(u => u.department === dept.name).length;
                                                
                                                return (
                                                    <div
                                                        key={dept.id}
                                                        onClick={() => handleDepartmentToggle(dept.name)}
                                                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                                            isSelected 
                                                                ? 'border-[#005E54] bg-[#F0FDF4]' 
                                                                : 'border-slate-200 hover:border-slate-300 bg-white'
                                                        }`}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-center gap-3 flex-1">
                                                                <div className={`p-2 rounded-xl ${
                                                                    isSelected ? 'bg-[#005E54] text-white' : 'bg-slate-100 text-slate-600'
                                                                }`}>
                                                                    <Building2 size={20} />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-slate-900">{dept.name}</p>
                                                                    <p className="text-xs text-slate-500">{usersInDept} users</p>
                                                                </div>
                                                            </div>
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => {}}
                                                                className="custom-checkbox"
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="col-span-2 text-center py-10 text-slate-400">
                                                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                <p>No departments available</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-500">
                                {assignTab === 'individual' 
                                    ? `${modalSelected.length} user dipilih`
                                    : `${selectedDepartments.length} departemen dipilih`}
                            </span>
                            <div className="flex gap-3">
                                <button onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition">
                                    Batal
                                </button>
                                <button 
                                    onClick={handleAssign}
                                    disabled={
                                        loading || 
                                        (assignTab === 'individual' && modalSelected.length === 0) ||
                                        (assignTab === 'department' && selectedDepartments.length === 0)
                                    }
                                    className="px-8 py-3 bg-[#002824] text-[#D6F84C] rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:shadow-none hover:scale-105 transition-transform"
                                >
                                    {loading ? 'Menambahkan...' : 'Tambahkan Peserta'}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}

        </div>
        </AdminLayout>
    );
}
