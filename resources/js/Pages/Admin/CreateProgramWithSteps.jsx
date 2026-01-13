import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    ArrowLeft, ArrowRight, Check, BookOpen, FileText, HelpCircle, 
    AlertCircle, Plus, Trash2, Sparkles, Image as ImageIcon, Save, 
    Zap, GripVertical, Settings, Video, File, Link as LinkIcon, Trophy, Upload,
    X, BarChart3, Eye, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// --- REUSABLE COMPONENTS ---

const StepIndicator = ({ currentStep, steps }) => (
    <div className="flex justify-between items-center mb-10 px-4">
        {steps.map((step, index) => {
            const isActive = step.number === currentStep;
            const isCompleted = step.number < currentStep;
            
            return (
                <div key={step.number} className="flex-1 flex items-center relative">
                    <div className="flex flex-col items-center relative z-10 w-full">
                        <motion.div 
                            initial={false}
                            animate={{ 
                                scale: isActive ? 1.1 : 1,
                                backgroundColor: isActive ? '#D6FF59' : isCompleted ? '#1e293b' : '#f1f5f9',
                                color: isActive || isCompleted ? '#000' : '#94a3b8'
                            }}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm transition-colors border-2 ${isActive ? 'border-black' : 'border-transparent'}`}
                        >
                            {isCompleted ? <Check size={18} className="text-white" /> : step.number}
                        </motion.div>
                        <p className={`text-xs font-bold mt-2 uppercase tracking-wider ${isActive ? 'text-black' : 'text-slate-400'}`}>
                            {step.title}
                        </p>
                    </div>
                    {/* Progress Line */}
                    {index < steps.length - 1 && (
                        <div className="absolute top-5 left-1/2 w-full h-[2px] bg-slate-100 -z-0">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: isCompleted ? '100%' : '0%' }}
                                className="h-full bg-slate-900"
                            />
                        </div>
                    )}
                </div>
            );
        })}
    </div>
);

const InputField = ({ label, value, onChange, placeholder, type = "text", icon: Icon }) => (
    <div className="group">
        <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2 group-focus-within:text-indigo-600 transition-colors">
            {label}
        </label>
        <div className="relative">
            {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />}
            <input 
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full ${Icon ? 'pl-12' : 'pl-4'} pr-4 py-3 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-[#D6FF59] focus:border-transparent transition-all shadow-sm`}
            />
        </div>
    </div>
);

const AIButton = ({ label, onClick }) => (
    <button 
        type="button"
        onClick={onClick}
        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
    >
        <Sparkles size={14} /> {label}
    </button>
);

export default function CreateProgramWithSteps({ auth }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [createdProgramId, setCreatedProgramId] = useState(null);
    const [previewFile, setPreviewFile] = useState(null);

    // Form States
    const [programData, setProgramData] = useState({
        title: '',
        description: '',
        duration_minutes: '',
        passing_grade: 70,
        category: '',
        is_active: true,
        allow_retake: false,
        max_retake_attempts: '',
        expiry_date: '',
        prerequisite_module_id: '',
        instructor_id: '',
        certificate_template: '',
        xp: 100,
        coverImage: null,
        // In minutes. Empty = no time limit
        pretest_duration_minutes: '',
        posttest_duration_minutes: ''
    });

    const [materials, setMaterials] = useState([
        { 
            id: 1, 
            type: 'document', 
            title: '', 
            description: '', 
            file: null,
            fileName: null,
            fileSize: 0,
            url: ''
        }
    ]);

    const [preTestQuestions, setPreTestQuestions] = useState([
        { question_text: '', image_url: null, image_file: null, option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'a', explanation: '' }
    ]);

    const [postTestQuestions, setPostTestQuestions] = useState([
        { question_text: '', image_url: null, image_file: null, option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'a', explanation: '' }
    ]);

    const coverImageInputRef = React.useRef(null);
    const categories = ['Compliance', 'Technical', 'Leadership', 'Soft Skills', 'Product', 'Security'];

    const steps = [
        { number: 1, title: 'Identity' },
        { number: 2, title: 'Curriculum' },
        { number: 3, title: 'Assessment' },
        { number: 4, title: 'Review' }
    ];

    // Auto-save effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsAutoSaving(true);
            setTimeout(() => setIsAutoSaving(false), 1000);
        }, 3000);
        return () => clearTimeout(timer);
    }, [programData, materials]);

    // Validation
    const validateStep = () => {
        setError('');

        if (currentStep === 1) {
            if (!programData.title.trim()) {
                setError('Nama program harus diisi');
                return false;
            }
            if (!programData.description.trim()) {
                setError('Deskripsi harus diisi');
                return false;
            }
            if (!programData.duration_minutes) {
                setError('Durasi harus diisi');
                return false;
            }
            if (!programData.category) {
                setError('Kategori harus dipilih');
                return false;
            }
        }

        if (currentStep === 3) {
            // Validasi hanya jika ada question yang sudah mulai diisi
            for (let i = 0; i < preTestQuestions.length; i++) {
                const q = preTestQuestions[i];
                // Skip validasi jika semua field kosong (belum diisi sama sekali)
                const hasAnyContent = q.question_text.trim() || q.option_a.trim() || q.option_b.trim() || q.option_c.trim() || q.option_d.trim();
                if (!hasAnyContent) continue;
                
                // Jika sudah mulai diisi, semua harus lengkap
                if (!q.question_text.trim()) {
                    setError(`Pre-Test Soal ${i + 1}: Pertanyaan harus diisi`);
                    return false;
                }
                if (!q.option_a.trim() || !q.option_b.trim() || !q.option_c.trim() || !q.option_d.trim()) {
                    setError(`Pre-Test Soal ${i + 1}: Semua opsi harus diisi`);
                    return false;
                }
            }

            // Validate duration if provided
            if (programData.pretest_duration_minutes) {
                const val = parseInt(programData.pretest_duration_minutes, 10);
                if (isNaN(val) || val < 1) {
                    setError('Durasi Pre-Test harus berupa angka minimal 1 menit');
                    return false;
                }
            }
        }

        if (currentStep === 4) {
            // Validasi hanya jika ada question yang sudah mulai diisi
            for (let i = 0; i < postTestQuestions.length; i++) {
                const q = postTestQuestions[i];
                // Skip validasi jika semua field kosong (belum diisi sama sekali)
                const hasAnyContent = q.question_text.trim() || q.option_a.trim() || q.option_b.trim() || q.option_c.trim() || q.option_d.trim();
                if (!hasAnyContent) continue;
                
                // Jika sudah mulai diisi, semua harus lengkap
                if (!q.question_text.trim()) {
                    setError(`Post-Test Soal ${i + 1}: Pertanyaan harus diisi`);
                    return false;
                }
                if (!q.option_a.trim() || !q.option_b.trim() || !q.option_c.trim() || !q.option_d.trim()) {
                    setError(`Post-Test Soal ${i + 1}: Semua opsi harus diisi`);
                    return false;
                }
            }

            // Validate duration if provided
            if (programData.posttest_duration_minutes) {
                const val = parseInt(programData.posttest_duration_minutes, 10);
                if (isNaN(val) || val < 1) {
                    setError('Durasi Post-Test harus berupa angka minimal 1 menit');
                    return false;
                }
            }
        }

        return true;
    };

    const handleNext = () => {
        if (validateStep()) {
            if (currentStep < 4) {
                setCurrentStep(currentStep + 1);
                window.scrollTo(0, 0);
            }
        }
    };

    // Handle cover image upload
    const handleCoverImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            setError('Ukuran file tidak boleh lebih dari 5MB');
            return;
        }

        // Validate file type
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            setError('Tipe file hanya boleh PNG atau JPG');
            return;
        }

        // Read file and set as data URL
        const reader = new FileReader();
        reader.onload = (event) => {
            setProgramData({
                ...programData,
                coverImage: event.target?.result
            });
            setError('');
        };
        reader.onerror = () => {
            setError('Gagal membaca file');
        };
        reader.readAsDataURL(file);
    };

    const handlePrev = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            window.scrollTo(0, 0);
        }
    };

    // Handle material file upload
    const handleMaterialFileChange = (idx, e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
            setError('Ukuran file terlalu besar (max 50MB)');
            return;
        }

        // Store file langsung ke state dengan informasi lengkap
        const newMaterials = [...materials];
        newMaterials[idx].file = file;
        newMaterials[idx].fileName = file.name;
        newMaterials[idx].fileSize = file.size;
        
        // Auto-fill title jika kosong dengan nama file
        if (!newMaterials[idx].title.trim()) {
            // Remove extension dan clean up filename untuk jadi title
            const titleFromFile = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
            newMaterials[idx].title = titleFromFile;
        }
        
        setMaterials(newMaterials);
        setError('');
        console.log(`Material ${idx} file uploaded:`, { 
            name: file.name, 
            size: file.size,
            type: file.type 
        });
    };

    const handleSubmit = async () => {
        if (!validateStep()) return;

        setLoading(true);
        try {
            // Create FormData untuk handle file uploads
            const formData = new FormData();

            // Add program data
            formData.append('title', programData.title);
            formData.append('description', programData.description);
            formData.append('duration_minutes', programData.duration_minutes);
            formData.append('passing_grade', programData.passing_grade);
            formData.append('category', programData.category);
            formData.append('is_active', programData.is_active ? 1 : 0);
            formData.append('allow_retake', programData.allow_retake ? 1 : 0);
            if (programData.max_retake_attempts) {
                formData.append('max_retake_attempts', programData.max_retake_attempts);
            }
            if (programData.expiry_date) {
                formData.append('expiry_date', programData.expiry_date);
            }
            if (programData.prerequisite_module_id) {
                formData.append('prerequisite_module_id', programData.prerequisite_module_id);
            }
            if (programData.instructor_id) {
                formData.append('instructor_id', programData.instructor_id);
            }
            if (programData.certificate_template) {
                formData.append('certificate_template', programData.certificate_template);
            }
            formData.append('xp', programData.xp);

            // Add pre/post test durations jika ada (send both legacy keys and _minutes for compatibility)
            if (programData.pretest_duration_minutes) {
                const val = parseInt(programData.pretest_duration_minutes, 10);
                if (!isNaN(val)) {
                    formData.append('pretest_duration_minutes', val);
                    formData.append('pretest_duration', val);
                }
            }
            if (programData.posttest_duration_minutes) {
                const val = parseInt(programData.posttest_duration_minutes, 10);
                if (!isNaN(val)) {
                    formData.append('posttest_duration_minutes', val);
                    formData.append('posttest_duration', val);
                }
            }

            // Add cover image jika ada (base64 string bisa langsung append)
            if (programData.coverImage && programData.coverImage.startsWith('data:')) {
                // Convert base64 to blob
                const response = await fetch(programData.coverImage);
                const blob = await response.blob();
                formData.append('cover_image', blob, 'cover.png');
            }

            // Add materials dengan file uploads - IMPROVED LOGIC
            // Filter: harus punya title DAN (file ATAU url)
            const materialsToUpload = materials.filter(m => {
                const hasTitle = m.title && m.title.trim();
                const hasFile = m.file && typeof m.file === 'object' && m.file.name;
                const hasUrl = m.url && m.url.trim();
                
                console.log(`Material check:`, {
                    title: m.title,
                    hasTitle,
                    hasFile,
                    hasUrl,
                    willUpload: hasTitle && (hasFile || hasUrl)
                });
                
                return hasTitle && (hasFile || hasUrl);
            });
            
            console.log(`Uploading ${materialsToUpload.length} materials out of ${materials.length} total`);
            
            materialsToUpload.forEach((material, idx) => {
                formData.append(`materials[${idx}][type]`, material.type);
                formData.append(`materials[${idx}][title]`, material.title.trim());
                
                if (material.description && material.description.trim()) {
                    formData.append(`materials[${idx}][description]`, material.description.trim());
                }
                
                // Kirim file jika ada (prioritas file over URL)
                if (material.file && typeof material.file === 'object' && material.file.name) {
                    console.log(`Appending file for material ${idx}:`, material.file.name);
                    formData.append(`materials[${idx}][file]`, material.file, material.file.name);
                }
                // Kirim URL jika ada dan tidak ada file
                else if (material.url && material.url.trim()) {
                    console.log(`Appending URL for material ${idx}:`, material.url);
                    formData.append(`materials[${idx}][url]`, material.url.trim());
                }
            });

            // Add pre-test questions (filter yang sudah diisi)
            const validPreTestQuestions = preTestQuestions.filter(q => 
                q.question_text.trim() && 
                q.option_a.trim() && 
                q.option_b.trim() && 
                q.option_c.trim() && 
                q.option_d.trim()
            );
            validPreTestQuestions.forEach((q, idx) => {
                formData.append(`pre_test_questions[${idx}][question_text]`, q.question_text);
                formData.append(`pre_test_questions[${idx}][option_a]`, q.option_a);
                formData.append(`pre_test_questions[${idx}][option_b]`, q.option_b);
                formData.append(`pre_test_questions[${idx}][option_c]`, q.option_c);
                formData.append(`pre_test_questions[${idx}][option_d]`, q.option_d);
                formData.append(`pre_test_questions[${idx}][correct_answer]`, q.correct_answer);
                // Add explanation jika ada
                if (q.explanation && q.explanation.trim()) {
                    formData.append(`pre_test_questions[${idx}][explanation]`, q.explanation.trim());
                }
                // Add image jika ada
                if (q.image_file) {
                    formData.append(`pre_test_questions[${idx}][image_url]`, q.image_file);
                }
            });

            // Add post-test questions (filter yang sudah diisi)
            const validPostTestQuestions = postTestQuestions.filter(q => 
                q.question_text.trim() && 
                q.option_a.trim() && 
                q.option_b.trim() && 
                q.option_c.trim() && 
                q.option_d.trim()
            );
            validPostTestQuestions.forEach((q, idx) => {
                formData.append(`post_test_questions[${idx}][question_text]`, q.question_text);
                formData.append(`post_test_questions[${idx}][option_a]`, q.option_a);
                formData.append(`post_test_questions[${idx}][option_b]`, q.option_b);
                formData.append(`post_test_questions[${idx}][option_c]`, q.option_c);
                formData.append(`post_test_questions[${idx}][option_d]`, q.option_d);
                formData.append(`post_test_questions[${idx}][correct_answer]`, q.correct_answer);
                // Add explanation jika ada
                if (q.explanation && q.explanation.trim()) {
                    formData.append(`post_test_questions[${idx}][explanation]`, q.explanation.trim());
                }
                // Add image jika ada
                if (q.image_file) {
                    formData.append(`post_test_questions[${idx}][image_url]`, q.image_file);
                }
            });

            // Send request with FormData
            const response = await axios.post('/api/admin/training-programs', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                // Backend returns module in `data` and also `program` (backwards compat). Use whichever is present.
                const programId = response.data.program?.id || response.data.data?.id || null;
                setCreatedProgramId(programId);
                setSuccess('✅ Program & Materi berhasil dibuat! Pilih aksi di bawah untuk melanjutkan.');
                console.info('Created program id:', programId);
            }
        } catch (err) {
            console.error('Submit error:', err);
            setError(err.response?.data?.message || 'Error membuat program: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Question handlers
    const handlePreTestQuestionChange = (index, field, value) => {
        const newQuestions = [...preTestQuestions];
        newQuestions[index][field] = value;
        setPreTestQuestions(newQuestions);
    };

    const handlePostTestQuestionChange = (index, field, value) => {
        const newQuestions = [...postTestQuestions];
        newQuestions[index][field] = value;
        setPostTestQuestions(newQuestions);
    };

    const handlePreTestImageUpload = (index, file) => {
        if (!file.type.startsWith('image/')) {
            showToast('Harap upload file gambar', 'warning');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showToast('Ukuran file maksimal 5MB', 'warning');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const newQuestions = [...preTestQuestions];
            newQuestions[index].image_url = e.target.result;
            newQuestions[index].image_file = file;
            setPreTestQuestions(newQuestions);
        };
        reader.readAsDataURL(file);
    };

    const handlePostTestImageUpload = (index, file) => {
        if (!file.type.startsWith('image/')) {
            showToast('Harap upload file gambar', 'warning');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showToast('Ukuran file maksimal 5MB', 'warning');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const newQuestions = [...postTestQuestions];
            newQuestions[index].image_url = e.target.result;
            newQuestions[index].image_file = file;
            setPostTestQuestions(newQuestions);
        };
        reader.readAsDataURL(file);
    };

    const addPreTestQuestion = () => {
        setPreTestQuestions([
            ...preTestQuestions,
            { question_text: '', image_url: null, image_file: null, option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'a', explanation: '' }
        ]);
    };

    const addPostTestQuestion = () => {
        setPostTestQuestions([
            ...postTestQuestions,
            { question_text: '', image_url: null, image_file: null, option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'a', explanation: '' }
        ]);
    };

    const removePreTestQuestion = (index) => {
        if (preTestQuestions.length > 1) {
            setPreTestQuestions(preTestQuestions.filter((_, i) => i !== index));
        }
    };

    const removePostTestQuestion = (index) => {
        if (postTestQuestions.length > 1) {
            setPostTestQuestions(postTestQuestions.filter((_, i) => i !== index));
        }
    };

    // Step renders
    const renderStep1 = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div className="flex gap-8">
                {/* Left: Cover Image Upload */}
                <div className="w-1/3">
                    <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Cover Image</label>
                    <div 
                        onClick={() => coverImageInputRef.current?.click()}
                        className="aspect-[3/4] bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-500 transition-colors flex flex-col items-center justify-center cursor-pointer group relative overflow-hidden"
                    >
                        {programData.coverImage ? (
                            <img src={programData.coverImage} alt="Cover" className="w-full h-full object-cover" />
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                    <ImageIcon className="text-slate-400 group-hover:text-indigo-600" size={24} />
                                </div>
                                <p className="text-xs font-bold text-slate-400 group-hover:text-indigo-600">Upload Cover</p>
                                <p className="text-[10px] text-slate-400 mt-1">PNG, JPG up to 5MB</p>
                            </>
                        )}
                        <input 
                            ref={coverImageInputRef}
                            type="file" 
                            className="hidden" 
                            accept="image/png,image/jpeg,image/jpg"
                            onChange={handleCoverImageChange}
                        />
                    </div>
                </div>

                {/* Right: Details */}
                <div className="w-2/3 space-y-6">
                    <InputField 
                        label="Program Title" 
                        placeholder="e.g. Digital Leadership Masterclass"
                        value={programData.title}
                        onChange={(e) => setProgramData({...programData, title: e.target.value})}
                        icon={BookOpen}
                    />
                    
                    <div className="group">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Description</label>
                            <AIButton label="Generate with AI" onClick={() => setProgramData({...programData, description: "Generated by AI: This comprehensive course covers essential topics for modern professionals..."})} />
                        </div>
                        <textarea 
                            value={programData.description}
                            onChange={(e) => setProgramData({...programData, description: e.target.value})}
                            placeholder="Describe what users will learn..."
                            className="w-full p-4 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#D6FF59] transition-all shadow-sm min-h-[120px] text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InputField 
                            label="Duration (Minutes)" 
                            type="number"
                            placeholder="60"
                            value={programData.duration_minutes}
                            onChange={(e) => setProgramData({...programData, duration_minutes: e.target.value})}
                            icon={Settings}
                        />
                        <div className="group">
                            <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Gamification (XP)</label>
                            <div className="relative">
                                <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-500" size={18} />
                                <input 
                                    type="number"
                                    value={programData.xp}
                                    onChange={(e) => setProgramData({...programData, xp: e.target.value})}
                                    className="w-full pl-12 pr-4 py-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl font-bold outline-none focus:ring-2 focus:ring-yellow-400"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InputField 
                            label="Category"
                            value={programData.category}
                            onChange={(e) => setProgramData({...programData, category: e.target.value})}
                            placeholder="Select category"
                            icon={BookOpen}
                        />
                        <InputField 
                            label="Passing Grade (KKM)" 
                            type="number"
                            placeholder="70"
                            value={programData.passing_grade}
                            onChange={(e) => setProgramData({...programData, passing_grade: e.target.value})}
                            icon={Check}
                        />
                    </div>

                    <div className="flex items-center gap-3 bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={programData.is_active}
                            onChange={(e) => setProgramData({...programData, is_active: e.target.checked})}
                            className="w-5 h-5 rounded"
                        />
                        <label htmlFor="is_active" className="font-semibold text-gray-800 cursor-pointer text-sm">
                            Aktifkan Program (Users dapat mengakses program ini)
                        </label>
                    </div>
                </div>
            </div>
        </motion.div>
    );

    const renderStep2 = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Learning Path</h3>
                    <p className="text-sm text-slate-500 mt-1">Susun materi pembelajaran seperti playlist Spotify</p>
                </div>
                <button 
                    type="button"
                    onClick={() => setMaterials([...materials, { 
                        id: Date.now(), 
                        type: 'document', 
                        title: '', 
                        description: '', 
                        file: null,
                        fileName: null,
                        fileSize: 0,
                        url: ''
                    }])}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-slate-800 transition"
                >
                    <Plus size={16} /> Add Module
                </button>
            </div>

            <div className="space-y-4">
                {materials.map((item, idx) => (
                    <div key={item.id || idx} className="group bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                        {/* Material Header */}
                        <div className="p-4 flex items-center gap-4 border-b border-slate-100">
                            <div className="cursor-move text-slate-300 hover:text-slate-600">
                                <GripVertical size={20} />
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                                {item.type === 'video' ? <Video size={20} /> : item.type === 'pdf' ? <FileText size={20} /> : item.type === 'ppt' ? <Sparkles size={20} /> : item.type === 'spreadsheet' ? <BarChart3 size={20} /> : <File size={20} />}
                            </div>
                            <div className="flex-1">
                                <input 
                                    type="text" 
                                    placeholder="Module Title" 
                                    value={item.title}
                                    onChange={(e) => {
                                        const newMaterials = [...materials];
                                        newMaterials[idx].title = e.target.value;
                                        setMaterials(newMaterials);
                                    }}
                                    className="w-full bg-transparent text-sm font-semibold text-slate-700 placeholder-slate-400 outline-none border-b border-transparent focus:border-indigo-300" 
                                />
                            </div>
                            <select 
                                value={item.type}
                                onChange={(e) => {
                                    const newMaterials = [...materials];
                                    newMaterials[idx].type = e.target.value;
                                    newMaterials[idx].file = null;
                                    setMaterials(newMaterials);
                                }}
                                className="px-3 py-1 text-xs font-bold bg-slate-100 border border-slate-200 rounded-lg text-slate-700 outline-none focus:ring-2 focus:ring-indigo-300"
                            >
                                <option value="document">Document</option>
                                <option value="video">Video</option>
                                <option value="pdf">PDF</option>
                                <option value="ppt">PowerPoint</option>
                                <option value="spreadsheet">Spreadsheet (Excel/CSV)</option>
                            </select>
                            <button 
                                type="button"
                                onClick={() => setMaterials(materials.filter((_, i) => i !== idx))}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition flex-shrink-0"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        {/* Material Content */}
                        <div className="p-4 space-y-4">
                            {/* File Upload */}
                            {item.file ? (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                                            <Check size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-green-900">{item.file.name}</p>
                                            <p className="text-xs text-green-700">{(item.file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setPreviewFile(item)}
                                            className="p-2 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                                            title="Preview"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newMaterials = [...materials];
                                                newMaterials[idx].file = null;
                                                setMaterials(newMaterials);
                                            }}
                                            className="text-xs font-bold text-green-700 hover:text-green-900 bg-green-100 hover:bg-green-200 px-3 py-1 rounded-lg transition"
                                        >
                                            Change
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-indigo-400 hover:bg-indigo-50 transition">
                                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                    <p className="text-sm font-semibold text-slate-700 mb-2">Upload File</p>
                                    <p className="text-xs text-slate-500 mb-3">Max 50MB - PDF, Word, PPT, Excel, Video</p>
                                    <input 
                                        type="file" 
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300" 
                                        onChange={(e) => handleMaterialFileChange(idx, e)}
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.mp4,.webm,.avi,.mov"
                                    />
                                </div>
                            )}

                            {/* URL Input as alternative */}
                            {!item.file && (
                                <div className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-lg border border-slate-200">
                                    <LinkIcon size={16} className="text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="atau paste URL file..." 
                                        value={item.url}
                                        onChange={(e) => {
                                            const newMaterials = [...materials];
                                            newMaterials[idx].url = e.target.value;
                                            setMaterials(newMaterials);
                                        }}
                                        className="bg-transparent border-none outline-none text-sm text-slate-700 w-full placeholder-slate-400" 
                                    />
                                </div>
                            )}

                            {/* Description */}
                            <textarea 
                                placeholder="Deskripsi materi (opsional)"
                                value={item.description}
                                onChange={(e) => {
                                    const newMaterials = [...materials];
                                    newMaterials[idx].description = e.target.value;
                                    setMaterials(newMaterials);
                                }}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300 placeholder-slate-400 resize-none"
                                rows="2"
                            />
                        </div>
                    </div>
                ))}
            </div>
            
            {materials.length === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <p className="text-slate-500 text-sm font-medium">No materials yet. Click "Add Module" to start.</p>
                </div>
            )}
        </motion.div>
    );

    const renderStep3 = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 text-white relative overflow-hidden">
                <Sparkles className="absolute top-4 right-4 text-white/20" size={100} />
                <div className="relative z-10">
                    <h3 className="text-2xl font-black mb-2">AI Quiz Generator</h3>
                    <p className="text-indigo-100 mb-6 max-w-md">Let our AI analyze your materials and generate relevant questions automatically.</p>
                    <button 
                        type="button"
                        className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold shadow-lg hover:bg-indigo-50 transition flex items-center gap-2"
                    >
                        <Zap size={18} /> Generate Questions
                    </button>
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-4 gap-4">
                    <h3 className="font-bold text-slate-900 mb-0">Pre-Test Questions</h3>
                    <div className="flex items-center gap-3">
                        <label className="text-xs font-semibold text-slate-500">Waktu Pre-Test</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="1"
                                max="1440"
                                placeholder="Menit"
                                value={programData.pretest_duration_minutes}
                                onChange={(e) => setProgramData({...programData, pretest_duration_minutes: e.target.value})}
                                className="w-20 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none"
                            />
                            <span className="text-xs text-slate-400">menit (kosong = tanpa batas)</span>
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    {preTestQuestions.map((question, index) => (
                        <div key={index} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                            <div className="flex justify-between mb-4">
                                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full uppercase tracking-wider">Question {index + 1}</span>
                                {preTestQuestions.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removePreTestQuestion(index)}
                                        className="text-red-600 hover:bg-red-50 px-3 py-1 rounded text-sm font-bold transition"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                            <textarea 
                                value={question.question_text}
                                onChange={(e) => handlePreTestQuestionChange(index, 'question_text', e.target.value)}
                                placeholder="Enter your question here..." 
                                className="w-full text-lg font-semibold text-slate-800 placeholder-slate-300 outline-none mb-4 p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#D6FF59]"
                                rows="2"
                            />
                            
                            {/* Image Upload */}
                            <div 
                                className="mb-4 p-3 border-2 border-dashed border-slate-200 rounded-lg hover:border-slate-300 transition-colors cursor-pointer text-center"
                                onDragOver={(e) => { e.preventDefault(); e.target.style.borderColor = '#94a3b8'; }}
                                onDragLeave={(e) => { e.target.style.borderColor = '#cbd5e1'; }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    if (e.dataTransfer.files.length > 0) {
                                        handlePreTestImageUpload(index, e.dataTransfer.files[0]);
                                    }
                                }}
                                onClick={() => document.getElementById(`pretest-image-${index}`).click()}
                            >
                                <input 
                                    id={`pretest-image-${index}`}
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                        if (e.target.files.length > 0) {
                                            handlePreTestImageUpload(index, e.target.files[0]);
                                        }
                                    }}
                                />
                                {question.image_url ? (
                                    <div className="space-y-2">
                                        <img src={question.image_url} alt="Preview" className="h-20 mx-auto rounded object-contain" />
                                        <p className="text-xs text-slate-600 font-semibold">Klik untuk ganti</p>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newQuestions = [...preTestQuestions];
                                                newQuestions[index].image_url = null;
                                                newQuestions[index].image_file = null;
                                                setPreTestQuestions(newQuestions);
                                            }}
                                            className="text-xs text-red-500 hover:text-red-600 font-semibold"
                                        >
                                            Hapus
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-600 font-semibold">Drag/klik upload gambar (opsional)</p>
                                )}
                            </div>
                            
                            <div className="space-y-3">
                                {['a', 'b', 'c', 'd'].map((opt) => (
                                    <div key={opt} className="flex items-center gap-3">
                                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                                            <input 
                                                type="radio" 
                                                name={`correct_${index}`}
                                                checked={question.correct_answer === opt}
                                                onChange={() => handlePreTestQuestionChange(index, 'correct_answer', opt)}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-xs font-bold uppercase text-slate-500 w-6">{opt}</span>
                                            <input 
                                                type="text" 
                                                value={question[`option_${opt}`]}
                                                onChange={(e) => handlePreTestQuestionChange(index, `option_${opt}`, e.target.value)}
                                                placeholder={`Option ${opt.toUpperCase()}`} 
                                                className="flex-1 bg-slate-50 px-4 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-slate-300 border border-slate-200"
                                            />
                                        </label>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Explanation Field */}
                            <div className="mt-4">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                    Penjelasan (Opsional)
                                </label>
                                <textarea 
                                    value={question.explanation || ''}
                                    onChange={(e) => handlePreTestQuestionChange(index, 'explanation', e.target.value)}
                                    placeholder="Masukkan penjelasan jawaban yang benar..."
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-300 placeholder-slate-400 resize-none"
                                    rows="3"
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={addPreTestQuestion}
                    className="mt-4 w-full py-3 border-2 border-dashed border-blue-300 text-blue-600 font-bold rounded-xl hover:border-blue-400 hover:bg-blue-50 transition"
                >
                    + Add Pre-Test Question
                </button>
            </div>
        </motion.div>
    );

    const renderStep4 = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div>
                <div className="flex items-center justify-between mb-4 gap-4">
                    <h3 className="font-bold text-slate-900 mb-0">Post-Test Questions</h3>
                    <div className="flex items-center gap-3">
                        <label className="text-xs font-semibold text-slate-500">Waktu Post-Test</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="1"
                                max="1440"
                                placeholder="Menit"
                                value={programData.posttest_duration_minutes}
                                onChange={(e) => setProgramData({...programData, posttest_duration_minutes: e.target.value})}
                                className="w-20 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none"
                            />
                            <span className="text-xs text-slate-400">menit (kosong = tanpa batas)</span>
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    {postTestQuestions.map((question, index) => (
                        <div key={index} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                            <div className="flex justify-between mb-4">
                                <span className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full uppercase tracking-wider">Question {index + 1}</span>
                                {postTestQuestions.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removePostTestQuestion(index)}
                                        className="text-red-600 hover:bg-red-50 px-3 py-1 rounded text-sm font-bold transition"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                            <textarea 
                                value={question.question_text}
                                onChange={(e) => handlePostTestQuestionChange(index, 'question_text', e.target.value)}
                                placeholder="Enter your question here..." 
                                className="w-full text-lg font-semibold text-slate-800 placeholder-slate-300 outline-none mb-4 p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#D6FF59]"
                                rows="2"
                            />
                            
                            {/* Image Upload */}
                            <div 
                                className="mb-4 p-3 border-2 border-dashed border-slate-200 rounded-lg hover:border-slate-300 transition-colors cursor-pointer text-center"
                                onDragOver={(e) => { e.preventDefault(); e.target.style.borderColor = '#94a3b8'; }}
                                onDragLeave={(e) => { e.target.style.borderColor = '#cbd5e1'; }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    if (e.dataTransfer.files.length > 0) {
                                        handlePostTestImageUpload(index, e.dataTransfer.files[0]);
                                    }
                                }}
                                onClick={() => document.getElementById(`posttest-image-${index}`).click()}
                            >
                                <input 
                                    id={`posttest-image-${index}`}
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                        if (e.target.files.length > 0) {
                                            handlePostTestImageUpload(index, e.target.files[0]);
                                        }
                                    }}
                                />
                                {question.image_url ? (
                                    <div className="space-y-2">
                                        <img src={question.image_url} alt="Preview" className="h-20 mx-auto rounded object-contain" />
                                        <p className="text-xs text-slate-600 font-semibold">Klik untuk ganti</p>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newQuestions = [...postTestQuestions];
                                                newQuestions[index].image_url = null;
                                                newQuestions[index].image_file = null;
                                                setPostTestQuestions(newQuestions);
                                            }}
                                            className="text-xs text-red-500 hover:text-red-600 font-semibold"
                                        >
                                            Hapus
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-600 font-semibold">Drag/klik upload gambar (opsional)</p>
                                )}
                            </div>
                            
                            <div className="space-y-3">
                                {['a', 'b', 'c', 'd'].map((opt) => (
                                    <div key={opt} className="flex items-center gap-3">
                                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                                            <input 
                                                type="radio" 
                                                name={`correct_post_${index}`}
                                                checked={question.correct_answer === opt}
                                                onChange={() => handlePostTestQuestionChange(index, 'correct_answer', opt)}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-xs font-bold uppercase text-slate-500 w-6">{opt}</span>
                                            <input 
                                                type="text" 
                                                value={question[`option_${opt}`]}
                                                onChange={(e) => handlePostTestQuestionChange(index, `option_${opt}`, e.target.value)}
                                                placeholder={`Option ${opt.toUpperCase()}`} 
                                                className="flex-1 bg-slate-50 px-4 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-slate-300 border border-slate-200"
                                            />
                                        </label>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Explanation Field */}
                            <div className="mt-4">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                    Penjelasan (Opsional)
                                </label>
                                <textarea 
                                    value={question.explanation || ''}
                                    onChange={(e) => handlePostTestQuestionChange(index, 'explanation', e.target.value)}
                                    placeholder="Masukkan penjelasan jawaban yang benar..."
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-300 placeholder-slate-400 resize-none"
                                    rows="3"
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={addPostTestQuestion}
                    className="mt-4 w-full py-3 border-2 border-dashed border-green-300 text-green-600 font-bold rounded-xl hover:border-green-400 hover:bg-green-50 transition"
                >
                    + Add Post-Test Question
                </button>
            </div>
        </motion.div>
    );

    const renderStep5 = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-center py-20">
            <div className="w-20 h-20 bg-[#D6FF59] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-lime-200">
                <Check size={40} className="text-black" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">Ready to Launch!</h2>
            <p className="text-slate-500 max-w-md mx-auto">Your program "<strong>{programData.title || 'Untitled'}</strong>" is ready to be published. Review the details and click Publish to go live.</p>
        </motion.div>
    );

    return (
        <AdminLayout user={auth.user}>
            <Head title="Buat Program Pembelajaran - Creator Studio" />

            <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden min-h-[600px] flex flex-col">
                {/* Header Progress */}
                <div className="pt-8 pb-4">
                    <StepIndicator currentStep={currentStep} steps={steps} />
                </div>

                {/* Error/Success Notifications */}
                <AnimatePresence>
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mx-8 mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
                        >
                            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                            <div>
                                <p className="font-semibold text-red-900">Error</p>
                                <p className="text-red-700 text-sm">{error}</p>
                            </div>
                        </motion.div>
                    )}

                    {success && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mx-8 mb-6 bg-green-50 border border-green-200 rounded-xl p-4"
                        >
                            <div className="flex items-start gap-3 mb-4">
                                <Check className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="font-semibold text-green-900">Success</p>
                                    <p className="text-green-700 text-sm">{success}</p>
                                </div>
                            </div>
                            
                            {createdProgramId && (
                                <div className="flex gap-3 pt-4 border-t border-green-200">
                                    <button
                                        onClick={() => window.location.href = `/admin/training-materials-manager/${createdProgramId}`}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                                    >
                                        <Video size={16} /> Lihat Materi
                                    </button>
                                    <button
                                        onClick={() => window.location.href = `/admin/training-programs/${createdProgramId}`}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold hover:bg-green-200 transition"
                                    >
                                        <Settings size={16} /> Edit Program
                                    </button>
                                    <button
                                        onClick={() => window.location.href = '/admin/training-programs'}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition"
                                    >
                                        <ArrowLeft size={16} /> Kembali ke Daftar
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Content Area */}
                <div className="flex-1 px-12 py-8">
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                    {currentStep === 4 && renderStep4()}
                    {currentStep === 5 && renderStep5()}
                </div>

                {/* Footer Actions */}
                <div className="bg-slate-50 px-12 py-6 border-t border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                        {isAutoSaving ? (
                            <>
                                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                                Saving draft...
                            </>
                        ) : (
                            <>
                                <Check size={12} /> Draft saved
                            </>
                        )}
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={handlePrev}
                            disabled={currentStep === 1}
                            className={`px-6 py-3 rounded-xl font-bold text-sm transition ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-500 hover:bg-slate-200'}`}
                        >
                            Back
                        </button>
                        
                        <button 
                            onClick={currentStep === 4 ? handleSubmit : handleNext}
                            disabled={loading}
                            className="flex items-center gap-2 px-8 py-3 bg-black text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition shadow-lg hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {currentStep === 4 ? (
                                loading ? (
                                    <>
                                        <span className="animate-spin">⏳</span> Publishing...
                                    </>
                                ) : (
                                    <> <Save size={18} /> Publish Program </>
                                )
                            ) : (
                                <> Continue <ArrowRight size={18} /> </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            <AnimatePresence>
                {previewFile && (() => {
                    const fileUrl = URL.createObjectURL(previewFile.file);
                    const fileName = previewFile.file?.name || '';
                    const fileExtension = fileName.split('.').pop()?.toLowerCase();
                    
                    // Determine file type for preview
                    const isVideo = ['mp4', 'webm', 'avi', 'mov', 'mkv'].includes(fileExtension);
                    const isPDF = fileExtension === 'pdf';
                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension);
                    const isDoc = ['doc', 'docx'].includes(fileExtension);
                    const isPPT = ['ppt', 'pptx'].includes(fileExtension);
                    const isExcel = ['xls', 'xlsx', 'csv'].includes(fileExtension);
                    
                    return (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setPreviewFile(null)}
                        >
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white rounded-[32px] shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
                                    {/* Left: Preview Area */}
                                    <div className="flex-1 bg-slate-50 p-8 flex items-center justify-center border-r border-slate-200 overflow-auto">
                                        <button 
                                            onClick={() => setPreviewFile(null)}
                                            className="absolute top-6 left-6 p-2 bg-white rounded-xl shadow-lg hover:bg-slate-50 transition z-10"
                                        >
                                            <X size={20} />
                                        </button>
                                        
                                        <div className="w-full h-full flex items-center justify-center">
                                            {isVideo && (
                                                <video 
                                                    src={fileUrl} 
                                                    controls 
                                                    className="max-w-full max-h-[70vh] rounded-2xl shadow-2xl"
                                                >
                                                    Browser Anda tidak mendukung video preview.
                                                </video>
                                            )}
                                            
                                            {isPDF && (
                                                <iframe 
                                                    src={fileUrl} 
                                                    className="w-full h-[70vh] rounded-2xl shadow-2xl border-0"
                                                    title="PDF Preview"
                                                />
                                            )}
                                            
                                            {isImage && (
                                                <img 
                                                    src={fileUrl} 
                                                    alt={fileName}
                                                    className="max-w-full max-h-[70vh] rounded-2xl shadow-2xl object-contain"
                                                />
                                            )}
                                            
                                            {(isDoc || isPPT || isExcel) && (
                                                <div className="text-center">
                                                    <div className="w-32 h-32 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                                                        {isPPT ? (
                                                            <Sparkles size={48} className="text-orange-500" />
                                                        ) : isExcel ? (
                                                            <BarChart3 size={48} className="text-emerald-500" />
                                                        ) : (
                                                            <FileText size={48} className="text-blue-500" />
                                                        )}
                                                    </div>
                                                    <h3 className="text-xl font-bold text-slate-900 mb-4 line-clamp-2 max-w-md mx-auto">
                                                        {fileName}
                                                    </h3>
                                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 max-w-md mx-auto">
                                                        <p className="text-amber-800 text-sm">
                                                            <strong>📌 Info:</strong> Preview langsung untuk file {fileExtension.toUpperCase()} akan tersedia setelah program disimpan.
                                                        </p>
                                                    </div>
                                                    <p className="text-slate-600 mb-6">
                                                        File berhasil dipilih dan siap diupload.
                                                    </p>
                                                    <button
                                                        onClick={() => {
                                                            const a = document.createElement('a');
                                                            a.href = fileUrl;
                                                            a.download = fileName;
                                                            a.click();
                                                        }}
                                                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition shadow-lg inline-flex items-center gap-2"
                                                    >
                                                        <Download size={18} /> Download File
                                                    </button>
                                                </div>
                                            )}
                                            
                                            {!isVideo && !isPDF && !isImage && !isDoc && !isPPT && !isExcel && (
                                                <div className="text-center">
                                                    <div className="w-32 h-32 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                                                        <File size={48} className="text-slate-500" />
                                                    </div>
                                                    <h3 className="text-xl font-bold text-slate-900 mb-4 line-clamp-2 max-w-md mx-auto">
                                                        {fileName}
                                                    </h3>
                                                    <p className="text-slate-600 mb-6">
                                                        Preview tidak tersedia untuk tipe file ini. <br/>
                                                        Silakan download file untuk melihat isinya.
                                                    </p>
                                                    <button
                                                        onClick={() => {
                                                            const a = document.createElement('a');
                                                            a.href = fileUrl;
                                                            a.download = fileName;
                                                            a.click();
                                                        }}
                                                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition shadow-lg inline-flex items-center gap-2"
                                                    >
                                                        <Download size={18} /> Download File
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: File Info */}
                                    <div className="w-full md:w-80 p-8 bg-white overflow-y-auto">
                                        <div className="mb-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <File size={20} className="text-slate-400" />
                                                <h4 className="font-bold text-slate-900 line-clamp-2">{fileName || 'File'}</h4>
                                            </div>
                                            <p className="text-sm text-slate-500">{(previewFile.file?.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>

                                        <button
                                            onClick={() => {
                                                const a = document.createElement('a');
                                                a.href = fileUrl;
                                                a.download = fileName;
                                                a.click();
                                            }}
                                            className="w-full px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition shadow-lg flex items-center justify-center gap-2"
                                        >
                                            <Download size={18} /> Download
                                        </button>

                                        <div className="mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Sparkles size={16} className="text-indigo-600" />
                                                <h5 className="font-bold text-indigo-900 text-sm">AI INSIGHT</h5>
                                            </div>
                                            <p className="text-xs text-indigo-700">
                                                Click analyze to generate summary, key points, and tags automatically.
                                            </p>
                                            <button className="mt-3 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition">
                                                Analyze
                                            </button>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-slate-100">
                                            <h5 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-4">FILE PROPERTIES</h5>
                                            <div className="space-y-3 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Type</span>
                                                    <span className="font-medium text-slate-900">{fileExtension?.toUpperCase()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Size</span>
                                                    <span className="font-medium text-slate-900">{(previewFile.file?.size / 1024 / 1024).toFixed(2)} MB</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>
        </AdminLayout>
    );
}

