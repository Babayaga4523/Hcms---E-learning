import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle, Award, AlertCircle } from 'lucide-react';

// Helper: Format duration from minutes to MM:SS format
const formatDuration = (durationMinutes) => {
    if (!durationMinutes && durationMinutes !== 0) return 'N/A';
    const mins = Math.floor(Number(durationMinutes) || 0);
    const secs = Math.round(((Number(durationMinutes) || 0) - mins) * 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function TestResultsModal({ examAttemptId, isOpen, onClose }) {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedQuestion, setExpandedQuestion] = useState(null);

    useEffect(() => {
        if (!isOpen || !examAttemptId) return;

        const fetchResults = async () => {
            try {
                setLoading(true);
                const response = await axios.get(
                    `/api/admin/pretest-posttest/result/${examAttemptId}`
                );

                if (response.data.success) {
                    setResults(response.data.data);
                }
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to load results');
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [isOpen, examAttemptId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 border-b">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">Hasil {results?.exam_type === 'pre_test' ? 'Pre-Test' : 'Post-Test'}</h2>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-blue-700 px-3 py-2 rounded"
                        >
                            ✕
                        </button>
                    </div>

                    {loading ? (
                        <div className="animate-pulse h-4 bg-blue-500 rounded w-1/4"></div>
                    ) : error ? (
                        <p className="text-red-200">{error}</p>
                    ) : (
                        <p className="text-blue-100">{results.module_title}</p>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {loading && (
                        <div className="flex items-center justify-center h-full p-8">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p>Loading results...</p>
                            </div>
                        </div>
                    )}

                    {error && !loading && (
                        <div className="m-8 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-red-900">Error</p>
                                <p className="text-red-700">{error}</p>
                            </div>
                        </div>
                    )}

                    {!loading && !error && results && (
                        <div className="p-8">
                            {/* Score Summary */}
                            <div className={`rounded-lg p-8 mb-8 text-center ${
                                results.is_passed
                                    ? 'bg-green-50 border-2 border-green-200'
                                    : 'bg-red-50 border-2 border-red-200'
                            }`}>
                                <div className="flex items-center justify-center mb-4">
                                    {results.is_passed ? (
                                        <CheckCircle className="text-green-600" size={48} />
                                    ) : (
                                        <XCircle className="text-red-600" size={48} />
                                    )}
                                </div>

                                <h3 className={`text-3xl font-bold mb-2 ${
                                    results.is_passed ? 'text-green-700' : 'text-red-700'
                                }`}>
                                    {results.is_passed ? 'LULUS ✓' : 'TIDAK LULUS ✗'}
                                </h3>

                                <div className="text-5xl font-bold mb-4">
                                    <span className={results.is_passed ? 'text-green-600' : 'text-red-600'}>
                                        {results.percentage.toFixed(1)}%
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mt-6">
                                    <div className="bg-white rounded p-3">
                                        <p className="text-gray-600 text-sm">Jawaban Benar</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {results.correct_answers}/{results.total_questions}
                                        </p>
                                    </div>
                                    <div className="bg-white rounded p-3">
                                        <p className="text-gray-600 text-sm">KKM</p>
                                        <p className="text-2xl font-bold text-blue-600">
                                            {results.passing_grade}%
                                        </p>
                                    </div>
                                    <div className="bg-white rounded p-3">
                                        <p className="text-gray-600 text-sm">Waktu Pengerjaan</p>
                                        <p className="text-2xl font-bold text-purple-600">
                                            {formatDuration(results.duration_minutes)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Answer Review */}
                            <div>
                                <h4 className="text-xl font-semibold mb-4">Review Jawaban</h4>
                                <div className="space-y-4">
                                    {results.answers.map((answer, idx) => (
                                        <div
                                            key={idx}
                                            className={`border rounded-lg overflow-hidden ${
                                                answer.is_correct ? 'border-green-200' : 'border-red-200'
                                            }`}
                                        >
                                            {/* Question Header */}
                                            <button
                                                onClick={() => setExpandedQuestion(
                                                    expandedQuestion === idx ? null : idx
                                                )}
                                                className={`w-full p-4 text-left flex items-center gap-3 ${
                                                    answer.is_correct ? 'bg-green-50' : 'bg-red-50'
                                                } hover:bg-opacity-75 transition-all`}
                                            >
                                                <div className="flex-shrink-0">
                                                    {answer.is_correct ? (
                                                        <CheckCircle className="text-green-600" size={20} />
                                                    ) : (
                                                        <XCircle className="text-red-600" size={20} />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-semibold text-gray-800">
                                                        Pertanyaan {idx + 1}
                                                    </p>
                                                    <p className="text-sm text-gray-600 line-clamp-1">
                                                        {answer.question_text}
                                                    </p>
                                                </div>
                                                <span className="text-sm font-semibold">
                                                    {expandedQuestion === idx ? '▼' : '▶'}
                                                </span>
                                            </button>

                                            {/* Question Details */}
                                            {expandedQuestion === idx && (
                                                <div className="p-4 border-t border-inherit bg-white">
                                                    <p className="mb-4 text-gray-800 font-semibold">
                                                        {answer.question_text}
                                                    </p>

                                                    <div className="space-y-2 mb-4">
                                                        {Object.entries(answer.option).map(([key, value]) => {
                                                            const isUserAnswer = key === answer.user_answer;
                                                            const isCorrect = key === answer.correct_answer;

                                                            let bgColor = 'bg-white border-gray-200';
                                                            if (isCorrect) {
                                                                bgColor = 'bg-green-50 border-green-300';
                                                            } else if (isUserAnswer && !isCorrect) {
                                                                bgColor = 'bg-red-50 border-red-300';
                                                            }

                                                            return (
                                                                <div
                                                                    key={key}
                                                                    className={`border-2 p-3 rounded ${bgColor}`}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-semibold text-gray-700">
                                                                            {key.toUpperCase()}.
                                                                        </span>
                                                                        <span className="text-gray-700">
                                                                            {value}
                                                                        </span>
                                                                        {isCorrect && (
                                                                            <span className="ml-auto text-sm font-semibold text-green-600 flex items-center gap-1">
                                                                                ✓ Jawaban Benar
                                                                            </span>
                                                                        )}
                                                                        {isUserAnswer && !isCorrect && (
                                                                            <span className="ml-auto text-sm font-semibold text-red-600 flex items-center gap-1">
                                                                                ✗ Jawaban Anda
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!loading && !error && (
                    <div className="bg-gray-50 p-6 border-t flex justify-end gap-2">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold"
                        >
                            Tutup
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
