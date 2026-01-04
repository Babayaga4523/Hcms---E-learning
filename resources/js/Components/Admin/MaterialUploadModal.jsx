import React, { useState } from 'react';
import { Upload, X, File, FileText, Film, Loader } from 'lucide-react';
import axios from 'axios';

export default function MaterialUploadModal({ programId, isOpen, onClose, onSuccess }) {
    const [file, setFile] = useState(null);
    const [fileType, setFileType] = useState('video');
    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [dragActive, setDragActive] = useState(false);

    const fileTypeConfig = {
        video: { accept: '.mp4,.avi,.mov,.mkv', icon: Film, label: 'Video' },
        pdf: { accept: '.pdf', icon: FileText, label: 'PDF' },
        ppt: { accept: '.ppt,.pptx', icon: FileText, label: 'PowerPoint' },
        document: { accept: '.doc,.docx,.txt', icon: FileText, label: 'Document' }
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
        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles && droppedFiles[0]) {
            setFile(droppedFiles[0]);
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!file || !title) {
            setError('File dan title harus diisi');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('file_type', fileType);
        formData.append('duration_minutes', duration || 0);

        setLoading(true);
        try {
            await axios.post(`/api/admin/training-programs/${programId}/upload-material`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setFile(null);
            setTitle('');
            setDuration('');
            onSuccess && onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Error uploading file');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const FileIcon = fileTypeConfig[fileType].icon;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Upload Material</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* File Type Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Tipe File
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(fileTypeConfig).map(([key, config]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => {
                                            setFileType(key);
                                            setFile(null);
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
                                        <div className={`text-xs font-medium ${
                                            fileType === key ? 'text-blue-600' : 'text-gray-700'
                                        }`}>
                                            {config.label}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* File Upload Area */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Pilih File
                            </label>
                            <div
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-lg p-6 text-center transition ${
                                    dragActive
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-300 hover:border-blue-400'
                                }`}
                            >
                                <input
                                    type="file"
                                    accept={fileTypeConfig[fileType].accept}
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="file-input"
                                />
                                <label htmlFor="file-input" className="cursor-pointer">
                                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600 mb-1">
                                        {file ? file.name : 'Drag file di sini atau klik untuk pilih'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Max. 100MB
                                    </p>
                                </label>
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Judul Material
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Intro to AML"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Duration */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Durasi (menit) - Opsional
                            </label>
                            <input
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                placeholder="e.g., 15"
                                min="0"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex gap-3 pt-4 border-t">
                            <button
                                type="submit"
                                disabled={!file || !title || loading}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
                            >
                                {loading ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        Upload
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                            >
                                Batal
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
