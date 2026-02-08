import React, { useState, useEffect } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { 
    LayoutDashboard, BookOpen, Users, FileText, LogOut, 
    HelpCircle, Calendar, CheckSquare, 
    Settings, Bell, Megaphone, BarChart, X, Menu, TrendingUp, Shield
} from 'lucide-react';

// Komponen Item Menu - Menggunakan anchor tag biasa untuk routing sempurna
const MenuItem = ({ item, isActive }) => {
    return (
        <a
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all duration-200 ${
                isActive 
                ? 'bg-[#D6FF59] text-slate-900 font-semibold' 
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50' 
            }`}
        >
            <span className="flex-shrink-0">{item.icon}</span>
            <span className="flex-1 text-sm font-medium">{item.label}</span>
            {isActive && <span className="w-2 h-2 bg-slate-900 rounded-full"></span>}
        </a>
    );
};

// Komponen Group Header
const MenuSection = ({ title, children }) => (
    <div className="px-2 py-4">
        <h3 className="px-4 mb-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
            {title}
        </h3>
        <div className="space-y-1">
            {children}
        </div>
    </div>
);

export default function AdminSidebar({ user }) {
    const { url } = usePage();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const menuGroups = [
        {
            title: "Utama",
            items: [
                { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/admin/dashboard', id: 'dashboard' },
                { label: 'Analytics', icon: <BarChart size={20} />, href: '/admin/analytics', id: 'analytics' },
            ]
        },
        {
            title: "Pembelajaran",
            items: [
                { label: 'Program', icon: <BookOpen size={20} />, href: '/admin/training-programs', id: 'training' },
                { label: 'Jadwal', icon: <Calendar size={20} />, href: '/admin/training-schedule', id: 'schedule' },
                { label: 'Bank Soal', icon: <HelpCircle size={20} />, href: '/admin/questions', id: 'questions' },
            ]
        },
        {
            title: "Pengguna & Kepatuhan",
            items: [
                { label: 'Manajemen Pengguna', icon: <Users size={20} />, href: '/admin/users', id: 'users' },
                { label: 'Laporan Terpadu', icon: <TrendingUp size={20} />, href: '/admin/reports/unified', id: 'reports-unified' },
                { label: 'Laporan Lama', icon: <FileText size={20} />, href: '/admin/reports', id: 'reports' },
                { label: 'Kepatuhan', icon: <CheckSquare size={20} />, href: '/admin/compliance', id: 'compliance' },
            ]
        },
        {
            title: "Sistem",
            items: [
                { label: 'Communications', icon: <Megaphone size={20} />, href: '/admin/communications', id: 'communications' },
                { label: 'Pengaturan', icon: <Settings size={20} />, href: '/admin/system-settings', id: 'settings' },
            ]
        }
    ];

    const isPathActive = (path) => url.startsWith(path);

    const handleLogout = (e) => {
        if (e) e.preventDefault();
        router.post('/logout', {}, {
            preserveState: false,
            preserveScroll: false,
            onSuccess: () => {
                // Logout berhasil, redirect ke login
                window.location.href = '/login';
            },
            onError: () => {
                // Jika terjadi error (seperti 419), paksa redirect ke login
                // User sudah tidak punya session valid, jadi tujuan logout tercapai
                window.location.href = '/login';
            },
        });
    };

    const closeMobileMenu = () => {
        setIsMobileOpen(false);
    };

    // Sidebar Desktop
    const SidebarDesktop = () => (
        <aside className="hidden md:flex md:fixed md:left-0 md:top-0 md:w-[280px] md:h-screen md:flex-col md:bg-gradient-to-b md:from-slate-900 md:via-slate-950 md:to-slate-950 md:border-r md:border-slate-700/50 md:shadow-xl md:z-40 md:overflow-hidden">
            <SidebarContent />
        </aside>
    );

    // Sidebar Mobile
    const SidebarMobile = () => (
        <>
            {/* Hamburger Button */}
            <div className="md:hidden fixed top-4 left-4 z-50">
                <button
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-white hover:bg-slate-800 transition-colors"
                    aria-label="Menu"
                >
                    {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Overlay */}
            {isMobileOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-black/50 z-30"
                    onClick={closeMobileMenu}
                ></div>
            )}

            {/* Sidebar */}
            <aside className={`md:hidden fixed top-0 left-0 w-[280px] h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-r border-slate-700/50 z-40 transform transition-transform duration-300 flex flex-col ${
                isMobileOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                <SidebarContent onClose={closeMobileMenu} />
            </aside>
        </>
    );

    // Konten Sidebar
    const SidebarContent = ({ onClose }) => (
        <>
            {/* Logo */}
            <div className="h-20 flex items-center px-6 border-b border-slate-700/50 bg-gradient-to-b from-slate-900 to-slate-950 flex-shrink-0">
                <div className="flex items-center gap-3 w-full">
                    <img 
                        src="/bni-finance.png" 
                        alt="BNI Finance" 
                        className="h-10 w-auto object-contain"
                    />
                    <div className="flex-1 min-w-0">
                        <h1 className="text-white font-bold text-base leading-none">HCMS</h1>
                        <p className="text-slate-400 text-[9px] font-medium mt-0.5">BNI Finance</p>
                    </div>
                </div>
            </div>

            {/* Menu */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900 scroll-smooth">
                {menuGroups.map((group, idx) => (
                    <MenuSection key={idx} title={group.title}>
                        {group.items.map((item) => (
                            <div key={item.id} onClick={onClose}>
                                <MenuItem 
                                    item={item}
                                    isActive={isPathActive(item.href)}
                                />
                            </div>
                        ))}
                    </MenuSection>
                ))}
            </nav>

            {/* User Profile Card */}
            <div className="p-4 border-t border-slate-700/50 bg-slate-950 flex-shrink-0">
                <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-lg flex items-center gap-3 backdrop-blur-sm">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lime-400 to-teal-400 flex items-center justify-center flex-shrink-0 font-bold text-slate-900 text-sm">
                        {user?.name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div className="flex-1 min-w-0 hidden sm:block">
                        <p className="text-sm font-semibold text-white truncate">{user?.name || 'Admin'}</p>
                        <p className="text-xs text-slate-400 truncate">Administrator</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0"
                        title="Keluar"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </>
    );

    return (
        <>
            <SidebarDesktop />
            <SidebarMobile />
        </>
    );
}
