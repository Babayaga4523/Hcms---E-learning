import React, { useState, useEffect } from 'react';
import { Zap, FileText, Brain, CheckCircle, Clock, AlertCircle, RefreshCw, Trash2, Share2 } from 'lucide-react';
import axios from 'axios';

export default function AutoQuizGenerator() {
    const [quizzes, setQuizzes] = useState([]);
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({
        module_id: '',
        source: 'transcript',
        difficulty: 'medium',
        question_count: 15
    });

    useEffect(() => {
        fetchModulesAndQuizzes();
    }, []);

    const fetchModulesAndQuizzes = async () => {
        try {
            const [modulesRes, quizzesRes] = await Promise.all([
                axios.get('/api/admin/quizzes/modules'),
                axios.get('/api/admin/quizzes')
            ]);
            setModules(modulesRes.data || []);
            setQuizzes(quizzesRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            setModules([]);
            setQuizzes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateQuiz = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/admin/quizzes/generate', {
                module_id: parseInt(formData.module_id),
                source: formData.source,
                difficulty: formData.difficulty,
                question_count: parseInt(formData.question_count)
            });
            
            setQuizzes([response.data.quiz, ...quizzes]);
            setFormData({
                module_id: '',
                source: 'transcript',
                difficulty: 'medium',
                question_count: 15
            });
            setShowCreateForm(false);
        } catch (error) {
            console.error('Error generating quiz:', error);
            alert('Failed to generate quiz: ' + (error.response?.data?.error || error.message));
        }
    };

    const handlePublishQuiz = async (quizId) => {
        try {
            const response = await axios.post(`/api/admin/quizzes/${quizId}/publish`);
            setQuizzes(quizzes.map(q => q.id === quizId ? response.data.quiz : q));
            alert('Quiz published successfully!');
        } catch (error) {
            console.error('Error publishing quiz:', error);
            alert('Failed to publish quiz');
        }
    };

    const handleDeleteQuiz = async (quizId) => {
        if (!confirm('Are you sure you want to delete this quiz?')) return;
        try {
            await axios.delete(`/api/admin/quizzes/${quizId}`);
            setQuizzes(quizzes.filter(q => q.id !== quizId));
        } catch (error) {
            console.error('Error deleting quiz:', error);
            alert('Failed to delete quiz');
        }
    };

    const getDifficultyColor = (difficulty) => {
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

    if (loading) {
        return <div className="text-center py-12">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Auto-Quiz Generator</h2>
                    <p className="text-gray-600">🤖 Generate intelligent quizzes from training materials with AI</p>
                </div>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
                >
                    <Zap className="w-5 h-5" />
                    Generate New Quiz
                </button>
            </div>

            {/* Create Form */}
            {showCreateForm && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                    <form onSubmit={handleGenerateQuiz} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Select Module
                                </label>
                                <select
                                    value={formData.module_id}
                                    onChange={(e) => setFormData({ ...formData, module_id: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Choose a module...</option>
                                    {modules.map((mod) => (
                                        <option key={mod.id} value={mod.id}>{mod.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Source Content
                                </label>
                                <select
                                    value={formData.source}
                                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="transcript">Video Transcript</option>
                                    <option value="slides">PowerPoint Slides</option>
                                    <option value="both">Both</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Difficulty Level
                                </label>
                                <select
                                    value={formData.difficulty}
                                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Number of Questions
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="5"
                                        max="50"
                                        step="5"
                                        value={formData.question_count}
                                        onChange={(e) => setFormData({ ...formData, question_count: parseInt(e.target.value) })}
                                        className="flex-1"
                                    />
                                    <span className="text-lg font-bold text-purple-600 min-w-fit">{formData.question_count}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2"
                            >
                                <Brain className="w-5 h-5" />
                                Generate with AI
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Quizzes List */}
            <div className="grid grid-cols-1 gap-4">
                {quizzes.map((quiz) => (
                    <div key={quiz.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-bold text-gray-900">{quiz.title}</h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(quiz.difficulty)}`}>
                                        {quiz.difficulty.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDeleteQuiz(quiz.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        {quiz.status === 'generating' ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-semibold text-blue-900">Generating questions...</p>
                                    <p className="text-sm text-blue-700">{quiz.progress || 50}%</p>
                                </div>
                                <div className="w-full bg-blue-200 rounded-full h-2">
                                    <div 
                                        className="bg-blue-600 h-2 rounded-full transition-all"
                                        style={{ width: `${quiz.progress || 50}%` }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-gray-900">{quiz.question_count}</p>
                                    <p className="text-xs text-gray-600">Questions</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">{quiz.quality_score}%</p>
                                    <p className="text-xs text-gray-600">Quality</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">{quiz.coverage_score}%</p>
                                    <p className="text-xs text-gray-600">Coverage</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-gray-700">{quiz.status}</p>
                                    <p className="text-xs text-gray-600">Status</p>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2">
                            {quiz.status === 'generated' && (
                                <>
                                    <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium">
                                        Preview Questions
                                    </button>
                                    <button
                                        onClick={() => handlePublishQuiz(quiz.id)}
                                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                                    >
                                        Publish Quiz
                                    </button>
                                </>
                            )}
                            {quiz.status === 'published' && (
                                <>
                                    <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium">
                                        <Share2 className="w-4 h-4 inline mr-1" />
                                        Share
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {quizzes.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No quizzes generated yet</p>
                </div>
            )}
        </div>
    );
}
