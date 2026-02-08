import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, AlertCircle, Loader, FileText, Play, Eye } from 'lucide-react';
import axios from 'axios';

/**
 * Improved Material Viewer Component
 * 
 * Features:
 * - Robust file serving dengan error handling
 * - Support multiple file types (PDF, Video, Images, Documents)
 * - Loading states
 * - Error messages dengan recovery options
 * - File metadata display
 */
export default function ImprovedMaterialViewer({ 
    trainingId, 
    materialId,
    onBack
}) {
    // State
    const [material, setMaterial] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [fileUrl, setFileUrl] = useState('');
    const [isLoadingFile, setIsLoadingFile] = useState(false);

    /**
     * Load material data on mount
     */
    useEffect(() => {
        loadMaterial();
    }, [trainingId, materialId]);

    /**
     * Load material information
     */
    const loadMaterial = async () => {
        try {
            setLoading(true);
            setError('');

            // Fetch material metadata
            const response = await axios.get(
                `/api/training/${trainingId}/materials/${materialId}`
            );

            if (response.data.success) {
                setMaterial(response.data.data);
                
                // Generate file URL untuk serving
                const url = `/training/${trainingId}/material/${materialId}/serve`;
                setFileUrl(url);
            } else {
                setError(response.data.message || 'Gagal memuat materi');
            }
        } catch (err) {
            console.error('Error loading material:', err);
            const errorMessage = err.response?.data?.message || 
                                err.message || 
                                'Terjadi kesalahan saat memuat materi';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handle file load start
     */
    const handleFileLoadStart = () => {
        setIsLoadingFile(true);
    };

    /**
     * Handle file load complete
     */
    const handleFileLoadComplete = () => {
        setIsLoadingFile(false);
    };

    /**
     * Handle file load error
     */
    const handleFileLoadError = () => {
        setIsLoadingFile(false);
        setError('Gagal memuat file. Silakan coba lagi atau hubungi admin.');
    };

    /**
     * Download file
     */
    const handleDownload = async () => {
        try {
            const response = await axios.get(fileUrl, {
                responseType: 'blob',
            });

            // Create download link
            const blob = new Blob([response.data]);
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = material?.file_name || 'download';
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (err) {
            console.error('Download error:', err);
            setError('Gagal mendownload file');
        }
    };

    /**
     * Retry loading
     */
    const handleRetry = () => {
        loadMaterial();
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
                <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-700 font-semibold">Memuat materi...</p>
            </div>
        );
    }

    // Error state
    if (error && !material) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
                        Gagal Memuat Materi
                    </h3>
                    <p className="text-gray-600 text-center mb-6">{error}</p>
                    <div className="flex gap-3">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                            >
                                Kembali
                            </button>
                        )}
                        <button
                            onClick={handleRetry}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                        >
                            Coba Lagi
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!material) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <p className="text-gray-700">Materi tidak ditemukan</p>
            </div>
        );
    }

    // Determine file type and render appropriate viewer
    const renderContent = () => {
        const fileType = material.file_type?.toLowerCase();
        
        switch (fileType) {
            case 'video':
                return (
                    <div className="bg-black rounded-lg overflow-hidden">
                        {isLoadingFile && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                <Loader className="w-12 h-12 text-white animate-spin" />
                            </div>
                        )}
                        <video
                            key={fileUrl}
                            width="100%"
                            height="auto"
                            controls
                            className="w-full"
                            onLoadStart={handleFileLoadStart}
                            onLoadedMetadata={handleFileLoadComplete}
                            onError={handleFileLoadError}
                        >
                            <source src={fileUrl} />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                );

            case 'pdf':
                return (
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                        {isLoadingFile && (
                            <div className="flex items-center justify-center py-12">
                                <Loader className="w-8 h-8 text-blue-600 animate-spin mr-2" />
                                <span className="text-gray-600">Memuat PDF...</span>
                            </div>
                        )}
                        <iframe
                            key={fileUrl}
                            src={fileUrl}
                            width="100%"
                            height="600px"
                            className={isLoadingFile ? 'opacity-50' : ''}
                            onLoad={handleFileLoadComplete}
                            onError={handleFileLoadError}
                            title={material.title}
                        />
                    </div>
                );

            case 'image':
                return (
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden flex items-center justify-center">
                        {isLoadingFile && (
                            <Loader className="w-8 h-8 text-blue-600 animate-spin absolute" />
                        )}
                        <img
                            key={fileUrl}
                            src={fileUrl}
                            alt={material.title}
                            className="max-w-full h-auto"
                            onLoadStart={handleFileLoadStart}
                            onLoad={handleFileLoadComplete}
                            onError={handleFileLoadError}
                        />
                    </div>
                );

            case 'presentation':
            case 'spreadsheet':
            case 'document':
            default:
                return (
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">
                            Format file {fileType || 'document'} tidak bisa ditampilkan di browser
                        </p>
                        <button
                            onClick={handleDownload}
                            className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold mx-auto"
                        >
                            <Download className="w-4 h-4" />
                            Download untuk membuka
                        </button>
                    </div>
                );
        }
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                                title="Kembali"
                            >
                                <ArrowLeft className="w-6 h-6 text-gray-600" />
                            </button>
                        )}
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900 line-clamp-2">
                                {material.title}
                            </h1>
                            {material.description && (
                                <p className="text-gray-600 text-sm mt-1 line-clamp-1">
                                    {material.description}
                                </p>
                            )}
                        </div>
                        {fileType !== 'pdf' && fileType !== 'video' && (
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* File Viewer */}
                <div className="mb-8">
                    {error && (
                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 items-start">
                            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-amber-900">Peringatan</p>
                                <p className="text-amber-700 text-sm">{error}</p>
                                <button
                                    onClick={handleRetry}
                                    className="text-amber-600 text-sm font-semibold hover:underline mt-2"
                                >
                                    Coba muat ulang
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {renderContent()}
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-gray-600 text-sm">Tipe File</p>
                        <p className="font-bold text-gray-900">
                            {material.file_type || 'Unknown'}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-gray-600 text-sm">Ukuran File</p>
                        <p className="font-bold text-gray-900">
                            {formatFileSize(material.file_size || 0)}
                        </p>
                    </div>
                    {material.duration_minutes > 0 && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <p className="text-gray-600 text-sm">Durasi</p>
                            <p className="font-bold text-gray-900">
                                {material.duration_minutes} menit
                            </p>
                        </div>
                    )}
                </div>

                {/* Description */}
                {material.description && (
                    <div className="mt-6 bg-white rounded-lg p-6 border border-gray-200">
                        <h3 className="font-bold text-gray-900 mb-3">Deskripsi</h3>
                        <p className="text-gray-700 whitespace-pre-wrap">
                            {material.description}
                        </p>
                    </div>
                )}

                {/* Upload Info */}
                <div className="mt-6 bg-gray-100 rounded-lg p-4 text-sm text-gray-600">
                    <p>Diunggah oleh: <span className="font-semibold">{material.uploaded_by || 'Admin'}</span></p>
                    <p>Tanggal: <span className="font-semibold">{new Date(material.created_at).toLocaleDateString('id-ID')}</span></p>
                </div>
            </div>
        </div>
    );
}
