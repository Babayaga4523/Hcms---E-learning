import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { 
    Mail, Lock, Eye, EyeOff, ArrowRight, Check, 
    Loader2, ShieldCheck, CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

// --- Wondr Style System ---
const WondrStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #FFFFFF; color: #1e293b; }
        
        .wondr-dark { background-color: #002824; }
        .wondr-green { color: #005E54; }
        .wondr-lime-text { color: #D6F84C; }
        
        .floating-input {
            transition: all 0.2s ease;
        }
        .floating-input:focus + label,
        .floating-input:not(:placeholder-shown) + label {
            transform: translateY(-24px) scale(0.85);
            color: #005E54;
        }
        
        .hero-pattern {
            background-image: radial-gradient(#ffffff 1px, transparent 1px);
            background-size: 40px 40px;
            opacity: 0.1;
        }

        .custom-checkbox:checked {
            background-color: #005E54;
            border-color: #005E54;
        }
    `}</style>
);

// --- Components ---

const InputField = ({ id, type, label, value, onChange, icon: Icon, error, isPassword }) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
        <div className="relative mb-6">
            <div className="relative">
                <input
                    id={id}
                    type={inputType}
                    value={value}
                    onChange={onChange}
                    autoComplete={type === 'email' ? 'username' : 'current-password'}
                    className={`floating-input block w-full px-4 py-4 pl-12 bg-slate-50 border-2 rounded-xl text-slate-900 placeholder-transparent focus:outline-none focus:bg-white transition-colors ${
                        error 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-slate-100 focus:border-[#005E54]'
                    }`}
                    placeholder={label}
                />
                <label 
                    htmlFor={id}
                    className={`absolute left-12 top-4 text-slate-400 pointer-events-none transition-all duration-200 origin-[0] ${
                        error ? 'text-red-400' : ''
                    }`}
                >
                    {label}
                </label>
                
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${error ? 'text-red-400' : 'text-slate-400'}`}>
                    <Icon size={20} />
                </div>

                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                )}
            </div>
            {error && (
                <motion.p 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-500 mt-1 ml-1 font-medium"
                >
                    {error}
                </motion.p>
            )}
        </div>
    );
};

// --- Main Page ---

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Login - Wondr Learning" />
            <WondrStyles />
            
            <div className="min-h-screen flex w-full">
                {/* Left Side: Brand & Visuals */}
                <div className="hidden lg:flex w-1/2 bg-[#002824] relative overflow-hidden items-center justify-center p-12">
                    <div className="hero-pattern absolute inset-0"></div>
                    
                    {/* Abstract Orbs */}
                    <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#005E54] rounded-full blur-[128px] opacity-40"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#D6F84C] rounded-full blur-[150px] opacity-10"></div>

                    <div className="relative z-10 max-w-lg">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-[#D6F84C] rounded-2xl flex items-center justify-center shadow-lg shadow-[#D6F84C]/20">
                                <span className="font-black text-2xl text-[#002824]">W</span>
                            </div>
                            <span className="text-2xl font-bold text-white tracking-tight">Wondr Learning</span>
                        </div>

                        <h1 className="text-5xl font-extrabold text-white leading-tight mb-6">
                            Tingkatkan Potensi <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D6F84C] to-emerald-400">
                                Tanpa Batas.
                            </span>
                        </h1>
                        
                        <p className="text-lg text-slate-300 leading-relaxed mb-8">
                            Platform pembelajaran terintegrasi untuk pengembangan karir profesional Anda. Akses ribuan materi, kuis interaktif, dan sertifikasi resmi.
                        </p>

                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                                <ShieldCheck size={16} className="text-[#D6F84C]" />
                                <span className="text-sm font-medium text-white">Secure Platform</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                                <Check size={16} className="text-[#D6F84C]" />
                                <span className="text-sm font-medium text-white">Official Certification</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-white">
                    <div className="w-full max-w-md">
                        
                        {/* Mobile Logo (Visible only on small screens) */}
                        <div className="lg:hidden flex justify-center mb-8">
                            <div className="w-12 h-12 bg-[#002824] rounded-xl flex items-center justify-center text-[#D6F84C] font-black text-2xl">
                                W
                            </div>
                        </div>

                        <div className="text-center lg:text-left mb-10">
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">Selamat Datang! 👋</h2>
                            <p className="text-slate-500">Silakan masuk ke akun Anda untuk melanjutkan.</p>
                        </div>

                        {status && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium flex items-center gap-2"
                            >
                                <CheckCircle size={18} />
                                {status}
                            </motion.div>
                        )}

                        <form onSubmit={submit}>
                            <InputField
                                id="email"
                                type="email"
                                label="Email Address"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                icon={Mail}
                                error={errors.email}
                            />

                            <InputField
                                id="password"
                                type="password"
                                label="Password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                icon={Lock}
                                error={errors.password}
                                isPassword
                            />

                            <div className="flex items-center justify-between mb-8">
                                <label className="flex items-center cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={data.remember}
                                            onChange={(e) => setData('remember', e.target.checked)}
                                        />
                                        <div className={`w-5 h-5 border-2 rounded transition-colors flex items-center justify-center ${
                                            data.remember ? 'bg-[#005E54] border-[#005E54]' : 'border-slate-300 group-hover:border-[#005E54]'
                                        }`}>
                                            {data.remember && <Check size={12} className="text-white" />}
                                        </div>
                                    </div>
                                    <span className="ml-2 text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Ingat saya</span>
                                </label>

                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="text-sm font-bold text-[#005E54] hover:underline"
                                    >
                                        Lupa Password?
                                    </Link>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-4 bg-[#002824] text-white rounded-xl font-bold text-lg shadow-lg hover:bg-[#00403a] hover:shadow-xl transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 size={24} className="animate-spin text-[#D6F84C]" />
                                        Masuk...
                                    </>
                                ) : (
                                    <>
                                        Masuk Sekarang <ArrowRight size={20} className="text-[#D6F84C]" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white text-slate-400 font-medium">Atau masuk dengan</span>
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-4">
                                <button type="button" className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition font-bold text-slate-700 text-sm">
                                    <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                                        <path d="M12.0003 20.45c4.6667 0 8.45-3.7833 8.45-8.45 0-4.6667-3.7833-8.45-8.45-8.45-4.6667 0-8.45 3.7833-8.45 8.45 0 4.6667 3.7833 8.45 8.45 8.45Z" fill="#fff" />
                                        <path d="M20.3083 11.2333h-8.3083v3.1333h4.9417c-0.1917 1.35-1.5583 3.9167-4.9417 3.9167-2.975 0-5.4-2.425-5.4-5.4 0-2.975 2.425-5.4 5.4-5.4 1.2833 0 2.4417 0.4667 3.3583 1.3417l2.4583-2.4583c-1.575-1.4667-3.6083-2.3583-5.8167-2.3583-4.8083 0-8.7083 3.9-8.7083 8.7083s3.9 8.7083 8.7083 8.7083c4.35 0 8.55-3.1417 8.55-8.7083 0-0.6417-0.075-1.225-0.1417-1.8833Z" fill="#4285F4" />
                                    </svg>
                                    Google
                                </button>
                                <button type="button" className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition font-bold text-slate-700 text-sm">
                                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M13.6005 8.3999C13.6625 7.03711 14.5427 5.86738 15.7483 5.30005C15.011 3.52261 13.2599 2.40002 11.4005 2.40002C8.63914 2.40002 6.40051 4.63865 6.40051 7.39996C6.40051 8.58249 6.81177 9.6681 7.50051 10.5181C5.17939 10.9701 3.40051 12.9866 3.40051 15.4C3.40051 18.1614 5.63914 20.4 8.40051 20.4C9.58305 20.4 10.6687 19.9887 11.5187 19.3C11.9707 21.6211 13.9872 23.4 16.4005 23.4C19.1619 23.4 21.4005 21.1614 21.4005 18.4C21.4005 16.1465 19.919 14.2389 17.8937 13.6265C17.7816 13.5855 17.6659 13.5519 17.5475 13.5262C16.8833 13.3821 16.1821 13.4357 15.5451 13.6617C14.4172 14.062 13.6005 15.1437 13.6005 16.4C13.6005 16.6342 13.6301 16.8617 13.6865 17.0799C12.6042 16.368 11.8005 15.2098 11.8005 13.9C11.8005 11.6908 13.6005 9.90002 15.8005 9.90002C16.2976 9.90002 16.7725 9.99066 17.2146 10.1553C16.657 9.07147 15.2281 8.3999 13.6005 8.3999Z" />
                                    </svg>
                                    Apple
                                </button>
                            </div>
                        </div>

                        <div className="mt-12 text-center">
                            <p className="text-slate-400 text-xs">
                                &copy; {new Date().getFullYear()} BNI Corp University. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
