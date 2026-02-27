import React, { useRef, useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { motion } from 'framer-motion';
import showToast from '@/Utils/toast';
import { validateCertificate } from '@/Utils/validators';
import axiosInstance from '@/Services/axiosInstance';
import { API_ENDPOINTS } from '@/Config/api';
import { handleAuthError } from '@/Utils/authGuard';
import { 
    Download, Share2, ArrowLeft,
    Loader2, User, Calendar, CheckCircle2
} from 'lucide-react';

export default function Certificate({ auth, trainingId, training, certificate, eligible = false, requirements = {} }) {
    const user = auth?.user || {};
    const certificateRef = useRef(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = async () => {
        const certId = certificate?.id || trainingId;
        if (!certId) {
            showToast('Sertifikat belum tersedia untuk didownload.', 'warning');
            return;
        }

        try {
            setIsDownloading(true);

            let meta = null;
            try {
                const metaRes = await axiosInstance.get(API_ENDPOINTS.CERTIFICATE_DETAIL(certId), { withCredentials: true });
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

            const res = await axiosInstance.get(API_ENDPOINTS.CERTIFICATE_DOWNLOAD(certId), { responseType: 'blob', withCredentials: true });

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
            if (handleAuthError(error)) return;

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
                console.log('Share cancelled');
            }
        } else {
            try {
                await navigator.clipboard.writeText(window.location.href);
                showToast('Link sertifikat berhasil disalin!', 'success');
            } catch (e) {
                showToast('Gagal menyalin link', 'error');
            }
        }
    };
    
    const certNumber = certificate?.certificate_number || 
        `BNIF-${new Date().getFullYear()}-${String(trainingId || 0).padStart(3, '0')}-${String(user?.id || 0).padStart(4, '0')}`;
    
    let validatedCert = null;
    try {
        if (certificate && typeof certificate === 'object') {
            validatedCert = validateCertificate(certificate);
        }
    } catch (error) {
        console.warn('Certificate validation error:', error);
        validatedCert = {
            user_name: user?.name || '',
            materials_completed: 0,
            issued_at: null,
            training_title: training?.title || '',
        };
    }
    
    const displayName = validatedCert?.user_name || certificate?.user_name || user?.name || '';
    const materialsCompleted = validatedCert?.materials_completed ?? certificate?.materials_completed;
    const trainingMaterials = training?.materials_count;
    const displayMaterials = materialsCompleted !== null ? materialsCompleted : trainingMaterials;
    
    const displayDate = validatedCert?.issued_at || certificate?.completed_at || null;
    const displayTrainingTitle = validatedCert?.training_title || training?.title || certificate?.training_title || '';
    const displayInstructor = certificate?.instructor_name || training?.instructor_name || training?.instructor?.name || '';
    const displayInstructorTitle = training?.instructor?.title || '';

    const formatDate = (iso) => {
        if (!iso) return '-';
        try { 
            return new Date(iso).toLocaleDateString('id-ID', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
            }); 
        } catch (e) { 
            return iso; 
        }
    };

    return (
        <AppLayout user={user}>
            <Head title={`Sertifikat - ${displayTrainingTitle}`} />
            
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&family=DM+Sans:wght@300;400;500;600;700&family=Cinzel:wght@400;600;700&display=swap');
                
                :root {
                    --bni-green: #005E54;
                    --bni-green-dk: #003D36;
                    --bni-green-lt: #00796B;
                    --bni-lime: #D6F84C;
                    --bni-orange: #F15A23;
                    --bni-gold: #C9A84C;
                    --bni-gold-lt: #E8C97A;
                    --bni-gold-dk: #9A7728;
                    --cream: #FAF7F0;
                    --ink: #1A1A1A;
                }
                
                @media print {
                    body { background: white !important; }
                    .no-print { display: none !important; }
                    .cert-paper { box-shadow: none !important; max-width: 100% !important; }
                    @page { size: A4 landscape; margin: 0; }
                }
            `}</style>

            <div style={{ fontFamily: "'DM Sans', sans-serif", background: 'linear-gradient(135deg, #0a1628 0%, #003D36 50%, #001a15 100%)', minHeight: '100vh', padding: '40px 20px', position: 'relative' }}>
                
                {/* Background Pattern */}
                <div style={{ position: 'fixed', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(201, 168, 76, 0.04) 60px, rgba(201, 168, 76, 0.04) 61px), repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(201, 168, 76, 0.04) 60px, rgba(201, 168, 76, 0.04) 61px)', pointerEvents: 'none', zIndex: 0 }}></div>

                {/* Page Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1160px', margin: '0 auto 24px', position: 'relative', zIndex: 10 }} className="no-print">
                    <Link 
                        href={`/training/${trainingId || training?.id}`}
                        as="button"
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: 'none', background: 'none', padding: 0, transition: 'color 0.2s' }}
                        className="hover:text-white"
                    >
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>←</div>
                        Kembali ke Training
                    </Link>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(255, 255, 255, 0.06)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '14px', padding: '8px 14px' }}>
                        <button 
                            onClick={() => { if (!eligible) return showToast('Sertifikat belum tersedia. Lengkapi persyaratan terlebih dahulu.', 'warning'); handleShare(); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '10px', background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.15)', color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif" }}
                            onMouseEnter={(e) => { e.target.style.background = 'rgba(255, 255, 255, 0.1)'; e.target.style.color = 'white'; }}
                            onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = 'rgba(255, 255, 255, 0.7)'; }}
                        >
                            <Share2 size={13} /> Bagikan
                        </button>
                        <button 
                            onClick={() => { if (!eligible) return showToast('Sertifikat belum tersedia. Lengkapi persyaratan terlebih dahulu.', 'warning'); handleDownload(); }}
                            disabled={isDownloading || !eligible}
                            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 20px', borderRadius: '10px', background: isDownloading ? 'rgba(100, 100, 100, 0.3)' : (eligible ? 'linear-gradient(135deg, #C9A84C, #9A7728)' : 'rgba(100, 100, 100, 0.2)'), border: 'none', color: isDownloading ? 'rgba(255, 255, 255, 0.5)' : (eligible ? '#003D36' : 'rgba(255, 255, 255, 0.3)'), fontSize: '13px', fontWeight: 700, cursor: isDownloading || !eligible ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: eligible ? '0 4px 14px rgba(201, 168, 76, 0.35)' : 'none', fontFamily: "'DM Sans', sans-serif" }}
                            onMouseEnter={(e) => { if (!isDownloading && eligible) { e.target.style.filter = 'brightness(1.08)'; e.target.style.transform = 'translateY(-1px)'; } }}
                            onMouseLeave={(e) => { e.target.style.filter = 'brightness(1)'; e.target.style.transform = 'translateY(0)'; }}
                        >
                            {isDownloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                            {isDownloading ? 'Mengunduh...' : 'Download PDF'}
                        </button>
                    </div>
                </div>

                {!eligible && (
                    <div style={{ maxWidth: '1160px', margin: '0 auto 24px', padding: '0 16px', position: 'relative', zIndex: 10 }} className="no-print">
                        <div style={{ background: 'rgba(250, 204, 21, 0.1)', borderLeft: '4px solid #FBBF24', padding: '16px', borderRadius: '6px', fontSize: '14px', color: '#f8fafc' }}>
                            <div style={{ fontWeight: 700, marginBottom: '8px' }}>Sertifikat belum tersedia</div>
                            <div style={{ fontSize: '12px', marginBottom: '8px' }}>Selesaikan persyaratan berikut untuk membuka sertifikat:</div>
                            <ul style={{ fontSize: '12px', paddingLeft: '20px', lineHeight: '1.6' }}>
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

                {/* Certificate */}
                <div style={{ maxWidth: '1160px', margin: '0 auto', position: 'relative', zIndex: 10 }} className="cert-wrapper">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        ref={certificateRef}
                        style={{
                            width: '100%',
                            aspectRatio: '1.414 / 1',
                            background: 'var(--cream)',
                            borderRadius: '4px',
                            boxShadow: '0 0 0 1px #9A7728, 0 0 0 6px rgba(201, 168, 76, 0.15), 0 40px 80px -20px rgba(0, 0, 0, 0.6), 0 0 120px -40px rgba(201, 168, 76, 0.2)',
                            overflow: 'hidden',
                            position: 'relative'
                        }}
                        className="cert-paper"
                    >
                        {/* Watermark */}
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 1 }}>
                            <span style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(60px, 12vw, 130px)', fontWeight: 700, color: 'rgba(0, 94, 84, 0.055)', letterSpacing: '0.15em', userSelect: 'none' }}>BNI</span>
                        </div>

                        {/* Left Strip */}
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '64px', background: 'linear-gradient(180deg, #003D36 0%, #005E54 50%, #003D36 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', zIndex: 10 }}>
                            <div style={{ width: '7px', height: '7px', background: '#C9A84C', transform: 'rotate(45deg)' }}></div>
                            <span style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)', fontFamily: "'Cinzel', serif", fontSize: '7px', letterSpacing: '0.3em', color: 'rgba(201, 168, 76, 0.6)', textTransform: 'uppercase' }}>Wondr Learning Platform</span>
                            <div style={{ width: '7px', height: '7px', background: '#C9A84C', transform: 'rotate(45deg)' }}></div>
                            <span style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)', fontFamily: "'Cinzel', serif", fontSize: '7px', letterSpacing: '0.3em', color: 'rgba(201, 168, 76, 0.6)', textTransform: 'uppercase' }}>BNI Finance</span>
                            <div style={{ width: '7px', height: '7px', background: '#C9A84C', transform: 'rotate(45deg)' }}></div>
                        </div>

                        {/* Right Strip */}
                        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '64px', background: 'linear-gradient(180deg, #003D36 0%, #005E54 50%, #003D36 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', zIndex: 10 }}>
                            <div style={{ width: '7px', height: '7px', background: '#C9A84C', transform: 'rotate(45deg)' }}></div>
                            <span style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)', fontFamily: "'Cinzel', serif", fontSize: '7px', letterSpacing: '0.3em', color: 'rgba(201, 168, 76, 0.6)', textTransform: 'uppercase' }}>Certificate of Completion</span>
                            <div style={{ width: '7px', height: '7px', background: '#C9A84C', transform: 'rotate(45deg)' }}></div>
                            <span style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)', fontFamily: "'Cinzel', serif", fontSize: '7px', letterSpacing: '0.3em', color: 'rgba(201, 168, 76, 0.6)', textTransform: 'uppercase' }}>2026</span>
                            <div style={{ width: '7px', height: '7px', background: '#C9A84C', transform: 'rotate(45deg)' }}></div>
                        </div>

                        {/* Top Banner */}
                        <div style={{ position: 'absolute', top: 0, left: '64px', right: '64px', height: '54px', background: 'linear-gradient(90deg, #003D36 0%, #005E54 50%, #003D36 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', zIndex: 5, borderBottom: '3px solid var(--bni-gold)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '4px', height: 'clamp(18px, 2.5vw, 28px)', background: '#F15A23', borderRadius: '2px' }}></div>
                                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                                    <span style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(14px, 2vw, 20px)', fontWeight: 700, color: 'white', letterSpacing: '0.05em' }}>BNI</span>
                                    <span style={{ fontSize: 'clamp(6px, 0.9vw, 8px)', fontWeight: 600, color: 'rgba(255, 255, 255, 0.55)', letterSpacing: '0.25em', textTransform: 'uppercase' }}>Finance</span>
                                </div>
                            </div>
                            <span style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(7px, 1vw, 10px)', letterSpacing: '0.3em', color: 'rgba(201, 168, 76, 0.7)', textTransform: 'uppercase' }}>Wondr Learning Platform</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: 'clamp(8px, 0.9vw, 10px)', color: 'rgba(255, 255, 255, 0.4)', letterSpacing: '0.1em' }}>ID:</span>
                                <span style={{ fontFamily: 'monospace', fontSize: 'clamp(8px, 0.9vw, 10px)', color: 'rgba(201, 168, 76, 0.7)', letterSpacing: '0.06em' }}>{certNumber}</span>
                            </div>
                        </div>

                        {/* Bottom Banner */}
                        <div style={{ position: 'absolute', bottom: 0, left: '64px', right: '64px', height: '44px', background: 'linear-gradient(90deg, #003D36 0%, #005E54 50%, #003D36 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5, borderTop: '3px solid var(--bni-gold)' }}>
                            <span style={{ fontSize: 'clamp(8px, 0.9vw, 10px)', color: 'rgba(255, 255, 255, 0.4)', letterSpacing: '0.1em' }}>Sertifikat ini sah dan diterbitkan secara digital oleh BNI Finance Learning System</span>
                        </div>

                        {/* Corner Ornaments - TL */}
                        <div style={{ position: 'absolute', top: '54px', left: '64px', width: 'clamp(48px, 6vw, 70px)', height: 'clamp(48px, 6vw, 70px)', zIndex: 6 }}>
                            <svg viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                                <path d="M4 4 L4 32" stroke="#C9A84C" strokeWidth="2"/>
                                <path d="M4 4 L32 4" stroke="#C9A84C" strokeWidth="2"/>
                                <path d="M4 4 L20 20" stroke="#C9A84C" strokeWidth="1" opacity="0.45"/>
                                <rect x="1.5" y="1.5" width="5" height="5" stroke="#C9A84C" strokeWidth="1" fill="none"/>
                                <rect x="14" y="14" width="4" height="4" fill="#C9A84C" opacity="0.55" transform="rotate(45 16 16)"/>
                            </svg>
                        </div>

                        {/* Corner Ornaments - TR */}
                        <div style={{ position: 'absolute', top: '54px', right: '64px', width: 'clamp(48px, 6vw, 70px)', height: 'clamp(48px, 6vw, 70px)', zIndex: 6, transform: 'scaleX(-1)' }}>
                            <svg viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                                <path d="M4 4 L4 32" stroke="#C9A84C" strokeWidth="2"/>
                                <path d="M4 4 L32 4" stroke="#C9A84C" strokeWidth="2"/>
                                <path d="M4 4 L20 20" stroke="#C9A84C" strokeWidth="1" opacity="0.45"/>
                                <rect x="1.5" y="1.5" width="5" height="5" stroke="#C9A84C" strokeWidth="1" fill="none"/>
                            </svg>
                        </div>

                        {/* Corner Ornaments - BL */}
                        <div style={{ position: 'absolute', bottom: '44px', left: '64px', width: 'clamp(48px, 6vw, 70px)', height: 'clamp(48px, 6vw, 70px)', zIndex: 6, transform: 'scaleY(-1)' }}>
                            <svg viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                                <path d="M4 4 L4 32" stroke="#C9A84C" strokeWidth="2"/>
                                <path d="M4 4 L32 4" stroke="#C9A84C" strokeWidth="2"/>
                                <path d="M4 4 L20 20" stroke="#C9A84C" strokeWidth="1" opacity="0.45"/>
                                <rect x="1.5" y="1.5" width="5" height="5" stroke="#C9A84C" strokeWidth="1" fill="none"/>
                            </svg>
                        </div>

                        {/* Corner Ornaments - BR */}
                        <div style={{ position: 'absolute', bottom: '44px', right: '64px', width: 'clamp(48px, 6vw, 70px)', height: 'clamp(48px, 6vw, 70px)', zIndex: 6, transform: 'scale(-1)' }}>
                            <svg viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                                <path d="M4 4 L4 32" stroke="#C9A84C" strokeWidth="2"/>
                                <path d="M4 4 L32 4" stroke="#C9A84C" strokeWidth="2"/>
                                <path d="M4 4 L20 20" stroke="#C9A84C" strokeWidth="1" opacity="0.45"/>
                                <rect x="1.5" y="1.5" width="5" height="5" stroke="#C9A84C" strokeWidth="1" fill="none"/>
                            </svg>
                        </div>

                        {/* Main Content */}
                        <div style={{ position: 'absolute', left: '64px', right: '64px', top: '54px', bottom: '44px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(10px, 2.5vw, 24px) clamp(20px, 4vw, 48px)', zIndex: 20, textAlign: 'center' }}>
                            
                            {/* Sub eyebrow */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'clamp(6px, 1.2vw, 12px)' }}>
                                <div style={{ width: '22px', height: '1px', background: '#C9A84C', opacity: 0.6 }}></div>
                                <span style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(7px, 1vw, 10px)', letterSpacing: '0.35em', color: '#C9A84C', textTransform: 'uppercase' }}>Certificate of Completion</span>
                                <div style={{ width: '22px', height: '1px', background: '#C9A84C', opacity: 0.6 }}></div>
                            </div>

                            {/* Main Title */}
                            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(26px, 5vw, 58px)', fontWeight: 600, color: '#005E54', lineHeight: 1.05, margin: '0 0 2px', letterSpacing: '0.02em' }}>
                                Sertifikat Kelulusan
                            </h1>

                            {/* Divider */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', maxWidth: '440px', margin: '10px auto' }}>
                                <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)' }}></div>
                                <div style={{ width: '6px', height: '6px', background: '#C9A84C', transform: 'rotate(45deg)' }}></div>
                                <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)' }}></div>
                            </div>

                            {/* Recipient label */}
                            <p style={{ fontSize: 'clamp(9px, 1.1vw, 12px)', color: '#64748B', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 5px' }}>Diberikan kepada</p>

                            {/* Recipient Name */}
                            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(22px, 4vw, 46px)', fontWeight: 700, color: '#1A1A1A', margin: '0 0 3px', padding: '3px clamp(20px, 5vw, 44px) 10px', borderBottom: '2px solid #C9A84C', display: 'inline-block', letterSpacing: '0.02em' }}>
                                {displayName}
                            </h2>

                            {/* Completion text */}
                            <p style={{ fontSize: 'clamp(9px, 1.1vw, 12px)', color: '#64748B', margin: '8px 0 3px', maxWidth: '480px' }}>
                                Telah menyelesaikan dengan sangat baik program pelatihan
                            </p>

                            {/* Training Title */}
                            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(13px, 2vw, 22px)', fontWeight: 600, color: '#005E54', fontStyle: 'italic', margin: '0 0 clamp(8px, 1.5vw, 14px)', maxWidth: '580px', lineHeight: 1.3 }}>
                                "{displayTrainingTitle}"
                            </p>

                            {/* Info chips */}
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 'clamp(8px, 1.8vw, 16px)' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 13px', border: '1px solid rgba(201, 168, 76, 0.4)', borderRadius: '999px', background: 'rgba(201, 168, 76, 0.08)', fontSize: 'clamp(9px, 1.1vw, 12px)', color: '#003D36', fontWeight: 500 }}>📅 {formatDate(displayDate)}</span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 13px', border: '1px solid rgba(201, 168, 76, 0.4)', borderRadius: '999px', background: 'rgba(201, 168, 76, 0.08)', fontSize: 'clamp(9px, 1.1vw, 12px)', color: '#003D36', fontWeight: 500 }}>📚 {(certificate?.materials_completed ?? displayMaterials) + ' / ' + (training?.materials_count ?? displayMaterials)} Materi</span>
                            </div>

                            {/* Signatures Row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', paddingTop: '4px' }}>
                                
                                {/* Sig Left */}
                                <div style={{ textAlign: 'center', minWidth: 'clamp(100px, 14vw, 148px)' }}>
                                    <svg width="130" height="36" viewBox="0 0 160 50" style={{ display: 'block', margin: '0 auto 3px' }}>
                                        <path d="M10,45 C30,10 55,50 80,30 C105,10 130,45 150,40" stroke="#005E54" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                                    </svg>
                                    <div style={{ width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, #d1d5db, transparent)', margin: '0 auto 5px' }}></div>
                                    <p style={{ fontSize: 'clamp(10px, 1.2vw, 13px)', fontWeight: 700, color: '#1A1A1A', margin: '4px 0 2px' }}>{displayInstructor}</p>
                                    <p style={{ fontSize: 'clamp(8px, 0.9vw, 10px)', color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>{displayInstructorTitle || 'Training Facilitator'}</p>
                                </div>

                                {/* Gold Seal */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                    <div style={{ width: 'clamp(76px, 9vw, 100px)', height: 'clamp(76px, 9vw, 100px)', borderRadius: '50%', background: 'conic-gradient(#9A7728 0deg, #E8C97A 60deg, #C9A84C 120deg, #E8C97A 180deg, #9A7728 240deg, #C9A84C 300deg, #9A7728 360deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 3px white, 0 0 0 5px #C9A84C, 0 8px 24px rgba(201, 168, 76, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3)', flexShrink: 0 }}>
                                        <div style={{ width: '80%', height: '80%', borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #E8C97A, #9A7728)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '2px' }}>
                                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#003D36" strokeWidth="1.5">
                                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                            </svg>
                                            <span style={{ fontFamily: "'Cinzel', serif", fontSize: '6px', color: '#003D36', fontWeight: 700, letterSpacing: '0.12em' }}>VERIFIED</span>
                                        </div>
                                    </div>
                                    <span style={{ fontFamily: 'monospace', fontSize: 'clamp(7px, 0.75vw, 9px)', color: '#94A3B8', letterSpacing: '0.05em' }}>{certNumber}</span>
                                </div>

                                {/* Sig Right */}
                                <div style={{ textAlign: 'center', minWidth: 'clamp(100px, 14vw, 148px)' }}>
                                    <svg width="130" height="36" viewBox="0 0 160 50" style={{ display: 'block', margin: '0 auto 3px' }}>
                                        <path d="M10,30 C40,55 70,10 100,35 C120,50 140,20 152,30" stroke="#005E54" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                                    </svg>
                                    <div style={{ width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, #d1d5db, transparent)', margin: '0 auto 5px' }}></div>
                                    <p style={{ fontSize: 'clamp(10px, 1.2vw, 13px)', fontWeight: 700, color: '#1A1A1A', margin: '4px 0 2px' }}>Rina Kusuma</p>
                                    <p style={{ fontSize: 'clamp(8px, 0.9vw, 10px)', color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Head of People & Culture</p>
                                </div>

                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Info Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', maxWidth: '1160px', width: '100%', margin: '28px auto 0', position: 'relative', zIndex: 10 }} className="no-print">
                    
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '18px', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: '14px', transition: 'background 0.2s', cursor: 'pointer' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                    >
                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, background: 'rgba(96, 165, 250, 0.12)' }}>👤</div>
                        <div>
                            <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>Penerima</div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>{displayName}</div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '18px', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: '14px', transition: 'background 0.2s', cursor: 'pointer' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                    >
                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, background: 'rgba(251, 191, 36, 0.12)' }}>📅</div>
                        <div>
                            <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>Tanggal Selesai</div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>{formatDate(displayDate)}</div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '18px', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: '14px', transition: 'background 0.2s', cursor: 'pointer' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                    >
                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, background: 'rgba(52, 211, 153, 0.12)' }}>✅</div>
                        <div>
                            <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>Status</div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#34D399' }}>Verified ✓</div>
                        </div>
                    </motion.div>

                </div>

            </div>
        </AppLayout>
    );
}

