import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Users, BookOpen, Zap, ChevronRight, ArrowLeft,
    Filter, ArrowUpRight, Clock, Star, MoreHorizontal, X
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';

// --- HELPER COMPONENTS ---

/**
 * Highlights search query within text with lime green background
 */
const HighlightText = ({ text, highlight }) => {
    if (!highlight || !text) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
        <span>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <span key={i} className="bg-[#D6FF59] text-slate-900 px-1 rounded-sm font-bold">
                        {part}
                    </span>
                ) : (
                    part
                )
            )}
        </span>
    );
};

/**
 * Filter Tab Pill Component
 */
const FilterTab = ({ id, label, icon: Icon, active, count, onClick }) => (
    <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onClick(id)}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border-2 whitespace-nowrap ${
            active
                ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
        }`}
    >
        {Icon && (
            <Icon size={16} className={active ? 'text-[#D6FF59]' : 'text-slate-400'} />
        )}
        {label}
        <span
            className={`ml-1 text-xs px-2.5 py-1 rounded-full font-black ${
                active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}
        >
            {count}
        </span>
    </motion.button>
);

/**
 * User Result Card
 */
const UserResultCard = ({ user, query }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02, y: -4 }}
        className="group bg-white p-5 rounded-[24px] border-2 border-slate-100 hover:border-[#D6FF59] hover:shadow-xl transition-all duration-300 flex items-center justify-between cursor-pointer"
    >
        <div className="flex items-center gap-4 flex-1 min-w-0">
            <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0"
            >
                {user.name.charAt(0).toUpperCase()}
            </motion.div>
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 text-base truncate">
                    <HighlightText text={user.name} highlight={query} />
                </h3>
                <p className="text-sm text-slate-600 flex items-center gap-2 truncate">
                    <span className="font-bold text-slate-700">{user.role || 'User'}</span>
                    {user.department && <span className="text-slate-500">• {user.department}</span>}
                </p>
                {user.email && <p className="text-xs text-slate-400 mt-1 truncate">{user.email}</p>}
            </div>
        </div>
        <motion.button
            whileHover={{ scale: 1.1, x: 4 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-[#D6FF59] transition-colors flex-shrink-0 ml-4"
        >
            <ArrowUpRight size={20} />
        </motion.button>
    </motion.div>
);

/**
 * Module Result Card
 */
const ModuleResultCard = ({ module, query }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02, y: -4 }}
        className="group bg-white p-5 rounded-[24px] border-2 border-slate-100 hover:border-blue-400 hover:shadow-xl transition-all duration-300 flex flex-col h-full cursor-pointer"
    >
        <div className="flex justify-between items-start mb-4">
            <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors flex-shrink-0"
            >
                <BookOpen size={24} />
            </motion.div>
            {module.category && (
                <span className="px-3 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider rounded-full">
                    {module.category}
                </span>
            )}
        </div>
        <h3 className="font-black text-slate-900 text-base mb-3 line-clamp-2 flex-1">
            <HighlightText text={module.title} highlight={query} />
        </h3>
        {module.description && (
            <p className="text-xs text-slate-500 mb-3 line-clamp-2">{module.description}</p>
        )}
        <div className="flex items-center gap-3 text-xs font-bold text-slate-500 mt-auto pt-3 border-t border-slate-50 flex-wrap">
            {module.duration && <span className="flex items-center gap-1"><Clock size={14} /> {module.duration}</span>}
            {module.total_enrollments && <span className="flex items-center gap-1"><Users size={14} /> {module.total_enrollments}</span>}
            {module.rating && <span className="flex items-center gap-1 text-amber-500"><Star size={14} fill="currentColor" /> {module.rating}</span>}
        </div>
    </motion.div>
);

/**
 * Training Result Card
 */
const TrainingResultCard = ({ training, query }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02, y: -4 }}
        className="group bg-white p-5 rounded-[24px] border-2 border-slate-100 hover:border-purple-400 hover:shadow-xl transition-all duration-300 flex items-center justify-between cursor-pointer"
    >
        <div className="flex gap-4 items-center flex-1 min-w-0">
            <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 flex-shrink-0"
            >
                <Zap size={24} />
            </motion.div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Training Session</p>
                <h3 className="font-bold text-slate-900 truncate">
                    <HighlightText text={training.module_title || training.title} highlight={query} />
                </h3>
                {training.user_name && (
                    <p className="text-sm text-slate-500 truncate">
                        User: <HighlightText text={training.user_name} highlight={query} />
                    </p>
                )}
            </div>
        </div>
        <div className="text-right flex-shrink-0 ml-4">
            <div
                className={`text-xs font-black px-3 py-1.5 rounded-full inline-block mb-2 ${
                    training.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : training.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-700'
                        : training.status === 'enrolled'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                }`}
            >
                {training.status === 'completed'
                    ? '✓ Completed'
                    : training.status === 'in_progress'
                    ? '⏳ In Progress'
                    : training.status === 'enrolled'
                    ? '📝 Enrolled'
                    : '✕ Failed'}
            </div>
            {training.progress && (
                <div className="w-24 h-1.5 bg-slate-100 rounded-full">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${training.progress}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full ${
                            training.status === 'completed'
                                ? 'bg-emerald-500'
                                : training.status === 'in_progress'
                                ? 'bg-blue-500'
                                : training.status === 'enrolled'
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                        }`}
                    />
                </div>
            )}
        </div>
    </motion.div>
);

// --- MAIN COMPONENT ---

export default function SearchResults({ query = '', users = [], modules = [], trainings = [], auth = {} }) {
    const [activeTab, setActiveTab] = useState('all');
    const [searchInput, setSearchInput] = useState(query);

    // Debug logging
    React.useEffect(() => {
        console.log('SearchResults Mounted:', {
            query,
            usersCount: users.length,
            modulesCount: modules.length,
            trainingsCount: trainings.length,
            totalCount: users.length + modules.length + trainings.length,
            authUser: auth?.user?.name,
        });
    }, [query, users, modules, trainings, auth]);

    // Calculate Counts
    const counts = {
        all: users.length + modules.length + trainings.length,
        users: users.length,
        modules: modules.length,
        trainings: trainings.length,
    };

    const hasResults = counts.all > 0;

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchInput.trim()) {
            router.visit(`/admin/search?q=${encodeURIComponent(searchInput)}`);
        }
    };

    return (
        <AdminLayout user={auth?.user || {}}>
            <Head title={`Search Results - ${query}`} />

            <div className="pb-20">
                {/* DEBUG: Show if data is received */}
                {/* {console.log('SearchResults Props:', { query, users, modules, trainings })} */}

                {/* --- HEADER --- */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                >
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.visit('/admin/dashboard')}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-sm mb-6 transition"
                    >
                        <ArrowLeft size={18} /> Back to Dashboard
                    </motion.button>

                    <div className="flex flex-col lg:flex-row items-start lg:items-end gap-6">
                        <div className="flex-1 w-full">
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
                                🔍 Discovery Engine
                            </h1>
                            {hasResults ? (
                                <p className="text-slate-600 font-semibold">
                                    Found{' '}
                                    <span className="text-slate-900 font-black text-lg">{counts.all}</span>{' '}
                                    matches for{' '}
                                    <span className="text-slate-900 font-black italic">"{query}"</span>
                                </p>
                            ) : (
                                <p className="text-slate-500 font-medium">
                                    Search across people, learning programs, and training activities
                                </p>
                            )}
                        </div>

                        {/* Big Search Input */}
                        <form
                            onSubmit={handleSearch}
                            className="w-full lg:w-[520px] relative group flex-shrink-0"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#D6FF59] to-teal-400 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500"></div>
                            <div className="relative bg-white rounded-2xl shadow-lg flex items-center p-2 border-2 border-slate-100 group-focus-within:border-[#D6FF59] transition-all">
                                <Search className="text-slate-400 ml-3 flex-shrink-0" size={24} />
                                <input
                                    type="text"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    className="w-full px-4 py-3 bg-transparent text-lg font-bold text-slate-900 placeholder-slate-300 outline-none"
                                    placeholder="Search again..."
                                />
                                {searchInput && (
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        type="button"
                                        onClick={() => setSearchInput('')}
                                        className="p-2 text-slate-400 hover:text-slate-600 transition"
                                    >
                                        <X size={20} />
                                    </motion.button>
                                )}
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    type="submit"
                                    className="bg-slate-900 text-white p-3 rounded-xl hover:bg-slate-800 transition flex-shrink-0"
                                >
                                    <ArrowUpRight size={20} />
                                </motion.button>
                            </div>
                        </form>
                    </div>
                </motion.div>

                {/* --- TABS --- */}
                {hasResults && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex gap-3 mb-10 overflow-x-auto pb-2 scrollbar-hide"
                    >
                        <FilterTab
                            id="all"
                            label="All Results"
                            icon={Filter}
                            active={activeTab === 'all'}
                            count={counts.all}
                            onClick={setActiveTab}
                        />
                        <FilterTab
                            id="users"
                            label="People"
                            icon={Users}
                            active={activeTab === 'users'}
                            count={counts.users}
                            onClick={setActiveTab}
                        />
                        <FilterTab
                            id="modules"
                            label="Learning"
                            icon={BookOpen}
                            active={activeTab === 'modules'}
                            count={counts.modules}
                            onClick={setActiveTab}
                        />
                        <FilterTab
                            id="trainings"
                            label="Activity"
                            icon={Zap}
                            active={activeTab === 'trainings'}
                            count={counts.trainings}
                            onClick={setActiveTab}
                        />
                    </motion.div>
                )}

                {/* --- RESULTS AREA --- */}
                <div className="space-y-12 min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {!hasResults ? (
                            <motion.div
                                key="no-results"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border-2 border-slate-200 border-dashed"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6"
                                >
                                    <Search size={40} className="text-slate-300" />
                                </motion.div>
                                <h3 className="text-2xl font-black text-slate-900 mb-2">
                                    No results found
                                </h3>
                                <p className="text-slate-500 mb-8 text-center max-w-md">
                                    {query
                                        ? `We couldn't find anything matching "${query}". Try different keywords or check your spelling.`
                                        : 'Enter a search query to discover people, learning programs, and training activities.'}
                                </p>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => router.visit('/admin/dashboard')}
                                    className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition"
                                >
                                    Back to Dashboard
                                </motion.button>
                            </motion.div>
                        ) : (
                            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                {/* PEOPLE SECTION */}
                                {(activeTab === 'all' || activeTab === 'users') && users.length > 0 && (
                                    <motion.section
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        {activeTab === 'all' && (
                                            <motion.h2
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="text-xs font-black uppercase text-slate-500 tracking-widest mb-5 flex items-center gap-2"
                                            >
                                                <Users size={16} /> People
                                            </motion.h2>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {users.map((user, idx) => (
                                                <motion.div
                                                    key={user.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                >
                                                    <UserResultCard user={user} query={query} />
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.section>
                                )}

                                {/* LEARNING SECTION */}
                                {(activeTab === 'all' || activeTab === 'modules') && modules.length > 0 && (
                                    <motion.section
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.25 }}
                                    >
                                        {activeTab === 'all' && (
                                            <motion.h2
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="text-xs font-black uppercase text-slate-500 tracking-widest mb-5 flex items-center gap-2"
                                            >
                                                <BookOpen size={16} /> Learning Programs
                                            </motion.h2>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {modules.map((module, idx) => (
                                                <motion.div
                                                    key={module.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                >
                                                    <ModuleResultCard module={module} query={query} />
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.section>
                                )}

                                {/* TRAINING SECTION */}
                                {(activeTab === 'all' || activeTab === 'trainings') && trainings.length > 0 && (
                                    <motion.section
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        {activeTab === 'all' && (
                                            <motion.h2
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="text-xs font-black uppercase text-slate-500 tracking-widest mb-5 flex items-center gap-2"
                                            >
                                                <Zap size={16} /> Active Trainings
                                            </motion.h2>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {trainings.map((training, idx) => (
                                                <motion.div
                                                    key={training.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                >
                                                    <TrainingResultCard training={training} query={query} />
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.section>
                                )}

                                {/* EMPTY TAB STATE */}
                                {activeTab !== 'all' &&
                                    ((activeTab === 'users' && users.length === 0) ||
                                        (activeTab === 'modules' && modules.length === 0) ||
                                        (activeTab === 'trainings' && trainings.length === 0)) && (
                                        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-[24px] border-2 border-slate-100">
                                            <p className="text-slate-600 font-semibold">
                                                No {activeTab} found in your search results
                                            </p>
                                        </div>
                                    )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </AdminLayout>
    );
}
