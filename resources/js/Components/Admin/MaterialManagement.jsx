import React, { useState } from 'react';
import { Upload, FileVideo, FileText, Presentation, X, Download, Eye, Trash2, CheckCircle, Clock, Film, Loader } from 'lucide-react';
import MaterialUploadModal from './MaterialUploadModal';
import axios from 'axios';

export default function MaterialManagement({ programId, materials = [], onMaterialAdded }) {
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [materialList, setMaterialList] = useState(materials);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        title: '',
        type: 'video',
        description: '',
        file: null,
        order: 1,
    });

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            setFormData({ ...formData, file });
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFormData({ ...formData, file: e.target.files[0] });
        }
    };

    const handleUpload = (e) => {
        e.preventDefault();
        if (!formData.file || !formData.title) {
            setMessage({ type: 'error', text: 'Lengkapi form terlebih dahulu' });
            return;
        }

        // Simulate upload progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 30;
            setUploadProgress(Math.min(progress, 95));

            if (progress >= 95) {
                clearInterval(interval);
                setTimeout(() => {
                    setUploadProgress(100);
                    setTimeout(() => {
                        setFormData({ title: '', type: 'video', description: '', file: null, order: 1 });
                        setUploadProgress(0);
                        setShowUploadForm(false);
                        setMessage({ type: 'success', text: 'Materi berhasil di-upload!' });
                        if (onMaterialAdded) onMaterialAdded();
                    }, 500);
                }, 500);
            }
        }, 300);
    };

    const getFileIcon = (type) => {
        switch (type) {
            case 'video':
                return <FileVideo className="w-6 h-6" />;
            case 'pdf':
                return <FileText className="w-6 h-6" />;
            case 'ppt':
                return <Presentation className="w-6 h-6" />;
            default:
                return <FileText className="w-6 h-6" />;
        }
    };

    const getTypeBadgeColor = (type) => {
        switch (type) {
            case 'video':
                return 'bg-red-100 text-red-800';
            case 'pdf':
                return 'bg-blue-100 text-blue-800';
            case 'ppt':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'video':
                return 'Video';
            case 'pdf':
                return 'PDF Document';
            case 'ppt':
                return 'PowerPoint';
            default:
                return type;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Manajemen Materi</h2>
                    <p className="text-gray-600 text-sm mt-1">Upload dan kelola materi pembelajaran (Video, PDF, PowerPoint)</p>
                </div>
                <button
                    onClick={() => setShowUploadForm(!showUploadForm)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                    <Upload className="w-5 h-5" />
                    Upload Materi
                </button>
            </div>

            {/* Upload Form */}
            {showUploadForm && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                    <form onSubmit={handleUpload} className="space-y-4">
                        {/* Drag & Drop Area */}
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
                                dragActive
                                    ? 'border-blue-500 bg-blue-100'
                                    : 'border-blue-300 bg-white hover:border-blue-400'
                            }`}
                        >
                            <Upload className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                            <p className="text-gray-900 font-semibold mb-2">Drag & drop file atau klik untuk memilih</p>
                            <p className="text-gray-600 text-sm mb-4">Didukung: Video (MP4), PDF, PowerPoint (PPTX) - Max 500MB</p>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                accept=".mp4,.pdf,.pptx,.mov,.avi"
                                className="hidden"
                                id="fileInput"
                            />
                            <label
                                htmlFor="fileInput"
                                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer font-medium"
                            >
                                Pilih File
                            </label>
                            {formData.file && (
                                <p className="text-sm text-green-600 mt-3 font-medium">
                                    ✓ {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
                                </p>
                            )}
                        </div>

                        {/* Form Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Judul Materi
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Pengantar BNI Compliance"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Tipe Materi
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="video">📹 Video</option>
                                    <option value="pdf">📄 PDF Document</option>
                                    <option value="ppt">📊 PowerPoint</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Deskripsi
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Jelaskan konten materi ini..."
                                rows="3"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Progress Bar */}
                        {uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="bg-white p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-semibold text-gray-700">Uploading...</p>
                                    <p className="text-sm text-gray-600">{Math.round(uploadProgress)}%</p>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-blue-600 h-2 rounded-full transition-all"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={uploadProgress > 0}
                                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
                            >
                                Upload Materi
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowUploadForm(false);
                                    setFormData({ title: '', type: 'video', description: '', file: null, order: 1 });
                                    setUploadProgress(0);
                                }}
                                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                            >
                                Batal
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Materials List */}
            {materials && materials.length > 0 ? (
                <div className="space-y-3">
                    {materials.map((material, idx) => (
                        <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className="text-gray-600 pt-1">
                                    {getFileIcon(material.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-bold text-gray-900">{material.title}</h3>
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getTypeBadgeColor(material.type)}`}>
                                            {getTypeLabel(material.type)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">{material.description}</p>
                                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" />
                                            Uploaded: {material.uploadedAt}
                                        </div>
                                        {material.duration && (
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Durasi: {material.duration} menit
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button className="p-2 border border-blue-300 text-blue-600 rounded hover:bg-blue-50 transition">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition">
                                        <Download className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 border border-red-300 text-red-600 rounded hover:bg-red-50 transition">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <FileVideo className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">Belum ada materi</p>
                    <p className="text-gray-500 text-sm">Upload materi pembelajaran (video, PDF, PowerPoint) untuk program ini</p>
                </div>
            )}

            {/* Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-amber-900 mb-2">📌 Tips Upload Materi:</p>
                <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                    <li>Gunakan format HD untuk video agar kualitas terbaik</li>
                    <li>PDF harus berupa dokumen yang dapat dicari (searchable)</li>
                    <li>PowerPoint akan dikonversi menjadi slide interaktif</li>
                    <li>Ukuran file maksimal 500MB per file</li>
                    <li>File akan diproses otomatis setelah upload selesai</li>
                </ul>
            </div>
        </div>
    );
}
