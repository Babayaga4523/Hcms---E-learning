import React, { useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { motion } from 'framer-motion';
import { 
    Award, Download, Share2, Printer, ArrowLeft,
    Calendar, User, BookOpen, CheckCircle2, Star,
    Shield, QrCode
} from 'lucide-react';

// Main Component
export default function Certificate({ auth, certificate = {}, training = {} }) {
    const user = auth?.user || {};
    const certificateRef = useRef(null);

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = async () => {
        // In production, this would call an API to generate PDF
        alert('Downloading certificate as PDF...');
    };

    const handleShare = async () => {
        if (navigator.share) {
            await navigator.share({
                title: `Sertifikat ${training.title}`,
                text: `Saya telah menyelesaikan training ${training.title}!`,
                url: window.location.href
            });
        } else {
            // Fallback: copy link
            navigator.clipboard.writeText(window.location.href);
            alert('Link berhasil disalin!');
        }
    };

    return (
        <AppLayout user={user}>
            <Head title={`Sertifikat - ${training.title}`} />

            {/* Header */}
            <div className="mb-8">
                <Link 
                    href={`/training/${training.id}`}
                    className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition mb-4"
                >
                    <ArrowLeft size={18} />
                    Kembali ke Training
                </Link>
                
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">Sertifikat Kelulusan</h1>
                        <p className="text-slate-500 mt-1">{training.title}</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleShare}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition"
                        >
                            <Share2 size={18} />
                            Share
                        </button>
                        <button 
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition"
                        >
                            <Printer size={18} />
                            Print
                        </button>
                        <button 
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                        >
                            <Download size={18} />
                            Download PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Certificate Preview */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-slate-200 p-4 md:p-8 shadow-xl print:shadow-none print:border-0"
            >
                <div 
                    ref={certificateRef}
                    className="relative aspect-[1.414/1] bg-gradient-to-br from-slate-50 to-white rounded-2xl border-4 border-amber-200 p-8 md:p-12 overflow-hidden"
                >
                    {/* Decorative Elements */}
                    <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-amber-100 to-transparent rounded-br-full opacity-50" />
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-amber-100 to-transparent rounded-tl-full opacity-50" />
                    <div className="absolute top-4 right-4 w-20 h-20 border-2 border-amber-300 rounded-full opacity-30" />
                    <div className="absolute bottom-4 left-4 w-16 h-16 border-2 border-amber-300 rounded-full opacity-30" />
                    
                    {/* Certificate Content */}
                    <div className="relative h-full flex flex-col items-center justify-between text-center">
                        {/* Header */}
                        <div>
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <Shield className="text-amber-500" size={32} />
                                <span className="text-xl font-bold text-slate-400 tracking-widest uppercase">
                                    Certificate
                                </span>
                                <Shield className="text-amber-500" size={32} />
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-2">
                                Certificate of Completion
                            </h2>
                            <p className="text-lg text-slate-500">Sertifikat Kelulusan Training</p>
                        </div>

                        {/* Main Content */}
                        <div className="my-8">
                            <p className="text-slate-500 mb-4">Dengan ini dinyatakan bahwa</p>
                            <h3 className="text-3xl md:text-4xl font-black text-blue-600 mb-4 border-b-2 border-amber-300 pb-2 inline-block">
                                {certificate.user_name || user.name}
                            </h3>
                            <p className="text-slate-500 mb-4">telah berhasil menyelesaikan training</p>
                            <h4 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">
                                {training.title}
                            </h4>
                            
                            {/* Stats */}
                            <div className="flex items-center justify-center gap-8 mb-6">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <CheckCircle2 className="text-emerald-600" size={32} />
                                    </div>
                                    <p className="text-2xl font-bold text-emerald-600">{certificate.score || 95}</p>
                                    <p className="text-xs text-slate-500">Nilai Akhir</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <BookOpen className="text-blue-600" size={32} />
                                    </div>
                                    <p className="text-2xl font-bold text-blue-600">{certificate.materials_completed || 10}</p>
                                    <p className="text-xs text-slate-500">Materi Selesai</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <Star className="text-amber-600" size={32} fill="currentColor" />
                                    </div>
                                    <p className="text-2xl font-bold text-amber-600">{certificate.hours || 8}</p>
                                    <p className="text-xs text-slate-500">Jam Belajar</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="w-full">
                            <div className="flex items-center justify-between">
                                <div className="text-left">
                                    <p className="text-xs text-slate-400 mb-1">Tanggal Terbit</p>
                                    <p className="font-bold text-slate-700">
                                        {new Date(certificate.issued_at || new Date()).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                                
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center mb-2 mx-auto">
                                        <QrCode className="text-slate-400" size={48} />
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        ID: {certificate.certificate_number || 'CERT-2024-001'}
                                    </p>
                                </div>
                                
                                <div className="text-right">
                                    <p className="text-xs text-slate-400 mb-1">Ditandatangani oleh</p>
                                    <p className="font-bold text-slate-700">{training.instructor_name || 'Admin LMS'}</p>
                                    <p className="text-xs text-slate-500">Training Manager</p>
                                </div>
                            </div>
                            
                            {/* Award Badge */}
                            <div className="mt-6 pt-6 border-t border-amber-200 flex items-center justify-center gap-2">
                                <Award className="text-amber-500" size={24} />
                                <span className="text-sm text-slate-500">
                                    Sertifikat ini diterbitkan oleh HCMS E-Learning Platform
                                </span>
                                <Award className="text-amber-500" size={24} />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-xl border border-slate-200 p-6"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <User className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Penerima</p>
                            <p className="font-bold text-slate-900">{certificate.user_name || user.name}</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-xl border border-slate-200 p-6"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                            <Calendar className="text-amber-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Tanggal Selesai</p>
                            <p className="font-bold text-slate-900">
                                {new Date(certificate.completed_at || new Date()).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-xl border border-slate-200 p-6"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <CheckCircle2 className="text-emerald-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Status</p>
                            <p className="font-bold text-emerald-600">Verified</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print\\:shadow-none,
                    .print\\:shadow-none * {
                        visibility: visible;
                    }
                    .print\\:shadow-none {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                }
            `}</style>
        </AppLayout>
    );
}
