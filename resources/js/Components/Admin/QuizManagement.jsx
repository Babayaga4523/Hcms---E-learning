import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, Copy, CheckCircle, AlertCircle, HelpCircle, X } from 'lucide-react';
import QuestionBuilder from './QuestionBuilder';

export default function QuizManagement({ programId, quizzes = [] }) {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showQuestionBuilder, setShowQuestionBuilder] = useState(false);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [activeTab, setActiveTab] = useState('pretest'); // pretest, posttest
    const [formData, setFormData] = useState({
        name: '',
        type: 'pretest',
        description: '',
        passingScore: 70,
        timeLimit: 60,
        showAnswers: true,
    });

    const handleCreateQuiz = (e) => {
        e.preventDefault();
        console.log('Create quiz:', formData);
        setFormData({
            name: '',
            type: 'pretest',
            description: '',
            passingScore: 70,
            timeLimit: 60,
            showAnswers: true,
        });
        setShowCreateForm(false);
    };

    const pretestQuizzes = quizzes.filter(q => q.type === 'pretest');
    const posttestQuizzes = quizzes.filter(q => q.type === 'posttest');
    const activeQuizzes = activeTab === 'pretest' ? pretestQuizzes : posttestQuizzes;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Management Kuis & Test</h2>
                    <p className="text-gray-600 text-sm mt-1">Buat, kelola, dan edit pre-test dan post-test untuk program ini</p>
                </div>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                    <Plus className="w-5 h-5" />
                    Buat Kuis Baru
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('pretest')}
                    className={`px-6 py-3 font-semibold border-b-2 transition ${
                        activeTab === 'pretest'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                >
                    📋 Pre-Test ({pretestQuizzes.length})
                </button>
                <button
                    onClick={() => setActiveTab('posttest')}
                    className={`px-6 py-3 font-semibold border-b-2 transition ${
                        activeTab === 'posttest'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                >
                    ✓ Post-Test ({posttestQuizzes.length})
                </button>
            </div>

            {/* Create Form */}
            {showCreateForm && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                    <form onSubmit={handleCreateQuiz} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Nama Kuis
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Pre-Test BNI Compliance"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Tipe Kuis
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="pretest">Pre-Test (Sebelum pembelajaran)</option>
                                    <option value="posttest">Post-Test (Setelah pembelajaran)</option>
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
                                placeholder="Jelaskan tujuan dan cara mengerjakan kuis ini..."
                                rows="3"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Nilai Kelulusan (%)
                                </label>
                                <input
                                    type="number"
                                    value={formData.passingScore}
                                    onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) })}
                                    min="0"
                                    max="100"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Time Limit (menit)
                                </label>
                                <input
                                    type="number"
                                    value={formData.timeLimit}
                                    onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) })}
                                    min="5"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div className="flex items-end">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.showAnswers}
                                        onChange={(e) => setFormData({ ...formData, showAnswers: e.target.checked })}
                                        className="w-4 h-4 rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Tampilkan jawaban</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                            >
                                Buat Kuis
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                            >
                                Batal
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Quizzes List */}
            {activeQuizzes && activeQuizzes.length > 0 ? (
                <div className="space-y-3">
                    {activeQuizzes.map((quiz, idx) => (
                        <div key={idx} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-bold text-gray-900">{quiz.name}</h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                            quiz.type === 'pretest'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-green-100 text-green-800'
                                        }`}>
                                            {quiz.type === 'pretest' ? '📋 Pre-Test' : '✓ Post-Test'}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 text-sm mb-3">{quiz.description}</p>
                                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <HelpCircle className="w-4 h-4" />
                                            <span>{quiz.questionCount || 0} pertanyaan</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4" />
                                            <span>Passing: {quiz.passingScore}%</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <CheckCircle className="w-4 h-4" />
                                            <span>Waktu: {quiz.timeLimit} menit</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2">
                                <button className="flex items-center gap-2 px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium text-sm">
                                    <Eye className="w-4 h-4" />
                                    Preview
                                </button>
                                <button 
                                    onClick={() => {
                                        setSelectedQuiz(quiz);
                                        setShowQuestionBuilder(true);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 transition font-medium text-sm">
                                    <Plus className="w-4 h-4" />
                                    Tambah Soal
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm">
                                    <Edit2 className="w-4 h-4" />
                                    Edit
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 border border-cyan-300 text-cyan-600 rounded-lg hover:bg-cyan-50 transition font-medium text-sm">
                                    <Copy className="w-4 h-4" />
                                    Duplikat
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition font-medium text-sm">
                                    <Trash2 className="w-4 h-4" />
                                    Hapus
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Belum ada kuis untuk tab ini</p>
                    <p className="text-gray-500 text-sm">Klik tombol "Buat Kuis Baru" untuk membuat {activeTab === 'pretest' ? 'pre-test' : 'post-test'}</p>
                </div>
            )}

            {/* Question Types Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-sm font-bold text-blue-900 mb-3">❓ Tipe Pertanyaan yang Didukung</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-blue-100">
                        <p className="font-semibold text-gray-900 mb-2">Multiple Choice</p>
                        <p className="text-sm text-gray-600">Pilihan ganda dengan 4-5 opsi jawaban</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-blue-100">
                        <p className="font-semibold text-gray-900 mb-2">True/False</p>
                        <p className="text-sm text-gray-600">Pertanyaan benar atau salah</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-blue-100">
                        <p className="font-semibold text-gray-900 mb-2">Fill in the Blank</p>
                        <p className="text-sm text-gray-600">Isi bagian yang kosong dengan jawaban singkat</p>
                    </div>
                </div>
            </div>

            {/* Best Practices */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-amber-900 mb-2">💡 Tips Membuat Kuis yang Efektif:</p>
                <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                    <li>Pre-test: Ukur pengetahuan awal peserta sebelum pembelajaran</li>
                    <li>Post-test: Verifikasi pemahaman setelah menyelesaikan materi</li>
                    <li>Minimal 10-15 soal per kuis untuk assessment yang akurat</li>
                    <li>Mix berbagai tipe soal untuk evaluasi yang komprehensif</li>
                    <li>Setting passing score realistis (60-80% untuk standar industri)</li>
                    <li>Gunakan time limit untuk mencegah cheating</li>
                </ul>
            </div>

            {/* Question Builder Modal */}
            {showQuestionBuilder && selectedQuiz && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
                    <div className="min-h-screen flex items-start justify-center p-4 pt-12">
                        <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Manajemen Pertanyaan Kuis</h2>
                                    <p className="text-gray-600 text-sm mt-1">Quiz: <strong>{selectedQuiz.name}</strong></p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowQuestionBuilder(false);
                                        setSelectedQuiz(null);
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6">
                                <QuestionBuilder 
                                    quizId={selectedQuiz.id}
                                    questions={selectedQuiz.questions || []}
                                    onQuestionAdded={() => {
                                        // Refresh quiz if needed
                                    }}
                                    onQuestionUpdated={() => {
                                        // Refresh quiz if needed
                                    }}
                                />
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setShowQuestionBuilder(false);
                                        setSelectedQuiz(null);
                                    }}
                                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
