import React from 'react';
import { 
    Mail, MapPin, Phone, Facebook, Twitter, 
    Instagram, Linkedin, Globe, ShieldCheck
} from 'lucide-react';

// --- Wondr Style System ---
const WondrStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        .wondr-font { font-family: 'Plus Jakarta Sans', sans-serif; }
        
        .footer-link {
            position: relative;
            transition: all 0.3s ease;
        }
        .footer-link:hover {
            color: #D6F84C;
            padding-left: 4px;
        }
        
        .social-icon {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .social-icon:hover {
            transform: translateY(-4px);
            background-color: #D6F84C;
            color: #002824;
            border-color: #D6F84C;
        }

        .app-btn {
            transition: all 0.3s ease;
        }
        .app-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(214, 248, 76, 0.2);
            border-color: #D6F84C;
        }
    `}</style>
);

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-[#002824] text-slate-300 wondr-font relative overflow-hidden mt-auto border-t border-white/10">
            <WondrStyles />
            
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#005E54] rounded-full blur-[150px] opacity-20 -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#D6F84C] rounded-full blur-[150px] opacity-5 translate-y-1/2 pointer-events-none"></div>

            {/* Top Section: CTA */}
            <div className="border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h3 className="text-2xl font-extrabold text-white mb-1">Butuh Bantuan Pembelajaran?</h3>
                        <p className="text-slate-400 text-sm">Tim Learning & Development siap membantu pengembangan karir Anda.</p>
                    </div>
                    <div className="flex gap-4">
                        <a 
                            href="mailto:training@bni.co.id"
                            className="px-6 py-3 bg-[#005E54] hover:bg-[#00403a] text-white rounded-xl font-bold transition flex items-center gap-2"
                        >
                            <Mail size={18} /> Hubungi Support
                        </a>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
                    
                    {/* Column 1: Brand Info (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#D6F84C] rounded-xl flex items-center justify-center font-extrabold text-[#002824] text-xl shadow-lg">
                                W
                            </div>
                            <div className="flex flex-col">
                                <span className="text-white font-extrabold text-xl leading-none tracking-tight">Wondr</span>
                                <span className="text-[#002824] text-[10px] font-bold uppercase tracking-widest bg-[#D6F84C] px-1 rounded-sm mt-1 w-fit">Learning</span>
                            </div>
                        </div>
                        
                        <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                            Platform ekosistem pembelajaran digital terintegrasi untuk Insan BNI. Tingkatkan kompetensi, raih prestasi, dan wujudkan potensi terbaik Anda bersama kami.
                        </p>

                        <div className="flex gap-3 pt-2">
                            {[
                                { Icon: Facebook, href: 'https://facebook.com/bni' },
                                { Icon: Twitter, href: 'https://twitter.com/bni' },
                                { Icon: Instagram, href: 'https://instagram.com/bni' },
                                { Icon: Linkedin, href: 'https://linkedin.com/company/bni' }
                            ].map(({ Icon, href }, i) => (
                                <a 
                                    key={i} 
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white social-icon"
                                >
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Column 2: Quick Links (2 cols) */}
                    <div className="lg:col-span-2 space-y-6">
                        <h4 className="text-white font-bold text-lg">Eksplorasi</h4>
                        <ul className="space-y-3 text-sm">
                            {[
                                { label: 'Dashboard', href: '/dashboard' },
                                { label: 'Katalog Training', href: '/catalog' },
                                { label: 'Training Saya', href: '/my-trainings' },
                                { label: 'Sertifikasi', href: '/certificates' },
                                { label: 'Performa', href: '/learner/performance' }
                            ].map((item) => (
                                <li key={item.label}>
                                    <a href={item.href} className="footer-link block text-slate-400">
                                        {item.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 3: Support (3 cols) */}
                    <div className="lg:col-span-3 space-y-6">
                        <h4 className="text-white font-bold text-lg">Hubungi Kami</h4>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-start gap-3 text-slate-400">
                                <MapPin className="w-5 h-5 text-[#D6F84C] shrink-0 mt-0.5" />
                                <span>
                                    BNI Corp University<br/>
                                    Jl. S. Parman Kav. 55-56<br/>
                                    Jakarta Barat 11410
                                </span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-400">
                                <Phone className="w-5 h-5 text-[#D6F84C] shrink-0" />
                                <a href="tel:+62215789999" className="hover:text-white transition">
                                    +62 (21) 5789 9999
                                </a>
                            </li>
                            <li className="flex items-center gap-3 text-slate-400">
                                <Mail className="w-5 h-5 text-[#D6F84C] shrink-0" />
                                <a href="mailto:training@bni.co.id" className="hover:text-white transition">
                                    training@bni.co.id
                                </a>
                            </li>
                            <li className="flex items-center gap-3 text-slate-400">
                                <Globe className="w-5 h-5 text-[#D6F84C] shrink-0" />
                                <a href="https://bni.co.id" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
                                    www.bni.co.id
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Column 4: Download App (3 cols) */}
                    <div className="lg:col-span-3 space-y-6">
                        <h4 className="text-white font-bold text-lg">Mobile Learning</h4>
                        <p className="text-xs text-slate-400">Akses materi pembelajaran di mana saja, kapan saja.</p>
                        
                        <div className="space-y-3">
                            <button className="app-btn w-full flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/10 text-left group">
                                <div className="p-2 bg-white rounded-lg">
                                    <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.21-.93 3.46-.84 1.48.1 2.61.64 3.32 1.62-2.91 1.76-2.42 6.07.41 7.23-.51 1.47-1.28 2.92-2.27 4.22M12.03 5.08c-.73 2.96-3.84 4.54-5.38 4.25.32-2.61 2.38-4.99 5.38-4.25z"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Download on the</p>
                                    <p className="text-sm font-bold text-white group-hover:text-[#D6F84C] transition-colors">App Store</p>
                                </div>
                            </button>

                            <button className="app-btn w-full flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/10 text-left group">
                                <div className="p-2 bg-white rounded-lg">
                                    <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M3.609 1.814L13.792 12 3.61 22.186c-.184-.135-.37-.417-.37-.893V2.707c0-.476.186-.758.37-.893zm11.666 11.233l2.84 2.84-2.84 2.84-5.594-5.595 5.594-5.595 2.84 2.84-2.84 2.84zm1.485 1.485l4.897 4.897c.504.504 1.157.378 1.157-.595V5.166c0-.973-.653-1.1-1.157-.595l-4.897 4.897-1.485 1.485 1.485 1.485z"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Get it on</p>
                                    <p className="text-sm font-bold text-white group-hover:text-[#D6F84C] transition-colors">Google Play</p>
                                </div>
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-white/10 bg-[#00221e]">
                <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    
                    <div className="text-xs text-slate-500 text-center md:text-left">
                        <p>&copy; {currentYear} PT Bank Negara Indonesia (Persero) Tbk. All rights reserved.</p>
                        <p className="mt-1">HCMS E-Learning System v2.0 • Made with <span className="text-red-500">❤</span> by BNI CorpU</p>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <ShieldCheck className="w-4 h-4 text-green-500" />
                            <span>Terdaftar & Diawasi oleh OJK</span>
                        </div>
                        <div className="flex gap-4 text-xs font-bold text-slate-400">
                            <a href="/privacy" className="hover:text-[#D6F84C] transition">Privacy Policy</a>
                            <a href="/terms" className="hover:text-[#D6F84C] transition">Terms of Service</a>
                        </div>
                    </div>

                </div>
            </div>
        </footer>
    );
}
