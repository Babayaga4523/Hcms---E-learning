import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Bookmark, BookmarkCheck, Search, Filter, X, Edit3, 
    Trash2, BookOpen, FileText, Video, Clock, Star,
    Plus, Save, Calendar, Tag, FolderOpen, StickyNote
} from 'lucide-react';

const TypeBadge = ({ type }) => {
    const config = {
        training: { color: 'bg-blue-100 text-blue-700', icon: BookOpen, label: 'Training' },
        material: { color: 'bg-green-100 text-green-700', icon: FileText, label: 'Material' },
        video: { color: 'bg-purple-100 text-purple-700', icon: Video, label: 'Video' },
    };
    const { color, icon: Icon, label } = config[type] || config.training;

    return (
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${color}`}>
            <Icon size={12} /> {label}
        </span>
    );
};

export default function MyBookmarks({ auth }) {
    const user = auth.user;
    
    const [bookmarks, setBookmarks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [selectedBookmark, setSelectedBookmark] = useState(null);
    const [noteText, setNoteText] = useState('');

    useEffect(() => {
        loadBookmarks();
    }, []);

    const loadBookmarks = async () => {
        try {
            // Dummy data untuk demo
            const dummyBookmarks = [
                {
                    id: 1,
                    type: 'training',
                    title: 'Cyber Security Fundamentals',
                    description: 'Learn essential cybersecurity concepts and best practices',
                    url: '/training/1',
                    image: 'https://via.placeholder.com/400x200',
                    tags: ['Security', 'IT'],
                    bookmarked_at: '2024-12-28T10:00:00',
                    last_accessed: '2024-12-30T14:30:00',
                    access_count: 12,
                    notes: 'Important: Review chapter 3 before exam',
                    rating: 5
                },
                {
                    id: 2,
                    type: 'material',
                    title: 'Data Protection Guidelines PDF',
                    description: 'Comprehensive guide on data protection regulations',
                    url: '/training/1/material/5',
                    image: null,
                    tags: ['Compliance', 'Legal'],
                    bookmarked_at: '2024-12-27T15:20:00',
                    last_accessed: '2024-12-29T09:15:00',
                    access_count: 8,
                    notes: 'Key points on page 12 and 45',
                    rating: 4
                },
                {
                    id: 3,
                    type: 'video',
                    title: 'Leadership Skills Workshop',
                    description: 'Interactive video series on effective leadership',
                    url: '/training/3/material/12',
                    image: 'https://via.placeholder.com/400x200',
                    tags: ['Leadership', 'Soft Skills'],
                    bookmarked_at: '2024-12-25T08:00:00',
                    last_accessed: '2024-12-30T11:00:00',
                    access_count: 15,
                    notes: 'Check timestamp 12:30 for delegation techniques',
                    rating: 5
                },
            ];
            
            setBookmarks(dummyBookmarks);
        } catch (error) {
            console.error('Failed to load bookmarks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBookmark = async (id) => {
        if (!confirm('Remove this bookmark?')) return;
        
        setBookmarks(bookmarks.filter(b => b.id !== id));
    };

    const handleEditNote = (bookmark) => {
        setSelectedBookmark(bookmark);
        setNoteText(bookmark.notes || '');
        setShowNoteModal(true);
    };

    const handleSaveNote = () => {
        setBookmarks(bookmarks.map(b => 
            b.id === selectedBookmark.id ? { ...b, notes: noteText } : b
        ));
        setShowNoteModal(false);
        setNoteText('');
    };

    const handleRating = (bookmarkId, rating) => {
        setBookmarks(bookmarks.map(b => 
            b.id === bookmarkId ? { ...b, rating } : b
        ));
    };

    const filteredBookmarks = bookmarks.filter(bookmark => {
        const matchesSearch = bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            bookmark.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || bookmark.type === filterType;
        return matchesSearch && matchesType;
    });

    const sortedBookmarks = [...filteredBookmarks].sort((a, b) => {
        return new Date(b.last_accessed) - new Date(a.last_accessed);
    });

    return (
        <AppLayout user={user}>
            <Head title="My Bookmarks" />

            <div className="max-w-7xl mx-auto pb-20">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                                Favorites
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900">My Bookmarks</h1>
                        <p className="text-slate-500 font-medium mt-1">
                            Quick access to your favorite trainings and materials • {bookmarks.length} saved
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-4 text-white">
                        <Bookmark size={24} className="mb-2" />
                        <h3 className="text-2xl font-black">{bookmarks.length}</h3>
                        <p className="text-xs text-amber-100">Total Bookmarks</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
                        <BookOpen size={24} className="mb-2" />
                        <h3 className="text-2xl font-black">{bookmarks.filter(b => b.type === 'training').length}</h3>
                        <p className="text-xs text-blue-100">Trainings</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white">
                        <FileText size={24} className="mb-2" />
                        <h3 className="text-2xl font-black">{bookmarks.filter(b => b.type === 'material').length}</h3>
                        <p className="text-xs text-green-100">Materials</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
                        <Video size={24} className="mb-2" />
                        <h3 className="text-2xl font-black">{bookmarks.filter(b => b.type === 'video').length}</h3>
                        <p className="text-xs text-purple-100">Videos</p>
                    </div>
                </div>

                {/* Search & Filter */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text"
                                placeholder="Search bookmarks..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>

                        <select 
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-amber-500"
                        >
                            <option value="all">All Types</option>
                            <option value="training">Training</option>
                            <option value="material">Material</option>
                            <option value="video">Video</option>
                        </select>
                    </div>
                </div>

                {/* Bookmarks Grid */}
                {loading ? (
                    <div className="text-center py-16">
                        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-slate-500">Loading bookmarks...</p>
                    </div>
                ) : sortedBookmarks.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                        <Bookmark size={48} className="mx-auto mb-4 text-slate-300" />
                        <p className="font-semibold text-slate-600">No bookmarks found</p>
                        <p className="text-sm text-slate-500 mt-1">Start bookmarking your favorite content!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {sortedBookmarks.map((bookmark) => (
                            <motion.div 
                                key={bookmark.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition group"
                            >
                                {/* Image/Thumbnail */}
                                {bookmark.image ? (
                                    <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
                                        <img 
                                            src={bookmark.image} 
                                            alt={bookmark.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                        />
                                        <div className="absolute top-3 right-3">
                                            <TypeBadge type={bookmark.type} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-40 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative">
                                        <FileText size={48} className="text-slate-600" />
                                        <div className="absolute top-3 right-3">
                                            <TypeBadge type={bookmark.type} />
                                        </div>
                                    </div>
                                )}

                                {/* Content */}
                                <div className="p-6">
                                    <Link href={bookmark.url} className="group/link">
                                        <h3 className="font-bold text-slate-900 text-lg mb-2 group-hover/link:text-amber-600 transition line-clamp-2">
                                            {bookmark.title}
                                        </h3>
                                    </Link>
                                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                                        {bookmark.description}
                                    </p>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {bookmark.tags.map((tag, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Notes Preview */}
                                    {bookmark.notes && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                                            <div className="flex items-start gap-2">
                                                <StickyNote size={14} className="text-amber-600 mt-0.5 shrink-0" />
                                                <p className="text-xs text-amber-900 line-clamp-2">{bookmark.notes}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Rating */}
                                    <div className="flex items-center gap-1 mb-4">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => handleRating(bookmark.id, star)}
                                                className="transition hover:scale-110"
                                            >
                                                <Star 
                                                    size={16} 
                                                    className={star <= bookmark.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                                                />
                                            </button>
                                        ))}
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} />
                                            Opened {bookmark.access_count}x
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            {new Date(bookmark.last_accessed).toLocaleDateString('id-ID', { 
                                                day: 'numeric', 
                                                month: 'short' 
                                            })}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Link 
                                            href={bookmark.url}
                                            className="flex-1 py-2 px-4 bg-amber-500 text-white rounded-lg font-semibold text-sm hover:bg-amber-600 transition text-center"
                                        >
                                            Open
                                        </Link>
                                        <button 
                                            onClick={() => handleEditNote(bookmark)}
                                            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                                            title="Edit note"
                                        >
                                            <Edit3 size={18} className="text-slate-600" />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteBookmark(bookmark.id)}
                                            className="p-2 bg-red-50 hover:bg-red-100 rounded-lg transition"
                                            title="Remove bookmark"
                                        >
                                            <Trash2 size={18} className="text-red-600" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Note Modal */}
                <AnimatePresence>
                    {showNoteModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                                onClick={() => setShowNoteModal(false)}
                            />
                            
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative z-10"
                            >
                                <div className="p-6 border-b border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-black text-slate-900">Edit Note</h2>
                                        <button 
                                            onClick={() => setShowNoteModal(false)}
                                            className="p-2 rounded-lg hover:bg-slate-100"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <p className="font-semibold text-slate-900 mb-4">{selectedBookmark?.title}</p>
                                    <textarea 
                                        value={noteText}
                                        onChange={(e) => setNoteText(e.target.value)}
                                        placeholder="Add your notes, key points, or reminders here..."
                                        rows={6}
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                                    />
                                </div>

                                <div className="p-6 border-t border-slate-100 flex gap-3">
                                    <button 
                                        onClick={() => setShowNoteModal(false)}
                                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleSaveNote}
                                        className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition flex items-center justify-center gap-2"
                                    >
                                        <Save size={18} /> Save Note
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </div>
        </AppLayout>
    );
}
