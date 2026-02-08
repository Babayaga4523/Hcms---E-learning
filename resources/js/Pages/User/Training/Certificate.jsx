import React, { useRef, useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import showToast from '@/Utils/toast';
import axios from 'axios';
import { 
    Award, Download, Share2, Printer, ArrowLeft,
    Calendar, User, BookOpen, CheckCircle2, Star,
    Shield, QrCode
} from 'lucide-react';

// --- Wondr & Certificate Styles ---
const CertificateStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap');
        
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        
        .font-serif { font-family: 'Playfair Display', serif; }
        
        .wondr-green { color: #005E54; }
        .bg-wondr-green { background-color: #005E54; }
        
        .certificate-container {
            width: 100%;
            max-width: 1200px;
            aspect-ratio: 1.414 / 1; /* A4 Landscape */
            margin: 0 auto;
            position: relative;
            background: white;
            box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.15);
            overflow: hidden;
            color: #1e293b;
            border-radius: 8px;
        }

        /* Guilloche Pattern Simulation */
        .guilloche-bg {
            position: absolute;
            inset: 0;
            background-image: 
                radial-gradient(circle at 0% 0%, transparent 45%, rgba(0, 94, 84, 0.03) 46%, transparent 47%),
                radial-gradient(circle at 100% 0%, transparent 45%, rgba(0, 94, 84, 0.03) 46%, transparent 47%),
                radial-gradient(circle at 100% 100%, transparent 45%, rgba(0, 94, 84, 0.03) 46%, transparent 47%),
                radial-gradient(circle at 0% 100%, transparent 45%, rgba(0, 94, 84, 0.03) 46%, transparent 47%);
            background-size: 60px 60px;
            opacity: 0.6;
            pointer-events: none;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        .border-ornament {
            position: absolute;
            inset: 15px;
            border: 2px solid #D4AF37; /* Gold */
            outline: 10px solid #005E54; /* BNI Green */
            z-index: 10;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        .gold-seal {
            background: radial-gradient(circle, #FFD700 0%, #D4AF37 100%) !important;
            box-shadow: 0 4px 10px rgba(212, 175, 55, 0.4);
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        .glass-modal {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.5);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }

        /* Force colors in print */
        .print-color {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
        }

        @media print {
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            
            html, body {
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
                background: white !important;
            }
            
            body * { visibility: hidden; }
            
            .certificate-wrapper, 
            .certificate-wrapper * { 
                visibility: visible !important; 
            }
            
            .certificate-wrapper { 
                position: absolute; 
                left: 0; 
                top: 0; 
                width: 100%; 
                height: 100%; 
                margin: 0; 
                padding: 0;
                box-shadow: none !important;
                transform: none !important;
            }
            
            .certificate-container {
                width: 100% !important;
                max-width: 100% !important;
                height: 100% !important;
                border-radius: 0 !important;
                box-shadow: none !important;
            }
            
            .border-ornament {
                border: 2px solid #D4AF37 !important;
                outline: 10px solid #005E54 !important;
            }
            
            .bg-\\[\\#005E54\\], .bg-wondr-green {
                background-color: #005E54 !important;
            }
            
            .bg-\\[\\#D6F84C\\] {
                background-color: #D6F84C !important;
            }
            
            .bg-\\[\\#F15A23\\] {
                background-color: #F15A23 !important;
            }
            
            .text-\\[\\#005E54\\] {
                color: #005E54 !important;
            }
            
            .text-\\[\\#D6F84C\\] {
                color: #D6F84C !important;
            }
            
            .bg-slate-100 {
                background-color: #f1f5f9 !important;
            }
            
            .no-print { 
                display: none !important; 
            }
            
            @page { 
                size: A4 landscape; 
                margin: 0; 
            }
        }
    `}</style>
);


// Main Component - All data comes from backend via Inertia props
export default function Certificate({ auth, trainingId, training, certificate, eligible = false, requirements = {} }) {
    const user = auth?.user || {};
    const certificateRef = useRef(null);

    const handlePrint = () => {
        window.print();
    };

    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        // Prefer server-generated PDF download via API
        const certId = certificate?.id || trainingId;
        if (!certId) {
            showToast('Sertifikat belum tersedia untuk didownload.', 'warning');
            return;
        }

        try {
            setIsDownloading(true);

            // Pre-check eligibility via API; server returns eligible + requirements (may respond with 404/403 but include body)
            let meta = null;
            try {
                const metaRes = await axios.get(`/api/certificate/${certId}`, { withCredentials: true });
                meta = metaRes.data;
            } catch (metaErr) {
                if (metaErr?.response?.data) meta = metaErr.response.data;
            }

            if (meta && meta.eligible === false) {
                const req = meta.requirements || {};
                const parts = [];
                if ((req.materials_total || 0) > (req.materials_completed || 0)) parts.push(`Selesaikan semua materi (${req.materials_completed || 0}/${req.materials_total || 0})`);
                if (req.pretest_required && !req.pretest_passed) parts.push('Lulus Pre-Test');
                if (req.posttest_required && !req.posttest_passed) parts.push('Lulus Post-Test');

                const message = parts.length ? `Sertifikat terkunci: ${parts.join('; ')}` : (meta.message || 'Sertifikat belum tersedia.');
                showToast(message, 'warning');
                setIsDownloading(false);
                return;
            }

            // Proceed to download
            const res = await axios.get(`/api/certificate/${certId}/download`, { responseType: 'blob', withCredentials: true });

            // Attempt to extract filename from Content-Disposition header
            const cd = res.headers && (res.headers['content-disposition'] || res.headers['Content-Disposition']);
            let filename = `certificate-${certNumber}.pdf`;
            if (cd) {
                const match = cd.match(/filename\*=UTF-8''(.+)|filename="?([^";]+)"?/);
                if (match) {
                    filename = decodeURIComponent((match[1] || match[2] || filename));
                }
            }

            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            showToast('Mulai mengunduh sertifikat. Terima kasih!', 'success');
        } catch (error) {
            console.error('Download certificate failed:', error);
            if (error?.response?.status === 401) {
                // Force login so they can retry
                window.location.href = '/login';
                return;
            }

            if (error?.response?.status === 403 || error?.response?.status === 404) {
                const data = error?.response?.data || {};
                const req = data.requirements || {};
                const parts = [];
                if ((req.materials_total || 0) > (req.materials_completed || 0)) parts.push(`Selesaikan semua materi (${req.materials_completed || 0}/${req.materials_total || 0})`);
                if (req.pretest_required && !req.pretest_passed) parts.push('Lulus Pre-Test');
                if (req.posttest_required && !req.posttest_passed) parts.push('Lulus Post-Test');

                const message = parts.length ? `Sertifikat terkunci: ${parts.join('; ')}` : (data.message || 'Akses ditolak.');
                showToast(message, 'warning');
                return;
            }

            const serverMsg = error?.response?.data?.message || 'Gagal mengunduh sertifikat. Silakan coba lagi.';
            showToast(serverMsg, 'error');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleShare = async () => {
        const shareText = `Saya telah menyelesaikan training "${training?.title || 'Training'}"!`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Sertifikat ${training?.title || 'Training'}`,
                    text: shareText,
                    url: window.location.href
                });
            } catch (e) {
                // User cancelled or error
                console.log('Share cancelled');
            }
        } else {
            // Fallback: copy link
            try {
                await navigator.clipboard.writeText(window.location.href);
                showToast('Link sertifikat berhasil disalin!', 'success');
            } catch (e) {
                showToast('Gagal menyalin link', 'error');
            }
        }
    };
    
    // Generate certificate number
    const certNumber = certificate?.certificate_number || 
        `BNIF-${new Date().getFullYear()}-${String(trainingId || 0).padStart(3, '0')}-${String(user?.id || 0).padStart(4, '0')}`;
    
    // Use backend-provided data directly (avoid hardcoded defaults)
    const displayName = certificate?.user_name || user?.name || '';
    // Note: final score and duration are intentionally not shown on the certificate per policy
    const displayMaterials = certificate?.materials_completed ?? training?.materials_count ?? null;
    const displayDate = certificate?.issued_at || certificate?.completed_at || null;
    const displayTrainingTitle = training?.title || certificate?.training_title || '';
    const displayInstructor = certificate?.instructor_name || training?.instructor_name || training?.instructor?.name || '';
    const displayInstructorTitle = training?.instructor?.title || '';

    // Render helper
    const formatDate = (iso) => {
        if (!iso) return '-';
        try { return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return iso; }
    };

    return (
        <AppLayout user={user}>
            <CertificateStyles />
            <Head title={`Sertifikat - ${displayTrainingTitle}`} />

            <div className="min-h-screen py-6 md:py-8 px-4 flex flex-col items-center justify-start bg-slate-100">
                
                {/* --- Top Action Bar --- */}
                <div className="w-full max-w-[1200px] mb-6 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
                    <Link 
                        href={`/training/${trainingId || training?.id}`}
                        className="flex items-center gap-2 text-slate-500 hover:text-[#005E54] transition font-bold"
                    >
                        <div className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition">
                            <ArrowLeft size={20} />
                        </div>
                        <span className="text-sm">Kembali ke Training</span>
                    </Link>

                    <div className="flex gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
                        <button 
                            onClick={() => { if (!eligible) return showToast('Sertifikat belum tersedia. Lengkapi persyaratan terlebih dahulu.', 'warning'); handleShare(); }}
                            className={`flex items-center gap-2 px-4 py-2 ${eligible ? 'text-slate-600 hover:bg-slate-50' : 'text-slate-400 cursor-not-allowed'} rounded-xl transition font-medium text-sm`}
                        >
                            <Share2 size={16} /> Share
                        </button>
                        <button 
                            onClick={() => { if (!eligible) return showToast('Sertifikat belum tersedia. Lengkapi persyaratan terlebih dahulu.', 'warning'); handleDownload(); }}
                            disabled={isDownloading || !eligible}
                            className={`flex items-center gap-2 px-4 py-2 ${isDownloading ? 'bg-slate-200 text-slate-500' : (eligible ? 'bg-[#005E54] hover:bg-[#004b43] text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed')} rounded-xl transition font-bold text-sm shadow-lg ${isDownloading ? '' : 'shadow-[#005E54]/20'}`}
                        >
                            {isDownloading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Download size={16} />
                            )}
                            {isDownloading ? 'Mengunduh...' : 'Download PDF'}
                        </button>
                    </div>
                </div>

                {/* --- Show eligibility message if not eligible --- */}
                {!eligible && (
                    <div className="w-full max-w-[1200px] mb-6 px-4">
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md text-sm text-slate-800">
                            <div className="font-bold mb-1">Sertifikat belum tersedia</div>
                            <div className="text-xs mb-2">Selesaikan persyaratan berikut untuk membuka sertifikat:</div>
                            <ul className="text-xs list-disc pl-5 space-y-1">
                                {requirements?.materials_total > (requirements?.materials_completed || 0) && (
                                    <li>{`Selesaikan semua materi (${requirements?.materials_completed || 0}/${requirements?.materials_total})`}</li>
                                )}
                                {requirements?.pretest_required && !requirements?.pretest_passed && (
                                    <li>Lewati dan lulus <strong>Pre-Test</strong></li>
                                )}
                                {requirements?.posttest_required && !requirements?.posttest_passed && (
                                    <li>Lewati dan lulus <strong>Post-Test</strong></li>
                                )}
                            </ul>
                        </div>
                    </div>
                )}

                {/* --- Certificate Preview Wrapper --- */}
                <div className="certificate-wrapper w-full flex justify-center px-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        ref={certificateRef}
                        className="certificate-container print-color"
                    >
                        {/* Background Patterns */}
                        <div className="guilloche-bg print-color"></div>
                        <div className="border-ornament print-color"></div>
                        
                        {/* Top Left Decoration */}
                        <div className="absolute top-0 left-0 w-64 h-64 bg-[#D6F84C] opacity-10 rounded-br-full z-0 print-color"></div>
                        <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#005E54] opacity-5 rounded-tl-full z-0 print-color"></div>

                        {/* Content Layer */}
                        <div className="relative z-20 flex flex-col h-full p-12 md:p-16 justify-between text-center print-color">
                            
                            {/* Header: Logos */}
                            <div className="flex justify-between items-center mb-4 px-4 print-color">
                                <div className="flex items-center gap-3">
                                    {/* BNI Logo Simulation */}
                                    <div className="flex flex-col items-start print-color">
                                        <div className="flex items-center gap-1">
                                            <div className="h-6 w-2 bg-[#F15A23] print-color"></div>
                                            <h1 className="text-2xl font-bold tracking-tighter text-[#005E54] print-color">BNI</h1>
                                        </div>
                                        <span className="text-[10px] tracking-[0.2em] font-bold text-[#005E54] uppercase ml-3 print-color">Finance</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h3 className="font-extrabold text-[#D6F84C] bg-[#005E54] px-3 py-1 text-sm tracking-widest uppercase rounded print-color"> Certificate
                                        Wondr Learning
                                    </h3>
                                </div>
                            </div>

                            {/* Main Title */}
                            <div className="space-y-2 mt-4 print-color">
                                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#005E54] tracking-wide font-bold print-color">
                                    Sertifikat Kelulusan
                                </h1>
                                <p className="text-slate-400 font-medium tracking-widest uppercase text-xs print-color">
                                    Certificate of Completion
                                </p>
                            </div>

                            {/* Recipient */}
                            <div className="my-6 md:my-8 print-color">
                                <p className="text-slate-500 mb-4 md:mb-6 italic text-base md:text-lg print-color">Diberikan kepada:</p>
                                <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-slate-800 font-bold border-b-2 border-[#D4AF37] pb-4 inline-block px-8 md:px-12 print-color">
                                    {displayName}
                                </h2>
                            </div>

                            {/* Course Details */}
                            <div className="mb-6 md:mb-8 print-color">
                                <p className="text-slate-500 mb-2 text-base md:text-lg print-color">
                                    Telah menyelesaikan dengan sangat baik program pelatihan:
                                </p>
                                <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#005E54] mb-4 print-color">
                                    {displayTrainingTitle}
                                </h3>
                                <div className="flex flex-wrap justify-center gap-3 md:gap-6 text-xs md:text-sm text-slate-600 font-medium print-color">

                                    <span className="px-3 py-1 bg-slate-100 rounded-full border border-slate-200 print-color">
                                        Tanggal: <strong>{formatDate(displayDate)}</strong>
                                    </span>
                                    <span className="px-3 py-1 bg-slate-100 rounded-full border border-slate-200 print-color">
                                        Materi: <strong>{(certificate?.materials_completed ?? displayMaterials) + ' / ' + (training?.materials_count ?? displayMaterials)}</strong>
                                    </span>
                                </div>
                            </div>

                            {/* Footer: Signatures & QR */}
                            <div className="flex justify-between items-end px-4 md:px-8 mt-auto print-color">
                                
                                {/* Signature 1 */}
                                <div className="text-center w-36 md:w-48 print-color">
                                    <div className="h-16 md:h-20 flex items-end justify-center mb-2">
                                        {/* Signature Simulation */}
                                        <svg width="120" height="50" viewBox="0 0 150 60" className="opacity-80 print-color">
                                            <path d="M10,50 Q40,10 70,50 T140,40" stroke="#005E54" strokeWidth="2" fill="none" />
                                        </svg>
                                    </div>
                                    <div className="border-t border-slate-300 pt-2 print-color">
                                        <p className="font-bold text-slate-800 text-sm md:text-base print-color">{displayInstructor}</p>
                                        <p className="text-[10px] md:text-xs text-slate-500 uppercase tracking-wide print-color">{displayInstructorTitle}</p>
                                    </div>
                                </div>

                                {/* Seal & QR */}
                                <div className="flex flex-col items-center print-color">
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full gold-seal flex items-center justify-center relative mb-2 print-color">
                                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-white/50 flex items-center justify-center">
                                            <Shield className="w-8 h-8 md:w-10 md:h-10 text-white drop-shadow-md" />
                                        </div>
                                        <div className="absolute bottom-0 right-0 bg-white p-1 rounded shadow-md print-color">
                                            <QrCode size={20} className="text-slate-800" />
                                        </div>
                                    </div>
                                    <p className="text-[9px] md:text-[10px] text-slate-400 font-mono tracking-wider print-color">
                                        ID: {certNumber}
                                    </p>
                                </div>

                                {/* Signature 2 (Head of Learning) */}
                                <div className="text-center w-36 md:w-48 print-color">
                                    <div className="h-16 md:h-20 flex items-end justify-center mb-2">
                                        <svg width="120" height="50" viewBox="0 0 150 60" className="opacity-80 print-color">
                                            <path d="M10,30 Q50,60 90,30 T140,50" stroke="#005E54" strokeWidth="2" fill="none" />
                                        </svg>
                                    </div>
                                    <div className="border-t border-slate-300 pt-2 print-color">
                                        <p className="font-bold text-slate-800 text-sm md:text-base print-color">Rina Kusuma</p>
                                        <p className="text-[10px] md:text-xs text-slate-500 uppercase tracking-wide print-color">Head of People & Culture</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </motion.div>
                </div>

                {/* --- Security Note --- */}
                <div className="max-w-[1200px] w-full mt-6 text-center no-print">
                    <p className="text-slate-400 text-xs flex items-center justify-center gap-2">
                        <CheckCircle2 size={12} className="text-[#005E54]" />
                        Sertifikat ini sah dan diterbitkan secara digital oleh BNI Finance Learning System.
                    </p>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-[1200px] w-full no-print">
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
                                <p className="font-bold text-slate-900">{displayName}</p>
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
                                    {new Date(displayDate).toLocaleDateString('id-ID', {
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

            </div>
        </AppLayout>
    );
}
