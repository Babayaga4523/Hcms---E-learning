import React, { useState, useRef } from 'react';
import { 
    Trash2, AlertTriangle, Loader2, Lock, Eye, EyeOff, X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Mocking Inertia & Helpers for Preview ---
const route = (name) => '#';

const useForm = (initialValues) => {
    const [data, setData] = useState(initialValues);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});

    const deleteReq = (url, options = {}) => {
        setProcessing(true);
        setErrors({});
        
        // Simulasi API call
        setTimeout(() => {
            setProcessing(false);
            // Simulasi: Anggap password benar untuk demo
            if (data.password) {
                if (options.onSuccess) options.onSuccess();
                if (options.onFinish) options.onFinish();
            } else {
                setErrors({ password: 'Password wajib diisi.' });
                if (options.onError) options.onError();
            }
        }, 1500);
    };

    const reset = () => setData(initialValues);
    const clearErrors = () => setErrors({});

    return { 
        data, 
        setData: (key, value) => setData(prev => ({ ...prev, [key]: value })), 
        delete: deleteReq, 
        processing, 
        reset, 
        errors, 
        clearErrors 
    };
};
// ------------------------------------

// --- Wondr Style System ---
const WondrStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        .wondr-font { font-family: 'Plus Jakarta Sans', sans-serif; }
        
        .input-wondr {
            background: #F8F9FA;
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            transition: all 0.3s ease;
        }
        .input-wondr:focus {
            background: #FFFFFF;
            border-color: #EF4444;
            box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
            outline: none;
        }
        .input-wondr-error {
            border-color: #EF4444;
            background: #FEF2F2;
        }
    `}</style>
);

// --- Modal Konfirmasi (Internal Component) ---
const DeleteModal = ({ show, onClose, onConfirm, processing, data, setData, error, passwordRef }) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#002824]/60 backdrop-blur-sm wondr-font">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl relative"
                    >
                        {/* Header Modal */}
                        <div className="p-8 pb-0 text-center">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-red-100">
                                <AlertTriangle className="text-red-600" size={32} />
                            </div>
                            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
                                Hapus Akun Permanen?
                            </h2>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                Tindakan ini <strong>tidak dapat dibatalkan</strong>. Semua data, riwayat, dan sumber daya Anda akan hilang selamanya.
                            </p>
                        </div>

                        {/* Form Modal */}
                        <form onSubmit={onConfirm} className="p-8">
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-slate-700 ml-1">
                                    Konfirmasi Password
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Lock size={20} />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        ref={passwordRef}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className={`w-full pl-12 pr-12 py-3.5 input-wondr font-medium text-slate-900 placeholder:text-slate-400 ${error ? 'input-wondr-error' : ''}`}
                                        placeholder="Masukkan password Anda"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {error && (
                                    <p className="text-sm text-red-600 font-bold ml-1 flex items-center gap-1">
                                        <AlertTriangle size={12} /> {error}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-3.5 rounded-2xl font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Menghapus...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={18} />
                                            Ya, Hapus
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default function DeleteUserForm({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);
        clearErrors();
        reset();
    };

    return (
        <section className={`wondr-font ${className}`}>
            <WondrStyles />

            <div className="bg-red-50/50 rounded-[32px] p-8 border-2 border-red-100 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-100 rounded-bl-full opacity-50 -z-10 pointer-events-none"></div>

                <div className="relative z-10">
                    <header className="flex items-start gap-4 mb-8">
                        <div className="p-3 bg-red-100 rounded-2xl text-red-600 shrink-0 border border-red-200">
                            <AlertTriangle size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-extrabold text-red-900 mb-2">
                                Zona Bahaya
                            </h2>
                            <p className="text-red-800/80 text-sm leading-relaxed max-w-xl">
                                Akun yang dihapus tidak dapat dipulihkan kembali. Pastikan Anda telah mencadangkan data penting sebelum melanjutkan proses ini.
                            </p>
                        </div>
                    </header>

                    <div className="flex justify-end">
                        <button
                            onClick={confirmUserDeletion}
                            className="group relative px-8 py-3.5 bg-white text-red-600 border-2 border-red-200 rounded-2xl font-bold shadow-sm hover:shadow-lg hover:border-red-600 hover:bg-red-600 hover:text-white transition-all duration-300 flex items-center gap-2"
                        >
                            <Trash2 size={18} className="group-hover:animate-bounce" />
                            Hapus Akun Saya
                        </button>
                    </div>
                </div>
            </div>

            <DeleteModal
                show={confirmingUserDeletion}
                onClose={closeModal}
                onConfirm={deleteUser}
                processing={processing}
                data={data}
                setData={setData}
                error={errors.password}
                passwordRef={passwordInput}
            />
        </section>
    );
}