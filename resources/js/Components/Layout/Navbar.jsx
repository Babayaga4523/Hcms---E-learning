import React, { useState, useEffect, useRef } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { 
    Menu, X, LogOut, User, Settings, ChevronDown, 
    Target, TrendingUp, FileText, 
    Search, Bell, Sparkles, LayoutDashboard, GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationDropdown from '@/Components/Notification/NotificationDropdown';

// --- Wondr Style System ---
const WondrStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F8F9FA; color: #1e293b; }
        
        .glass-nav {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.5);
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.03);
        }

        .nav-link {
            position: relative;
            color: #64748B;
            transition: color 0.3s ease;
        }
        .nav-link:hover, .nav-link.active {
            color: #005E54;
        }
        .nav-link::after {
            content: '';
            position: absolute;
            bottom: -24px;
            left: 0;
            width: 100%;
            height: 3px;
            background: #005E54;
            border-radius: 4px 4px 0 0;
            transform: scaleX(0);
            transition: transform 0.3s ease;
        }
        .nav-link.active::after {
            transform: scaleX(1);
        }

        .dropdown-item {
            transition: all 0.2s ease;
        }
        .dropdown-item:hover {
            background-color: #F0FDF4;
            color: #005E54;
        }

        .search-input:focus {
            box-shadow: 0 0 0 3px rgba(0, 94, 84, 0.1);
            border-color: #005E54;
        }
        
        .notification-dot {
            animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
        @keyframes pulse-ring {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(220, 38, 38, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }
    `}</style>
);

// --- Sub-Components ---

const NavLink = ({ href, active, children, icon: Icon }) => (
    <Link 
        href={href} 
        className={`nav-link flex items-center gap-2 text-sm font-bold px-1 h-full ${active ? 'active' : ''}`}
    >
        {Icon && <Icon size={18} />}
        {children}
    </Link>
);

const MobileNavLink = ({ href, children, icon: Icon, onClick }) => (
    <Link 
        href={href} 
        onClick={onClick}
        className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-[#005E54] hover:bg-[#F0FDF4] rounded-xl transition-all font-semibold"
    >
        {Icon && <Icon size={20} />}
        {children}
    </Link>
);

// --- Main Component ---

export default function Navbar({ user }) {
    const { url } = usePage();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(null); // 'learning', 'reports', 'profile'
    const dropdownRef = useRef(null);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileSearchQuery, setMobileSearchQuery] = useState('');
    const searchRef = useRef(null);
    const mobileSearchRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        // Keyboard shortcut: focus search with Cmd/Ctrl+K
        const handleKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                if (searchRef.current) searchRef.current.focus();
            }
            // Enter in mobile search should navigate too
            if (document.activeElement === mobileSearchRef.current && e.key === 'Enter') {
                e.preventDefault();
                if (mobileSearchQuery) {
                    router.visit(`/catalog?search=${encodeURIComponent(mobileSearchQuery)}`);
                    setMobileMenuOpen(false);
                }
            }
        };
        document.addEventListener('keydown', handleKey);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKey);
        };
    }, [mobileSearchQuery]);

    const toggleDropdown = (name) => {
        setDropdownOpen(dropdownOpen === name ? null : name);
    };

    const handleLogout = (e) => {
        e.preventDefault();
        router.post('/logout', {}, {
            preserveState: false,
            preserveScroll: false,
            onSuccess: () => {
                window.location.href = '/login';
            },
            onError: () => {
                window.location.href = '/login';
            },
        });
    };

    const isActive = (path) => url.startsWith(path);

    return (
        <>
            <WondrStyles />
            <nav className="glass-nav sticky top-0 z-50 h-20">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-full">
                    <div className="flex justify-between items-center h-full">
                        
                        {/* 1. Logo & Brand */}
                        <div className="flex items-center gap-8">
                            <Link href="/dashboard" className="flex items-center gap-3 group">
                                <div className="relative">
                                    <div className="w-10 h-10 bg-[#002824] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                                        <span className="text-[#D6F84C] font-black text-xl">W</span>
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#D6F84C] rounded-full border-2 border-white"></div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xl font-extrabold text-[#002824] leading-none tracking-tight">Wondr</span>
                                    <span className="text-[10px] font-bold text-[#005E54] tracking-widest uppercase">Learning</span>
                                </div>
                            </Link>

                            {/* Desktop Nav */}
                            <div className="hidden lg:flex items-center gap-6 h-full pt-1">
                                <NavLink href="/dashboard" active={isActive('/dashboard')} icon={LayoutDashboard}>Dashboard</NavLink>
                                <NavLink href="/my-trainings" active={isActive('/my-trainings')} icon={GraduationCap}>Training Saya</NavLink>
                                
                                {/* Dropdown: Explore */}
                                <div className="relative h-full flex items-center" ref={dropdownRef}>
                                    <button 
                                        onClick={() => toggleDropdown('learning')}
                                        className={`flex items-center gap-1 text-sm font-bold transition-colors ${dropdownOpen === 'learning' ? 'text-[#005E54]' : 'text-slate-600 hover:text-[#005E54]'}`}
                                    >
                                        Eksplorasi <ChevronDown size={16} className={`transition-transform duration-200 ${dropdownOpen === 'learning' ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {dropdownOpen === 'learning' && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute top-[calc(100%-10px)] left-0 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 overflow-hidden"
                                            >
                                                <Link href="/catalog" className="dropdown-item flex items-center gap-3 p-3 rounded-xl">
                                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Target size={18}/></div>
                                                    <div>
                                                        <p className="text-sm font-bold">Katalog Training</p>
                                                        <p className="text-xs text-slate-400">Jelajahi semua modul</p>
                                                    </div>
                                                </Link>
                                                <Link href="/learner/performance" className="dropdown-item flex items-center gap-3 p-3 rounded-xl">
                                                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><TrendingUp size={18}/></div>
                                                    <div>
                                                        <p className="text-sm font-bold">Performa Saya</p>
                                                        <p className="text-xs text-slate-400">Statistik belajar</p>
                                                    </div>
                                                </Link>
                                                <Link href="/my-reports" className="dropdown-item flex items-center gap-3 p-3 rounded-xl">
                                                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><FileText size={18}/></div>
                                                    <div>
                                                        <p className="text-sm font-bold">Laporan</p>
                                                        <p className="text-xs text-slate-400">Unduh transkrip nilai</p>
                                                    </div>
                                                </Link>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        {/* 2. Right Actions */}
                        <div className="hidden md:flex items-center gap-4">
                            {/* Search */}
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#005E54] transition-colors" size={18} />
                                <form onSubmit={(e) => { e.preventDefault(); if (searchQuery) router.visit(`/catalog?search=${encodeURIComponent(searchQuery)}`); }}>
                                    <input 
                                        ref={searchRef}
                                        type="text" 
                                        placeholder="Cari materi..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="search-input pl-10 pr-4 py-2.5 bg-slate-50 border border-transparent rounded-xl text-sm font-medium w-48 focus:w-64 transition-all outline-none"
                                    />
                                </form>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <button onClick={() => { if (searchQuery) router.visit(`/catalog?search=${encodeURIComponent(searchQuery)}`); }} className="text-[10px] text-slate-400 font-bold bg-white px-2 py-1 rounded border border-slate-200">Cari</button>
                                    <span className="text-[10px] text-slate-400 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 ml-2">⌘K</span>
                                </div>
                            </div>

                            <div className="h-8 w-[1px] bg-slate-200"></div>

                            {/* Notifications */}
                            <NotificationDropdown user={user} />

                            {/* User Profile */}
                            <div className="relative" ref={dropdownRef}>
                                <button 
                                    onClick={() => toggleDropdown('profile')}
                                    className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
                                >
                                    <div className="text-right hidden lg:block">
                                        <p className="text-sm font-bold text-slate-900 leading-none">{user.name}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">{user.role || 'Employee'}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#005E54] to-[#002824] p-[2px]">
                                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                            {user.avatar_url ? (
                                                <img src={user.avatar_url} alt="User" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="font-bold text-[#005E54]">{user.name.charAt(0)}</span>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronDown size={16} className="text-slate-400 mr-2" />
                                </button>

                                <AnimatePresence>
                                    {dropdownOpen === 'profile' && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute top-[calc(100%+8px)] right-0 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 overflow-hidden origin-top-right"
                                        >
                                            <div className="px-4 py-3 bg-[#F0FDF4] rounded-xl mb-2 flex items-center gap-3">
                                                <div className="p-2 bg-white rounded-full text-[#005E54]"><Sparkles size={16} /></div>
                                                <div>
                                                    <p className="text-xs text-[#005E54] font-bold uppercase">Active Learner</p>
                                                    <div className="w-24 h-1.5 bg-white rounded-full mt-1 overflow-hidden">
                                                        <div className="h-full bg-[#D6F84C] w-3/4"></div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <Link href="/profile" className="dropdown-item flex items-center gap-3 p-3 rounded-xl text-slate-700">
                                                <User size={18} /> Profile Saya
                                            </Link>
                                            
                                            {user?.role === 'admin' && (
                                                <>
                                                    <div className="h-[1px] bg-slate-100 my-1"></div>
                                                    <Link href="/admin/dashboard" className="dropdown-item flex items-center gap-3 p-3 rounded-xl text-slate-700">
                                                        <Settings size={18} /> Admin Panel
                                                    </Link>
                                                </>
                                            )}
                                            
                                            <div className="h-[1px] bg-slate-100 my-1"></div>
                                            
                                            <button 
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 p-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-medium text-left"
                                            >
                                                <LogOut size={18} /> Keluar
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="lg:hidden flex items-center">
                            <button 
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
                            >
                                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. Mobile Menu Overlay */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="lg:hidden bg-white border-b border-slate-200 overflow-hidden"
                        >
                            <div className="px-4 py-6 space-y-4">
                                {/* Search Mobile */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                        ref={mobileSearchRef}
                                        type="text" 
                                        placeholder="Cari materi..." 
                                        value={mobileSearchQuery}
                                        onChange={(e) => setMobileSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#005E54] outline-none"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <MobileNavLink href="/dashboard" icon={LayoutDashboard} onClick={() => setMobileMenuOpen(false)}>
                                        Dashboard
                                    </MobileNavLink>
                                    <MobileNavLink href="/my-trainings" icon={GraduationCap} onClick={() => setMobileMenuOpen(false)}>
                                        Training Saya
                                    </MobileNavLink>
                                    <MobileNavLink href="/catalog" icon={Target} onClick={() => setMobileMenuOpen(false)}>
                                        Katalog
                                    </MobileNavLink>
                                    <MobileNavLink href="/learner/performance" icon={TrendingUp} onClick={() => setMobileMenuOpen(false)}>
                                        Performa
                                    </MobileNavLink>
                                    <MobileNavLink href="/my-reports" icon={FileText} onClick={() => setMobileMenuOpen(false)}>
                                        Laporan
                                    </MobileNavLink>
                                </div>

                                <div className="h-[1px] bg-slate-100"></div>

                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#005E54] font-bold">
                                        {user.name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-900">{user.name}</p>
                                        <p className="text-xs text-slate-500">{user.email}</p>
                                    </div>
                                </div>

                                {user?.role === 'admin' && (
                                    <MobileNavLink href="/admin/dashboard" icon={Settings} onClick={() => setMobileMenuOpen(false)}>
                                        Admin Panel
                                    </MobileNavLink>
                                )}

                                <button 
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 text-red-600 font-bold rounded-xl"
                                >
                                    <LogOut size={18} /> Keluar
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
        </>
    );
}
