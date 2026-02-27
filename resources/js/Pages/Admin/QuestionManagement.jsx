import React, { useState, useEffect } from 'react';
import { Head, usePage, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import DOMPurify from 'dompurify';
import {
    Save, X, Plus, Trash2, Copy, Eye, ArrowLeft, 
    AlertCircle, Check, ChevronDown, Image as ImageIcon,
    Bold, Italic, List, Code, Type, AlignLeft, Hash,
    MoreHorizontal, HelpCircle, GripVertical, Underline,
    ListOrdered, AlignCenter, AlignRight, Strikethrough
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import showToast from '@/Utils/toast';

// Add styles for contenteditable
const editorStyles = `
    [contenteditable]:empty:before {
        content: attr(placeholder);
        color: #94a3b8;
        font-style: italic;
    }
    [contenteditable] {
        -webkit-user-modify: read-write-plaintext-only;
    }
    [contenteditable] b, [contenteditable] strong {
        font-weight: 700;
    }
    [contenteditable] i, [contenteditable] em {
        font-style: italic;
    }
    [contenteditable] u {
        text-decoration: underline;
    }
    [contenteditable] ul {
        list-style: disc;
        padding-left: 2rem;
        margin: 0.5rem 0;
    }
    [contenteditable] ol {
        list-style: decimal;
        padding-left: 2rem;
        margin: 0.5rem 0;
    }
    [contenteditable] li {
        margin: 0.25rem 0;
    }
`;

// --- REUSABLE COMPONENTS ---

const ToolbarButton = ({ icon: Icon, onClick, active, title }) => (
    <button 
        type="button" 
        onClick={onClick}
        title={title}
        className={`p-2 rounded-lg transition ${
            active 
            ? 'text-lime-600 bg-lime-50' 
            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
        }`}
    >
        <Icon size={16} />
    </button>
);

const TagChip = ({ label, onRemove }) => (
    <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100">
        {label}
        <button type="button" onClick={onRemove} className="hover:text-indigo-900"><X size={12} /></button>
    </span>
);

const DifficultyCard = ({ level, active, onClick }) => {
    const colors = {
        easy: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        medium: 'bg-amber-100 text-amber-700 border-amber-200',
        hard: 'bg-red-100 text-red-700 border-red-200',
    };
    
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex-1 py-3 px-2 rounded-xl border-2 text-xs font-bold uppercase tracking-wider transition-all ${
                active 
                ? `${colors[level]} shadow-sm scale-105` 
                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
            }`}
        >
            {level === 'easy' ? '🟢 Easy' : level === 'medium' ? '🟡 Medium' : '🔴 Hard'}
        </button>
    );
};

// --- MAIN COMPONENT ---

export default function QuestionManagement({ question = null, module_id = null, quiz_id = null, question_type = null, returnUrl = null }) {
    const page = usePage();
    const auth = page?.props?.auth || {};
    const user = auth?.user;
    
    // Get query parameters
    const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const queryType = urlParams.get('type'); // pretest or posttest
    const queryModuleId = urlParams.get('module_id');
    
    // Determine test type from query params first, then from question_type param, then default
    const initialTestType = queryType || question_type === 'pretest' || question_type === 'posttest' 
        ? queryType || question_type 
        : (question?.question_type === 'pretest' || question?.type === 'pretest' ? 'pretest' : 'posttest');
    
    // Default return URL
    const getBackUrl = () => {
        if (returnUrl) return returnUrl;
        if (queryModuleId || module_id) return `/admin/training-programs/${queryModuleId || module_id}/content-manager`;
        if (quiz_id) return `/admin/quizzes/${quiz_id}`;
        return '/admin/questions';
    };
    
    // Convert database format to form format
    const questionData = question ? {
        question_text: question.question_text || question.question || '',
        question_type: question.question_type || question.type || 'multiple_choice',
        category: question.category || 'general',
        difficulty: question.difficulty || 'medium',
        options: [
            question.option_a || '',
            question.option_b || '',
            question.option_c || '',
            question.option_d || ''
        ],
        correct_answer: question.correct_answer || 'a',
        points: question.points || 10,
        explanation: question.explanation || '',
        module_id: question.module_id || null,
        quiz_id: question.quiz_id || null,
        id: question.id || null,
    } : null;
    
    // Sanitize HTML from contenteditable (remove dangerous tags but keep formatting)
    const sanitizeQuestionText = (html) => {
        return DOMPurify.sanitize(html, { 
            ALLOWED_TAGS: ['b', 'i', 'u', 's', 'em', 'strong', 'ul', 'ol', 'li', 'br', 'p', 'pre', 'code'],
            ALLOWED_ATTR: ['style'],
            KEEP_CONTENT: true
        });
    };
    
    // Debug log - show loaded question data
    if (questionData) {
        console.log('Loaded questionData:', {
            id: questionData.id,
            question_type: questionData.question_type,
            question_type_type: typeof questionData.question_type,
            difficulty: questionData.difficulty,
            original_question: question
        });
    }
    
    const [loading, setLoading] = useState(false);
    const [testType, setTestType] = useState(initialTestType);
    const [draftRestored, setDraftRestored] = useState(false); // NEW: Track if draft was restored
    const editorRef = React.useRef(null);
    const initialFormData = {
        question_text: questionData?.question_text || '',
        question_type: questionData?.question_type || 'multiple_choice',
        category: questionData?.category || 'general',
        difficulty: questionData?.difficulty || 'medium',
        options: questionData?.options || ['', '', '', ''],
        correct_answer: questionData?.correct_answer || 'a',
        points: questionData?.points || 5,
        explanation: questionData?.explanation || '',
        image_url: questionData?.image_url || null,
        image_file: null,
        module_id: questionData?.module_id || queryModuleId || module_id || null,
        quiz_id: questionData?.quiz_id || quiz_id || null,
    };
    
    console.log('Initial formData:', {
        question_type: initialFormData.question_type,
        question_type_type: typeof initialFormData.question_type,
        difficulty: initialFormData.difficulty
    });
    
    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState({});

    // NEW: Persist test type in URL parameters
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            params.set('type', testType);
            window.history.replaceState({}, '', `?${params.toString()}`);
        }
    }, [testType]);

    /**
     * Safe localStorage save with quota management
     * Prevents data loss when localStorage quota is exceeded
     */
    const safeLocalStorageSave = (key, data) => {
        try {
            // Check available space first
            const dataStr = JSON.stringify(data);
            const dataSize = new Blob([dataStr]).size;
            
            // Most browsers have 5-10MB, but we use localStorage carefully
            // If data is too large, don't save the entire draft
            const MAX_DRAFT_SIZE = 1024 * 100; // 100KB max for a single draft
            
            if (dataSize > MAX_DRAFT_SIZE) {
                console.warn(`Draft data too large (${dataSize} bytes), saving only essential fields`);
                // Save only essential fields to reduce size
                const minimalData = {
                    question_text: data.question_text,
                    difficulty: data.difficulty,
                    testType: data.testType,
                    savedAt: data.savedAt
                };
                localStorage.setItem(key, JSON.stringify(minimalData));
                showToast('⚠️ Draft saved with limited data due to size constraints', 'warning');
                return;
            }
            
            // Try to save
            localStorage.setItem(key, dataStr);
            
        } catch (e) {
            // Handle QuotaExceededError
            if (e.name === 'QuotaExceededError' || e.code === 22) {
                console.error('localStorage quota exceeded:', e);
                showToast('❌ Storage full! Unable to save draft. Please clear browser cache or save your work immediately.', 'error');
                
                // Try to clear old drafts to make space
                try {
                    const keys = Object.keys(localStorage);
                    const draftKeys = keys.filter(k => k.startsWith('question_draft_'));
                    
                    if (draftKeys.length > 1) {
                        // Remove oldest draft (keep only current one)
                        const oldestKey = draftKeys.sort().slice(0, -1)[0];
                        if (oldestKey) {
                            localStorage.removeItem(oldestKey);
                            console.log('Removed old draft to make space');
                            // Retry saving
                            localStorage.setItem(key, JSON.stringify(data));
                            showToast('✅ Cleared old draft and saved current one', 'success');
                        }
                    }
                } catch (clearError) {
                    console.error('Could not clear old drafts:', clearError);
                }
            } else {
                console.error('Unexpected localStorage error:', e);
                showToast('❌ Failed to save draft locally', 'error');
            }
        }
    };

    // NEW: Auto-save to localStorage every 30 seconds
    useEffect(() => {
        const moduleKey = `question_draft_${queryModuleId || module_id}`;
        const interval = setInterval(() => {
            let currentQuestionText = formData.question_text;
            if (editorRef.current) {
                currentQuestionText = editorRef.current.innerHTML?.trim() || formData.question_text;
            }
            const draftData = { ...formData, question_text: currentQuestionText, testType, savedAt: new Date().toISOString() };
            
            // Use safe save that handles quota exceeded errors
            safeLocalStorageSave(moduleKey, draftData);
        }, 30000);
        return () => clearInterval(interval);
    }, [formData, testType, queryModuleId, module_id]);

    // NEW: Restore draft on mount if no question is being edited
    useEffect(() => {
        if (!questionData?.id && !draftRestored) {
            const moduleKey = `question_draft_${queryModuleId || module_id}`;
            try {
                const savedDraft = localStorage.getItem(moduleKey);
                if (savedDraft) {
                    const draft = JSON.parse(savedDraft);
                    
                    // Validate draft testType - ensure it's one of the expected values
                    const validTestTypes = ['pretest', 'posttest'];
                    if (draft.testType && !validTestTypes.includes(draft.testType)) {
                        console.warn(`Invalid testType in draft: ${draft.testType}`);
                        localStorage.removeItem(moduleKey); // Remove corrupted draft
                        setDraftRestored(true);
                        return;
                    }
                    
                    setFormData(draft);
                    setTestType(draft.testType || initialTestType);
                    setDraftRestored(true);
                    showToast(`✅ Draft restored from ${new Date(draft.savedAt).toLocaleTimeString()}`, 'success');
                } else {
                    setDraftRestored(true);
                }
            } catch (err) {
                console.error('Error restoring draft:', err);
                showToast('⚠️ Could not restore draft (file may be corrupted)', 'warning');
                setDraftRestored(true);
                // Optionally clear the corrupted draft
                try {
                    localStorage.removeItem(moduleKey);
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
        }
    }, []);

    const categories = [
        { id: 'general', name: 'Umum' },
        { id: 'technical', name: 'Teknis' },
        { id: 'behavioral', name: 'Perilaku' },
        { id: 'scenario', name: 'Skenario' },
        { id: 'case-study', name: 'Studi Kasus' }
    ];

    const types = [
        { id: 'multiple_choice', name: 'Pilihan Ganda', icon: '🔘' },
        { id: 'true_false', name: 'Benar/Salah', icon: '✓' },
        { id: 'short_answer', name: 'Jawaban Singkat', icon: '📝' },
    ];

    // Get theme colors based on test type
    const themeColors = testType === 'pretest' ? {
        primary: 'from-blue-500 to-blue-600',
        primaryLight: 'from-blue-50 to-blue-100',
        primaryBorder: 'border-blue-200',
        primaryRing: 'focus:ring-blue-200/50',
        primaryAccent: 'text-blue-600',
        badge: 'bg-blue-100 text-blue-700',
        button: 'from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600',
    } : {
        primary: 'from-orange-500 to-orange-600',
        primaryLight: 'from-orange-50 to-orange-100',
        primaryBorder: 'border-orange-200',
        primaryRing: 'focus:ring-orange-200/50',
        primaryAccent: 'text-orange-600',
        badge: 'bg-orange-100 text-orange-700',
        button: 'from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600',
    };

    const difficulties = [
        { id: 'easy', name: 'Easy' },
        { id: 'medium', name: 'Medium' },
        { id: 'hard', name: 'Hard' }
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        console.log(`handleInputChange: ${name} = "${value}" (${typeof value})`);
        setFormData({
            ...formData,
            [name]: value
        });
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: null
            });
        }
    };

    const handleEditorInput = () => {
        if (editorRef.current) {
            // Sync editor content to state without overwriting user input
            const newContent = editorRef.current.innerHTML;
            setFormData(prev => ({
                ...prev,
                question_text: newContent
            }));
        }
    };

    // Set initial content for editor - run ONLY when question data first loads or changes
    useEffect(() => {
        console.log('useEffect triggered - setting initial editor content', {
            hasRef: !!editorRef.current,
            questionDataId: questionData?.id
        });
        
        if (editorRef.current && questionData?.id) {
            // Only set innerHTML when loading/editing a question (not on every state change)
            const contentToSet = questionData.question_text || '';
            editorRef.current.innerHTML = contentToSet;
            setFormData(prev => ({
                ...prev,
                question_text: contentToSet
            }));
            console.log('Editor content initialized to:', contentToSet);
        } else if (editorRef.current && !questionData?.id) {
            // For new questions, clear editor on mount
            editorRef.current.innerHTML = '';
        }
    }, [questionData?.id]); // Only depend on question ID change, not formData.question_text

    const handleOptionChange = (index, value) => {
        const newOptions = [...formData.options];
        newOptions[index] = value;
        setFormData({
            ...formData,
            options: newOptions
        });
    };

    const addOption = () => {
        setFormData({
            ...formData,
            options: [...formData.options, '']
        });
    };

    const removeOption = (index) => {
        if (formData.options.length > 2) {
            const newOptions = formData.options.filter((_, i) => i !== index);
            const answerLetters = ['a', 'b', 'c', 'd'];
            // Use functional update to avoid state ordering issues
            setFormData(prev => ({
                ...prev,
                options: newOptions,
                correct_answer: prev.correct_answer === answerLetters[index] ? 'a' : prev.correct_answer
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        let currentQuestionText = formData.question_text;
        if (editorRef.current) {
            currentQuestionText = editorRef.current.innerHTML?.trim() || formData.question_text;
        }
        if (!currentQuestionText?.trim()) {
            newErrors.question_text = 'Pertanyaan diperlukan';
        }
        if (!formData.question_type) {
            newErrors.question_type = 'Tipe pertanyaan harus dipilih';
        }
        if (formData.question_type !== 'essay' && formData.question_type !== 'short_answer') {
            if (formData.options.length < 2) {
                newErrors.options = 'Minimal 2 opsi diperlukan';
            } else if (formData.options.some(opt => !opt?.trim())) {
                newErrors.options = 'Semua opsi harus ada teksnya';
            } else if (!formData.correct_answer) {
                newErrors.correct_answer = 'Pilih jawaban yang benar';
            }
        }
        if (!formData.difficulty) {
            newErrors.difficulty = 'Level kesulitan diperlukan';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAddOption = () => {
        if (formData.question_type === 'multiple_choice') {
            setFormData(prev => ({
                ...prev,
                options: [...prev.options, '']
            }));
        }
    };

    const removeTag = (index) => {
        // Removed - tags not used in current implementation
    };

    // Text formatting functions for contenteditable
    const applyFormatting = (tag) => {
        document.execCommand(tag, false, null);
        if (editorRef.current) {
            setFormData(prev => ({
                ...prev,
                question_text: editorRef.current.innerHTML
            }));
        }
    };

    const applyListFormatting = (type) => {
        const command = type === 'bullet' ? 'insertUnorderedList' : 'insertOrderedList';
        document.execCommand(command, false, null);
        if (editorRef.current) {
            setFormData(prev => ({
                ...prev,
                question_text: editorRef.current.innerHTML
            }));
        }
    };

    const handleImageUpload = (file) => {
        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!ALLOWED_TYPES.includes(file.type)) {
            showToast(`❌ Format gambar tidak didukung. Gunakan: JPG, PNG, atau WebP`, 'error');
            return;
        }
        const MAX_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
            showToast(`❌ Ukuran gambar ${sizeMB}MB terlalu besar. Maksimal 5MB`, 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            setFormData(prev => ({ ...prev, image_url: e.target.result, image_file: file }));
            showToast('✅ Gambar siap diunggah', 'success');
        };
        reader.onerror = () => {
            showToast('❌ Gagal membaca file gambar', 'error');
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);

            // Force sync contenteditable content to state BEFORE validation
            let editorContent = '';
            
            if (editorRef.current) {
                editorContent = editorRef.current.innerHTML ? editorRef.current.innerHTML.trim() : '';
                // Sanitize HTML content
                editorContent = sanitizeQuestionText(editorContent);
                console.log('Editor ref found, sanitized content:', {
                    innerHTML: editorRef.current.innerHTML,
                    sanitized: editorContent,
                    isEmpty: !editorContent
                });
            } else {
                console.error('Editor ref is NULL!');
            }

            // Also get from state as fallback
            if (!editorContent && formData.question_text) {
                editorContent = formData.question_text.trim();
                editorContent = sanitizeQuestionText(editorContent);
                console.log('Using formData.question_text as fallback:', editorContent);
            }

            // Validate dengan content
            const newErrors = {};
            if (!editorContent) {
                newErrors.question_text = 'Pertanyaan diperlukan';
            }
            if (!formData.question_type) {
                newErrors.question_type = 'Tipe pertanyaan harus dipilih';
            }
            if (!formData.difficulty) {
                newErrors.difficulty = 'Tingkat kesulitan harus dipilih';
            }
            
            if (Object.keys(newErrors).length > 0) {
                console.error('Validation failed:', newErrors);
                setErrors(newErrors);
                setLoading(false);
                return;
            }

            const isUpdate = !!questionData;
            const method = isUpdate ? 'POST' : 'POST'; // Always POST for FormData
            const url = isUpdate ? `/api/questions/${questionData.id}` : '/api/questions';

            // Use FormData dengan content yang fresh dan sanitized
            const formDataToSend = new FormData();
            
            // Add _method untuk Laravel PUT spoofing jika update
            if (isUpdate) {
                formDataToSend.append('_method', 'PUT');
            }
            
            formDataToSend.append('question_text', editorContent);
            formDataToSend.append('question_type', testType === 'pretest' || testType === 'posttest' ? testType : formData.question_type);
            formDataToSend.append('category', formData.category);
            formDataToSend.append('difficulty', formData.difficulty);
            formDataToSend.append('option_a', formData.options[0] || '');
            formDataToSend.append('option_b', formData.options[1] || '');
            formDataToSend.append('option_c', formData.options[2] || '');
            formDataToSend.append('option_d', formData.options[3] || '');
            formDataToSend.append('correct_answer', formData.correct_answer);
            formDataToSend.append('explanation', formData.explanation);
            formDataToSend.append('points', parseInt(formData.points));
            formDataToSend.append('module_id', formData.module_id || '');
            formDataToSend.append('quiz_id', formData.quiz_id || '');
            
            // Add image file jika ada
            if (formData.image_file) {
                formDataToSend.append('image_url', formData.image_file);
            }

            // Debug log - log FormData contents
            const entries = Array.from(formDataToSend.entries());
            console.log('Submitting question:', {
                isUpdate,
                url,
                question_text: editorContent,
                question_type: formData.question_type,
                difficulty: formData.difficulty,
                module_id: formData.module_id,
                quiz_id: formData.quiz_id,
                hasImage: !!formData.image_file,
                formDataEntries: entries
            });

            const response = await fetch(url, {
                method: 'POST', // Always POST, _method header handles PUT
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                body: formDataToSend
            });

            const responseData = await response.json();
            console.log('Response status:', response.status, 'Data:', responseData);

            if (response.ok) {
                showToast('Soal berhasil disimpan!', 'success');
                router.push(getBackUrl());
            } else {
                console.error('Validation errors:', responseData.errors);
                setErrors(responseData.errors || {});
                showToast('Gagal menyimpan soal', 'error');
            }
        } catch (error) {
            console.error('Error saving question:', error);
            setErrors({ general: 'Terjadi kesalahan saat menyimpan: ' + error.message });
            showToast('Terjadi kesalahan: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const typeConfig = types.find(t => t.id === formData.question_type) || types[0];

    // Debug logging
    if (typeof window !== 'undefined') {
        console.log('QuestionManagement loaded', { user, question, questionData });
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Loading...</h2>
                    <p className="text-slate-600">Initializing Question Management</p>
                    <div className="mt-4 text-sm text-slate-500">
                        <p>Auth: {auth ? 'available' : 'missing'}</p>
                        <p>User: {user ? 'logged in' : 'not found'}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <AdminLayout user={user}>
            <Head title={question ? 'Edit Soal' : 'Buat Soal Baru'} />
            <style>{editorStyles}</style>

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-lime-50/30">
                {/* Header with Gradient */}
                <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100/50">
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <Link
                                    href={getBackUrl()}
                                    className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    <ArrowLeft size={20} />
                                </Link>
                                <div>
                                    <h1 className="text-2xl font-black text-slate-900">
                                        {testType === 'pretest' ? '🔵 Pre-Test' : '🟠 Post-Test'} Editor
                                    </h1>
                                    <p className="text-xs text-slate-600 uppercase tracking-wider font-bold mt-0.5">
                                        {question ? '✏️ Edit Mode' : '✨ Create Mode'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="submit"
                                form="question-form"
                                disabled={loading}
                                className={`flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r ${themeColors.button} text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50`}
                            >
                                <Save size={18} />
                                {loading ? 'Menyimpan...' : 'Publikasikan'}
                            </button>
                        </div>

                        {/* Test Type Toggle */}
                        <div className="flex items-center gap-3 bg-gradient-to-r from-slate-50 to-slate-100 p-3 rounded-xl border border-slate-200">
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Pilih Jenis Tes:</span>
                            <div className="flex gap-2">
                                {['pretest', 'posttest'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setTestType(type)}
                                        disabled={question !== null}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                                            testType === type
                                                ? type === 'pretest'
                                                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-400 shadow-md'
                                                    : 'bg-orange-100 text-orange-700 border-2 border-orange-400 shadow-md'
                                                : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-slate-300'
                                        }`}
                                        title={question ? 'Tidak bisa mengubah tipe tes saat mengedit' : ''}
                                    >
                                        {type === 'pretest' ? '🔵 Pre-Test' : '🟠 Post-Test'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <form id="question-form" onSubmit={handleSubmit} className="max-w-7xl mx-auto px-6 py-8">
                    {/* Test Type Info Banner */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mb-8 p-4 rounded-xl border-2 bg-gradient-to-r ${themeColors.primaryLight} ${themeColors.primaryBorder}`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="text-2xl">{testType === 'pretest' ? '🔵' : '🟠'}</div>
                            <div>
                                <h2 className={`font-bold text-sm ${themeColors.primaryAccent} uppercase tracking-wider`}>
                                    {testType === 'pretest' 
                                        ? 'Membuat Soal Pre-Test' 
                                        : 'Membuat Soal Post-Test'}
                                </h2>
                                <p className="text-xs text-slate-600 mt-1">
                                    {testType === 'pretest' 
                                        ? 'Pre-test digunakan untuk mengukur pengetahuan awal peserta sebelum mengikuti pelatihan.'
                                        : 'Post-test digunakan untuk mengukur pemahaman dan pencapaian peserta setelah menyelesaikan pelatihan.'}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="grid grid-cols-1 xl:grid-cols-3 gap-8"
                    >
                        {/* Left Column - Immersive Editor */}
                        <div className="xl:col-span-2 space-y-6">
                            {/* Question Editor Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.1 }}
                                className="bg-white rounded-[32px] shadow-lg p-8 border border-slate-100"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <Type size={18} className={testType === 'pretest' ? 'text-blue-600' : 'text-orange-600'} />
                                    <label className="text-xs font-black text-slate-900 uppercase tracking-wider">
                                        Pertanyaan Utama
                                    </label>
                                </div>

                                {/* Toolbar */}
                                <div className="flex items-center gap-1 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex-wrap">
                                    <ToolbarButton 
                                        icon={Bold} 
                                        title="Bold (Ctrl+B)"
                                        onClick={() => applyFormatting('bold')}
                                    />
                                    <ToolbarButton 
                                        icon={Italic} 
                                        title="Italic (Ctrl+I)"
                                        onClick={() => applyFormatting('italic')}
                                    />
                                    <ToolbarButton 
                                        icon={Underline} 
                                        title="Underline (Ctrl+U)"
                                        onClick={() => applyFormatting('underline')}
                                    />
                                    <ToolbarButton 
                                        icon={Strikethrough} 
                                        title="Strikethrough"
                                        onClick={() => applyFormatting('strikeThrough')}
                                    />
                                    <div className="w-px h-6 bg-slate-200" />
                                    <ToolbarButton 
                                        icon={List} 
                                        title="Bullet List"
                                        onClick={() => applyListFormatting('bullet')}
                                    />
                                    <ToolbarButton 
                                        icon={ListOrdered} 
                                        title="Numbered List"
                                        onClick={() => applyListFormatting('numbered')}
                                    />
                                    <div className="w-px h-6 bg-slate-200" />
                                    <ToolbarButton 
                                        icon={Code} 
                                        title="Code"
                                        onClick={() => applyFormatting('formatBlock', '<pre>')}
                                    />
                                </div>

                                {/* NEW: Rich Text Editor with separate placeholder div */}
                                <div className="relative">
                                    {/* Placeholder - shows when editor is empty */}
                                    {!formData.question_text && (
                                        <div className="absolute top-4 left-4 text-slate-400 text-lg font-semibold pointer-events-none italic">
                                            Tulis pertanyaan yang hebat...
                                        </div>
                                    )}
                                    <div
                                        ref={editorRef}
                                        contentEditable
                                        onInput={handleEditorInput}
                                        suppressContentEditableWarning
                                        className={`w-full min-h-[180px] p-4 text-lg font-semibold text-slate-900 bg-slate-50 rounded-xl border-2 transition-all overflow-y-auto focus:outline-none ${
                                            testType === 'pretest' 
                                                ? 'border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200/50' 
                                                : 'border-orange-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200/50'
                                        }`}
                                        style={{
                                            lineHeight: '1.6',
                                        }}
                                    ></div>
                                </div>

                                {errors.question_text && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-3 p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm flex items-center gap-2"
                                    >
                                        <AlertCircle size={16} /> {errors.question_text}
                                    </motion.div>
                                )}

                                {/* Media Upload */}
                                <div 
                                    className="mt-4 p-4 border-2 border-dashed border-slate-200 rounded-xl hover:border-slate-300 transition-colors cursor-pointer text-center"
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        e.target.style.borderColor = '#94a3b8';
                                    }}
                                    onDragLeave={(e) => {
                                        e.target.style.borderColor = '#cbd5e1';
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const files = e.dataTransfer.files;
                                        if (files.length > 0) {
                                            handleImageUpload(files[0]);
                                        }
                                    }}
                                    onClick={() => document.getElementById('image-input').click()}
                                >
                                    <input 
                                        id="image-input"
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            if (e.target.files.length > 0) {
                                                handleImageUpload(e.target.files[0]);
                                            }
                                        }}
                                    />
                                    {formData.image_url ? (
                                        <div className="space-y-2">
                                            <img src={formData.image_url} alt="Preview" className="h-32 mx-auto rounded object-contain" />
                                            <p className="text-xs text-slate-600 font-semibold">Klik untuk ganti gambar</p>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFormData({ ...formData, image_url: null });
                                                }}
                                                className="text-xs text-red-500 hover:text-red-600 font-semibold"
                                            >
                                                Hapus gambar
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <ImageIcon size={24} className="text-slate-400 mx-auto mb-2" />
                                            <p className="text-xs text-slate-600 font-semibold">Drag gambar atau klik untuk upload</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Options Management */}
                            {(formData.question_type === 'multiple_choice' || formData.question_type === 'true_false') && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.15 }}
                                    className="bg-white rounded-[32px] shadow-lg p-8 border border-slate-100"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2">
                                            <Check size={18} className={themeColors.primaryAccent} />
                                            <label className="text-xs font-black text-slate-900 uppercase tracking-wider">
                                                Pilihan Jawaban
                                            </label>
                                        </div>
                                        {formData.question_type === 'multiple_choice' && (
                                            <button
                                                type="button"
                                                onClick={handleAddOption}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold ${themeColors.primaryAccent} hover:bg-slate-100 rounded-lg transition-colors uppercase tracking-wider`}
                                            >
                                                <Plus size={14} /> Tambah Opsi
                                            </button>
                                        )}
                                    </div>

                                    <AnimatePresence>
                                        <div className="space-y-3">
                                            {formData.options.map((option, index) => {
                                                const optionLetter = String.fromCharCode(97 + index); // 'a', 'b', 'c', 'd'
                                                return (
                                                <motion.div
                                                    key={`option-${optionLetter}`}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    transition={{ duration: 0.2 }}
                                                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer group ${
                                                        ['a', 'b', 'c', 'd'][index] === formData.correct_answer
                                                            ? testType === 'pretest'
                                                                ? 'border-blue-400 bg-blue-50/50'
                                                                : 'border-orange-400 bg-orange-50/50'
                                                            : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                                                    }`}
                                                >
                                                    {/* Drag Handle */}
                                                    <GripVertical size={16} className="text-slate-400 flex-shrink-0" />

                                                    {/* Radio Indicator */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({
                                                            ...prev,
                                                            correct_answer: ['a', 'b', 'c', 'd'][index]
                                                        }))}
                                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                                            ['a', 'b', 'c', 'd'][index] === formData.correct_answer
                                                                ? testType === 'pretest'
                                                                    ? 'border-blue-400 bg-blue-400'
                                                                    : 'border-orange-400 bg-orange-400'
                                                                : 'border-slate-300 hover:border-slate-400'
                                                        }`}
                                                    >
                                                        {['a', 'b', 'c', 'd'][index] === formData.correct_answer && (
                                                            <Check size={12} className="text-white" />
                                                        )}
                                                    </button>

                                                    {/* Option Input */}
                                                    <input
                                                        type="text"
                                                        value={option}
                                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                                        placeholder={`Opsi ${String.fromCharCode(65 + index)}`}
                                                        className="flex-1 px-3 py-2 bg-white rounded-lg border border-slate-200 text-slate-900 font-semibold focus:border-slate-400 focus:ring-2 focus:ring-slate-200/50 outline-none transition-all"
                                                    />

                                                    {/* Delete Button */}
                                                    {formData.options.length > 2 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeOption(index)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </motion.div>
                                                );
                                            })}
                                        </div>
                                    </AnimatePresence>

                                    {errors.options && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-3 p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm flex items-center gap-2"
                                        >
                                            <AlertCircle size={16} /> {errors.options}
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}

                            {/* Explanation */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.2 }}
                                className="bg-white rounded-[32px] shadow-lg p-8 border border-slate-100"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <HelpCircle size={18} className={testType === 'pretest' ? 'text-blue-600' : 'text-orange-600'} />
                                    <label className="text-xs font-black text-slate-900 uppercase tracking-wider">
                                        Penjelasan & Jawaban
                                    </label>
                                </div>

                                <textarea
                                    name="explanation"
                                    value={formData.explanation}
                                    onChange={handleInputChange}
                                    placeholder="Jelaskan mengapa jawaban ini benar..."
                                    className={`w-full p-4 text-slate-900 bg-slate-50 rounded-xl border-2 resize-none outline-none transition-all ${
                                        testType === 'pretest'
                                            ? 'border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200/50'
                                            : 'border-orange-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200/50'
                                    }`}
                                    rows="4"
                                />
                            </motion.div>
                        </div>

                        {/* Right Column - Settings Sidebar */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            className="space-y-6"
                        >
                            {/* Test Type Context Card */}
                            <div className={`bg-gradient-to-br ${themeColors.primaryLight} rounded-[32px] shadow-lg p-6 border-2 ${themeColors.primaryBorder} sticky top-32`}>
                                <h3 className={`text-xs font-black ${themeColors.primaryAccent} uppercase tracking-wider mb-3`}>
                                    {testType === 'pretest' ? '🔵 Informasi Pre-Test' : '🟠 Informasi Post-Test'}
                                </h3>
                                <p className="text-xs leading-relaxed text-slate-700 mb-3">
                                    {testType === 'pretest' 
                                        ? 'Soal ini akan ditampilkan kepada peserta sebelum mereka memulai pelatihan untuk mengevaluasi pengetahuan awal mereka.'
                                        : 'Soal ini akan ditampilkan kepada peserta setelah menyelesaikan pelatihan untuk mengukur pemahaman dan kompetensi mereka.'}
                                </p>
                                <div className={`flex items-center gap-2 p-3 rounded-lg ${themeColors.badge}`}>
                                    <span className="text-lg">{testType === 'pretest' ? '📊' : '🎯'}</span>
                                    <span className="text-xs font-bold uppercase tracking-wider">
                                        {testType === 'pretest' ? 'Penilaian Awal' : 'Penilaian Akhir'}
                                    </span>
                                </div>
                            </div>

                            {/* Configuration Card */}
                            <div className="bg-white rounded-[32px] shadow-lg p-6 border border-slate-100 sticky top-80">
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4">
                                    ⚙️ Konfigurasi Soal
                                </h3>

                                <div className="space-y-4">
                                    {/* Type Select */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                            Format Soal
                                        </label>
                                        <select
                                            name="question_type"
                                            value={formData.question_type}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:border-slate-400 focus:ring-2 focus:ring-slate-200/50 outline-none transition-all"
                                        >
                                            {types.map(t => (
                                                <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Difficulty Buttons */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                            Tingkat Kesulitan
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {difficulties.map(diff => (
                                                <button
                                                    key={diff.id}
                                                    onClick={() => setFormData(prev => ({
                                                        ...prev,
                                                        difficulty: diff.id
                                                    }))}
                                                    className={`flex-1 py-3 px-2 rounded-xl border-2 text-xs font-bold uppercase tracking-wider transition-all ${
                                                        formData.difficulty === diff.id 
                                                        ? diff.id === 'easy'
                                                            ? 'bg-emerald-100 text-emerald-700 border-emerald-400 shadow-sm scale-105' 
                                                            : diff.id === 'medium'
                                                            ? 'bg-amber-100 text-amber-700 border-amber-400 shadow-sm scale-105'
                                                            : 'bg-red-100 text-red-700 border-red-400 shadow-sm scale-105'
                                                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                                                    }`}
                                                >
                                                    {diff.id === 'easy' ? '🟢 Easy' : diff.id === 'medium' ? '🟡 Medium' : '🔴 Hard'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Category Select */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                            Kategori
                                        </label>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:border-slate-400 focus:ring-2 focus:ring-slate-200/50 outline-none transition-all"
                                        >
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Points Slider */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                Poin
                                            </label>
                                            <span className={`text-lg font-black ${themeColors.primaryAccent}`}>
                                                {formData.points}
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            name="points"
                                            value={formData.points}
                                            onChange={handleInputChange}
                                            min="1"
                                            max="100"
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                            style={{
                                                accentColor: testType === 'pretest' ? '#3b82f6' : '#f97316'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Error Alert */}
                            {errors.general && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3"
                                >
                                    <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                                    <span className="text-red-700 font-semibold text-sm">{errors.general}</span>
                                </motion.div>
                            )}

                            {/* Back Button */}
                            <Link
                                href={getBackUrl()}
                                className="block w-full px-6 py-3 border-2 border-slate-200 text-slate-900 font-bold rounded-xl hover:bg-slate-50 transition-colors text-center uppercase tracking-wider text-xs"
                            >
                                ← Kembali
                            </Link>
                        </motion.div>
                    </motion.div>
                </form>
            </div>
        </AdminLayout>
    );
}
