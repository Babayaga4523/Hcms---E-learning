import React, { useState, useEffect, useRef } from 'react';
import { Link, router } from '@inertiajs/react';
import { Menu, X, LogOut, User, Settings, ChevronDown, Bookmark, Target, TrendingUp, BarChart3, FileText } from 'lucide-react';
import NotificationDropdown from '@/Components/Notification/NotificationDropdown';

export default function Navbar({ user }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [learningDropdownOpen, setLearningDropdownOpen] = useState(false);
    const [reportsDropdownOpen, setReportsDropdownOpen] = useState(false);
    
    const learningRef = useRef(null);
    const reportsRef = useRef(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (learningRef.current && !learningRef.current.contains(event.target)) {
                setLearningDropdownOpen(false);
            }
            if (reportsRef.current && !reportsRef.current.contains(event.target)) {
                setReportsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = (e) => {
        e.preventDefault();
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

    return (
        <nav className="sticky top-0 z-50 bg-white shadow-md border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-lg">
                                <span className="text-white font-bold text-xl">HCMS</span>
                            </div>
                            <div className="hidden sm:block">
                                <h1 className="text-lg font-bold text-gray-800">E-Learning</h1>
                                <p className="text-xs text-gray-600">BNI Training</p>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link 
                            href="/dashboard" 
                            className="text-gray-700 hover:text-blue-600 font-medium transition"
                        >
                            Dashboard
                        </Link>
                        <Link 
                            href="/my-trainings" 
                            className="text-gray-700 hover:text-blue-600 font-medium transition"
                        >
                            Training Saya
                        </Link>
                        
                        {/* My Learning Dropdown */}
                        <div className="relative" ref={learningRef}>
                            <button
                                onClick={() => setLearningDropdownOpen(!learningDropdownOpen)}
                                className="flex items-center gap-1 text-gray-700 hover:text-blue-600 font-medium transition"
                            >
                                My Learning
                                <ChevronDown size={16} className={`transition-transform ${learningDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {learningDropdownOpen && (
                                <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                                    <Link 
                                        href="/bookmarks"
                                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                                    >
                                        <Bookmark size={18} />
                                        <div>
                                            <p className="font-semibold text-sm">Bookmarks</p>
                                            <p className="text-xs text-gray-500">Saved favorites</p>
                                        </div>
                                    </Link>
                                    <Link 
                                        href="/goals"
                                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                                    >
                                        <Target size={18} />
                                        <div>
                                            <p className="font-semibold text-sm">Learning Goals</p>
                                            <p className="text-xs text-gray-500">Track targets</p>
                                        </div>
                                    </Link>
                                    <Link 
                                        href="/learning-path"
                                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                                    >
                                        <BarChart3 size={18} />
                                        <div>
                                            <p className="font-semibold text-sm">Learning Path</p>
                                            <p className="text-xs text-gray-500">Skill roadmap</p>
                                        </div>
                                    </Link>
                                    <div className="border-t border-gray-100 my-2"></div>
                                    <Link 
                                        href="/learner/performance"
                                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                                    >
                                        <TrendingUp size={18} />
                                        <div>
                                            <p className="font-semibold text-sm">Performance</p>
                                            <p className="text-xs text-gray-500">View metrics</p>
                                        </div>
                                    </Link>
                                    <Link 
                                        href="/learner/progress-detail"
                                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                                    >
                                        <BarChart3 size={18} />
                                        <div>
                                            <p className="font-semibold text-sm">Progress Detail</p>
                                            <p className="text-xs text-gray-500">Track completion</p>
                                        </div>
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Reports Dropdown */}
                        <div className="relative" ref={reportsRef}>
                            <button
                                onClick={() => setReportsDropdownOpen(!reportsDropdownOpen)}
                                className="flex items-center gap-1 text-gray-700 hover:text-blue-600 font-medium transition"
                            >
                                Reports
                                <ChevronDown size={16} className={`transition-transform ${reportsDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {reportsDropdownOpen && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                                    <Link 
                                        href="/my-reports"
                                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                                    >
                                        <FileText size={18} />
                                        <div>
                                            <p className="font-semibold text-sm">My Reports</p>
                                            <p className="text-xs text-gray-500">View reports</p>
                                        </div>
                                    </Link>
                                </div>
                            )}
                        </div>

                        {user?.role === 'admin' && (
                            <Link 
                                href="/admin/dashboard" 
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
                            >
                                Admin Panel
                            </Link>
                        )}
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center gap-4">
                        {/* Notification Bell */}
                        <NotificationDropdown user={user} />

                        {/* User Dropdown */}
                        <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-gray-200 relative">
                            <button
                                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                className="flex items-center gap-3 hover:opacity-80 transition"
                            >
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-800">{user.name}</p>
                                    <p className="text-xs text-gray-600">{user.department}</p>
                                </div>
                                <img 
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D8ABC&color=fff&size=40`}
                                    alt={user.name}
                                    className="w-10 h-10 rounded-full border-2 border-blue-600"
                                />
                            </button>

                            {/* Dropdown Menu */}
                            {userDropdownOpen && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                    <Link 
                                        href="/profile"
                                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-t-lg flex items-center gap-2 transition"
                                    >
                                        <User className="w-4 h-4" />
                                        Profile
                                    </Link>
                                    <Link 
                                        href="/settings"
                                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition"
                                    >
                                        <Settings className="w-4 h-4" />
                                        Pengaturan
                                    </Link>
                                    <hr className="my-1" />
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-b-lg flex items-center gap-2 transition"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button 
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            {mobileMenuOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-200">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        <Link 
                            href="/dashboard"
                            className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
                        >
                            Dashboard
                        </Link>
                        <Link 
                            href="/my-trainings"
                            className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
                        >
                            Training Saya
                        </Link>
                        
                        {/* My Learning Section */}
                        <div className="pt-2">
                            <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">My Learning</p>
                            <Link 
                                href="/bookmarks"
                                className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
                            >
                                📚 Bookmarks
                            </Link>
                            <Link 
                                href="/goals"
                                className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
                            >
                                🎯 Learning Goals
                            </Link>
                            <Link 
                                href="/learning-path"
                                className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
                            >
                                🗺️ Learning Path
                            </Link>
                            <Link 
                                href="/learner/performance"
                                className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
                            >
                                📈 Performance
                            </Link>
                            <Link 
                                href="/learner/progress-detail"
                                className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
                            >
                                📊 Progress Detail
                            </Link>
                        </div>

                        {/* Reports Section */}
                        <div className="pt-2">
                            <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Reports</p>
                            <Link 
                                href="/my-reports"
                                className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
                            >
                                📄 My Reports
                            </Link>
                        </div>

                        {user?.role === 'admin' && (
                            <>
                                <hr className="my-2" />
                                <Link 
                                    href="/admin/dashboard"
                                    className="block px-3 py-2 rounded-lg bg-blue-600 text-white font-medium"
                                >
                                    Admin Panel
                                </Link>
                            </>
                        )}
                        <hr className="my-2" />
                        <Link 
                            href="/profile"
                            className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                            <User className="w-4 h-4" />
                            Profile
                        </Link>
                        <Link 
                            href="/settings"
                            className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                            <Settings className="w-4 h-4" />
                            Pengaturan
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-3 py-2 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 transition"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}
