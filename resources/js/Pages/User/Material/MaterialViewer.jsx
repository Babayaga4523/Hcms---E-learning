import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import showToast from '@/Utils/toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, ChevronRight, ChevronLeft, CheckCircle2, 
    PlayCircle, FileText, Lock, Menu, X, Download, 
    Maximize2, Minimize2, Share2, Sparkles, Play, Pause, 
    Volume2, VolumeX, SkipBack, SkipForward
} from 'lucide-react';
import axios from 'axios';

// --- Wondr Style System ---
const WondrStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        
        .glass-sidebar {
            background: rgba(255, 255, 255, 0.98);
            border-left: 1px solid #E2E8F0;
        }

        .material-item {
            transition: all 0.2s ease;
            border-left: 3px solid transparent;
        }
        .material-item:hover { background-color: #F1F5F9; }
        .material-item.active {
            background-color: #F0FDF4;
            border-left-color: #005E54;
        }
        .material-item.locked { opacity: 0.5; cursor: not-allowed; }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }

        .content-frame {
            border: none;
            width: 100%;
            height: 100%;
            background: #f1f5f9;
        }
        
        .video-controls {
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .video-wrapper:hover .video-controls {
            opacity: 1;
        }
        
        .progress-bar {
            cursor: pointer;
        }
        .progress-bar:hover .progress-thumb {
            transform: scale(1.5);
        }
    `}</style>
);

// --- Helper Components ---

const MaterialItem = ({ item, index, isActive, isLocked, onClick }) => {
    const Icon = item.type === 'video' ? PlayCircle : FileText;
    
    return (
        <button
            onClick={() => !isLocked && onClick(item)}
            disabled={isLocked}
            className={`material-item w-full flex items-start gap-3 p-4 text-left group ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
        >
            <div className={`mt-0.5 shrink-0 transition-colors ${isActive ? 'text-[#005E54]' : 'text-slate-400'}`}>
                {item.is_completed ? (
                    <CheckCircle2 size={18} className="text-emerald-500 fill-emerald-50" />
                ) : isLocked ? (
                    <Lock size={18} />
                ) : (
                    <Icon size={18} />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold mb-1 truncate ${isActive ? 'text-[#005E54]' : 'text-slate-700'}`}>
                    {index + 1}. {item.title}
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-2">
                    <span>{item.duration} min</span>
                    {item.type === 'video' && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">Video</span>}
                    {(item.type === 'pdf' || item.type === 'document') && <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">PDF</span>}
                    {item.type === 'presentation' && <span className="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">PPT</span>}
                </p>
            </div>
        </button>
    );
};

const VideoPlayer = ({ url, onComplete }) => {
    const videoRef = useRef(null);
    const progressRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const isMounted = useRef(true);
    const hasCalledComplete = useRef(false);

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const isVideoUrl = (videoUrl) => {
        if (!videoUrl) return false;
        const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
        return videoExtensions.some(ext => videoUrl.toLowerCase().endsWith(ext));
    };

    useEffect(() => {
        isMounted.current = true;
        hasCalledComplete.current = false;
        return () => {
            isMounted.current = false;
            if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.removeAttribute('src');
                videoRef.current.load();
            }
        };
    }, [url]);

    if (!isVideoUrl(url)) {
        return (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center text-white">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6">
                    <PlayCircle size={48} className="opacity-50" />
                </div>
                <p className="text-lg font-medium mb-2">Format video tidak didukung</p>
                <p className="text-sm text-white/60">Silakan hubungi administrator</p>
            </div>
        );
    }

    const togglePlay = async () => {
        if (videoRef.current && isMounted.current) {
            if (isPlaying) {
                videoRef.current.pause();
                setIsPlaying(false);
            } else {
                try {
                    await videoRef.current.play();
                    if (isMounted.current) setIsPlaying(true);
                } catch (error) {
                    if (error.name !== 'AbortError') {
                        console.error('Error playing video:', error);
                    }
                }
            }
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            videoRef.current?.parentElement?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current && isMounted.current) {
            const current = videoRef.current.currentTime;
            const total = videoRef.current.duration;
            setCurrentTime(current);
            setDuration(total);
            setProgress((current / total) * 100);
            
            if (progress >= 90 && onComplete && !hasCalledComplete.current) {
                hasCalledComplete.current = true;
                onComplete();
            }
        }
    };

    const handleProgressClick = (e) => {
        if (progressRef.current && videoRef.current) {
            const rect = progressRef.current.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            videoRef.current.currentTime = percent * videoRef.current.duration;
        }
    };

    const skip = (seconds) => {
        if (videoRef.current) {
            videoRef.current.currentTime += seconds;
        }
    };

    return (
        <div className="video-wrapper relative w-full h-full bg-black flex items-center justify-center group">
            <video
                ref={videoRef}
                src={url}
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => onComplete && onComplete()}
                onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                preload="metadata"
                onClick={togglePlay}
            />
            
            {/* Center Play Button (when paused) */}
            {!isPlaying && (
                <div 
                    className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/30"
                    onClick={togglePlay}
                >
                    <button className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:scale-110 transition-transform hover:bg-[#D6F84C] hover:text-[#002824] text-white shadow-2xl">
                        <Play size={48} fill="currentColor" className="ml-2" />
                    </button>
                </div>
            )}

            {/* Bottom Controls */}
            <div className="video-controls absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                {/* Progress Bar */}
                <div 
                    ref={progressRef}
                    className="progress-bar w-full h-1.5 bg-white/30 rounded-full mb-4 overflow-hidden relative group/progress"
                    onClick={handleProgressClick}
                >
                    <div 
                        className="h-full bg-[#D6F84C] rounded-full relative"
                        style={{ width: `${progress}%` }}
                    >
                        <div className="progress-thumb absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#D6F84C] rounded-full shadow-lg transition-transform"></div>
                    </div>
                </div>
                
                {/* Control Buttons */}
                <div className="flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={togglePlay}
                            className="p-2 hover:bg-white/20 rounded-full transition"
                        >
                            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                        </button>
                        <button 
                            onClick={() => skip(-10)}
                            className="p-2 hover:bg-white/20 rounded-full transition"
                            title="Mundur 10 detik"
                        >
                            <SkipBack size={20} />
                        </button>
                        <button 
                            onClick={() => skip(10)}
                            className="p-2 hover:bg-white/20 rounded-full transition"
                            title="Maju 10 detik"
                        >
                            <SkipForward size={20} />
                        </button>
                        <button 
                            onClick={toggleMute}
                            className="p-2 hover:bg-white/20 rounded-full transition"
                        >
                            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>
                        <span className="text-sm font-medium ml-2">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>
                    <button 
                        onClick={toggleFullscreen}
                        className="p-2 hover:bg-white/20 rounded-full transition"
                    >
                        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

const PDFViewer = ({ url, title }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    
    // PENTING: Gunakan direct URL tanpa fetch, biar browser handle PDF inline
    return (
        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col relative">
            {/* Loading state */}
            {isLoading && !hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                    <div className="text-center">
                        <div className="w-14 h-14 border-4 border-[#005E54] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-600 font-medium">Memuat PDF...</p>
                    </div>
                </div>
            )}
            
            {/* PDF DIRECT INLINE - NO DOWNLOAD */}
            {url && !hasError ? (
                <iframe
                    src={url + '#toolbar=1&navpanes=0&scrollbar=1'}
                    className="w-full h-full border-0"
                    title={title || 'PDF Viewer'}
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                        setIsLoading(false);
                        setHasError(true);
                    }}
                    allow="autoplay"
                    referrerPolicy="no-referrer"
                    data-testid="pdf-iframe"
                />
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <div className="bg-white p-10 rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full">
                        <div className={`w-20 h-20 ${hasError ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-400'} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                            <FileText size={40} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-3 line-clamp-2">{title}</h3>
                        <p className="text-slate-500 mb-8 text-sm leading-relaxed">
                            {hasError 
                                ? 'Gagal memuat PDF. File mungkin bermasalah atau tidak tersedia.'
                                : 'Dokumen PDF siap ditampilkan. Gunakan toolbar PDF untuk zoom, search, dan print.'
                            }
                        </p>
                        {hasError && url ? (
                            <button
                                onClick={() => window.open(url, '_blank')}
                                className="w-full px-6 py-4 bg-[#002824] text-[#D6F84C] rounded-2xl font-bold hover:bg-[#00403a] transition shadow-xl flex items-center justify-center gap-3"
                            >
                                <Download size={20} /> Buka di Tab Baru
                            </button>
                        ) : !url ? (
                            <div className="w-full px-6 py-4 bg-slate-200 text-slate-500 rounded-2xl font-bold flex items-center justify-center gap-3">
                                <span>Tidak ada file untuk diakses</span>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
};

const ExcelViewer = ({ url, title }) => {
    const [data, setData] = useState(null);
    const [sheets, setSheets] = useState([]);
    const [activeSheet, setActiveSheet] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const loadExcel = async () => {
            try {
                // Load SheetJS library dynamically
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
                script.async = true;
                script.onload = async () => {
                    try {
                        const response = await fetch(url, {
                            method: 'GET',
                            credentials: 'include', // Include auth cookies
                            headers: {
                                'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel'
                            }
                        });
                        
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }
                        
                        const arrayBuffer = await response.arrayBuffer();
                        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                        
                        setSheets(workbook.SheetNames);
                        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                        setData(jsonData);
                        setLoading(false);
                    } catch (fetchErr) {
                        console.error('Error fetching Excel:', fetchErr);
                        setError(true);
                        setLoading(false);
                    }
                };
                script.onerror = () => {
                    console.error('Error loading SheetJS library');
                    setError(true);
                    setLoading(false);
                };
                document.head.appendChild(script);
            } catch (err) {
                console.error('Error loading Excel:', err);
                setError(true);
                setLoading(false);
            }
        };
        loadExcel();
    }, [url]);

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="w-14 h-14 border-4 border-[#005E54] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Memuat file Excel...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-slate-50">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-500">
                        <FileText size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Gagal Memuat File</h3>
                    <p className="text-slate-500 mb-6 text-sm">File Excel tidak dapat diproses.</p>
                    <a 
                        href={url} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#005E54] text-white rounded-xl font-bold hover:bg-[#004a44]"
                    >
                        <Download size={18} /> Download File
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col bg-white">
            {/* Sheet Tabs */}
            {sheets.length > 1 && (
                <div className="flex gap-2 p-4 border-b border-slate-200 bg-slate-50 overflow-x-auto">
                    {sheets.map((sheet, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveSheet(idx)}
                            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
                                activeSheet === idx
                                    ? 'bg-[#005E54] text-white'
                                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                            {sheet}
                        </button>
                    ))}
                </div>
            )}

            {/* Table */}
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full border-collapse text-sm">
                    <thead className="sticky top-0">
                        <tr className="bg-[#005E54] text-white">
                            {Object.keys(data[0] || {}).map((key, idx) => (
                                <th 
                                    key={idx}
                                    className="border border-slate-200 px-4 py-3 text-left font-bold"
                                >
                                    {key}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, idx) => (
                            <tr 
                                key={idx}
                                className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                            >
                                {Object.keys(row).map((key, colIdx) => (
                                    <td 
                                        key={colIdx}
                                        className="border border-slate-200 px-4 py-3"
                                    >
                                        {typeof row[key] === 'object' ? JSON.stringify(row[key]) : String(row[key])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer Info */}
            <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 flex items-center justify-between">
                <span>Total baris: <strong>{data.length}</strong></span>
                <span className="text-xs text-slate-500">Tampilan interaktif • Scroll untuk melihat lebih banyak data</span>
            </div>
        </div>
    );
};

const PowerPointViewer = ({ url, title }) => {
    return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="text-center max-w-md mx-4">
                <div className="bg-white p-12 rounded-3xl shadow-2xl border border-slate-200">
                    <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-8 text-orange-500">
                        <FileText size={40} />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">{title}</h3>
                    <p className="text-slate-500 mb-2 text-sm">File Type: <span className="font-semibold text-slate-700 uppercase">PPTX</span></p>
                    <p className="text-slate-500 mb-8 text-sm leading-relaxed">
                        Fitur pratinjau PowerPoint sedang dalam pengembangan. Silakan download untuk melihat presentasi lengkap.
                    </p>
                    
                    <div className="flex flex-col gap-3">
                        <a 
                            href={url} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full px-6 py-4 bg-[#005E54] text-white rounded-2xl font-bold hover:bg-[#004a44] transition flex items-center justify-center gap-3 shadow-lg"
                        >
                            <Download size={20} /> Download PowerPoint
                        </a>
                        <p className="text-xs text-slate-400 mt-2">
                            💡 Download dan buka dengan Microsoft PowerPoint atau Google Slides
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const IFrameViewer = ({ url, title, type }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    
    if (!url) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <FileText size={40} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500">Tidak ada file untuk ditampilkan</p>
                </div>
            </div>
        );
    }
    
    // Construct absolute URL if relative for PDFs and images
    let absoluteUrl = url;
    if (url.startsWith('/')) {
        const baseUrl = window.location.origin;
        absoluteUrl = baseUrl + url;
    }
    
    return (
        <div className="w-full h-full bg-white relative">
            {isLoading && !hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
                    <div className="text-center">
                        <div className="w-14 h-14 border-4 border-[#005E54] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-600 font-medium">Memuat konten...</p>
                        <p className="text-slate-400 text-sm mt-1">Mohon tunggu sebentar</p>
                    </div>
                </div>
            )}
            {hasError ? (
                <div className="flex-1 h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50">
                    <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-500">
                        <FileText size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Gagal Memuat Konten</h3>
                    <p className="text-slate-500 mb-6 text-sm">Konten tidak dapat ditampilkan dalam pratinjau.</p>
                    {url && (
                        <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-6 py-3 bg-[#005E54] text-white rounded-xl font-bold hover:bg-[#004a44] transition flex items-center gap-2"
                        >
                            <Download size={18} /> Buka di Tab Baru
                        </a>
                    )}
                </div>
            ) : (
                <iframe
                    src={absoluteUrl}
                    title={title || 'Materi Pembelajaran'}
                    className="content-frame w-full h-full"
                    onLoad={() => setIsLoading(false)}
                    onError={() => { setIsLoading(false); setHasError(true); }}
                    allow="autoplay; encrypted-media"
                    referrerPolicy="no-referrer"
                />
            )}
        </div>
    );
};

// --- Main Component ---
export default function MaterialViewer({ auth, trainingId, materialId }) {
    const user = auth?.user || {};
    const [training, setTraining] = useState({});
    const [material, setMaterial] = useState({});
    const [materials, setMaterials] = useState([]);
    const [isCompleted, setIsCompleted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [confetti, setConfetti] = useState(false);
    // Authoritative progress percentage returned by server (ModuleProgress)
    const [serverProgress, setServerProgress] = useState(null);

    useEffect(() => {
        loadMaterialData();
    }, [trainingId, materialId]);

    const loadMaterialData = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/training/${trainingId}/material/${materialId}`);
            
            setTraining(response.data.training);
            setMaterial(response.data.material);
            setMaterials(response.data.materials || []);
            setIsCompleted(response.data.material.is_completed || false);
            // Use server-side authoritative progress percentage when available
            setServerProgress(typeof response.data.progress_percentage !== 'undefined' ? response.data.progress_percentage : (response.data.progress?.progress_percentage ?? null));
        } catch (error) {
            console.error('Failed to load material:', error);
            showToast('Gagal memuat materi.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkComplete = async () => {
        if (isCompleted) return;
        
        try {
            setActionLoading(true);

            const res = await axios.post(`/api/training/${trainingId}/material/${materialId}/complete`);
            setIsCompleted(true);
            setConfetti(true);

            // Update server progress if provided
            const newProgress = (res.data && typeof res.data.progress_percentage !== 'undefined') ? res.data.progress_percentage : (res.data?.progress?.progress_percentage ?? null);
            if (newProgress !== null) {
                setServerProgress(newProgress);
            }

            const updated = [...materials];
            const idx = updated.findIndex(m => m.id === material.id);
            if (idx !== -1) updated[idx].is_completed = true;
            setMaterials(updated);
            
            // Auto-navigate after marking complete
            setTimeout(() => {
                setConfetti(false);
                // Move to next material only if available; do NOT auto-redirect to training detail
                if (currentIndex < materials.length - 1) {
                    handleMaterialChange(materials[currentIndex + 1]);
                } else {
                    // Stay on the completed material and let the user click "Kembali" when ready
                    showToast('Materi selesai. Klik "Kembali" untuk kembali ke halaman training.', 'success');
                }
            }, 2000);
        } catch (error) {
            console.error('Failed to mark as complete:', error);
            showToast('Gagal menandai materi sebagai selesai.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleMaterialChange = (item) => {
        router.visit(`/training/${trainingId}/material/${item.id}`);
    };

    const currentIndex = materials.findIndex(m => m.id === material.id);
    const totalMaterials = materials.length;

    // Determine if the current material is completed using authoritative materials list
    const currentIsCompleted = Boolean(
        (materials && materials.find(m => m.id === material.id && m.is_completed)) || isCompleted
    );

    // DISABLED: Auto-refresh on tab visibility was causing unnecessary page reloads
    // Users can manually refresh if needed, or use browser back button to reload
    // useEffect(() => {
    //     const onVisibilityChange = () => {
    //         if (document.visibilityState === 'visible') {
    //             loadMaterialData();
    //         }
    //     };
    //     document.addEventListener('visibilitychange', onVisibilityChange);
    //     return () => document.removeEventListener('visibilitychange', onVisibilityChange);
    // }, [trainingId, materialId]);

    const handleNext = () => {
        if (currentIndex < materials.length - 1) {
            handleMaterialChange(materials[currentIndex + 1]);
        } else {
            router.visit(`/training/${trainingId}`);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            handleMaterialChange(materials[currentIndex - 1]);
        }
    };

    const handleShare = () => {
        const shareUrl = window.location.href;
        const text = `Lihat materi training: ${material.title}`;
        
        if (navigator.share) {
            navigator.share({ title: material.title, text, url: shareUrl }).catch(console.error);
        } else {
            navigator.clipboard.writeText(shareUrl).then(() => {
                showToast('Link berhasil disalin ke clipboard', 'success');
            });
        }
    };

    const completedCount = materials.filter(m => m.is_completed).length;
    const progressPercent = serverProgress !== null ? serverProgress : (totalMaterials > 0 ? Math.round((completedCount / totalMaterials) * 100) : 0);

    const renderContent = () => {
        if (!material.type) return null;
        
        const url = material.url || material.file_url;
        
        // Untuk tipe VIDEO
        if (material.type === 'video') {
            // Cek apakah URL adalah file video langsung
            const isVideoFile = url && url.match(/\.(mp4|webm|ogg|mov|avi)$/i);
            
            if (isVideoFile) {
                return <VideoPlayer url={url} onComplete={handleMarkComplete} />;
            }
            
            // Jika ada URL (bisa HTML embed, YouTube, Vimeo, atau video embed lainnya)
            if (url) {
                return (
                    <div className="w-full h-full bg-black">
                        <iframe
                            src={url}
                            className="w-full h-full border-0"
                            title={material.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                );
            }
            
            // Jika tidak ada URL video valid, tampilkan placeholder dengan skeleton dan CTA bantuan
            return (
                <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center text-white p-6">
                    <div className="w-full max-w-2xl">
                        <div className="animate-pulse mb-6">
                            <div className="bg-white/5 rounded-lg h-56 mb-4"></div>
                            <div className="h-6 bg-white/10 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-white/8 rounded w-1/2"></div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold mb-2">{material.title}</h3>
                            <p className="text-white/60 text-sm mb-4">Video tidak tersedia untuk materi ini.</p>
                            <div className="flex items-center justify-center gap-3">
                                <button onClick={() => loadMaterialData()} className="px-4 py-2 bg-[#D6F84C] text-[#002824] rounded-lg font-bold hover:bg-[#c2e43c]">Coba Muat Ulang</button>
                                <a
                                    href={`mailto:support@yourdomain.com?subject=${encodeURIComponent(`Permintaan bantuan materi: ${material.title}`)}&body=${encodeURIComponent(`Training ID: ${trainingId}%0AMaterial ID: ${material.id}%0AURL: ${url || 'N/A'}%0A`)}`}
                                    className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
                                >
                                    Minta Bantuan
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        
        // Jika tidak ada URL, tampilkan placeholder yang lebih informatif dengan CTA
        if (!url) {
            return (
                <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center text-center p-8">
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 max-w-md w-full">
                        <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <FileText size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2">{material.title}</h3>
                        <p className="text-slate-500 mb-6">Konten tidak tersedia atau belum diunggah oleh instruktur.</p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => loadMaterialData()} className="px-4 py-2 bg-[#005E54] text-white rounded-lg font-bold hover:bg-[#004a44]">Coba Muat Ulang</button>
                            <a
                                href={`mailto:support@yourdomain.com?subject=${encodeURIComponent(`Permintaan bantuan materi: ${material.title}`)}&body=${encodeURIComponent(`Training ID: ${trainingId}%0AMaterial ID: ${material.id}%0A`)}`}
                                className="px-4 py-2 bg-white/10 text-slate-900 rounded-lg hover:bg-white/20"
                            >
                                Laporkan Masalah / Minta Bantuan
                            </a>
                        </div>
                    </div>
                </div>
            );
        }
        
        const isPdfFile = url.match(/\.(pdf)$/i);
        const isExcelFile = url.match(/\.(xlsx|xls|xlsm|csv)$/i);
        const isPowerpointFile = url.match(/\.(pptx|ppt)$/i);
        const isDocFile = url.match(/\.(doc|docx)$/i);
        
        // PRIORITY 1: PDF files - use PDFViewer with iframe
        // This includes: converted Excel files, true PDFs, and material.type='pdf'
        if (material.type === 'pdf' || isPdfFile) {
            return <PDFViewer url={url} title={material.title} />;
        }
        
        // PRIORITY 2: Excel files - ONLY if not converted to PDF
        // Backend sets type to 'pdf' when converted, so this only handles unconverted files
        if (isExcelFile && material.type !== 'pdf') {
            return <ExcelViewer url={url} title={material.title} />;
        }
        
        // PRIORITY 3: PowerPoint/Presentation files
        if (isPowerpointFile || material.type === 'presentation') {
            return <PowerPointViewer url={url} title={material.title} />;
        }
        
        // PRIORITY 4: Document files (DOC, DOCX)
        if (material.type === 'document' || isDocFile) {
            return <IFrameViewer url={url} title={material.title} type={material.type} />;
        }
        
        // Default - try iframe viewer for any other type (html, etc)
        return <IFrameViewer url={url} title={material.title} type={material.type} />;
    };
    
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
                <WondrStyles />
                <Head title="Loading..." />
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#D6F84C] border-t-transparent mx-auto mb-4"></div>
                    <p className="text-white/80 font-medium">Memuat materi...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-black overflow-hidden">
            <WondrStyles />
            <Head title={`${material.title} - ${training.title}`} />

            {/* --- Main Content Area (Full Width Theater Mode) --- */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#0f172a] relative">
                
                {/* Viewer Container (With padding for top/bottom bars) */}
                <div className="absolute inset-0 w-full h-full pt-14 pb-16">
                    {renderContent()}

                    {/* Confetti Overlay */}
                    <AnimatePresence>
                        {confetti && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 pointer-events-none flex items-center justify-center z-50 bg-black/30"
                            >
                                <motion.div 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1.5 }}
                                    exit={{ scale: 2, opacity: 0 }}
                                    className="text-8xl"
                                >
                                    🎉
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Top Overlay Bar */}
                <div className="h-14 flex items-center justify-between px-4 lg:px-6 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-40">
                    <div className="flex items-center gap-3">
                        <Link 
                            href={`/training/${trainingId}`} 
                            className="p-2 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="hidden md:block">
                            <h1 className="font-bold text-white text-sm line-clamp-1 max-w-md drop-shadow-lg">
                                {training.title}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Progress Badge */}
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-lg text-white text-sm">
                            <div className="w-12 h-1.5 bg-white/20 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-[#D6F84C] rounded-full transition-all duration-500" 
                                    style={{ width: `${progressPercent}%` }}
                                ></div>
                            </div>
                            <span className="font-medium text-xs">{progressPercent}%</span>
                        </div>

                        <button 
                            onClick={handleShare}
                            className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition"
                            title="Bagikan"
                        >
                            <Share2 size={18} />
                        </button>

                        <button 
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition ${
                                sidebarOpen 
                                ? 'bg-white text-black' 
                                : 'bg-black/40 backdrop-blur-sm text-white hover:bg-black/60'
                            }`}
                        >
                            <Menu size={18} />
                            <span className="hidden sm:inline">{sidebarOpen ? 'Tutup' : 'Materi'}</span>
                        </button>
                    </div>
                </div>

                {/* Bottom Control Bar */}
                <div className="h-16 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 lg:px-8 flex items-center justify-between absolute bottom-0 left-0 right-0 z-40">
                    {/* Material Info (Hidden on mobile) */}
                    <div className="hidden md:flex flex-col flex-1 min-w-0 mr-4">
                        <span className="text-[10px] text-[#D6F84C] font-bold uppercase tracking-wider mb-0.5">
                            Materi {currentIndex + 1} / {totalMaterials}
                        </span>
                        <span className="text-white font-bold text-sm truncate drop-shadow-lg">{material.title}</span>
                    </div>

                    {/* Navigation Controls */}
                    <div className="flex items-center gap-2 sm:gap-3 ml-auto">
                        <button 
                            onClick={handlePrev}
                            disabled={currentIndex === 0}
                            className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Sebelumnya"
                        >
                            <ChevronLeft size={22} />
                        </button>

                        {!currentIsCompleted ? (
                            <button 
                                onClick={handleMarkComplete}
                                disabled={actionLoading}
                                className="px-4 sm:px-5 py-2 bg-[#D6F84C] hover:bg-[#c2e43c] text-[#002824] rounded-lg font-bold shadow-lg transition hover:scale-105 flex items-center gap-2 disabled:opacity-50 text-sm"
                            >
                                {actionLoading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#002824] border-t-transparent" />
                                ) : (
                                    <>
                                        <CheckCircle2 size={16} /> 
                                        <span className="hidden sm:inline">Selesai</span>
                                    </>
                                )}
                            </button>
                        ) : (
                            // If material already completed and user is viewing it, show a simple "Kembali" button
                            <button 
                                onClick={() => router.visit(`/training/${trainingId}`)}
                                className="px-4 sm:px-5 py-2 bg-white text-[#002824] rounded-lg font-bold shadow-sm border border-slate-200 flex items-center gap-2 text-sm hover:bg-slate-50"
                            >
                                <ChevronLeft size={16} />
                                <span className="hidden sm:inline">Kembali</span>
                            </button>
                        )}
                        
                        <button 
                            onClick={handleNext}
                            className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition disabled:opacity-30 disabled:cursor-not-allowed"
                            disabled={currentIndex === materials.length - 1}
                            title="Selanjutnya"
                        >
                            <ChevronRight size={22} />
                        </button>
                    </div>
                </div>
            </main>

            {/* --- Right Sidebar (Collapsible Material List) --- */}
            <AnimatePresence initial={false}>
                {sidebarOpen && (
                    <motion.aside
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 380, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="glass-sidebar h-full flex flex-col shrink-0 overflow-hidden relative z-50 shadow-2xl"
                    >
                        {/* Sidebar Header */}
                        <div className="p-6 border-b border-slate-200 bg-white">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-extrabold text-slate-900 text-lg">Materi Kursus</h3>
                                <div className="text-xs font-bold px-2 py-1 bg-slate-100 rounded-lg text-slate-600">
                                    {completedCount}/{totalMaterials}
                                </div>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                                <div 
                                    className="bg-[#005E54] h-2 rounded-full transition-all duration-500" 
                                    style={{ width: `${progressPercent}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-slate-400 font-medium">
                                {progressPercent}% Selesai
                            </p>
                        </div>
                        
                        {/* Material List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                            {materials.map((m, idx) => (
                                <MaterialItem 
                                    key={m.id} 
                                    item={m} 
                                    index={idx}
                                    isActive={m.id === material.id}
                                    isLocked={idx > 0 && !materials[idx-1].is_completed}
                                    onClick={handleMaterialChange}
                                />
                            ))}
                        </div>

                        {/* Sidebar Footer - Description */}
                        <div className="p-6 border-t border-slate-200 bg-slate-50">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-bold text-slate-800 text-sm">Tentang Materi Ini</h4>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed line-clamp-4">
                                {material.description || 'Pelajari materi ini dengan seksama sebelum melanjutkan ke modul berikutnya. Pastikan Anda mencatat poin-poin penting.'}
                            </p>
                            
                            {/* Tips */}
                            <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                                <Sparkles className="text-blue-600 shrink-0" size={18} />
                                <div>
                                    <p className="text-xs font-bold text-blue-800 mb-1">Tips</p>
                                    <p className="text-[10px] text-blue-600 leading-relaxed">
                                        Selesaikan kuis di akhir modul untuk membuka sertifikat.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

        </div>
    );
}
