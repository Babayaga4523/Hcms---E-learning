import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import axios from 'axios';

export default function CreateProgramWithQuestions({ isOpen, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [programData, setProgramData] = useState({
        title: '',
        description: '',
        duration_minutes: '',
        passing_grade: 70,
        category: '',
        is_active: true,
    });

    const [questions, setQuestions] = useState([
        { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'a' }
    ]);

    const categories = ['Compliance', 'Technical', 'Leadership', 'Soft Skills', 'Product', 'Security'];

    const handleProgramChange = (field, value) => {
        setProgramData({ ...programData, [field]: value });
    };

    const handleQuestionChange = (index, field, value) => {
        const newQuestions = [...questions];
        newQuestions[index][field] = value;
        setQuestions(newQuestions);
    };

    const addQuestion = () => {
        setQuestions([
            ...questions,
            { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'a' }
        ]);
    };

    const removeQuestion = (index) => {
        if (questions.length > 1) {
            setQuestions(questions.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validasi program
        if (!programData.title.trim()) {
            setError('Nama program harus diisi');
            return;
        }
        if (!programData.description.trim()) {
            setError('Deskripsi harus diisi');
            return;
        }
        if (!programData.duration_minutes) {
            setError('Durasi harus diisi');
            return;
        }
        if (!programData.category) {
            setError('Kategori harus dipilih');
            return;
        }

        // Validasi soal
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.question_text.trim()) {
                setError(`Soal ${i + 1}: Pertanyaan harus diisi`);
                return;
            }
            if (!q.option_a.trim() || !q.option_b.trim() || !q.option_c.trim() || !q.option_d.trim()) {
                setError(`Soal ${i + 1}: Semua opsi harus diisi`);
                return;
            }
        }

        setLoading(true);
        try {
            const response = await axios.post('/api/admin/training-programs/with-questions', {
                program: programData,
                questions: questions
            });

            if (response.data.success) {
                onSuccess();
                setProgramData({
                    title: '',
                    description: '',
                    duration_minutes: '',
                    passing_grade: 70,
                    category: '',
                    is_active: true,
                });
                setQuestions([
                    { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'a' }
                ]);
                onClose();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error membuat program');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-blue-600 text-white p-6 flex items-center justify-between sticky top-0 z-10">
                    <h2 className="text-2xl font-bold">Buat Program & Soal Baru</h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-blue-700 px-3 py-2 rounded"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Program Information Section */}
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Informasi Program</h3>
                        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Nama Program *
                                    </label>
                                    <input
                                        type="text"
                                        value={programData.title}
                                        onChange={(e) => handleProgramChange('title', e.target.value)}
                                        placeholder="e.g., Cyber Security Awareness"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Durasi (menit) *
                                    </label>
                                    <input
                                        type="number"
                                        value={programData.duration_minutes}
                                        onChange={(e) => handleProgramChange('duration_minutes', parseInt(e.target.value))}
                                        placeholder="e.g., 120"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Deskripsi *
                                </label>
                                <textarea
                                    value={programData.description}
                                    onChange={(e) => handleProgramChange('description', e.target.value)}
                                    placeholder="Deskripsi singkat program"
                                    rows="3"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Kategori *
                                    </label>
                                    <select
                                        value={programData.category}
                                        onChange={(e) => handleProgramChange('category', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">-- Pilih Kategori --</option>
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Nilai Kelulusan (KKM)
                                    </label>
                                    <input
                                        type="number"
                                        value={programData.passing_grade}
                                        onChange={(e) => handleProgramChange('passing_grade', parseInt(e.target.value))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        min="0"
                                        max="100"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={programData.is_active}
                                    onChange={(e) => handleProgramChange('is_active', e.target.checked)}
                                    className="w-4 h-4 rounded"
                                />
                                <label htmlFor="is_active" className="text-sm font-semibold text-gray-700">
                                    Program Aktif
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Questions Section */}
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            Pertanyaan Pre-Test & Post-Test
                        </h3>
                        
                        <div className="space-y-6">
                            {questions.map((question, index) => (
                                <div key={index} className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-bold text-gray-900">Soal {index + 1}</h4>
                                        {questions.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeQuestion(index)}
                                                className="text-red-600 hover:bg-red-50 px-3 py-1 rounded flex items-center gap-1"
                                            >
                                                <Trash2 size={16} />
                                                Hapus
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        {/* Question Text */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Pertanyaan *
                                            </label>
                                            <textarea
                                                value={question.question_text}
                                                onChange={(e) => handleQuestionChange(index, 'question_text', e.target.value)}
                                                placeholder="Masukkan pertanyaan"
                                                rows="2"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        {/* Options */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {['a', 'b', 'c', 'd'].map(option => (
                                                <div key={option}>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                        Opsi {option.toUpperCase()} *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={question[`option_${option}`]}
                                                        onChange={(e) => handleQuestionChange(index, `option_${option}`, e.target.value)}
                                                        placeholder={`Jawaban ${option.toUpperCase()}`}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        {/* Correct Answer */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Jawaban Benar *
                                            </label>
                                            <select
                                                value={question.correct_answer}
                                                onChange={(e) => handleQuestionChange(index, 'correct_answer', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="a">A</option>
                                                <option value="b">B</option>
                                                <option value="c">C</option>
                                                <option value="d">D</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add Question Button */}
                        <button
                            type="button"
                            onClick={addQuestion}
                            className="mt-6 flex items-center gap-2 px-6 py-3 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition font-semibold"
                        >
                            <Plus size={20} />
                            Tambah Soal
                        </button>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition font-semibold"
                        >
                            {loading ? 'Menyimpan...' : 'Simpan Program & Soal'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
