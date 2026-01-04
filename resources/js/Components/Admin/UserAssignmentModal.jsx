import React, { useState } from 'react';
import { X, Users, Search, CheckCircle, Loader } from 'lucide-react';
import axios from 'axios';

export default function UserAssignmentModal({ programId, isOpen, onClose, onSuccess }) {
    const [assignmentType, setAssignmentType] = useState('individual'); // individual or department
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [selectedDepartments, setSelectedDepartments] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    const departments = ['Retail', 'Corporate', 'Operations', 'Finance', 'HR', 'IT', 'Support'];

    // Fetch users on mount or when search changes
    React.useEffect(() => {
        if (assignmentType === 'individual' && isOpen) {
            fetchUsers();
        }
    }, [isOpen, assignmentType, searchQuery]);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const response = await axios.get('/api/admin/users', {
                params: { search: searchQuery, limit: 50 }
            });
            setUsers(response.data.users || []);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleAssign = async (e) => {
        e.preventDefault();

        if (assignmentType === 'individual' && selectedUsers.length === 0) {
            setError('Pilih minimal 1 user');
            return;
        }

        if (assignmentType === 'department' && selectedDepartments.length === 0) {
            setError('Pilih minimal 1 departemen');
            return;
        }

        const payload = {
            user_ids: assignmentType === 'individual' ? selectedUsers : [],
            departments: assignmentType === 'department' ? selectedDepartments : [],
            due_date: dueDate || null,
            mandatory: true,
        };

        setLoading(true);
        try {
            await axios.post(`/api/admin/training-programs/${programId}/assign`, payload);
            setSelectedUsers([]);
            setSelectedDepartments([]);
            setDueDate('');
            onSuccess && onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Error assigning training');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">Assign Training ke User/Departemen</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <form onSubmit={handleAssign} className="space-y-6">
                        {/* Assignment Type */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Cara Assign
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAssignmentType('individual');
                                        setSelectedDepartments([]);
                                    }}
                                    className={`p-4 rounded-lg border-2 transition text-center ${
                                        assignmentType === 'individual'
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-blue-300'
                                    }`}
                                >
                                    <Users className={`w-6 h-6 mx-auto mb-2 ${
                                        assignmentType === 'individual' ? 'text-blue-600' : 'text-gray-600'
                                    }`} />
                                    <div className={`text-sm font-medium ${
                                        assignmentType === 'individual' ? 'text-blue-600' : 'text-gray-700'
                                    }`}>
                                        Individual User
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setAssignmentType('department');
                                        setSelectedUsers([]);
                                    }}
                                    className={`p-4 rounded-lg border-2 transition text-center ${
                                        assignmentType === 'department'
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-blue-300'
                                    }`}
                                >
                                    <Users className={`w-6 h-6 mx-auto mb-2 ${
                                        assignmentType === 'department' ? 'text-blue-600' : 'text-gray-600'
                                    }`} />
                                    <div className={`text-sm font-medium ${
                                        assignmentType === 'department' ? 'text-blue-600' : 'text-gray-700'
                                    }`}>
                                        By Department
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Individual Selection */}
                        {assignmentType === 'individual' && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Pilih User ({selectedUsers.length} selected)
                                </label>

                                <div className="mb-4 relative">
                                    <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Cari user..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                                    {loadingUsers ? (
                                        <div className="p-4 text-center">
                                            <Loader className="w-5 h-5 animate-spin mx-auto" />
                                        </div>
                                    ) : users.length > 0 ? (
                                        users.map(user => (
                                            <label key={user.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 border-b border-gray-200 last:border-b-0 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.includes(user.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedUsers([...selectedUsers, user.id]);
                                                        } else {
                                                            setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                                                        }
                                                    }}
                                                    className="w-4 h-4 rounded"
                                                />
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900">{user.name}</p>
                                                    <p className="text-xs text-gray-500">{user.email} • {user.department}</p>
                                                </div>
                                                {selectedUsers.includes(user.id) && (
                                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                                )}
                                            </label>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-gray-500">
                                            Tidak ada user ditemukan
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Department Selection */}
                        {assignmentType === 'department' && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Pilih Departemen ({selectedDepartments.length} selected)
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {departments.map(dept => (
                                        <label key={dept} className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedDepartments.includes(dept)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedDepartments([...selectedDepartments, dept]);
                                                    } else {
                                                        setSelectedDepartments(selectedDepartments.filter(d => d !== dept));
                                                    }
                                                }}
                                                className="w-4 h-4 rounded"
                                            />
                                            <span className="text-sm font-medium text-gray-900">{dept}</span>
                                            {selectedDepartments.includes(dept) && (
                                                <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                                            )}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Due Date */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Due Date (Opsional)
                            </label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        {/* Summary */}
                        {(selectedUsers.length > 0 || selectedDepartments.length > 0) && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-900 font-medium">
                                    {assignmentType === 'individual'
                                        ? `✓ ${selectedUsers.length} user akan diassign`
                                        : `✓ Semua user di departemen ${selectedDepartments.join(', ')} akan diassign`
                                    }
                                </p>
                                {dueDate && (
                                    <p className="text-sm text-blue-800 mt-1">
                                        Due date: {new Date(dueDate).toLocaleDateString('id-ID')}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex gap-3 pt-4 border-t">
                            <button
                                type="submit"
                                disabled={loading || (assignmentType === 'individual' && selectedUsers.length === 0) || (assignmentType === 'department' && selectedDepartments.length === 0)}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
                            >
                                {loading ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        Assigning...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        Assign
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                            >
                                Batal
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
