import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export default function PrePostTestModal({ moduleId, examType, isOpen, onClose, onComplete }) {
    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [examAttemptId, setExamAttemptId] = useState(null);
    const [startTime, setStartTime] = useState(null);
    const [timeSpent, setTimeSpent] = useState(0);

    // Fetch questions
    useEffect(() => {
        if (!isOpen || !moduleId) return;

        const fetchQuestions = async () => {
            try {
                setLoading(true);
                const response = await axios.get(
                    `/api/admin/pretest-posttest/questions/${moduleId}/${examType}`
                );
                
                if (response.data.success) {
                    setQuestions(response.data.data.questions);
                    setAnswers({});
                    setCurrentQuestion(0);
                    startExamAttempt();
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load questions');
            } finally {
                setLoading(false);
            }
        };

        fetchQuestions();
    }, [isOpen, moduleId, examType]);

    // Start exam attempt
    const startExamAttempt = async () => {
        try {
            const response = await axios.post(
                `/api/admin/pretest-posttest/start/${moduleId}`,
                { exam_type: examType }
            );

            if (response.data.success) {
                setExamAttemptId(response.data.data.exam_attempt_id);
                setStartTime(new Date());
            }
        } catch (err) {
            setError('Failed to start exam');
        }
    };

    // Timer effect
    useEffect(() => {
        if (!startTime) return;

        const timer = setInterval(() => {
            const now = new Date();
            const seconds = Math.floor((now - startTime) / 1000);
            setTimeSpent(seconds);
        }, 1000);

        return () => clearInterval(timer);
    }, [startTime]);

    // Handle answer selection
    const handleAnswerSelect = (option) => {
        setAnswers({
            ...answers,
            [questions[currentQuestion].id]: option
        });
    };

    // Handle next question
    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        }
    };

    // Handle previous question
    const handlePrevious = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    // Handle submit exam
    const handleSubmit = async () => {
        if (Object.keys(answers).length !== questions.length) {
            setError('Please answer all questions before submitting');
            return;
        }

        setSubmitting(true);

        try {
            const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
                question_id: parseInt(questionId),
                user_answer: answer
            }));

            const response = await axios.post(
                `/api/admin/pretest-posttest/submit/${examAttemptId}`,
                { answers: formattedAnswers }
            );

            if (response.data.success) {
                onComplete(response.data.data);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit exam');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const question = questions[currentQuestion];
    const answeredCount = Object.keys(answers).length;
    const progressPercent = (answeredCount / questions.length) * 100;
    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;

    const formatType = examType === 'pre_test' ? 'Pre-Test' : 'Post-Test';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-blue-600 text-white p-6 border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">{formatType}</h2>
                            <p className="text-blue-100">
                                Pertanyaan {currentQuestion + 1} dari {questions.length}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                                <Clock size={20} />
                                <span className="font-mono">
                                    {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                                </span>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-white hover:bg-blue-700 px-3 py-2 rounded"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 bg-white bg-opacity-20 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-white h-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <p className="text-sm mt-2 text-blue-100">
                        {answeredCount} dari {questions.length} pertanyaan dijawab
                    </p>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    {loading && (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p>Loading questions...</p>
                            </div>
                        </div>
                    )}

                    {error && !loading && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-red-900">Error</p>
                                <p className="text-red-700">{error}</p>
                            </div>
                        </div>
                    )}

                    {!loading && !error && question && (
                        <div>
                            {/* Question Text */}
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold text-gray-800 mb-6">
                                    {question.question_text}
                                </h3>

                                {/* Options */}
                                <div className="space-y-3">
                                    {['a', 'b', 'c', 'd'].map((option) => (
                                        <button
                                            key={option}
                                            onClick={() => handleAnswerSelect(option)}
                                            className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
                                                answers[question.id] === option
                                                    ? 'border-blue-600 bg-blue-50'
                                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                        answers[question.id] === option
                                                            ? 'border-blue-600 bg-blue-600'
                                                            : 'border-gray-300'
                                                    }`}
                                                >
                                                    {answers[question.id] === option && (
                                                        <div className="w-2 h-2 bg-white rounded-full" />
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-gray-700">
                                                        {option.toUpperCase()}.
                                                    </span>
                                                    <span className="ml-2 text-gray-700">
                                                        {question.options[option]}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Question Number Indicators */}
                            <div className="mt-8 pt-8 border-t">
                                <p className="text-sm text-gray-600 mb-3">Navigasi soal:</p>
                                <div className="grid grid-cols-10 gap-2">
                                    {questions.map((q, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentQuestion(idx)}
                                            className={`w-8 h-8 rounded text-sm font-semibold transition-all ${
                                                idx === currentQuestion
                                                    ? 'bg-blue-600 text-white'
                                                    : answers[q.id]
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                        >
                                            {idx + 1}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!loading && !error && (
                    <div className="bg-gray-50 p-6 border-t flex items-center justify-between">
                        <div className="flex gap-2">
                            <button
                                onClick={handlePrevious}
                                disabled={currentQuestion === 0}
                                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                ← Sebelumnya
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={currentQuestion === questions.length - 1}
                                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Selanjutnya →
                            </button>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={submitting || answeredCount !== questions.length}
                            className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                        >
                            {submitting ? 'Mengirim...' : 'Kirim Jawaban'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
