import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, Save, X, Copy, HelpCircle, Upload, Download, Loader } from 'lucide-react';
import axios from 'axios';

export default function QuestionBuilder({ quizId, questions = [], onQuestionAdded, onQuestionUpdated }) {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [questionList, setQuestionList] = useState(questions);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterDifficulty, setFilterDifficulty] = useState('all');

    const questionTypes = [
        { value: 'multiple_choice', label: 'Multiple Choice', icon: '◉' },
        { value: 'true_false', label: 'True/False', icon: 'T/F' },
        { value: 'fill_blank', label: 'Fill in the Blank', icon: '____' },
        { value: 'essay', label: 'Essay/Short Answer', icon: '✎' },
    ];

    const difficultyLevels = [
        { value: 'easy', label: 'Mudah', points: 3 },
        { value: 'medium', label: 'Sedang', points: 5 },
        { value: 'hard', label: 'Sulit', points: 7 },
    ];

    const [formData, setFormData] = useState({
        question_text: '',
        question_type: 'multiple_choice',
        difficulty: 'medium',
        points: 5,
        explanation: '',
        options: ['', '', '', ''],
        correct_answer: '',
        correct_answers: [],
        order: questionList.length + 1,
    });

    const showNotification = (msg, type = 'success') => {
        setMessage({ type, text: msg });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const resetForm = () => {
        setFormData({
            question_text: '',
            question_type: 'multiple_choice',
            difficulty: 'medium',
            points: 5,
            explanation: '',
            options: ['', '', '', ''],
            correct_answer: '',
            correct_answers: [],
            order: questionList.length + 1,
        });
    };

    const handleCreateQuestion = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.question_text.trim()) {
            showNotification('Pertanyaan tidak boleh kosong', 'error');
            return;
        }

        if (formData.question_type === 'multiple_choice') {
            if (formData.options.some(opt => !opt.trim())) {
                showNotification('Semua opsi harus diisi', 'error');
                return;
            }
            if (!formData.correct_answer) {
                showNotification('Pilih jawaban yang benar', 'error');
                return;
            }
        } else if (formData.question_type === 'true_false') {
            if (!formData.correct_answer) {
                showNotification('Pilih jawaban yang benar', 'error');
                return;
            }
        } else if (formData.question_type === 'fill_blank') {
            if (!formData.correct_answer.trim()) {
                showNotification('Jawaban yang benar tidak boleh kosong', 'error');
                return;
            }
        } else if (formData.question_type === 'essay') {
            if (!formData.explanation.trim()) {
                showNotification('Rubrik jawaban tidak boleh kosong', 'error');
                return;
            }
        }

        setLoading(true);
        try {
            const payload = {
                quiz_id: quizId,
                question_text: formData.question_text,
                question_type: formData.question_type,
                difficulty: formData.difficulty,
                points: formData.points,
                explanation: formData.explanation,
                options: formData.question_type === 'multiple_choice' ? formData.options : null,
                correct_answer: formData.correct_answer,
                order: formData.order,
            };

            const response = await axios.post('/api/questions', payload);
            
            if (response.data) {
                const newQuestion = response.data;
                setQuestionList([...questionList, newQuestion]);
                showNotification('Pertanyaan berhasil dibuat');
                resetForm();
                setShowCreateForm(false);
                if (onQuestionAdded) onQuestionAdded();
            }
        } catch (error) {
            showNotification(error.response?.data?.message || 'Error membuat pertanyaan', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditQuestion = async (e) => {
        e.preventDefault();
        
        if (!formData.question_text.trim()) {
            showNotification('Pertanyaan tidak boleh kosong', 'error');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                question_text: formData.question_text,
                question_type: formData.question_type,
                difficulty: formData.difficulty,
                points: formData.points,
                explanation: formData.explanation,
                options: formData.question_type === 'multiple_choice' ? formData.options : null,
                correct_answer: formData.correct_answer,
            };

            const response = await axios.put(`/api/questions/${selectedQuestion.id}`, payload);
            
            if (response.data) {
                const updatedList = questionList.map(q => 
                    q.id === selectedQuestion.id ? response.data : q
                );
                setQuestionList(updatedList);
                showNotification('Pertanyaan berhasil diperbarui');
                setShowEditForm(false);
                resetForm();
                if (onQuestionUpdated) onQuestionUpdated();
            }
        } catch (error) {
            showNotification(error.response?.data?.message || 'Error memperbarui pertanyaan', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteQuestion = async (questionId) => {
        if (!confirm('Hapus pertanyaan ini? Tindakan tidak dapat dibatalkan.')) return;

        setLoading(true);
        try {
            await axios.delete(`/api/questions/${questionId}`);
            setQuestionList(questionList.filter(q => q.id !== questionId));
            showNotification('Pertanyaan berhasil dihapus');
        } catch (error) {
            showNotification(error.response?.data?.message || 'Error menghapus pertanyaan', 'error');
        } finally {
            setLoading(false);
        }
    };

    const openEditForm = (question) => {
        setSelectedQuestion(question);
        setFormData({
            question_text: question.question_text,
            question_type: question.question_type,
            difficulty: question.difficulty,
            points: question.points,
            explanation: question.explanation || '',
            options: question.options || ['', '', '', ''],
            correct_answer: question.correct_answer || '',
            correct_answers: question.correct_answers || [],
            order: question.order,
        });
        setShowEditForm(true);
    };

    const filteredQuestions = questionList.filter(q => {
        const matchesSearch = q.question_text.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || q.question_type === filterType;
        const matchesDifficulty = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
        return matchesSearch && matchesType && matchesDifficulty;
    });

    const getDifficultyBadgeColor = (difficulty) => {
        switch (difficulty) {
            case 'easy':
                return 'bg-green-100 text-green-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'hard':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getQuestionTypeIcon = (type) => {
        const typeObj = questionTypes.find(t => t.value === type);
        return typeObj?.icon || '?';
    };

    const getQuestionTypeLabel = (type) => {
        const typeObj = questionTypes.find(t => t.value === type);
        return typeObj?.label || type;
    };

    const getDifficultyLabel = (difficulty) => {
        const diffObj = difficultyLevels.find(d => d.value === difficulty);
        return diffObj?.label || difficulty;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Manajemen Pertanyaan</h2>
                    <p className="text-gray-600 text-sm mt-1">
                        Buat dan kelola pertanyaan quiz ({filteredQuestions.length} pertanyaan)
                    </p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowCreateForm(!showCreateForm);
                        setShowEditForm(false);
                    }}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                    <Plus className="w-5 h-5" />
                    Tambah Pertanyaan
                </button>
            </div>

            {/* Notification */}
            {message.text && (
                <div className={`p-4 rounded-lg ${
                    message.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                    {message.text}
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Cari pertanyaan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">Semua Tipe</option>
                        {questionTypes.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                    <select
                        value={filterDifficulty}
                        onChange={(e) => setFilterDifficulty(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">Semua Tingkat</option>
                        {difficultyLevels.map(d => (
                            <option key={d.value} value={d.value}>{d.label} ({d.points}poin)</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Create Form */}
            {showCreateForm && !showEditForm && (
                <QuestionForm
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={handleCreateQuestion}
                    onCancel={() => {
                        setShowCreateForm(false);
                        resetForm();
                    }}
                    loading={loading}
                    isEditing={false}
                    questionTypes={questionTypes}
                    difficultyLevels={difficultyLevels}
                />
            )}

            {/* Edit Form */}
            {showEditForm && (
                <QuestionForm
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={handleEditQuestion}
                    onCancel={() => {
                        setShowEditForm(false);
                        setSelectedQuestion(null);
                        resetForm();
                    }}
                    loading={loading}
                    isEditing={true}
                    questionTypes={questionTypes}
                    difficultyLevels={difficultyLevels}
                />
            )}

            {/* Questions List */}
            {filteredQuestions.length > 0 ? (
                <div className="space-y-3">
                    {filteredQuestions.map((question, index) => (
                        <div key={question.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600 hover:shadow-lg transition">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                                            {index + 1}
                                        </span>
                                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                            {getQuestionTypeLabel(question.question_type)}
                                        </span>
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyBadgeColor(question.difficulty)}`}>
                                            {getDifficultyLabel(question.difficulty)} ({question.points}poin)
                                        </span>
                                    </div>
                                    <p className="text-gray-900 font-medium text-lg leading-relaxed">
                                        {question.question_text}
                                    </p>
                                </div>
                            </div>

                            {/* Question Preview */}
                            <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                                {question.question_type === 'multiple_choice' && question.options && (
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-2">Opsi Jawaban:</p>
                                        <ul className="space-y-2">
                                            {question.options.map((option, idx) => (
                                                <li key={idx} className={`text-sm p-2 rounded ${
                                                    question.correct_answer === option
                                                        ? 'bg-green-100 text-green-800 font-semibold'
                                                        : 'bg-white text-gray-700'
                                                }`}>
                                                    {String.fromCharCode(65 + idx)}. {option}
                                                    {question.correct_answer === option && ' ✓'}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {question.question_type === 'true_false' && (
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-2">Opsi:</p>
                                        <div className="flex gap-4">
                                            <button className={`px-4 py-2 rounded text-sm font-medium ${
                                                question.correct_answer === 'true'
                                                    ? 'bg-green-100 text-green-800 font-bold'
                                                    : 'bg-white text-gray-700 border border-gray-300'
                                            }`}>
                                                Benar {question.correct_answer === 'true' && '✓'}
                                            </button>
                                            <button className={`px-4 py-2 rounded text-sm font-medium ${
                                                question.correct_answer === 'false'
                                                    ? 'bg-green-100 text-green-800 font-bold'
                                                    : 'bg-white text-gray-700 border border-gray-300'
                                            }`}>
                                                Salah {question.correct_answer === 'false' && '✓'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {question.question_type === 'fill_blank' && (
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-2">Jawaban Benar:</p>
                                        <p className="text-sm p-2 bg-green-100 text-green-800 rounded font-semibold">
                                            {question.correct_answer}
                                        </p>
                                    </div>
                                )}

                                {question.question_type === 'essay' && (
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-2">Rubrik Jawaban:</p>
                                        <p className="text-sm text-gray-700 p-2 bg-white rounded border border-gray-300">
                                            {question.explanation}
                                        </p>
                                        <p className="text-xs text-gray-600 mt-2">
                                            (Butuh grading manual)
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
                                <button
                                    onClick={() => setSelectedQuestion(question)}
                                    className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                                >
                                    <Eye className="w-4 h-4" />
                                    Preview
                                </button>
                                <button
                                    onClick={() => openEditForm(question)}
                                    className="flex items-center gap-2 px-3 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition text-sm font-medium"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => {
                                        const newQuestion = { ...question, id: undefined };
                                        setFormData({
                                            question_text: newQuestion.question_text,
                                            question_type: newQuestion.question_type,
                                            difficulty: newQuestion.difficulty,
                                            points: newQuestion.points,
                                            explanation: newQuestion.explanation || '',
                                            options: newQuestion.options || ['', '', '', ''],
                                            correct_answer: newQuestion.correct_answer || '',
                                            order: questionList.length + 1,
                                        });
                                        setShowCreateForm(true);
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 border border-cyan-300 text-cyan-600 rounded-lg hover:bg-cyan-50 transition text-sm font-medium"
                                >
                                    <Copy className="w-4 h-4" />
                                    Duplikat
                                </button>
                                <button
                                    onClick={() => handleDeleteQuestion(question.id)}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition text-sm font-medium disabled:opacity-50"
                                >
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
                    <p className="text-gray-600 font-medium">Belum ada pertanyaan</p>
                    <p className="text-gray-500 text-sm">Klik tombol "Tambah Pertanyaan" untuk membuat pertanyaan quiz</p>
                </div>
            )}

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">💡 Tips Membuat Pertanyaan yang Efektif:</p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Gunakan bahasa yang jelas dan mudah dipahami</li>
                    <li>Multiple Choice: 4-5 opsi dengan 1 jawaban benar</li>
                    <li>Tingkat kesulitan: mudah (3poin), sedang (5poin), sulit (7poin)</li>
                    <li>Essay: Buat rubrik yang jelas untuk penilaian manual</li>
                    <li>Hindari pertanyaan yang ambigu atau berbelit-belit</li>
                </ul>
            </div>
        </div>
    );
}

// Question Form Component
function QuestionForm({ formData, setFormData, onSubmit, onCancel, loading, isEditing, questionTypes, difficultyLevels }) {
    return (
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-600">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
                {isEditing ? 'Edit Pertanyaan' : 'Buat Pertanyaan Baru'}
            </h2>

            <form onSubmit={onSubmit} className="space-y-6">
                {/* Question Text */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Teks Pertanyaan *
                    </label>
                    <textarea
                        value={formData.question_text}
                        onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                        placeholder="Masukkan pertanyaan di sini..."
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                    />
                </div>

                {/* Question Type & Difficulty */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Tipe Pertanyaan *
                        </label>
                        <select
                            value={formData.question_type}
                            onChange={(e) => setFormData({ 
                                ...formData, 
                                question_type: e.target.value,
                                options: e.target.value === 'multiple_choice' ? ['', '', '', ''] : formData.options,
                                correct_answer: '',
                            })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {questionTypes.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Tingkat Kesulitan *
                        </label>
                        <select
                            value={formData.difficulty}
                            onChange={(e) => {
                                const diff = difficultyLevels.find(d => d.value === e.target.value);
                                setFormData({ 
                                    ...formData, 
                                    difficulty: e.target.value,
                                    points: diff?.points || 5,
                                });
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {difficultyLevels.map(d => (
                                <option key={d.value} value={d.value}>{d.label} ({d.points}poin)</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Poin
                        </label>
                        <input
                            type="number"
                            value={formData.points}
                            onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="1"
                            max="10"
                        />
                    </div>
                </div>

                {/* Question Type Specific Fields */}
                {formData.question_type === 'multiple_choice' && (
                    <MultipleChoiceForm formData={formData} setFormData={setFormData} />
                )}

                {formData.question_type === 'true_false' && (
                    <TrueFalseForm formData={formData} setFormData={setFormData} />
                )}

                {formData.question_type === 'fill_blank' && (
                    <FillBlankForm formData={formData} setFormData={setFormData} />
                )}

                {formData.question_type === 'essay' && (
                    <EssayForm formData={formData} setFormData={setFormData} />
                )}

                {/* Explanation */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Penjelasan/Hint (optional)
                    </label>
                    <textarea
                        value={formData.explanation}
                        onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                        placeholder="Jelaskan jawaban atau berikan hint untuk peserta..."
                        rows="2"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-semibold"
                    >
                        {loading && <Loader className="w-4 h-4 animate-spin" />}
                        {isEditing ? 'Simpan Perubahan' : 'Buat Pertanyaan'}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                    >
                        Batal
                    </button>
                </div>
            </form>
        </div>
    );
}

// Multiple Choice Form
function MultipleChoiceForm({ formData, setFormData }) {
    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                Opsi Jawaban *
            </label>
            <div className="space-y-3">
                {formData.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <input
                            type="radio"
                            name="correct_answer"
                            value={option}
                            checked={formData.correct_answer === option}
                            onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                            className="w-4 h-4"
                        />
                        <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                                const newOptions = [...formData.options];
                                newOptions[index] = e.target.value;
                                setFormData({ ...formData, options: newOptions });
                            }}
                            placeholder={`Opsi ${String.fromCharCode(65 + index)}`}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">Centang radio button untuk jawaban yang benar</p>
        </div>
    );
}

// True/False Form
function TrueFalseForm({ formData, setFormData }) {
    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                Jawaban Benar *
            </label>
            <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="radio"
                        name="correct_answer"
                        value="true"
                        checked={formData.correct_answer === 'true'}
                        onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                        className="w-4 h-4"
                    />
                    <span className="text-gray-700 font-medium">Benar</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="radio"
                        name="correct_answer"
                        value="false"
                        checked={formData.correct_answer === 'false'}
                        onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                        className="w-4 h-4"
                    />
                    <span className="text-gray-700 font-medium">Salah</span>
                </label>
            </div>
        </div>
    );
}

// Fill in the Blank Form
function FillBlankForm({ formData, setFormData }) {
    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                Jawaban Benar (case-insensitive) *
            </label>
            <input
                type="text"
                value={formData.correct_answer}
                onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                placeholder="Masukkan jawaban yang benar..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-2">Jawaban akan diterima terlepas dari besar/kecil huruf</p>
        </div>
    );
}

// Essay Form
function EssayForm({ formData, setFormData }) {
    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rubrik Jawaban / Scoring Criteria *
            </label>
            <textarea
                value={formData.correct_answer}
                onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                placeholder="Jelaskan apa yang Anda harapkan dalam jawaban. Contoh: Jawaban harus mencakup ..."
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-2">Informasi ini akan digunakan PIC untuk grading manual</p>
        </div>
    );
}
