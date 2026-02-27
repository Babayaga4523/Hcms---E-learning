import React, { useState } from 'react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { 
    User, Mail, Save, AlertTriangle, CheckCircle2, 
    Camera, Loader2, Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { validateEmail, validateRequired, validateMinLength, validateMaxLength } from '@/Utils/formValidation';

// --- Wondr Style System ---
const WondrStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        .wondr-font { font-family: 'Plus Jakarta Sans', sans-serif; }
        
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
        .input-wondr-error {
            border-color: #EF4444;
            background: #FEF2F2;
        }
        .input-wondr-error:focus {
            box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
            border-color: #EF4444;
        }
    `}</style>
);

export default function UpdateProfileInformation({ mustVerifyEmail = true, status, className = '' }) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name,
        email: user.email,
    });

    // Real-time validation state
    const [validationErrors, setValidationErrors] = useState({});

    // Real-time validation handler
    const handleFieldChange = (field, value) => {
        setData(field, value);
        
        // Clear the error for this field when user starts typing
        if (validationErrors[field]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    // Validate form before submit
    const validateForm = () => {
        const newErrors = {};

        // Name validation
        const nameError = validateRequired(data.name, 'Nama');
        if (nameError) newErrors.name = nameError;

        const nameLengthError = validateMinLength(data.name, 3, 'Nama');
        if (nameLengthError) newErrors.name = nameLengthError;

        // Email validation
        const emailError = validateEmail(data.email);
        if (emailError) newErrors.email = emailError;

        setValidationErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const submit = (e) => {
        e.preventDefault();
        
        // Validate before submit
        if (!validateForm()) {
            return;
        }

        patch(route('profile.update'));
    };

    return (
        <section className={`wondr-font relative ${className}`}>
            <WondrStyles />
            
            <div className="relative">
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#E6FFFA] to-transparent rounded-bl-full -z-0 opacity-50"></div>

                <div className="relative z-10">
                    <form onSubmit={submit} className="space-y-8">
                        
                        {/* Avatar Section (Visual Enhancement) */}
                        <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                            <div className="relative group cursor-pointer">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#005E54] to-[#002824] flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg">
                                    {data.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="absolute bottom-0 right-0 p-1.5 bg-[#D6F84C] rounded-full border-2 border-white shadow-sm group-hover:scale-110 transition-transform">
                                    <Camera size={14} className="text-[#002824]" />
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">{data.name}</h3>
                                <p className="text-xs text-slate-500 mb-2">Employee</p>
                                <button type="button" className="text-xs font-bold text-[#005E54] hover:underline">
                                    Ubah Foto Profil
                                </button>
                            </div>
                        </div>

                        {/* Inputs */}
                        <div className="space-y-6">
                            {/* Name Input */}
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-bold text-slate-700 ml-1">
                                    Nama Lengkap
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <User size={20} />
                                    </div>
                                    <input
                                        id="name"
                                        type="text"
                                        className={`w-full pl-12 pr-4 py-3.5 input-wondr font-medium text-slate-900 ${validationErrors.name || errors.name ? 'input-wondr-error' : ''}`}
                                        value={data.name}
                                        onChange={(e) => handleFieldChange('name', e.target.value)}
                                        required
                                        autoComplete="name"
                                        placeholder="Masukkan nama lengkap Anda"
                                    />
                                </div>
                                <AnimatePresence>
                                    {(validationErrors.name || errors.name) && (
                                        <motion.p 
                                            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            className="text-sm text-red-600 font-medium ml-1 flex items-center gap-1"
                                        >
                                            <AlertTriangle size={14} /> {validationErrors.name || errors.name}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Email Input */}
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-bold text-slate-700 ml-1">
                                    Alamat Email
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Mail size={20} />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        className={`w-full pl-12 pr-4 py-3.5 input-wondr font-medium text-slate-900 ${validationErrors.email || errors.email ? 'input-wondr-error' : ''}`}
                                        value={data.email}
                                        onChange={(e) => handleFieldChange('email', e.target.value)}
                                        required
                                        autoComplete="username"
                                        placeholder="nama@perusahaan.com"
                                    />
                                </div>
                                <AnimatePresence>
                                    {(validationErrors.email || errors.email) && (
                                        <motion.p 
                                            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            className="text-sm text-red-600 font-medium ml-1 flex items-center gap-1"
                                        >
                                            <AlertTriangle size={14} /> {validationErrors.email || errors.email}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>
                        </div>

                        {/* Email Verification Notice */}
                        <AnimatePresence>
                            {mustVerifyEmail && user.email_verified_at === null && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4"
                                >
                                    <div className="p-2 bg-amber-100 rounded-full text-amber-600 mt-0.5">
                                        <AlertTriangle size={18} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-amber-800 mb-1">Email Belum Diverifikasi</h4>
                                        <p className="text-sm text-amber-700 leading-relaxed mb-2">
                                            Alamat email Anda belum diverifikasi. Fitur tertentu mungkin dibatasi.
                                        </p>
                                        <Link
                                            href={route('verification.send')}
                                            method="post"
                                            as="button"
                                            className="text-sm font-bold text-amber-900 underline hover:no-underline hover:text-amber-700 transition-colors"
                                        >
                                            Kirim ulang email verifikasi
                                        </Link>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {status === 'verification-link-sent' && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-green-50 border border-green-100 rounded-2xl text-sm font-medium text-green-700 flex items-center gap-2"
                            >
                                <CheckCircle2 size={18} />
                                Tautan verifikasi baru telah dikirim ke email Anda.
                            </motion.div>
                        )}

                        {/* Actions Footer */}
                        <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                            <button
                                type="submit"
                                disabled={processing}
                                className="group relative px-8 py-3.5 bg-[#002824] text-[#D6F84C] rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    {processing ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Simpan Perubahan
                                        </>
                                    )}
                                </span>
                                {/* Hover Effect */}
                                <div className="absolute inset-0 bg-[#00403a] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                            </button>

                            <AnimatePresence>
                                {recentlySuccessful && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-2 text-[#005E54] font-bold text-sm bg-[#E6FFFA] px-4 py-2 rounded-xl"
                                    >
                                        <Sparkles size={16} />
                                        Berhasil Disimpan!
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
}
