import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, ArrowRight, CheckCircle2, BookOpen, 
    FileText, Video, Download, ChevronLeft, ChevronRight,
    Play, Pause, Volume2, VolumeX, Maximize, Clock,
    BookmarkPlus, Share2, ThumbsUp, MessageCircle
} from 'lucide-react';
import axios from 'axios';

// PDF Viewer Component
const PDFViewer = ({ url }) => (
    <div className="w-full h-[70vh] bg-slate-100 rounded-xl overflow-hidden">
        <iframe
            src={url}
            className="w-full h-full"
            title="PDF Viewer"
        />
    </div>
);

// Video Player Component
const VideoPlayer = ({ url, onComplete }) => {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const total = videoRef.current.duration;
            setCurrentTime(current);
            setProgress((current / total) * 100);
            
            // Mark as complete when 90% watched
            if (progress >= 90 && onComplete) {
                onComplete();
            }
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const formatTime = (time) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="relative w-full bg-black rounded-xl overflow-hidden group">
            <video
                ref={videoRef}
                src={url}
                className="w-full aspect-video"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => onComplete && onComplete()}
            />
            
            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Progress Bar */}
                <div className="w-full h-1 bg-white/30 rounded-full mb-3 cursor-pointer">
                    <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={togglePlay} className="text-white hover:text-blue-400 transition">
                            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                        </button>
                        <button onClick={() => setIsMuted(!isMuted)} className="text-white hover:text-blue-400 transition">
                            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>
                        <span className="text-white text-sm">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>
                    <button className="text-white hover:text-blue-400 transition">
                        <Maximize size={20} />
                    </button>
                </div>
            </div>
            
            {/* Play Button Overlay */}
            {!isPlaying && (
                <div 
                    className="absolute inset-0 flex items-center justify-center cursor-pointer"
                    onClick={togglePlay}
                >
                    <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-xl">
                        <Play className="text-blue-600 ml-1" size={32} />
                    </div>
                </div>
            )}
        </div>
    );
};

// Text Content Component
const TextContent = ({ content }) => (
    <div className="prose prose-slate max-w-none bg-white rounded-xl p-8 border border-slate-200">
        <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
);

// Download Content Component
const DownloadContent = ({ material }) => (
    <div className="bg-white rounded-xl p-8 border border-slate-200 text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Download className="text-blue-600" size={40} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">{material.title}</h3>
        <p className="text-slate-500 mb-6">{material.description || 'Download materi untuk melanjutkan pembelajaran'}</p>
        <a
            href={material.file_url}
            download
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
            <Download size={20} />
            Download Materi
        </a>
        <p className="text-sm text-slate-400 mt-4">
            {material.file_size || '2.5 MB'} • {material.file_type || 'PDF'}
        </p>
    </div>
);

// Main Component
export default function MaterialViewer({ auth, training = {}, material = {}, materials = [], nextMaterial = null, prevMaterial = null }) {
    const user = auth?.user || {};
    const [isCompleted, setIsCompleted] = useState(material.is_completed || false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Load bookmark status
        loadBookmarkStatus();
    }, []);

    const loadBookmarkStatus = async () => {
        try {
            const response = await axios.get(`/api/training/${training.id}/material/${material.id}/stats`);
            if (response.data.success) {
                setIsBookmarked(response.data.stats.is_bookmarked);
            }
        } catch (error) {
            console.error('Failed to load bookmark status:', error);
        }
    };

    const handleMarkComplete = async () => {
        if (isCompleted) return;
        
        try {
            setLoading(true);
            await axios.post(`/api/training/${training.id}/material/${material.id}/complete`);
            setIsCompleted(true);
        } catch (error) {
            console.error('Failed to mark as complete:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (nextMaterial) {
            router.visit(`/training/${training.id}/material/${nextMaterial.id}`);
        } else {
            router.visit(`/training/${training.id}`);
        }
    };

    const handlePrev = () => {
        if (prevMaterial) {
            router.visit(`/training/${training.id}/material/${prevMaterial.id}`);
        }
    };

    const handleBookmark = async () => {
        try {
            setLoading(true);
            if (isBookmarked) {
                await axios.delete(`/api/training/${training.id}/material/${material.id}/bookmark`);
                setIsBookmarked(false);
            } else {
                await axios.post(`/api/training/${training.id}/material/${material.id}/bookmark`);
                setIsBookmarked(true);
            }
        } catch (error) {
            console.error('Failed to toggle bookmark:', error);
            alert('Gagal mengubah bookmark');
        } finally {
            setLoading(false);
        }
    };

    const handleShare = () => {
        const shareData = {
            title: material.title,
            text: `Lihat materi training: ${material.title} dari ${training.title}`,
            url: window.location.href
        };

        if (navigator.share) {
            // Use native share API if available
            navigator.share(shareData).catch(console.error);
        } else {
            // Fallback: copy link to clipboard
            navigator.clipboard.writeText(window.location.href).then(() => {
                alert('Link berhasil disalin ke clipboard');
            }).catch(() => {
                // Final fallback: show share modal
                showShareModal();
            });
        }
    };

    const showShareModal = () => {
        const shareUrl = window.location.href;
        const text = `Lihat materi training: ${material.title}`;
        
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + ' - ' + shareUrl)}`;
        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 class="text-lg font-bold mb-4">Bagikan Material</h3>
                <div class="space-y-3">
                    <button onclick="window.open('${whatsappUrl}', '_blank')" class="w-full p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
                        📱 Bagikan via WhatsApp
                    </button>
                    <button onclick="window.open('${telegramUrl}', '_blank')" class="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                        ✈️ Bagikan via Telegram
                    </button>
                    <button onclick="navigator.clipboard.writeText('${shareUrl}').then(() => alert('Link disalin!'))" class="w-full p-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">
                        📋 Salin Link
                    </button>
                    <button onclick="this.closest('.fixed').remove()" class="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                        Batal
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    };

    // Find current material index
    const currentIndex = materials.findIndex(m => m.id === material.id);
    const totalMaterials = materials.length;

    // Render content based on material type
    const renderContent = () => {
        switch (material.type) {
            case 'video':
                return <VideoPlayer url={material.file_url} onComplete={handleMarkComplete} />;
            case 'pdf':
            case 'document':
                return <PDFViewer url={material.file_url} />;
            case 'download':
                return <DownloadContent material={material} />;
            case 'text':
            case 'html':
                return <TextContent content={material.content} />;
            default:
                return <TextContent content={material.content || '<p>Konten tidak tersedia</p>'} />;
        }
    };

    return (
        <AppLayout user={user}>
            <Head title={`${material.title} - ${training.title}`} />

            {/* Top Navigation */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30 mb-6">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link 
                            href={`/training/${training.id}`}
                            className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition"
                        >
                            <ArrowLeft size={20} />
                            <span className="font-medium hidden md:inline">{training.title}</span>
                        </Link>
                        
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-500">
                                Materi {currentIndex + 1} dari {totalMaterials}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={handlePrev}
                                    disabled={!prevMaterial}
                                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Material Header */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs font-bold rounded uppercase">
                                        {material.type || 'Materi'}
                                    </span>
                                    {isCompleted && (
                                        <span className="px-2 py-1 bg-emerald-100 text-emerald-600 text-xs font-bold rounded flex items-center gap-1">
                                            <CheckCircle2 size={12} />
                                            Selesai
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-2xl font-bold text-slate-900">{material.title}</h1>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Clock size={16} />
                                <span>{material.duration || 10} menit</span>
                            </div>
                        </div>
                        
                        {material.description && (
                            <p className="text-slate-600">{material.description}</p>
                        )}
                    </div>

                    {/* Content Area */}
                    {renderContent()}

                    {/* Actions */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={handleBookmark}
                                    disabled={loading}
                                    className={`flex items-center gap-2 px-4 py-2 transition ${
                                        isBookmarked 
                                            ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' 
                                            : 'text-slate-600 hover:text-yellow-600 hover:bg-yellow-50'
                                    } rounded-lg`}
                                >
                                    <Bookmark 
                                        size={18} 
                                        className={isBookmarked ? 'fill-current' : ''} 
                                    />
                                    <span className="text-sm font-medium">
                                        {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                                    </span>
                                </button>
                                <button 
                                    onClick={handleShare}
                                    className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition rounded-lg"
                                >
                                    <Share2 size={18} />
                                    <span className="text-sm font-medium">Share</span>
                                </button>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                {!isCompleted && (
                                    <button
                                        onClick={handleMarkComplete}
                                        disabled={loading}
                                        className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                        ) : (
                                            <CheckCircle2 size={18} />
                                        )}
                                        Tandai Selesai
                                    </button>
                                )}
                                
                                <button
                                    onClick={handleNext}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-200"
                                >
                                    {nextMaterial ? 'Lanjut' : 'Kembali ke Training'}
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar - Material List */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 sticky top-24">
                        <h3 className="font-bold text-slate-900 mb-4">Daftar Materi</h3>
                        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                            {materials.map((m, index) => {
                                const isCurrent = m.id === material.id;
                                const isDone = m.is_completed;
                                
                                return (
                                    <Link
                                        key={m.id}
                                        href={`/training/${training.id}/material/${m.id}`}
                                        className={`flex items-center gap-3 p-3 rounded-xl transition ${
                                            isCurrent 
                                                ? 'bg-blue-50 border border-blue-200' 
                                                : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                                            isDone 
                                                ? 'bg-emerald-100 text-emerald-600' 
                                                : isCurrent 
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {isDone ? <CheckCircle2 size={16} /> : index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium truncate ${
                                                isCurrent ? 'text-blue-600' : 'text-slate-700'
                                            }`}>
                                                {m.title}
                                            </p>
                                            <p className="text-xs text-slate-400">{m.duration || 5} menit</p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
