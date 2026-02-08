import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Upload, Trash2, Download, File, Image as ImageIcon,
    Video, FileText, AlertCircle, CheckCircle2, Loader, Search,
    Grid, List as ListIcon, MoreVertical, Eye, Sparkles, X,
    HardDrive, Clock, FileArchive
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import axios from 'axios';

// --- COMPONENTS ---

const FileIcon = ({ type, extension }) => {
    const config = {
        document: { icon: FileText, color: 'text-red-500', bg: 'bg-red-50' },
        video: { icon: Video, color: 'text-purple-500', bg: 'bg-purple-50' },
        image: { icon: ImageIcon, color: 'text-blue-500', bg: 'bg-blue-50' },
        presentation: { icon: FileText, color: 'text-orange-500', bg: 'bg-orange-50' },
        spreadsheet: { icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        archive: { icon: FileArchive, color: 'text-slate-500', bg: 'bg-slate-100' },
    };
    const { icon: Icon, color, bg } = config[type] || { icon: File, color: 'text-slate-500', bg: 'bg-slate-50' };

    return (
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bg} ${color} relative overflow-hidden group-hover:scale-110 transition-transform`}>
            <Icon size={24} strokeWidth={2} />
            <span className="absolute bottom-1 right-1 text-[8px] font-bold uppercase opacity-50">{extension}</span>
        </div>
    );
};

const MaterialCard = ({ material, onView, onDelete, onComplete }) => (
    <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="group bg-white rounded-[24px] border border-slate-200 p-5 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 relative cursor-pointer"
        onClick={() => onView(material)}
    >
        <div className="flex items-start justify-between mb-4">
            <FileIcon type={material.material_type} extension={material.file_name?.split('.').pop() || 'file'} />
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(material.id); }}
                    className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>

        <h3 className="font-bold text-slate-900 text-sm line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">
            {material.title}
        </h3>

        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>{material.file_size ? (material.file_size / 1024 / 1024).toFixed(2) + ' MB' : 'Size unknown'}</span>
            <div className="flex items-center gap-2">
                <button
                    onClick={(e) => { e.stopPropagation(); if (onComplete) onComplete(material); }}
                    className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[11px] font-bold hover:bg-emerald-100 transition"
                >
                    <CheckCircle2 size={12} />
                    <span className="ml-2">Mark Complete</span>
                </button>
                <span className="flex items-center gap-1"><Download size={12} /> {Math.floor(Math.random() * 100)}</span>
            </div>
        </div>

        {material.material_type === 'document' && (
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
                    <Sparkles size={10} /> AI Summary
                </div>
            </div>
        )}
    </motion.div>
);

export default function TrainingMaterialsManager({ program, auth }) {
    const { user } = usePage().props.auth || {};
    const [materials, setMaterials] = useState(program?.materials || program?.training_materials || []);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [filter, setFilter] = useState('all');
    const [previewFile, setPreviewFile] = useState(null);
    
    const [searchQuery, setSearchQuery] = useState('');

    const [uploadData, setUploadData] = useState({
        title: '',
        description: '',
        file: null,
        material_type: 'document',
    });

    const materialTypes = [
        { value: 'document', label: 'Dokumen (PDF, Word)', extensions: ['.pdf', '.doc', '.docx', '.txt'] },
        { value: 'presentation', label: 'Presentasi (PPT)', extensions: ['.ppt', '.pptx', '.odp'] },
        { value: 'spreadsheet', label: 'Spreadsheet (Excel)', extensions: ['.xls', '.xlsx', '.csv'] },
        { value: 'video', label: 'Video', extensions: ['.mp4', '.webm', '.avi', '.mov', '.mkv'] },
        { value: 'image', label: 'Gambar', extensions: ['.jpg', '.jpeg', '.png', '.gif'] },
        { value: 'archive', label: 'Archive (ZIP)', extensions: ['.zip', '.rar'] },
    ];

    const showNotification = (msg, type = 'success') => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => setMessage(''), 3000);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 50 * 1024 * 1024) {
                showNotification('Ukuran file terlalu besar (max 50MB)', 'error');
                return;
            }
            setUploadData({ ...uploadData, file });
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!uploadData.file) {
            showNotification('Pilih file terlebih dahulu', 'error');
            return;
        }

        setLoading(true);
        setIsUploading(true);
        const formData = new FormData();
        formData.append('title', uploadData.title);
        formData.append('description', uploadData.description);
        formData.append('file', uploadData.file);
        formData.append('material_type', uploadData.material_type);

        try {
            const response = await axios.post(
                `/api/admin/training-programs/${program.id}/upload-material`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (progressEvent) => {
                        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percent);
                    },
                }
            );

            setMaterials([...materials, response.data.data]);
            showNotification('Material berhasil di-upload');
            setUploadData({ title: '', description: '', file: null, material_type: 'document' });
            setShowUploadForm(false);
            setUploadProgress(0);
        } catch (error) {
            showNotification(error.response?.data?.message || 'Error upload material', 'error');
        } finally {
            setLoading(false);
            setIsUploading(false);
        }
    };

    const handleDelete = async (materialId) => {
        if (!confirm('Hapus material ini?')) return;

        setLoading(true);
        try {
            await axios.delete(`/api/admin/training-programs/materials/${materialId}`);
            setMaterials(materials.filter(m => m.id !== materialId));
            showNotification('Material berhasil dihapus');
        } catch (error) {
            showNotification(error.response?.data?.message || 'Error menghapus material', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (material) => {
        const link = document.createElement('a');
        link.href = material.file_url;
        link.download = material.file_name;
        link.click();
    };

    const runAIAnalysis = () => {
        setAiAnalysis("Analysing...");
        setTimeout(() => {
            setAiAnalysis({
                summary: "Dokumen ini berisi pedoman standar kepatuhan perbankan untuk tahun fiskal 2025. Poin utama meliputi: 1. Perlindungan Data Nasabah (PDP), 2. Anti-Money Laundering, 3. Kode Etik Digital.",
                readingTime: "15 mins",
                tags: ["Compliance", "Policy", "2025"]
            });
        }, 1500);
    };

    const filteredMaterials = materials.filter(m => {
        const typeMatch = filter === 'all' || m.material_type === filter;
        const searchMatch = !searchQuery || m.title.toLowerCase().includes(searchQuery.toLowerCase());
        return typeMatch && searchMatch;
    });

    return (
        <AdminLayout user={user}>
            <Head title={`Wondr Resource Vault: ${program.title}`} />

            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`fixed top-4 right-4 p-4 rounded-xl ${messageType === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'} z-50 shadow-lg flex items-center gap-2 font-bold`}
                >
                    {messageType === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {message}
                </motion.div>
            )}

            <div className="pb-20">

                {/* --- HEADER --- */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => window.history.back()}
                        className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 text-slate-500 transition"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-3 py-1 bg-slate-900 text-[#D6FF59] text-[10px] font-bold uppercase tracking-wider rounded-full">
                                Asset Management
                            </span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Training Materials</h1>
                        <p className="text-slate-500 text-sm mt-1">{program.title}</p>
                    </div>
                </div>

                {/* --- UPLOAD ZONE (HERO) --- */}
                        {/* --- UPLOAD ZONE (HERO) --- */}
                {!showUploadForm ? (
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-[32px] p-1 shadow-2xl shadow-indigo-200 mb-10 overflow-hidden relative group">
                        <div className="bg-white/95 backdrop-blur-xl rounded-[30px] p-8 border border-white/20 relative z-10 flex flex-col items-center justify-center text-center transition-all min-h-[200px]">
                            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                <Upload size={32} className="text-indigo-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-1">Drag & Drop files here</h3>
                            <p className="text-slate-500 text-sm mb-6">Support PDF, MP4, PPTX, XLSX (Max 50MB)</p>
                            <button
                                onClick={() => setShowUploadForm(true)}
                                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition shadow-lg hover:-translate-y-1"
                            >
                                Browse Files
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-[24px] shadow-sm p-6 mb-10 border border-slate-200">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Upload Material Baru</h2>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold uppercase text-slate-500 tracking-wider mb-2">Judul Material</label>
                                <input
                                    type="text"
                                    value={uploadData.title}
                                    onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                                    placeholder="e.g., Materi Compliance 2025"
                                    className="w-full p-4 bg-slate-50 border-none rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#D6FF59]"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold uppercase text-slate-500 tracking-wider mb-2">Deskripsi</label>
                                <textarea
                                    value={uploadData.description}
                                    onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                                    placeholder="Deskripsi material (opsional)"
                                    rows="3"
                                    className="w-full p-4 bg-slate-50 border-none rounded-xl font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[#D6FF59]"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold uppercase text-slate-500 tracking-wider mb-2">Tipe Material</label>
                                    <select
                                        value={uploadData.material_type}
                                        onChange={(e) => setUploadData({ ...uploadData, material_type: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border-none rounded-xl font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[#D6FF59]"
                                    >
                                        {materialTypes.map(type => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold uppercase text-slate-500 tracking-wider mb-2">File</label>
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        className="w-full p-4 bg-slate-50 border-none rounded-xl font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[#D6FF59]"
                                        required
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Max 50MB</p>
                                </div>
                            </div>

                            {uploadProgress > 0 && uploadProgress < 100 && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-bold uppercase text-slate-500">Upload Progress</span>
                                        <span className="text-sm font-bold text-slate-900">{uploadProgress}%</span>
                                    </div>
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div
                                            animate={{ width: `${uploadProgress}%` }}
                                            className="h-full bg-indigo-600 rounded-full"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="submit"
                                    disabled={loading || !uploadData.file}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition font-bold disabled:opacity-50"
                                >
                                    {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                                    {loading ? 'Uploading...' : 'Upload Material'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowUploadForm(false);
                                        setUploadData({ title: '', description: '', file: null, material_type: 'document' });
                                    }}
                                    className="flex-1 px-6 py-3 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition font-bold"
                                >
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* --- FILTERS & TOOLS --- */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        {['all', 'document', 'video', 'presentation', 'archive'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                                    filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:flex-none">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search files..."
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#D6FF59]"
                            />
                        </div>
                        <div className="flex bg-white border border-slate-200 rounded-xl p-1">
                            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-slate-100' : 'text-slate-400'}`}>
                                <Grid size={16} />
                            </button>
                            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-slate-100' : 'text-slate-400'}`}>
                                <ListIcon size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- FILES GRID --- */}
                {filteredMaterials && filteredMaterials.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        <AnimatePresence>
                            {filteredMaterials.map(item => (
                                <MaterialCard
                                    key={item.id}
                                    material={item}
                                    onView={() => { setPreviewFile(item); }}
                                    onDelete={handleDelete}
                                    onComplete={async (material) => {
                                        try {
                                            setLoading(true);
                                            const res = await axios.post(`/api/materials/${material.id}/progress`, { is_completed: true });
                                            // Update UI to mark completed
                                            setMaterials(materials.map(m => m.id === material.id ? { ...m, is_completed: true } : m));
                                            showNotification('Material ditandai selesai');
                                        } catch (err) {
                                            showNotification(err.response?.data?.message || 'Gagal menandai selesai', 'error');
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-[24px] shadow-sm border border-dashed border-slate-300 mb-10">
                        <File className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600 font-bold">Belum ada material pembelajaran</p>
                        <p className="text-slate-400 text-sm">Upload file untuk menambahkan materi pembelajaran</p>
                    </div>
                )}

                {/* --- FILE PREVIEW MODAL --- */}
                <AnimatePresence>
                    {previewFile && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
                                onClick={() => setPreviewFile(null)}
                            />

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-white w-full max-w-6xl h-[85vh] rounded-[32px] shadow-2xl relative z-10 flex overflow-hidden"
                            >
                                {/* Left: Preview Area */}
                                <div className="flex-1 bg-slate-50 flex items-center justify-center p-8 relative overflow-auto">
                                    <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-black/5 to-transparent pointer-events-none"></div>

                                    {(() => {
                                        const fileName = previewFile.file_name || '';
                                        const fileExtension = fileName.split('.').pop()?.toLowerCase();
                                        const filePath = `/storage/${previewFile.file_path}`;
                                        const pdfPath = previewFile.pdf_path ? `/storage/${previewFile.pdf_path}` : null;
                                        
                                        const isVideo = ['mp4', 'webm', 'avi', 'mov', 'mkv'].includes(fileExtension) || previewFile.material_type === 'video';
                                        const isPDF = fileExtension === 'pdf';
                                        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension) || previewFile.material_type === 'image';
                                        const isPPT = ['ppt', 'pptx'].includes(fileExtension) || previewFile.material_type === 'presentation';
                                        const isWord = ['doc', 'docx'].includes(fileExtension);
                                        const isExcel = ['xls', 'xlsx'].includes(fileExtension) || previewFile.material_type === 'spreadsheet';
                                        const isCSV = fileExtension === 'csv';
                                        const isOfficeFile = isPPT || isWord || isExcel;
                                        const isArchive = ['zip', 'rar'].includes(fileExtension) || previewFile.material_type === 'archive';
                                        
                                        // If Office file has PDF version, show PDF
                                        if (isOfficeFile && pdfPath) {
                                            return (
                                                <div className="w-full h-full flex flex-col">
                                                    <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 flex items-center gap-2 text-emerald-700 text-sm font-medium">
                                                        <CheckCircle2 size={16} />
                                                        Menampilkan versi PDF dari {fileExtension?.toUpperCase()}
                                                    </div>
                                                    <iframe
                                                        src={pdfPath}
                                                        className="flex-1 rounded-2xl shadow-2xl border-0"
                                                        title="PDF Preview"
                                                    />
                                                </div>
                                            );
                                        }
                                        
                                        if (isVideo) {
                                            return (
                                                <video 
                                                    src={filePath}
                                                    controls
                                                    className="max-w-full max-h-[70vh] rounded-2xl shadow-2xl"
                                                    onEnded={async () => {
                                                        try {
                                                            await axios.post(`/api/materials/${previewFile.id}/progress`, { is_completed: true });
                                                            showNotification('Material ditandai selesai');
                                                            setMaterials(materials.map(m => m.id === previewFile.id ? { ...m, is_completed: true } : m));
                                                        } catch (err) {
                                                            showNotification('Gagal menandai selesai', 'error');
                                                        }
                                                    }}
                                                >
                                                    Browser Anda tidak mendukung video preview.
                                                </video>
                                            );
                                        }
                                        
                                        if (isPDF) {
                                            return (
                                                <iframe
                                                    src={filePath}
                                                    className="w-full h-[70vh] rounded-2xl shadow-2xl border-0"
                                                    title="PDF Preview"
                                                />
                                            );
                                        }
                                        
                                        if (isImage) {
                                            return (
                                                <img 
                                                    src={filePath} 
                                                    alt={previewFile.title}
                                                    className="max-w-full max-h-[70vh] rounded-2xl shadow-2xl object-contain"
                                                />
                                            );
                                        }
                                        
                                        // Office files (PPT, Word, Excel)
                                        if (isOfficeFile) {
                                            return (
                                                <div className="text-center">
                                                    <div className="w-40 h-40 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                                                        {isPPT ? (
                                                            <Sparkles size={64} className="text-white" />
                                                        ) : isExcel ? (
                                                            <FileText size={64} className="text-white" />
                                                        ) : (
                                                            <FileText size={64} className="text-white" />
                                                        )}
                                                    </div>
                                                    <h3 className="text-2xl font-bold text-slate-900 mb-2 line-clamp-2 max-w-md mx-auto">
                                                        {fileName}
                                                    </h3>
                                                    <div className="inline-block px-4 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold mb-6">
                                                        {fileExtension?.toUpperCase()} File
                                                    </div>
                                                    <p className="text-slate-600 mb-2 text-lg">
                                                        {previewFile.file_size ? `${(previewFile.file_size / 1024 / 1024).toFixed(2)} MB` : 'Size unknown'}
                                                    </p>
                                                    <p className="text-slate-500 mb-8 text-sm max-w-md mx-auto">
                                                        Preview untuk {fileExtension?.toUpperCase()} akan tersedia setelah file didownload dan dibuka dengan aplikasi Office.
                                                    </p>
                                                    <div className="flex gap-3 justify-center">
                                                        <button
                                                            onClick={() => handleDownload(previewFile)}
                                                            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-base hover:bg-indigo-700 transition shadow-xl inline-flex items-center gap-3 hover:scale-105 transform"
                                                        >
                                                            <Download size={20} /> Download & Open
                                                        </button>
                                                    </div>
                                                    <p className="text-slate-400 text-xs mt-6">
                                                        💡 Tip: Gunakan Microsoft Office, LibreOffice, atau Google Docs untuk membuka file ini
                                                    </p>
                                                </div>
                                            );
                                        }
                                        
                                        // CSV files - display as table
                                        if (isCSV) {
                                            return (
                                                <iframe
                                                    src={filePath}
                                                    className="w-full h-[70vh] rounded-2xl shadow-2xl border-0 bg-white"
                                                    title="CSV Preview"
                                                />
                                            );
                                        }
                                        
                                        // For non-previewable files (Archive, etc)
                                        return (
                                            <div className="text-center">
                                                <div className="w-32 h-32 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                                                    {isArchive ? (
                                                        <FileArchive size={48} className="text-slate-500" />
                                                    ) : (
                                                        <File size={48} className="text-slate-500" />
                                                    )}
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-900 mb-4 line-clamp-2 max-w-md mx-auto">
                                                    {fileName}
                                                </h3>
                                                <p className="text-slate-600 mb-6">
                                                    Preview tidak tersedia untuk {fileExtension?.toUpperCase()}. <br/>
                                                    Silakan download file untuk melihat isinya.
                                                </p>
                                                <button
                                                    onClick={() => handleDownload(previewFile)}
                                                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition shadow-lg inline-flex items-center gap-2"
                                                >
                                                    <Download size={18} /> Download File
                                                </button>
                                            </div>
                                        );
                                    })()}

                                    <button
                                        onClick={() => setPreviewFile(null)}
                                        className="absolute top-4 left-4 p-2 bg-white/50 hover:bg-white rounded-full transition shadow-sm backdrop-blur z-10"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Right: Details & AI */}
                                <div className="w-[350px] bg-white border-l border-slate-100 flex flex-col">
                                    <div className="p-6 border-b border-slate-100">
                                        <div className="flex items-start gap-4 mb-4">
                                            <FileIcon type={previewFile.material_type} extension={previewFile.file_name?.split('.').pop() || 'file'} />
                                            <div className="flex-1">
                                                <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-2">{previewFile.title}</h3>
                                                <p className="text-xs text-slate-400 mt-2">{previewFile.file_size ? (previewFile.file_size / 1024 / 1024).toFixed(2) + ' MB' : 'Size unknown'}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDownload(previewFile)}
                                            className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2"
                                        >
                                            <Download size={14} /> Download
                                        </button>
                                    </div>

                                    <div className="flex-1 p-6 overflow-y-auto space-y-6">
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">File Properties</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs border-b border-slate-100 pb-2">
                                                    <span className="text-slate-500">Type</span>
                                                    <span className="font-bold text-slate-700 uppercase">{previewFile.material_type}</span>
                                                </div>
                                                <div className="flex justify-between text-xs border-b border-slate-100 pb-2">
                                                    <span className="text-slate-500">Size</span>
                                                    <span className="font-bold text-slate-700">{previewFile.file_size ? (previewFile.file_size / 1024 / 1024).toFixed(2) + ' MB' : 'Size unknown'}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-slate-500">Downloads</span>
                                                    <span className="font-bold text-slate-700">{Math.floor(Math.random() * 100)}x</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </div>
        </AdminLayout>
    );
}

