import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    ArrowLeft, Plus, Trash2, Edit2, BookOpen, 
    AlertCircle, CheckCircle2, Search, Filter
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import axios from 'axios';

export default function TestManagement({ program, questions, testType, auth }) {
    const [allQuestions, setAllQuestions] = useState(questions || []);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null);

    const testTypeLabel = testType === 'pretest' ? 'Pretest' : 'Posttest';
    const testTypeColor = testType === 'pretest' ? 'bg-cyan-500' : 'bg-emerald-500';

    const filteredQuestions = allQuestions.filter(q =>
        q.question_text.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDelete = async (questionId) => {
        if (!confirm('Hapus soal ini?')) return;

        setLoading(true);
        try {
            await axios.delete(`/api/admin/training-programs/questions/${questionId}`);
            setAllQuestions(allQuestions.filter(q => q.id !== questionId));
            showNotification('Soal berhasil dihapus', 'success');
        } catch (error) {
            showNotification('Error menghapus soal', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditQuestion = (questionId) => {
        const returnUrl = `/admin/training-programs/${program.id}/${testType}`;
        window.location.href = `/admin/question-management/${questionId}?returnUrl=${encodeURIComponent(returnUrl)}`;
    };

    const handleAddQuestion = () => {
        const returnUrl = `/admin/training-programs/${program.id}/${testType}`;
        window.location.href = `/admin/question-management?module=${program.id}&type=${testType}&returnUrl=${encodeURIComponent(returnUrl)}`;
    };

    const showNotification = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    return (
        <AdminLayout user={auth?.user}>
            <Head title={`${testTypeLabel} - ${program.title}`} />
            
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-20">
                {/* Notification */}
                {notification && (
                    <div className={`fixed top-6 right-6 px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 ${
                        notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                        {notification.type === 'success' ? (
                            <CheckCircle2 className="w-5 h-5" />
                        ) : (
                            <AlertCircle className="w-5 h-5" />
                        )}
                        {notification.msg}
                    </div>
                )}

                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-8 px-6">
                    <div className="max-w-7xl mx-auto">
                        <button
                            onClick={() => router.visit('/admin/training-programs')}
                            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-bold">Kembali</span>
                        </button>
                        <div className="flex items-center justify-between">
                            <div>
                                <span className={`inline-block ${testTypeColor} text-white px-3 py-1 rounded-full text-sm font-bold mb-2`}>
                                    {testTypeLabel}
                                </span>
                                <h1 className="text-4xl font-bold text-white mb-2">{program.title}</h1>
                                <p className="text-slate-300">Kelola soal {testTypeLabel.toLowerCase()} untuk program pelatihan ini</p>
                            </div>
                            <div className="text-right">
                                <div className="text-4xl font-bold text-white">{filteredQuestions.length}</div>
                                <p className="text-slate-300 text-sm">Total Soal</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Controls */}
                    <div className="flex gap-4 mb-8">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Cari soal..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-slate-500 outline-none"
                            />
                        </div>
                        <button
                            onClick={handleAddQuestion}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition"
                        >
                            <Plus className="w-5 h-5" />
                            Tambah Soal
                        </button>
                    </div>

                    {/* Questions List */}
                    {filteredQuestions.length > 0 ? (
                        <div className="space-y-4">
                            {filteredQuestions.map((question, index) => (
                                <div
                                    key={question.id}
                                    className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition p-6"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
                                                    No. {index + 1}
                                                </span>
                                                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                                                    question.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' :
                                                    question.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {question.difficulty?.toUpperCase() || 'MEDIUM'}
                                                </span>
                                                <span className="text-xs font-bold px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 ml-auto">
                                                    JAWABAN: <span className="uppercase">{question.correct_answer}</span>
                                                </span>
                                            </div>
                                            <div className="text-slate-900 font-bold text-lg mb-3" dangerouslySetInnerHTML={{ __html: question.question_text }}></div>
                                            
                                            {/* Display question image if exists */}
                                            {question.image_url && (
                                                <div className="mb-4">
                                                    <img 
                                                        src={question.image_url}
                                                        alt="Question visual"
                                                        className="max-w-full h-auto rounded-lg border border-slate-200 shadow-sm"
                                                        style={{ maxHeight: '400px' }}
                                                        onError={(e) => {
                                                            console.error('Image load error:', question.image_url);
                                                            e.target.style.display = 'none';
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div className={`p-2 rounded-lg ${
                                                    question.correct_answer === 'a' 
                                                        ? 'bg-emerald-100 border border-emerald-300 text-emerald-700 font-bold' 
                                                        : 'text-slate-600'
                                                }`}>
                                                    <span className="font-bold">A:</span> {question.option_a}
                                                </div>
                                                <div className={`p-2 rounded-lg ${
                                                    question.correct_answer === 'b' 
                                                        ? 'bg-emerald-100 border border-emerald-300 text-emerald-700 font-bold' 
                                                        : 'text-slate-600'
                                                }`}>
                                                    <span className="font-bold">B:</span> {question.option_b}
                                                </div>
                                                <div className={`p-2 rounded-lg ${
                                                    question.correct_answer === 'c' 
                                                        ? 'bg-emerald-100 border border-emerald-300 text-emerald-700 font-bold' 
                                                        : 'text-slate-600'
                                                }`}>
                                                    <span className="font-bold">C:</span> {question.option_c}
                                                </div>
                                                <div className={`p-2 rounded-lg ${
                                                    question.correct_answer === 'd' 
                                                        ? 'bg-emerald-100 border border-emerald-300 text-emerald-700 font-bold' 
                                                        : 'text-slate-600'
                                                }`}>
                                                    <span className="font-bold">D:</span> {question.option_d}
                                                </div>
                                            </div>
                                            {question.explanation && (
                                                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                    <p className="text-xs font-bold text-blue-600 mb-1">PENJELASAN:</p>
                                                    <p className="text-sm text-blue-700">{question.explanation}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <button
                                                onClick={() => handleEditQuestion(question.id)}
                                                className="p-3 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(question.id)}
                                                disabled={loading}
                                                className="p-3 hover:bg-red-50 text-red-600 rounded-lg transition disabled:opacity-50"
                                                title="Hapus"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Belum ada soal {testTypeLabel.toLowerCase()}</h3>
                            <p className="text-slate-600 mb-6">Tambahkan soal untuk mulai membuat {testTypeLabel.toLowerCase()}</p>
                            <button
                                onClick={handleAddQuestion}
                                className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition"
                            >
                                Tambah Soal Pertama
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}

