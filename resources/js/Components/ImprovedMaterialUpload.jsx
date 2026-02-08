import React, { useState, useRef } from 'react';
import { Upload, X, AlertCircle, CheckCircle, Loader, File, Music, FileText, Presentation } from 'lucide-react';
import axios from 'axios';

/**
 * Improved Material Upload Component
 * 
 * Features:
 * - Drag & drop support
 * - Real-time upload progress
 * - File validation (size, type)
 * - Error handling dengan clear messages
 * - Success feedback
 * - Cancellation support
 */
export default function ImprovedMaterialUpload({ 
    programId, 
    onSuccess,
    onError,
    maxFileSize = 100 // MB
}) {
    // State management
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [fileType, setFileType] = useState('document');
    const [durationMinutes, setDurationMinutes] = useState('');
    
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    
    const fileInputRef = useRef(null);
    const cancelTokenRef = useRef(null);

    // File type configuration
    const fileTypeConfig = {
        document: {
            label: 'Document',
            icon: FileText,
            accepts: '.doc,.docx,.txt,.odt'
        },
        pdf: {
            label: 'PDF',
            icon: FileText,
            accepts: '.pdf'
        },
        video: {
            label: 'Video',
            icon: Music,
            accepts: '.mp4,.webm,.mov,.avi,.mkv,.flv,.wmv'
        },
        presentation: {
            label: 'Presentation',
            icon: Presentation,
            accepts: '.ppt,.pptx,.odp'
        },
        spreadsheet: {
            label: 'Spreadsheet',
            icon: FileText,
            accepts: '.xlsx,.xls,.csv,.ods'
        },
        image: {
            label: 'Image',
            icon: FileText,
            accepts: '.jpg,.jpeg,.png,.gif,.webp'
        }
    };

    /**
     * Validate file
     */
    const validateFile = (selectedFile) => {
        if (!selectedFile) {
            setError('Silakan pilih file terlebih dahulu');
            return false;
        }

        // Check file size
        const fileSizeInMB = selectedFile.size / (1024 * 1024);
        if (fileSizeInMB > maxFileSize) {
            setError(`Ukuran file terlalu besar. Maksimal ${maxFileSize}MB (file Anda: ${fileSizeInMB.toFixed(2)}MB)`);
            return false;
        }

        // Check file extension
        const extension = selectedFile.name.split('.').pop().toLowerCase();
        const config = fileTypeConfig[fileType];
        const allowedExtensions = config.accepts.split(',').map(e => e.trim().replace('.', ''));
        
        if (!allowedExtensions.includes(extension)) {
            setError(`Format file tidak sesuai. Format yang diizinkan: ${config.accepts}`);
            return false;
        }

        setError('');
        return true;
    };

    /**
     * Handle file selection
     */
    const handleFileSelect = (selectedFile) => {
        if (validateFile(selectedFile)) {
            setFile(selectedFile);
            setError('');
        }
    };

    /**
     * Handle drag events
     */
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    /**
     * Validate form before submit
     */
    const validateForm = () => {
        if (!file) {
            setError('Silakan pilih file');
            return false;
        }

        if (!title.trim()) {
            setError('Silakan masukkan judul materi');
            return false;
        }

        if (title.trim().length < 3) {
            setError('Judul materi minimal 3 karakter');
            return false;
        }

        setError('');
        return true;
    };

    /**
     * Submit form
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title.trim());
        formData.append('description', description.trim());
        formData.append('file_type', fileType);
        if (durationMinutes) {
            formData.append('duration_minutes', parseInt(durationMinutes));
        }

        setIsUploading(true);
        setUploadProgress(0);
        setError('');
        setSuccess('');

        // Create cancel token
        cancelTokenRef.current = axios.CancelToken.source();

        try {
            const response = await axios.post(
                `/api/admin/training-programs/${programId}/upload-material`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    onUploadProgress: (progressEvent) => {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(progress);
                    },
                    cancelToken: cancelTokenRef.current.token,
                }
            );

            if (response.data.success) {
                setSuccess(response.data.message || 'Material berhasil diunggah!');
                
                // Reset form
                setFile(null);
                setTitle('');
                setDescription('');
                setDurationMinutes('');
                setFileType('document');
                setUploadProgress(0);
                
                // Call callback
                if (onSuccess) {
                    setTimeout(() => {
                        onSuccess(response.data.data);
                    }, 1000);
                }
            } else {
                setError(response.data.message || 'Gagal mengunggah materi');
                if (onError) {
                    onError(response.data.message);
                }
            }
        } catch (err) {
            if (axios.isCancel(err)) {
                setError('Upload dibatalkan');
            } else {
                const errorMessage = err.response?.data?.message || err.message || 'Terjadi kesalahan saat upload';
                setError(errorMessage);
                if (onError) {
                    onError(errorMessage);
                }
            }
        } finally {
            setIsUploading(false);
        }
    };

    /**
     * Cancel upload
     */
    const handleCancel = () => {
        if (cancelTokenRef.current) {
            cancelTokenRef.current.cancel('Upload dibatalkan oleh user');
        }
        setIsUploading(false);
        setUploadProgress(0);
    };

    /**
     * Reset form
     */
    const handleReset = () => {
        setFile(null);
        setTitle('');
        setDescription('');
        setDurationMinutes('');
        setFileType('document');
        setError('');
        setSuccess('');
        setUploadProgress(0);
    };

    const currentConfig = fileTypeConfig[fileType];
    const IconComponent = currentConfig.icon;
    const fileSizeDisplay = file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : '';

    return (
        <div className="w-full max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 items-start">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-red-900">Error</p>
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {/* Success Message */}
                {success && !isUploading && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3 items-start">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-green-900">Sukses</p>
                            <p className="text-green-700 text-sm">{success}</p>
                        </div>
                    </div>
                )}

                {/* File Type Selection */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                        Tipe File <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {Object.entries(fileTypeConfig).map(([key, config]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => {
                                    setFileType(key);
                                    setFile(null);
                                    setError('');
                                }}
                                className={`p-3 rounded-lg border-2 transition text-center ${
                                    fileType === key
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-blue-300'
                                }`}
                            >
                                <config.icon className={`w-6 h-6 mx-auto mb-1 ${
                                    fileType === key ? 'text-blue-600' : 'text-gray-600'
                                }`} />
                                <p className={`text-xs font-semibold ${
                                    fileType === key ? 'text-blue-600' : 'text-gray-600'
                                }`}>
                                    {config.label}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Drag & Drop Area */}
                <div
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
                        isDragging
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                    } ${file ? 'border-green-400 bg-green-50' : ''}`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={currentConfig.accepts}
                        onChange={(e) => {
                            if (e.target.files?.[0]) {
                                handleFileSelect(e.target.files[0]);
                            }
                        }}
                        className="hidden"
                        disabled={isUploading}
                    />
                    
                    {file ? (
                        <div>
                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                            <p className="font-bold text-gray-900 break-words">{file.name}</p>
                            <p className="text-sm text-gray-600 mt-1">{fileSizeDisplay}</p>
                            <button
                                type="button"
                                onClick={() => handleFileSelect(null)}
                                className="text-blue-600 text-sm mt-2 hover:underline"
                            >
                                Pilih file lain
                            </button>
                        </div>
                    ) : (
                        <div>
                            <IconComponent className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-700 mb-1 font-semibold">
                                Drag file di sini atau klik untuk pilih
                            </p>
                            <p className="text-xs text-gray-500 mb-3">
                                Format: {currentConfig.accepts} | Max: {maxFileSize}MB
                            </p>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm font-semibold"
                            >
                                Pilih File
                            </button>
                        </div>
                    )}
                </div>

                {/* Title */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Judul Materi <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Contoh: Pengantar Compliance AML"
                        maxLength={255}
                        disabled={isUploading}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">{title.length} / 255</p>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Deskripsi (Opsional)
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Jelaskan singkat isi materi ini..."
                        maxLength={1000}
                        rows={3}
                        disabled={isUploading}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">{description.length} / 1000</p>
                </div>

                {/* Duration (for videos) */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Durasi (Menit) {fileType === 'video' && <span className="text-red-500">*</span>}
                    </label>
                    <input
                        type="number"
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(e.target.value)}
                        placeholder="Contoh: 30"
                        min="0"
                        max="1440"
                        disabled={isUploading}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Opsional - gunakan untuk tracking waktu viewing</p>
                </div>

                {/* Upload Progress */}
                {isUploading && uploadProgress > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-700">Upload Progress</span>
                            <span className="text-sm font-bold text-blue-600">{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                                className="h-full bg-blue-600 transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                    <button
                        type="submit"
                        disabled={!file || !title.trim() || isUploading}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
                    >
                        {isUploading ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="w-5 h-5" />
                                Upload Material
                            </>
                        )}
                    </button>

                    {isUploading && (
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-6 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition font-semibold"
                        >
                            Cancel
                        </button>
                    )}

                    {!isUploading && (
                        <button
                            type="button"
                            onClick={handleReset}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
