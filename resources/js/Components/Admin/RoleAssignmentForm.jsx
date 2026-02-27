import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { rolePermissionApi, departmentApi } from '@/Utils/ApiClient';

const RoleAssignmentForm = ({ userId = null, onSuccess = null, onClose = null }) => {
    const [formData, setFormData] = useState({
        user_id: userId || '',
        role_id: '',
        department_id: '',
        bulk_user_ids: [],
    });

    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [userRoles, setUserRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isBulk, setIsBulk] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Use axios with proper error handling
            const [usersRes, rolesRes, depsRes] = await Promise.all([
                fetch('/api/users', {
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                    }
                }).then(async r => {
                    if (!r.ok) {
                        const errorText = await r.text();
                        throw new Error(`Users API error: ${r.status} - ${errorText}`);
                    }
                    return r.json();
                }),
                fetch('/api/roles', {
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                    }
                }).then(async r => {
                    if (!r.ok) {
                        const errorText = await r.text();
                        throw new Error(`Roles API error: ${r.status} - ${errorText}`);
                    }
                    return r.json();
                }),
                departmentApi.getTree(),
            ]);

            setUsers(usersRes.data || []);
            setRoles(rolesRes.data || []);
            setDepartments(depsRes ? flattenDepartments(depsRes) : []);

            // Load user roles if userId is provided
            if (userId) {
                const rolesData = await rolePermissionApi.getUserRoles(userId);
                setUserRoles(rolesData || []);
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to load data';
            setError(errorMsg);
            console.error('RoleAssignmentForm fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const flattenDepartments = (node, list = []) => {
        list.push({ id: node.id, name: node.name, code: node.code, level: node.level });
        if (node.children) {
            node.children.forEach(child => flattenDepartments(child, list));
        }
        return list;
    };

    const handleAssignRole = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!formData.user_id || !formData.role_id) {
            setError('User and Role are required');
            return;
        }

        try {
            setSubmitting(true);
            await rolePermissionApi.assignRole(
                formData.user_id,
                formData.role_id,
                formData.department_id || null
            );

            setSuccess('Role assigned successfully');
            
            // Refresh user roles if editing specific user
            if (userId) {
                const rolesData = await rolePermissionApi.getUserRoles(userId);
                setUserRoles(rolesData || []);
            }

            // Reset form for bulk assign
            if (isBulk) {
                setFormData({
                    ...formData,
                    role_id: '',
                    department_id: '',
                    bulk_user_ids: [],
                });
            } else if (onSuccess) {
                onSuccess();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to assign role');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleBulkAssign = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (formData.bulk_user_ids.length === 0 || !formData.role_id) {
            setError('Select users and role');
            return;
        }

        try {
            setSubmitting(true);
            await rolePermissionApi.bulkAssignRole(
                formData.bulk_user_ids,
                formData.role_id,
                formData.department_id || null
            );

            setSuccess(`Role assigned to ${formData.bulk_user_ids.length} users`);
            setFormData({
                ...formData,
                role_id: '',
                department_id: '',
                bulk_user_ids: [],
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to bulk assign roles');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemoveRole = async (roleId) => {
        try {
            await rolePermissionApi.removeRole(userId, roleId);
            const rolesData = await rolePermissionApi.getUserRoles(userId);
            setUserRoles(rolesData || []);
            setSuccess('Role removed successfully');
        } catch (err) {
            setError('Failed to remove role');
        }
    };

    const toggleUserSelect = (userId) => {
        setFormData(prev => ({
            ...prev,
            bulk_user_ids: prev.bulk_user_ids.includes(userId)
                ? prev.bulk_user_ids.filter(id => id !== userId)
                : [...prev.bulk_user_ids, userId],
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow"
        >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                    {userId ? 'Assign Role to User' : 'Role Assignment'}
                </h3>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded text-gray-600"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Messages */}
            {error && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 text-red-800"
                >
                    <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                </motion.div>
            )}

            {success && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="m-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3 text-green-800"
                >
                    <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
                    <span>{success}</span>
                </motion.div>
            )}

            <div className="p-6 space-y-6">
                {/* Mode Selector (if not userId specified) */}
                {!userId && (
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                checked={!isBulk}
                                onChange={() => setIsBulk(false)}
                                className="w-4 h-4"
                            />
                            <span className="text-gray-700">Single User</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                checked={isBulk}
                                onChange={() => setIsBulk(true)}
                                className="w-4 h-4"
                            />
                            <span className="text-gray-700">Bulk Assignment</span>
                        </label>
                    </div>
                )}

                {/* Single User Form */}
                {!isBulk && (
                    <form onSubmit={handleAssignRole} className="space-y-4">
                        {!userId && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select User
                                </label>
                                <select
                                    value={formData.user_id}
                                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">-- Choose User --</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.name} ({user.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Role <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.role_id}
                                onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">-- Choose Role --</option>
                                {roles.map(role => (
                                    <option key={role.id} value={role.id}>
                                        {role.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Department (Optional)
                            </label>
                            <select
                                value={formData.department_id}
                                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">-- No Department Restriction --</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>
                                        {'\u00A0'.repeat((dept.level || 0) * 2)}{dept.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader size={18} className="animate-spin" />
                                    Assigning...
                                </>
                            ) : (
                                <>
                                    <Plus size={18} />
                                    Assign Role
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* Bulk Assignment Form */}
                {isBulk && (
                    <form onSubmit={handleBulkAssign} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Users ({formData.bulk_user_ids.length} selected)
                            </label>
                            <div className="border border-gray-300 rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto">
                                {users.map(user => (
                                    <label key={user.id} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.bulk_user_ids.includes(user.id)}
                                            onChange={() => toggleUserSelect(user.id)}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-gray-700">{user.name} ({user.email})</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Role <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.role_id}
                                onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">-- Choose Role --</option>
                                {roles.map(role => (
                                    <option key={role.id} value={role.id}>
                                        {role.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Department (Optional)
                            </label>
                            <select
                                value={formData.department_id}
                                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">-- No Department Restriction --</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>
                                        {'\u00A0'.repeat((dept.level || 0) * 2)}{dept.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader size={18} className="animate-spin" />
                                    Assigning...
                                </>
                            ) : (
                                <>
                                    <Plus size={18} />
                                    Assign to {formData.bulk_user_ids.length} Users
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* Current Roles Display (if userId provided) */}
                {userId && userRoles.length > 0 && (
                    <div className="border-t pt-6">
                        <h4 className="font-medium text-gray-900 mb-3">Current Roles</h4>
                        <div className="space-y-2">
                            {userRoles.map(role => (
                                <div
                                    key={role.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900">{role.name}</p>
                                        {role.pivot?.department_id && (
                                            <p className="text-sm text-gray-600">
                                                Dept: {role.pivot.department_name}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleRemoveRole(role.id)}
                                        className="p-2 hover:bg-red-100 text-red-600 rounded"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default RoleAssignmentForm;
