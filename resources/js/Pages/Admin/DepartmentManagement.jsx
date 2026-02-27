import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    Building2, Plus, Edit3, Trash2, Search, Users, User, 
    X, Check, AlertCircle, TrendingUp, 
    LayoutGrid, List as ListIcon, BarChart3, ChevronRight,
    MapPin, Phone, Mail, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// --- STAT WIDGET COMPONENT ---
const StatWidget = ({ label, value, icon: Icon, color, trend }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md hover:border-lime-300 transition-all"
    >
        <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
            <h3 className="text-2xl font-black text-slate-900">{value}</h3>
            {trend && <p className="text-xs text-green-600 font-bold mt-1 flex items-center gap-1"><TrendingUp size={12}/> {trend}</p>}
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
            <Icon size={24} className={color.replace('bg-', 'text-')} />
        </div>
    </motion.div>
);

// --- VIEW TOGGLE COMPONENT ---
const ViewToggle = ({ mode, setMode }) => (
    <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
        <button 
            onClick={() => setMode('grid')}
            className={`p-2 rounded-lg transition-all ${mode === 'grid' ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
        >
            <LayoutGrid size={18} />
        </button>
        <button 
            onClick={() => setMode('list')}
            className={`p-2 rounded-lg transition-all ${mode === 'list' ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
        >
            <ListIcon size={18} />
        </button>
    </div>
);

// --- DEPARTMENT CARD (GRID VIEW) ---
const DepartmentCard = ({ dept, onEdit, onDelete, onViewUsers, headName, headAvatar }) => {
    // Get department users count
    const deptUsers = dept.users || [];
    
    return (
    <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="group bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-lime-300 transition-all duration-300 relative overflow-hidden"
    >
        {/* Status Indicator Line */}
        <div className={`absolute top-0 left-0 w-full h-1.5 ${dept.is_active ? 'bg-gradient-to-r from-teal-400 to-lime-400' : 'bg-slate-200'}`}></div>

        <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-700 font-bold border border-slate-100 group-hover:bg-lime-50 transition">
                {dept.code?.split('-')[0] || 'ORG'}
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onViewUsers(dept)}
                    title="View Department Users"
                    className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition"
                >
                    <Users size={18} />
                </motion.button>
                <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onEdit(dept)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition"
                >
                    <Edit3 size={18} />
                </motion.button>
                <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onDelete(dept.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                >
                    <Trash2 size={18} />
                </motion.button>
            </div>
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-1">{dept.name}</h3>
        <p className="text-slate-500 text-sm mb-6 line-clamp-2 min-h-[40px]">{dept.description || 'No description'}</p>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Members</p>
                <div className="flex items-center gap-1.5">
                    <Users size={14} className="text-indigo-500" />
                    <span className="font-bold text-slate-700">{dept.members_count || 0}</span>
                </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Status</p>
                <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${dept.is_active ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                    <span className="font-bold text-slate-700">{dept.is_active ? 'Active' : 'Inactive'}</span>
                </div>
            </div>
        </div>

        {/* Department Head */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
                {headName ? (
                    <>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                            {headAvatar}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-900">{headName}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Head</p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <User size={14} />
                        </div>
                        <p className="text-xs font-bold text-slate-400 italic">No Head</p>
                    </>
                )}
            </div>
            
            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${dept.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {dept.is_active ? 'Active' : 'Inactive'}
            </span>
        </div>
    </motion.div>
    );
};

// --- MAIN PAGE ---
export default function DepartmentManagement({ departments = [], users = [], stats = {} }) {
    const [viewMode, setViewMode] = useState('grid');
    const [localDepts, setLocalDepts] = useState(departments);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [selectedDept, setSelectedDept] = useState(null);
    const [editingDept, setEditingDept] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        head_id: '',
        is_active: true,
    });

    // Filtering
    const filteredDepts = localDepts.filter(d => 
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        d.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get head info
    const getHeadInfo = (headId) => {
        const head = users.find(u => u.id === headId);
        if (!head) return { name: null, avatar: null };
        const initials = head.name.split(' ').map(n => n[0]).join('').toUpperCase();
        return { name: head.name, avatar: initials };
    };

    // Open Modal
    const openModal = (dept = null) => {
        if (dept) {
            setEditingDept(dept);
            setFormData({
                name: dept.name,
                code: dept.code || '',
                description: dept.description || '',
                head_id: dept.head_id || '',
                is_active: dept.is_active,
            });
        } else {
            setEditingDept(null);
            setFormData({
                name: '',
                code: '',
                description: '',
                head_id: '',
                is_active: true,
            });
        }
        setShowModal(true);
    };

    // Save Department
    const handleSaveDept = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const url = editingDept
                ? `/api/admin/departments/${editingDept.id}`
                : '/api/admin/departments';
            const method = editingDept ? 'PUT' : 'POST';

            const response = await axios({
                method,
                url,
                data: formData,
            });

            setMessage({ 
                type: 'success', 
                text: editingDept ? 'Department updated successfully' : 'Department created successfully' 
            });
            setShowModal(false);
            setTimeout(() => router.reload(), 1500);
        } catch (error) {
            setMessage({ 
                type: 'error', 
                text: error.response?.data?.message || 'Failed to save department' 
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Delete Department
    const handleDeleteDept = async (deptId) => {
        if (!window.confirm('Are you sure? This will affect all users in this department.')) return;
        
        setIsLoading(true);
        try {
            await axios.delete(`/api/admin/departments/${deptId}`);
            setMessage({ type: 'success', text: 'Department deleted successfully' });
            setLocalDepts(localDepts.filter(d => d.id !== deptId));
            setTimeout(() => router.reload(), 1500);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to delete department' });
        } finally {
            setIsLoading(false);
        }
    };

    // View Department Users
    const handleViewUsers = (dept) => {
        setSelectedDept(dept);
        setShowUserModal(true);
    };

    // Manager Users
    const managerUsers = users.filter(u => u.role === 'manager' || u.role === 'admin');

    // Calculate stats
    const calculatedStats = {
        total: localDepts.length,
        active: localDepts.filter(d => d.is_active).length,
        total_users: localDepts.reduce((sum, d) => sum + (d.members_count || 0), 0),
        avg_performance: stats.avg_performance || 89,
    };

    return (
        <>
            <Head title="Department Management" />
            <AdminLayout>
                <div className="pb-20">
                    
                    {/* --- HEADER --- */}
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <motion.button
                                    whileHover={{ x: -3 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => window.history.back()}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                                >
                                    <ArrowLeft size={18} /> Kembali
                                </motion.button>
                                <span className="px-3 py-1 bg-slate-900 text-lime-400 text-[10px] font-bold uppercase tracking-wider rounded-full">
                                    Organization Structure
                                </span>
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Departments</h1>
                            <p className="text-slate-500 font-medium mt-1">Manage corporate structure, head assignments, and resources.</p>
                        </div>
                        <div className="flex gap-3">
                            <ViewToggle mode={viewMode} setMode={setViewMode} />
                            <motion.button 
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => openModal()}
                                className="flex items-center gap-2 px-6 py-3 bg-lime-400 text-slate-900 rounded-xl font-bold shadow-lg shadow-lime-200 hover:bg-lime-300 transition"
                            >
                                <Plus size={18} /> New Department
                            </motion.button>
                        </div>
                    </div>

                    {/* --- STATS ROW --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatWidget 
                            label="Total Depts" 
                            value={calculatedStats.total} 
                            icon={Building2} 
                            color="bg-blue-500 text-blue-600" 
                            trend={`+${localDepts.filter(d => d.is_active).length} Active`}
                        />
                        <StatWidget 
                            label="Active Depts" 
                            value={calculatedStats.active} 
                            icon={Check} 
                            color="bg-green-500 text-green-600" 
                        />
                        <StatWidget 
                            label="Total Personnel" 
                            value={calculatedStats.total_users} 
                            icon={Users} 
                            color="bg-purple-500 text-purple-600" 
                            trend={`${Math.round(calculatedStats.total_users / (calculatedStats.total || 1))} avg/dept`}
                        />
                        <StatWidget 
                            label="Health Score" 
                            value={`${calculatedStats.avg_performance}%`} 
                            icon={BarChart3} 
                            color="bg-orange-500 text-orange-600" 
                        />
                    </div>

                    {/* --- MESSAGES --- */}
                    <AnimatePresence>
                        {message && message.text && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
                                    message.type === 'success'
                                        ? 'bg-green-50 text-green-800 border border-green-200'
                                        : 'bg-red-50 text-red-800 border border-red-200'
                                }`}
                            >
                                {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                {message.text}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* --- SEARCH & FILTER --- */}
                    <div className="relative mb-8">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="Search department name, code, or head..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-slate-700 font-bold outline-none focus:ring-4 focus:ring-lime-400/30 transition-all shadow-sm"
                        />
                    </div>

                    {/* --- CONTENT GRID/LIST --- */}
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            <AnimatePresence mode="wait">
                                {filteredDepts.length > 0 ? (
                                    filteredDepts.map((dept, idx) => {
                                        const { name: headName, avatar: headAvatar } = getHeadInfo(dept.head_id);
                                        return (
                                            <DepartmentCard
                                                key={dept.id}
                                                dept={dept}
                                                onEdit={openModal}
                                                onDelete={handleDeleteDept}
                                                onViewUsers={handleViewUsers}
                                                headName={headName}
                                                headAvatar={headAvatar}
                                            />
                                        );
                                    })
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="col-span-full text-center py-16"
                                    >
                                        <Building2 size={48} className="text-slate-300 mx-auto mb-4" />
                                        <p className="text-slate-500 font-medium">No departments found</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
                        >
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Dept Name</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Code</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Head</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Members</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredDepts.length > 0 ? (
                                        filteredDepts.map((dept) => {
                                            const { name: headName, avatar: headAvatar } = getHeadInfo(dept.head_id);
                                            return (
                                                <motion.tr 
                                                    key={dept.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="hover:bg-slate-50/80 transition"
                                                >
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-slate-900">{dept.name}</p>
                                                        <p className="text-xs text-slate-500 mt-1">{dept.description?.substring(0, 40) || 'No description'}...</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">{dept.code || 'N/A'}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {headName ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                                                                    {headAvatar}
                                                                </div>
                                                                <span className="text-sm font-semibold text-slate-700">{headName}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-slate-400 italic">Unassigned</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <Users size={14} className="text-slate-400" />
                                                            <span className="text-sm font-bold text-slate-700">{dept.members_count || 0}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className={`w-2 h-2 rounded-full ${dept.is_active ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <motion.button 
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => openModal(dept)}
                                                            className="text-indigo-600 hover:text-indigo-800 font-bold text-xs hover:bg-indigo-50 px-2 py-1 rounded transition"
                                                        >
                                                            Edit
                                                        </motion.button>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                                                No departments found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </motion.div>
                    )}

                </div>

                {/* --- MODAL (SLIDE OVER STYLE) --- */}
                <AnimatePresence>
                    {showModal && (
                        <>
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }}
                                onClick={() => setShowModal(false)}
                                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
                            />
                            <motion.div 
                                initial={{ x: '100%' }} 
                                animate={{ x: 0 }} 
                                exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[70] flex flex-col border-l border-slate-100"
                            >
                                {/* Modal Header */}
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                    <h2 className="text-xl font-black text-slate-900">
                                        {editingDept ? 'Edit Department' : 'New Department'}
                                    </h2>
                                    <motion.button 
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setShowModal(false)} 
                                        className="p-2 hover:bg-slate-200 rounded-full transition"
                                    >
                                        <X size={20} className="text-slate-500" />
                                    </motion.button>
                                </div>
                                
                                {/* Modal Content */}
                                <form onSubmit={handleSaveDept} className="flex-1 overflow-y-auto p-6 space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Department Name *</label>
                                        <input 
                                            type="text" 
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-lime-400 transition" 
                                            placeholder="e.g. Consumer Banking"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Code</label>
                                            <input 
                                                type="text" 
                                                value={formData.code}
                                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                                className="w-full p-3 bg-white border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-lime-400 transition" 
                                                placeholder="Ex: CB-01"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Description</label>
                                        <textarea 
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={3}
                                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 outline-none focus:ring-2 focus:ring-lime-400 transition" 
                                            placeholder="Short description of responsibilities..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Assign Head</label>
                                        <select
                                            value={formData.head_id}
                                            onChange={(e) => setFormData({ ...formData, head_id: e.target.value })}
                                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-lime-400 transition cursor-pointer"
                                        >
                                            <option value="">Select Department Head</option>
                                            {managerUsers.map(user => (
                                                <option key={user.id} value={user.id}>{user.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                            className="w-5 h-5 text-lime-400 rounded focus:ring-0 cursor-pointer accent-lime-400" 
                                        />
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Active Status</p>
                                            <p className="text-xs text-slate-500">Department is operational</p>
                                        </div>
                                    </div>
                                </form>

                                {/* Modal Footer */}
                                <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-3 px-4 bg-slate-200 text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-300 transition"
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleSaveDept}
                                        disabled={isLoading}
                                        className="flex-1 py-3 px-4 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Check size={18} /> Save Changes
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            </motion.div>
                        </>
                    )}

                    {/* --- USERS MODAL --- */}
                    <AnimatePresence>
                        {showUserModal && selectedDept && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setShowUserModal(false)}
                                    className="fixed inset-0 bg-black/50 z-40"
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl shadow-2xl z-50 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
                                >
                                    <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-900">{selectedDept.name}</h2>
                                            <p className="text-sm text-slate-500 mt-1">Department Members</p>
                                        </div>
                                        <button 
                                            onClick={() => setShowUserModal(false)}
                                            className="p-2 hover:bg-slate-100 rounded-full transition"
                                        >
                                            <X size={24} className="text-slate-600" />
                                        </button>
                                    </div>

                                    <div className="p-6">
                                        {selectedDept.users && selectedDept.users.length > 0 ? (
                                            <div className="grid gap-3">
                                                {selectedDept.users.map(user => (
                                                    <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                                                {(user.name || '?').charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900">{user.name}</p>
                                                                <p className="text-xs text-slate-500">{user.email}</p>
                                                            </div>
                                                        </div>
                                                        <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                                                            {user.role || 'User'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <Users className="w-8 h-8 text-slate-300 mx-auto mb-4" />
                                                <p className="text-slate-500 font-semibold">No users in this department</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </AnimatePresence>

            </AdminLayout>
        </>
    );
}
