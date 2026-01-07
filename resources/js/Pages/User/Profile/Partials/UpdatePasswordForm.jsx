import React, { useState, useRef } from 'react';
import { useForm } from '@inertiajs/react';
import { 
    Lock, Key, Eye, EyeOff, Shield, 
    AlertTriangle, CheckCircle2, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

        /* Strength Meter Animation */
        .strength-bar { transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease; }
    `}</style>
);

// --- Sub-Component: Password Input ---
const PasswordField = React.forwardRef(({ id, label, value, onChange, error, placeholder, autoComplete }, ref) => {
    const [show, setShow] = useState(false);

    return (
        <div className="space-y-2">
            <label htmlFor={id} className="text-sm font-bold text-slate-700 ml-1">
                {label}
            </label>
            <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={20} />
                </div>
                <input
                    id={id}
                    ref={ref}
                    type={show ? "text" : "password"}
                    className={`w-full pl-12 pr-12 py-3.5 input-wondr font-medium text-slate-900 placeholder:text-slate-400 ${error ? 'input-wondr-error' : ''}`}
                    value={value}
                    onChange={onChange}
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                />
                <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#005E54] transition-colors p-1 rounded-full hover:bg-slate-100"
                    tabIndex="-1"
                >
                    {show ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>
            {error && (
                <motion.p 
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600 font-medium ml-1 flex items-center gap-1"
                >
                    <AlertTriangle size={14} /> {error}
                </motion.p>
            )}
        </div>
    );
});

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    // Password Strength Logic
    const getStrength = (pass) => {
        let strength = 0;
        if (pass.length > 5) strength += 1;
        if (pass.length > 7) strength += 1;
        if (/[A-Z]/.test(pass)) strength += 1;
        if (/[0-9]/.test(pass)) strength += 1;
        if (/[^A-Za-z0-9]/.test(pass)) strength += 1;
        return strength; // 0 - 5
    };

    const strength = getStrength(data.password);
    const strengthColor = strength < 2 ? 'bg-red-500' : strength < 4 ? 'bg-amber-500' : 'bg-emerald-500';
    const strengthLabel = strength < 2 ? 'Lemah' : strength < 4 ? 'Sedang' : 'Kuat';

    const updatePassword = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current.focus();
                }
            },
        });
    };

    return (
        <section className={`wondr-font relative ${className}`}>
            <WondrStyles />

            <div className="relative">
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#005E54]/5 to-transparent rounded-bl-full -z-0 pointer-events-none"></div>

                <div className="relative z-10">
                    <form onSubmit={updatePassword} className="space-y-6">
                        
                        <PasswordField
                            id="current_password"
                            ref={currentPasswordInput}
                            label="Password Saat Ini"
                            value={data.current_password}
                            onChange={(e) => setData('current_password', e.target.value)}
                            error={errors.current_password}
                            autoComplete="current-password"
                            placeholder="Masukkan password lama Anda"
                        />

                        <div className="space-y-4 pt-2">
                            <PasswordField
                                id="password"
                                ref={passwordInput}
                                label="Password Baru"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                error={errors.password}
                                autoComplete="new-password"
                                placeholder="Minimal 8 karakter"
                            />
                            
                            {/* Strength Meter */}
                            <AnimatePresence>
                                {data.password.length > 0 && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }} 
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-slate-50 p-3 rounded-xl border border-slate-100"
                                    >
                                        <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
                                            <span>Kekuatan Password</span>
                                            <span className={`${strength < 2 ? 'text-red-500' : strength < 4 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                {strengthLabel}
                                            </span>
                                        </div>
                                        <div className="flex gap-1 h-1.5 w-full">
                                            {[1, 2, 3, 4, 5].map((step) => (
                                                <div key={step} className="h-full flex-1 bg-slate-200 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full strength-bar ${strength >= step ? strengthColor : 'bg-transparent'}`} 
                                                        style={{ width: strength >= step ? '100%' : '0%' }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-2">
                                            Tips: Gunakan kombinasi huruf besar, kecil, angka, dan simbol.
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <PasswordField
                            id="password_confirmation"
                            label="Konfirmasi Password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            error={errors.password_confirmation}
                            autoComplete="new-password"
                            placeholder="Ulangi password baru"
                        />

                        {/* Actions Footer */}
                        <div className="flex items-center gap-4 pt-6 border-t border-slate-100">
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
                                            <Key size={18} />
                                            Update Password
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
                                        className="flex items-center gap-2 text-[#005E54] font-bold text-sm bg-[#E6FFFA] px-4 py-2 rounded-xl border border-[#005E54]/10"
                                    >
                                        <CheckCircle2 size={16} />
                                        Password Berhasil Diubah!
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
