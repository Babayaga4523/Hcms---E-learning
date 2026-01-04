import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, Clock, AlertCircle, Download, Eye, Trash2 } from 'lucide-react';
import axios from 'axios';

export default function SmartContentIngestion() {
    const [uploads, setUploads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchUploads();
    }, []);

    const fetchUploads = async () => {
        try {
            const response = await axios.get('/api/admin/content/uploads');
            setUploads(response.data.data || response.data);
        } catch (error) {
            console.error('Error fetching uploads:', error);
            setUploads([]);
        } finally {
            setLoading(false);
        }
    };

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
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleFileInput = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleFileSelect = async (file) => {
        const allowedTypes = ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/pdf'];
        const allowedVideoTypes = ['video/mp4', 'video/x-msvideo', 'video/quicktime', 'video/x-ms-wmv'];
        
        if (!allowedTypes.includes(file.type) && !allowedVideoTypes.includes(file.type)) {
            alert('Please upload a valid file type (PPTX, PDF, or video)');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name.replace(/\.[^/.]+$/, ''));
        formData.append('description', 'Uploaded content');

        setUploading(true);
        try {
            const response = await axios.post('/api/admin/content/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUploads([response.data.upload, ...uploads]);
            fetchUploads();
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file: ' + (error.response?.data?.error || error.message));
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteUpload = async (uploadId) => {
        if (!confirm('Are you sure you want to delete this upload?')) return;
        try {
            await axios.delete(`/api/admin/content/uploads/${uploadId}`);
            setUploads(uploads.filter(u => u.id !== uploadId));
        } catch (error) {
            console.error('Error deleting upload:', error);
            alert('Failed to delete upload');
        }
    };

    if (loading) {
        return <div className="text-center py-12">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Smart Content Ingestion</h2>
                <p className="text-gray-600">📤 Drag & drop PowerPoint/PDF for auto-conversion to video and interactive content</p>
            </div>

            {/* Upload Area */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition ${
                    dragActive
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-300 bg-gray-50 hover:border-purple-400'
                }`}
            >
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Drag & Drop Your Files
                </h3>
                <p className="text-gray-600 mb-4">
                    Supported formats: PowerPoint (.pptx), PDF documents, Video files
                </p>
                <input
                    type="file"
                    onChange={handleFileInput}
                    accept=".pptx,.pdf,.mp4,.avi,.mov,.wmv"
                    className="hidden"
                    id="fileInput"
                />
                <label
                    htmlFor="fileInput"
                    className="inline-block px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition cursor-pointer disabled:opacity-50"
                >
                    {uploading ? 'Uploading...' : 'Select Files'}
                </label>
                <p className="text-xs text-gray-500 mt-4">Max file size: 500MB</p>
            </div>

            {/* Uploads List */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Recent Uploads</h3>
                {uploads.length > 0 ? (
                    uploads.map((upload) => (
                        <div key={upload.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="text-4xl">
                                        {upload.original_filename?.includes('.pdf') ? '📄' : upload.original_filename?.includes('.pptx') ? '📊' : '🎥'}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-lg font-bold text-gray-900 mb-1">{upload.title}</h4>
                                        <p className="text-sm text-gray-600 mb-2">
                                            {upload.original_filename} • {(upload.file_size / 1024 / 1024).toFixed(2)}MB
                                        </p>
                                        {upload.status === 'completed' && upload.conversion_details && (
                                            <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                                                {upload.conversion_details.slides_converted && <span>📊 {upload.conversion_details.slides_converted} slides</span>}
                                                {upload.conversion_details.pages_converted && <span>📄 {upload.conversion_details.pages_converted} pages</span>}
                                                {upload.conversion_details.images_extracted && <span>📸 {upload.conversion_details.images_extracted} images</span>}
                                                {upload.conversion_details.subtitles_extracted && <span>🎤 Subtitles extracted</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {upload.status === 'completed' && (
                                        <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                                            <CheckCircle className="w-4 h-4" />
                                            Ready
                                        </div>
                                    )}
                                    {upload.status === 'processing' && (
                                        <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                                            <Clock className="w-4 h-4" />
                                            Processing
                                        </div>
                                    )}
                                    {upload.status === 'failed' && (
                                        <div className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                                            <AlertCircle className="w-4 h-4" />
                                            Failed
                                        </div>
                                    )}
                                    <button
                                        onClick={() => handleDeleteUpload(upload.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {upload.status === 'processing' && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-semibold text-blue-900">Converting to interactive content...</p>
                                        <p className="text-sm text-blue-700">{upload.progress}%</p>
                                    </div>
                                    <div className="w-full bg-blue-200 rounded-full h-3">
                                        <div 
                                            className="bg-blue-600 h-3 rounded-full transition-all"
                                            style={{ width: `${upload.progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {upload.status === 'failed' && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                    <p className="text-sm text-red-800">{upload.error_message}</p>
                                </div>
                            )}

                            {upload.status === 'completed' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium">
                                        <Eye className="w-4 h-4" />
                                        Preview
                                    </button>
                                    <button className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium">
                                        <Download className="w-4 h-4" />
                                        Use in Module
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">No files uploaded yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
