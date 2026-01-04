import React, { useState } from 'react';
import { X, Mail, Lock, User, Shield, AlertCircle, CheckCircle, Loader } from 'lucide-react';

export default function UserForm({ onClose, onSuccess, onError, editUser = null }) {
    const [formData, setFormData] = useState({
        name: editUser?.name || '',
        email: editUser?.email || '',
        password: '',
        passwordConfirm: '',
        role: editUser?.role || 'user',
        status: editUser?.status || 'active',
    });

    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        // Clear error for this field
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Nama harus diisi';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email harus diisi';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Format email tidak valid';
        }

        if (!editUser && !formData.password) {
            newErrors.password = 'Password harus diisi';
        } else if (formData.password && formData.password.length < 8) {
            newErrors.password = 'Password minimal 8 karakter';
        }

        if (formData.password && formData.password !== formData.passwordConfirm) {
            newErrors.passwordConfirm = 'Password tidak cocok';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            const url = editUser ? `/api/admin/users/${editUser.id}` : '/api/admin/users';
            const method = editUser ? 'PUT' : 'POST';

            const payload = {
                name: formData.name,
                email: formData.email,
                role: formData.role,
                status: formData.status,
            };

            if (formData.password) {
                payload.password = formData.password;
            }

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: data.message });
                setTimeout(() => {
                    onSuccess(data.message);
                }, 1500);
            } else if (response.status === 422) {
                // Validation errors
                setErrors(data.messages || {});
                setMessage({ type: 'error', text: 'Validasi gagal' });
                if (onError) onError('Validasi gagal');
            } else {
                setMessage({ type: 'error', text: data.error || 'Terjadi kesalahan' });
                if (onError) onError(data.error || 'Terjadi kesalahan');
            }
        } catch (error) {
            console.error('Error:', error);
            setMessage({ type: 'error', text: 'Error mengkomunikasikan dengan server' });
            if (onError) onError('Error mengkomunikasikan dengan server');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700/50 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700/50 px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
                            <User className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-white">
                            {editUser ? 'Edit User' : 'Tambah User Baru'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700/50 rounded-lg transition-all duration-200"
                    >
                        <X className="w-5 h-5 text-slate-400 hover:text-white" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Alert Messages */}
                    {message.text && (
                        <div className={`p-4 rounded-lg flex items-center gap-3 backdrop-blur-md border transition-all duration-300 ${
                            message.type === 'success'
                                ? 'bg-green-500/10 text-green-300 border-green-500/30'
                                : 'bg-red-500/10 text-red-300 border-red-500/30'
                        }`}>
                            {message.type === 'success' ? (
                                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            ) : (
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            )}
                            <span className="text-sm font-medium">{message.text}</span>
                        </div>
                    )}

                    {/* Name Field */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2.5">
                            Nama Lengkap
                        </label>
                        <div className="relative">
                            <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Masukkan nama lengkap"
                                className={`w-full pl-12 pr-4 py-3 bg-slate-700/50 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 ${
                                    errors.name ? 'border-red-500/50 focus:ring-red-500/50' : 'border-slate-600/50'
                                }`}
                            />
                        </div>
                        {errors.name && (
                            <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" /> {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Email Field */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2.5">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="nama@email.com"
                                className={`w-full pl-12 pr-4 py-3 bg-slate-700/50 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 ${
                                    errors.email ? 'border-red-500/50 focus:ring-red-500/50' : 'border-slate-600/50'
                                }`}
                            />
                        </div>
                        {errors.email && (
                            <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" /> {errors.email}
                            </p>
                        )}
                    </div>

                    {/* Password Field */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2.5">
                            Password {!editUser && '(Required)'}
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder={editUser ? 'Kosongkan jika tidak ingin mengubah' : 'Minimal 8 karakter'}
                                className={`w-full pl-12 pr-4 py-3 bg-slate-700/50 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 ${
                                    errors.password ? 'border-red-500/50 focus:ring-red-500/50' : 'border-slate-600/50'
                                }`}
                            />
                        </div>
                        {errors.password && (
                            <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" /> {errors.password}
                            </p>
                        )}
                    </div>

                    {/* Password Confirmation Field */}
                    {formData.password && (
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2.5">
                                Konfirmasi Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                                <input
                                    type="password"
                                    name="passwordConfirm"
                                    value={formData.passwordConfirm}
                                    onChange={handleChange}
                                    placeholder="Ketik ulang password"
                                    className={`w-full pl-12 pr-4 py-3 bg-slate-700/50 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 ${
                                        errors.passwordConfirm ? 'border-red-500/50 focus:ring-red-500/50' : 'border-slate-600/50'
                                    }`}
                                />
                            </div>
                            {errors.passwordConfirm && (
                                <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" /> {errors.passwordConfirm}
                                </p>
                            )}
                            {formData.password && formData.password !== formData.passwordConfirm && (
                                <p className="mt-2 text-sm text-yellow-400 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" /> Password tidak cocok
                                </p>
                            )}
                        </div>
                    )}

                    {/* Role Field */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2.5">
                            Role
                        </label>
                        <div className="relative">
                            <Shield className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 pointer-events-none" />
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 appearance-none cursor-pointer"
                            >
                                <option value="user" className="bg-slate-800">Employee</option>
                                <option value="admin" className="bg-slate-800">Admin</option>
                            </select>
                        </div>
                    </div>

                    {/* Status Field */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2.5">
                            Status
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-3 cursor-pointer flex-1">
                                <input
                                    type="radio"
                                    name="status"
                                    value="active"
                                    checked={formData.status === 'active'}
                                    onChange={handleChange}
                                    className="w-4 h-4 accent-green-500"
                                />
                                <span className="text-sm text-slate-300">Aktif</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer flex-1">
                                <input
                                    type="radio"
                                    name="status"
                                    value="inactive"
                                    checked={formData.status === 'inactive'}
                                    onChange={handleChange}
                                    className="w-4 h-4 accent-red-500"
                                />
                                <span className="text-sm text-slate-300">Nonaktif</span>
                            </label>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex gap-3 pt-4 border-t border-slate-700/50">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-3 border border-slate-600/50 text-slate-300 rounded-lg hover:bg-slate-700/50 transition-all duration-200 font-medium hover:border-slate-500/50 disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || (formData.password && formData.password !== formData.passwordConfirm)}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 transition-all duration-200 font-medium hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-2"
                        >
                            {isSubmitting && (
                                <Loader className="w-4 h-4 animate-spin" />
                            )}
                            {editUser ? 'Simpan Perubahan' : 'Buat User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
