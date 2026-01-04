import React, { useState, useEffect } from 'react';
import { Head, usePage, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Save, X, Plus, Trash2, Copy, Eye, ArrowLeft, 
    AlertCircle, Check, ChevronDown, Sparkles, Image as ImageIcon,
    Bold, Italic, List, Code, Type, AlignLeft, Hash,
    MoreHorizontal, HelpCircle, GripVertical, Underline,
    ListOrdered, AlignCenter, AlignRight, Strikethrough
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function QuestionManagement({ question = null, module_id = null, question_type = null, returnUrl = null }) {
    const page = usePage();
    const auth = page?.props?.auth || {};
    const user = auth?.user;
    
    // Default return URL
    const getBackUrl = () => {
        if (returnUrl) return returnUrl;
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
        id: question.id || null,
    } : null;
    
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
    const editorRef = React.useRef(null);
    const initialFormData = {
        question_text: questionData?.question_text || '',
        question_type: questionData?.question_type || question_type || 'multiple_choice',
        category: questionData?.category || 'general',
        difficulty: questionData?.difficulty || 'medium',
        options: questionData?.options || ['', '', '', ''],
        correct_answer: questionData?.correct_answer || 'a',
        points: questionData?.points || 10,
        explanation: questionData?.explanation || '',
        image_url: questionData?.image_url || null,
        image_file: null,
        tags: [],
        tagInput: '',
        module_id: questionData?.module_id || module_id || null,
    };
    
    console.log('Initial formData:', {
        question_type: initialFormData.question_type,
        question_type_type: typeof initialFormData.question_type,
        difficulty: initialFormData.difficulty
    });
    
    const [formData, setFormData] = useState(initialFormData);

    const [errors, setErrors] = useState({});

    const categories = [
        { id: 'general', name: 'Umum' },
        { id: 'technical', name: 'Teknis' },
        { id: 'behavioral', name: 'Perilaku' },
        { id: 'scenario', name: 'Skenario' },
        { id: 'case-study', name: 'Studi Kasus' }
    ];

    const types = [
        { id: 'multiple_choice', name: 'Pilihan Ganda' },
        { id: 'true_false', name: 'Benar/Salah' },
        { id: 'short_answer', name: 'Jawaban Singkat' },
        { id: 'essay', name: 'Essay' },
        { id: 'pretest', name: 'Pre-Test' },
        { id: 'posttest', name: 'Post-Test' }
    ];

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
            setFormData(prev => ({
                ...prev,
                question_text: editorRef.current.innerHTML
            }));
        }
    };

    // Set initial content for editor - run when component mounts or questionData changes
    useEffect(() => {
        console.log('useEffect triggered - setting editor content', {
            hasRef: !!editorRef.current,
            questionText: formData.question_text,
            questionDataId: questionData?.id
        });
        
        if (editorRef.current) {
            // Always set innerHTML when formData.question_text changes or component mounts
            const contentToSet = formData.question_text || '';
            editorRef.current.innerHTML = contentToSet;
            console.log('Editor content set to:', contentToSet);
        }
    }, [formData.question_text]);

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
            setFormData({
                ...formData,
                options: newOptions
            });
            if (formData.correct_answer === answerLetters[index]) {
                setFormData({
                    ...formData,
                    correct_answer: 'a',
                    options: newOptions
                });
            }
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.question_text.trim()) {
            newErrors.question_text = 'Pertanyaan diperlukan';
        }

        if (formData.question_type !== 'essay' && formData.question_type !== 'short_answer') {
            if (formData.options.some(opt => !opt.trim())) {
                newErrors.options = 'Semua opsi harus diisi';
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

    const handleRemoveOption = (index) => {
        setFormData(prev => ({
            ...prev,
            options: prev.options.filter((_, i) => i !== index)
        }));
    };

    const handleAddTag = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const trimmed = formData.tagInput.trim();
            if (trimmed && !formData.tags.includes(trimmed)) {
                setFormData(prev => ({
                    ...prev,
                    tags: [...prev.tags, trimmed],
                    tagInput: ''
                }));
            }
        }
    };

    const removeTag = (index) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter((_, i) => i !== index)
        }));
    };

    const handleAIRephrase = () => {
        if (editorRef.current) {
            const content = editorRef.current.innerHTML;
            editorRef.current.innerHTML = content.startsWith('✨') ? content : '✨ ' + content;
            setFormData(prev => ({
                ...prev,
                question_text: editorRef.current.innerHTML
            }));
        }
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
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Harap upload file gambar');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Ukuran file maksimal 5MB');
            return;
        }

        // Create preview URL
        const reader = new FileReader();
        reader.onload = (e) => {
            setFormData(prev => ({
                ...prev,
                image_url: e.target.result,
                image_file: file
            }));
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
                console.log('Editor ref found, content:', {
                    innerHTML: editorRef.current.innerHTML,
                    textContent: editorRef.current.textContent,
                    trimmed: editorContent,
                    isEmpty: !editorContent
                });
            } else {
                console.error('Editor ref is NULL!');
            }

            // Also get from state as fallback
            if (!editorContent && formData.question_text) {
                editorContent = formData.question_text.trim();
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

            // Use FormData dengan content yang fresh
            const formDataToSend = new FormData();
            
            // Add _method untuk Laravel PUT spoofing jika update
            if (isUpdate) {
                formDataToSend.append('_method', 'PUT');
            }
            
            formDataToSend.append('question_text', editorContent);
            formDataToSend.append('question_type', formData.question_type);
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
                question_type_type: typeof formData.question_type,
                difficulty: formData.difficulty,
                difficulty_type: typeof formData.difficulty,
                hasImage: !!formData.image_file,
                formDataEntries: entries
            });
            
            // Log each field specifically
            console.log('FormData fields:');
            entries.forEach(([key, value]) => {
                console.log(`  ${key}: "${value}" (${typeof value})`);
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
                router.push('/admin/questions');
            } else {
                console.error('Validation errors:', responseData.errors);
                setErrors(responseData.errors || {});
            }
        } catch (error) {
            console.error('Error saving question:', error);
            setErrors({ general: 'Terjadi kesalahan saat menyimpan: ' + error.message });
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
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Link
                                    href={getBackUrl()}
                                    className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    <ArrowLeft size={20} />
                                </Link>
                                <div>
                                    <h1 className="text-2xl font-black text-slate-900">
                                        Wondr Editor Studio
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
                                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 text-slate-900 font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                            >
                                <Save size={18} />
                                {loading ? 'Menyimpan...' : 'Publikasikan'}
                            </button>
                        </div>
                    </div>
                </div>

                <form id="question-form" onSubmit={handleSubmit} className="max-w-7xl mx-auto px-6 py-8">
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
                                    <Type size={18} className="text-slate-600" />
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
                                    <div className="flex-1" />
                                    <button
                                        type="button"
                                        onClick={handleAIRephrase}
                                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors uppercase tracking-wider"
                                    >
                                        <Sparkles size={14} /> AI Rephrase
                                    </button>
                                </div>

                                {/* Rich Text Editor */}
                                <div
                                    ref={editorRef}
                                    contentEditable
                                    onInput={handleEditorInput}
                                    onBlur={handleEditorInput}
                                    suppressContentEditableWarning
                                    placeholder="Tulis pertanyaan yang hebat..."
                                    className="w-full min-h-[180px] p-4 text-lg font-semibold text-slate-900 bg-slate-50 rounded-xl border border-slate-200 focus:border-lime-400 focus:ring-2 focus:ring-lime-200/50 outline-none transition-all overflow-y-auto"
                                    style={{
                                        lineHeight: '1.6',
                                    }}
                                ></div>

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
                                            <Check size={18} className="text-emerald-600" />
                                            <label className="text-xs font-black text-slate-900 uppercase tracking-wider">
                                                Visual Option Selection
                                            </label>
                                        </div>
                                        {formData.question_type === 'multiple_choice' && (
                                            <button
                                                type="button"
                                                onClick={handleAddOption}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-lime-600 hover:bg-lime-50 rounded-lg transition-colors uppercase tracking-wider"
                                            >
                                                <Plus size={14} /> Tambah Opsi
                                            </button>
                                        )}
                                    </div>

                                    <AnimatePresence>
                                        <div className="space-y-3">
                                            {formData.options.map((option, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    transition={{ duration: 0.2 }}
                                                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer group ${
                                                        ['a', 'b', 'c', 'd'][index] === formData.correct_answer
                                                            ? 'border-emerald-400 bg-emerald-50/50'
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
                                                                ? 'border-emerald-400 bg-emerald-400'
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
                                                        className="flex-1 px-3 py-2 bg-white rounded-lg border border-slate-200 text-slate-900 font-semibold focus:border-lime-400 focus:ring-2 focus:ring-lime-200/50 outline-none transition-all"
                                                    />

                                                    {/* Delete Button */}
                                                    {formData.options.length > 2 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveOption(index)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </motion.div>
                                            ))}
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
                                    <HelpCircle size={18} className="text-indigo-600" />
                                    <label className="text-xs font-black text-slate-900 uppercase tracking-wider">
                                        Penjelasan & Jawaban
                                    </label>
                                </div>

                                <textarea
                                    name="explanation"
                                    value={formData.explanation}
                                    onChange={handleInputChange}
                                    placeholder="Jelaskan mengapa jawaban ini benar..."
                                    className="w-full p-4 text-slate-900 bg-slate-50 rounded-xl border border-slate-200 focus:border-lime-400 focus:ring-2 focus:ring-lime-200/50 resize-none outline-none transition-all"
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
                            {/* Configuration Card */}
                            <div className="bg-white rounded-[32px] shadow-lg p-6 border border-slate-100 sticky top-32">
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4">
                                    ⚙️ Konfigurasi
                                </h3>

                                <div className="space-y-4">
                                    {/* Type Select */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                            Tipe Soal
                                        </label>
                                        <select
                                            name="question_type"
                                            value={formData.question_type}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:border-lime-400 focus:ring-2 focus:ring-lime-200/50 outline-none transition-all"
                                        >
                                            {types.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
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
                                                <DifficultyCard
                                                    key={diff.id}
                                                    level={diff.id === 'easy' ? 'easy' : diff.id === 'medium' ? 'medium' : 'hard'}
                                                    active={formData.difficulty === diff.id}
                                                    onClick={() => setFormData(prev => ({
                                                        ...prev,
                                                        difficulty: diff.id
                                                    }))}
                                                />
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
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:border-lime-400 focus:ring-2 focus:ring-lime-200/50 outline-none transition-all"
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
                                                Poin XP
                                            </label>
                                            <span className="text-lg font-black text-lime-500">
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
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-lime-400"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Tags Card */}
                            <div className="bg-white rounded-[32px] shadow-lg p-6 border border-slate-100">
                                <div className="flex items-center gap-2 mb-4">
                                    <Hash size={18} className="text-indigo-600" />
                                    <label className="text-xs font-black text-slate-900 uppercase tracking-wider">
                                        Smart Tags
                                    </label>
                                </div>

                                {/* Tag Chips */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <AnimatePresence>
                                        {formData.tags.map((tag, index) => (
                                            <TagChip
                                                key={tag}
                                                label={tag}
                                                onRemove={() => removeTag(index)}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>

                                {/* Tag Input */}
                                <input
                                    type="text"
                                    value={formData.tagInput}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        tagInput: e.target.value
                                    }))}
                                    onKeyDown={handleAddTag}
                                    placeholder="Ketik & tekan Enter..."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:border-lime-400 focus:ring-2 focus:ring-lime-200/50 outline-none transition-all text-sm"
                                />
                            </div>

                            {/* Statistics Card (Edit Mode) */}
                            {question && (
                                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-[32px] shadow-lg p-6 border border-indigo-200">
                                    <h3 className="text-xs font-black text-indigo-900 uppercase tracking-wider mb-4">
                                        📊 Statistik Soal
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="bg-white/60 backdrop-blur rounded-xl p-3">
                                            <p className="text-xs text-indigo-700 font-bold uppercase tracking-wider">Digunakan</p>
                                            <p className="text-2xl font-black text-indigo-900">{question.used_count || 0}x</p>
                                        </div>
                                        <div className="bg-white/60 backdrop-blur rounded-xl p-3">
                                            <p className="text-xs text-indigo-700 font-bold uppercase tracking-wider">Dijawab Benar</p>
                                            <p className="text-2xl font-black text-emerald-600">{question.correct_count || 0}x</p>
                                        </div>
                                        <div className="bg-white/60 backdrop-blur rounded-xl p-3">
                                            <p className="text-xs text-indigo-700 font-bold uppercase tracking-wider">Success Rate</p>
                                            <p className="text-2xl font-black text-lime-500">
                                                {question.used_count > 0
                                                    ? Math.round((question.correct_count / question.used_count) * 100)
                                                    : 0}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

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
