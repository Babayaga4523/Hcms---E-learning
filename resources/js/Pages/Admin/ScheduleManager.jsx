import React, { useEffect, useState } from 'react';
import {
    X, Save, Trash2, Calendar, Clock, MapPin,
    Video, User, AlignLeft, Sparkles, AlertCircle,
    CheckCircle2, ArrowRight, ZoomIn, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Custom scrollbar styles
const scrollbarStyles = `
    <style>
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }
    </style>
`;

const timeSlots = [
    "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"
];

const durationChips = [
    { label: '+30m', hours: 0.5 },
    { label: '+1h', hours: 1 },
    { label: '+1.5h', hours: 1.5 },
    { label: '+2h', hours: 2 },
];

// --- REUSABLE COMPONENTS ---

const InputGroup = ({ label, icon: Icon, children, hint }) => (
    <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
    >
        <label className="flex items-center gap-2 text-xs font-bold uppercase text-slate-600 tracking-widest">
            {Icon && <Icon size={14} className="text-slate-400" />} {label}
            {hint && <span className="text-[10px] text-slate-400 font-normal">{hint}</span>}
        </label>
        {children}
    </motion.div>
);

const ToggleSwitch = ({ options, active, onChange }) => (
    <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
        {options.map((opt) => (
            <motion.button
                key={opt.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onChange(opt.value)}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    active === opt.value
                        ? 'bg-white text-slate-900 shadow-lg shadow-slate-200/50 ring-2 ring-[#D6FF59]'
                        : 'text-slate-500 hover:text-slate-700'
                }`}
            >
                {opt.icon} {opt.label}
            </motion.button>
        ))}
    </div>
);

const TrainerCard = ({ trainer, selected, onClick }) => {
    const colors = [
        'from-blue-500 to-blue-600',
        'from-purple-500 to-purple-600',
        'from-emerald-500 to-emerald-600',
        'from-pink-500 to-pink-600',
        'from-orange-500 to-orange-600',
        'from-teal-500 to-teal-600',
    ];
    const colorIndex = trainer.id % colors.length;
    
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                selected
                    ? 'border-[#D6FF59] bg-[#D6FF59]/5 shadow-md shadow-lime-200/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
        >
            <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center text-white font-bold text-xs shadow-md flex-shrink-0`}>
                    {trainer.avatar}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm">{trainer.name}</p>
                    <p className="text-xs text-slate-500">{trainer.department}</p>
                </div>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition flex-shrink-0 ${
                    selected ? 'bg-[#D6FF59] border-[#D6FF59]' : 'border-slate-300'
                }`}>
                    {selected && <CheckCircle2 size={14} className="text-slate-900" />}
                </div>
            </div>
        </motion.button>
    );
};

// --- MAIN COMPONENT ---

export default function ScheduleManager({ date = null, schedule = null, onClose = () => {}, onSaved = () => {} }) {
    const [formData, setFormData] = useState({
        title: '',
        date: date ? new Date(date).toISOString().split('T')[0] : '',
        startTime: '09:00',
        endTime: '11:00',
        type: 'online', // online | onsite
        location: '',
        link: '',
        trainer_ids: [],
        description: '',
    });

    const [saving, setSaving] = useState(false);
    const [showConflict, setShowConflict] = useState(false);
    const [instructors, setInstructors] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loadingInstructors, setLoadingInstructors] = useState(true);

    useEffect(() => {
        fetchInstructors();
    }, []);

    useEffect(() => {
        if (schedule) {
            // Convert trainer_id to array if it exists
            const trainerIds = schedule.trainer_ids 
                ? (Array.isArray(schedule.trainer_ids) ? schedule.trainer_ids : [schedule.trainer_ids])
                : (schedule.trainer_id ? [schedule.trainer_id] : []);
            
            setFormData({
                title: schedule.title || '',
                date: schedule.date ? new Date(schedule.date).toISOString().split('T')[0] : '',
                startTime: schedule.start_time || '09:00',
                endTime: schedule.end_time || '11:00',
                type: schedule.location?.includes('http') ? 'online' : 'onsite',
                location: schedule.location || '',
                link: schedule.location?.includes('http') ? schedule.location : '',
                trainer_ids: trainerIds,
                description: schedule.description || '',
            });
        } else if (date) {
            const newDate = new Date(date).toISOString().split('T')[0];
            setFormData(prev => ({ ...prev, date: newDate }));
        }
    }, [schedule, date]);

    const fetchInstructors = async () => {
        try {
            setLoadingInstructors(true);
            const res = await fetch('/api/admin/training-schedules/instructors', {
                headers: { 'Accept': 'application/json' }
            });
            if (res.ok) {
                const data = await res.json();
                setInstructors(data.users || []);
                setDepartments(data.departments || []);
            }
        } catch (err) {
            console.error('Error fetching instructors:', err);
        } finally {
            setLoadingInstructors(false);
        }
    };

    const calculateDuration = () => {
        if (!formData.startTime || !formData.endTime) return 'Set Time';
        const start = parseInt(formData.startTime.split(':')[0]);
        const end = parseInt(formData.endTime.split(':')[0]);
        const diff = end - start;
        return diff > 0 ? `${diff}h Duration` : 'Invalid';
    };

    const getSelectedTrainers = () => {
        return instructors.filter(t => formData.trainer_ids.includes(t.id));
    };

    const toggleTrainer = (trainerId) => {
        setFormData(prev => {
            const isSelected = prev.trainer_ids.includes(trainerId);
            return {
                ...prev,
                trainer_ids: isSelected 
                    ? prev.trainer_ids.filter(id => id !== trainerId)
                    : [...prev.trainer_ids, trainerId]
            };
        });
    };

    const handleAddDuration = (hours) => {
        const [hStart, mStart] = formData.startTime.split(':').map(Number);
        const totalMinutes = hStart * 60 + mStart + (hours * 60);
        const newHours = Math.floor(totalMinutes / 60);
        const newMinutes = totalMinutes % 60;
        const endTime = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
        setFormData(prev => ({ ...prev, endTime }));
    };

    const handleGenerateAI = () => {
        const aiDescriptions = [
            "✨ Sesi pelatihan komprehensif yang membahas strategi kepatuhan terbaru sesuai regulasi OJK 2025. Peserta akan mempelajari studi kasus pencucian uang, mitigasi risiko digital, dan best practices industri perbankan.",
            "✨ Workshop interaktif fokus pada penerapan regulasi anti-pencucian uang (AML). Diskusi mendalam tentang red flags dalam transaksi, teknologi detection, dan prosedur laporan mencurigakan (STR).",
            "✨ Pelatihan teknis mengenai sistem keamanan siber modern untuk financial institutions. Topik mencakup threat assessment, incident response, penetration testing, dan compliance dengan standar ISO 27001.",
            "✨ Sesi knowledge sharing tentang transformasi digital di sektor perbankan. Peserta akan memahami blockchain, AI dalam risk management, dan strategi digitalisasi operasional yang compliant.",
        ];
        const randomAI = aiDescriptions[Math.floor(Math.random() * aiDescriptions.length)];
        setFormData(prev => ({ ...prev, description: randomAI }));
    };

    const handleSave = async () => {
        if (!formData.title || !formData.date) {
            alert('Title and Date are required');
            return;
        }

        setSaving(true);

        const payload = {
            title: formData.title,
            date: formData.date,
            start_time: formData.startTime,
            end_time: formData.endTime,
            location: formData.type === 'online' ? formData.link : formData.location,
            description: formData.description,
            trainer_ids: formData.trainer_ids.length > 0 ? formData.trainer_ids : null,
        };

        try {
            let res;
            if (schedule && schedule.id) {
                res = await fetch(`/api/admin/training-schedules/${schedule.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                    },
                    body: JSON.stringify(payload),
                });
            } else {
                res = await fetch('/api/admin/training-schedules', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                    },
                    body: JSON.stringify(payload),
                });
            }

            if (res.ok) {
                onSaved();
                onClose();
            } else {
                const err = await res.text();
                console.error('Error saving schedule', err);
                alert('Failed to save schedule');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to save schedule');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!schedule?.id) return;
        if (!confirm('Delete this schedule?')) return;

        try {
            const res = await fetch(`/api/admin/training-schedules/${schedule.id}`, {
                method: 'DELETE',
                headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content },
            });
            if (res.ok) {
                onSaved();
                onClose();
            } else {
                alert('Failed to delete schedule');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to delete schedule');
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
                />

                {/* Modal Card - Split Layout */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="bg-white w-full max-w-6xl rounded-[32px] shadow-2xl relative z-10 overflow-hidden flex flex-col lg:flex-row h-[90vh]"
                >
                    {/* LEFT PANEL: FORM INPUTS */}
                    <div className="flex-1 p-8 lg:p-10 overflow-y-auto custom-scrollbar">
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-between items-start mb-8"
                        >
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                    Wondr Schedule Studio
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">
                                    {schedule ? '✏️ Edit Session' : '✨ Create New Session'}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                {schedule?.id && (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleDelete}
                                        className="p-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-full transition"
                                    >
                                        <Trash2 size={20} />
                                    </motion.button>
                                )}
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onClose}
                                    className="p-3 text-slate-400 hover:bg-slate-100 rounded-full transition"
                                >
                                    <X size={20} />
                                </motion.button>
                            </div>
                        </motion.div>

                        <div className="space-y-7">
                            {/* Title Input */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 }}
                            >
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Enter session title..."
                                    className="w-full text-2xl font-black placeholder-slate-300 border-none border-b-2 border-slate-100 focus:border-[#D6FF59] focus:ring-0 px-0 py-3 transition-all"
                                />
                            </motion.div>

                            {/* Date & Time Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <InputGroup label="Date" icon={Calendar} hint="Required">
                                    <motion.input
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.1 }}
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#D6FF59]/50 focus:border-[#D6FF59] transition-all"
                                    />
                                </InputGroup>

                                <InputGroup label="Time" icon={Clock} hint={calculateDuration()}>
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.1 }}
                                        className="flex items-center gap-3"
                                    >
                                        <input
                                            type="time"
                                            value={formData.startTime}
                                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                            className="flex-1 p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-[#D6FF59]/50 focus:border-[#D6FF59] transition-all"
                                        />
                                        <div className="text-slate-300 font-bold">→</div>
                                        <input
                                            type="time"
                                            value={formData.endTime}
                                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                            className="flex-1 p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-[#D6FF59]/50 focus:border-[#D6FF59] transition-all"
                                        />
                                    </motion.div>
                                </InputGroup>
                            </div>

                            {/* Quick Duration Chips */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                            >
                                <p className="text-xs font-bold uppercase text-slate-600 tracking-widest mb-3">⚡ Quick Duration</p>
                                <div className="flex gap-2 flex-wrap">
                                    {durationChips.map((chip) => (
                                        <motion.button
                                            key={chip.label}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleAddDuration(chip.hours)}
                                            className="px-4 py-2 bg-slate-100 hover:bg-[#D6FF59] text-slate-600 hover:text-slate-900 font-bold text-sm rounded-xl transition-all"
                                        >
                                            {chip.label}
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Location Type Switch */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="space-y-4"
                            >
                                <InputGroup label="Location Type" icon={MapPin}>
                                    <ToggleSwitch
                                        active={formData.type}
                                        onChange={(val) => setFormData({ ...formData, type: val })}
                                        options={[
                                            { value: 'online', label: 'Online Meeting', icon: <Video size={16} /> },
                                            { value: 'onsite', label: 'On-Site', icon: <MapPin size={16} /> },
                                        ]}
                                    />
                                </InputGroup>

                                {formData.type === 'online' ? (
                                    <motion.input
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        type="text"
                                        placeholder="Paste Zoom / Google Meet link..."
                                        value={formData.link}
                                        onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                        className="w-full p-4 bg-blue-50/50 border-2 border-blue-100 rounded-2xl text-blue-700 placeholder-blue-300 font-bold outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                                    />
                                ) : (
                                    <motion.input
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        type="text"
                                        placeholder="e.g. Meeting Room A, Floor 12"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-[#D6FF59]/50 focus:border-[#D6FF59] transition-all"
                                    />
                                )}
                            </motion.div>

                            {/* Trainer Assignment */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                            >
                                <InputGroup label="Instructors" icon={User} hint="Select one or more">
                                    {loadingInstructors ? (
                                        <div className="text-center py-8 text-slate-500">
                                            <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-[#D6FF59] rounded-full mx-auto"></div>
                                            <p className="text-xs mt-2">Loading instructors...</p>
                                        </div>
                                    ) : instructors.length === 0 ? (
                                        <div className="text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                            <User className="mx-auto text-slate-300 mb-2" size={32} />
                                            <p className="text-sm text-slate-500 font-medium">No instructors available</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-2 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                                            {instructors.map((trainer) => (
                                                <TrainerCard
                                                    key={trainer.id}
                                                    trainer={trainer}
                                                    selected={formData.trainer_ids.includes(trainer.id)}
                                                    onClick={() => toggleTrainer(trainer.id)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </InputGroup>
                            </motion.div>

                            {/* Description with AI */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <InputGroup label="Description" icon={AlignLeft} hint="Optional">
                                    <div className="relative">
                                        <textarea
                                            rows={5}
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Add session agenda, key topics, or special instructions..."
                                            className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-[#D6FF59]/50 focus:border-[#D6FF59] resize-none transition-all"
                                        />
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleGenerateAI}
                                            className="absolute bottom-3 right-3 flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all"
                                        >
                                            <Sparkles size={14} /> AI Writer
                                        </motion.button>
                                    </div>
                                </InputGroup>
                            </motion.div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: CONTEXT & PREVIEW */}
                    <div className="w-full lg:w-[380px] bg-gradient-to-b from-slate-50 to-slate-100/50 border-t lg:border-t-0 lg:border-l border-slate-200 p-8 flex flex-col overflow-y-auto custom-scrollbar">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex justify-between items-center mb-6"
                        >
                            <h3 className="text-xs font-black uppercase text-slate-600 tracking-widest">📅 Day Preview</h3>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onClose}
                                className="p-2 hover:bg-slate-200 rounded-full transition"
                            >
                                <X size={18} className="text-slate-400" />
                            </motion.button>
                        </motion.div>

                        {/* Mini Calendar Visual */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-sm mb-6"
                        >
                            <div className="text-center mb-4 pb-4 border-b-2 border-slate-100">
                                <span className="text-lg font-black text-slate-900">
                                    {formData.date ? new Date(formData.date).toLocaleDateString('id-ID', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select Date'}
                                </span>
                            </div>

                            {/* Visual Timeline */}
                            <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                {timeSlots.map((time, idx) => {
                                    const isSelectedSlot = time >= formData.startTime && time < formData.endTime;
                                    const isAfterEnd = time === formData.endTime;
                                    
                                    return (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.02 }}
                                            className="flex gap-3 items-center"
                                        >
                                            <span className="text-xs text-slate-400 font-mono w-10 flex-shrink-0">{time}</span>
                                            <motion.div
                                                layout
                                                className={`flex-1 h-10 rounded-xl border-2 flex items-center px-3 text-xs font-bold transition-all ${
                                                    isSelectedSlot
                                                        ? 'bg-[#D6FF59] border-[#D6FF59] text-slate-900 shadow-lg shadow-lime-200/30'
                                                        : isAfterEnd && formData.description
                                                        ? 'border-slate-200 bg-slate-50 text-slate-300'
                                                        : 'border-slate-200 bg-slate-50 text-slate-300'
                                                }`}
                                            >
                                                {isSelectedSlot ? (formData.title || 'New Session') : 'Available'}
                                            </motion.div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Conflict Alert */}
                            <AnimatePresence>
                                {showConflict && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="mt-4 p-3 bg-red-50 border-2 border-red-100 rounded-xl flex items-start gap-2"
                                    >
                                        <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs font-black text-red-700">⚠️ Conflict Detected</p>
                                            <p className="text-[10px] text-red-600 mt-0.5">Instructor is busy at selected time.</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Trainer Info if Selected */}
                            {getSelectedTrainers().length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 pt-4 border-t-2 border-slate-100"
                                >
                                    <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                                        Assigned Instructors ({getSelectedTrainers().length})
                                    </p>
                                    <div className="space-y-2 max-h-[100px] overflow-y-auto pr-1 custom-scrollbar">
                                        {getSelectedTrainers().map((trainer, idx) => {
                                            const colors = ['from-blue-500 to-blue-600', 'from-purple-500 to-purple-600', 'from-emerald-500 to-emerald-600', 'from-pink-500 to-pink-600', 'from-orange-500 to-orange-600', 'from-teal-500 to-teal-600'];
                                            const colorIndex = trainer.id % colors.length;
                                            return (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center text-white font-bold text-[10px]`}>
                                                        {trainer.avatar}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-bold text-slate-900 text-xs truncate">{trainer.name}</p>
                                                        <p className="text-[10px] text-slate-500 truncate">{trainer.department}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>

                        {/* Action Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="space-y-3"
                        >
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl font-black shadow-lg hover:shadow-xl transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                                {saving ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                ) : (
                                    <Save size={20} />
                                )}
                                {saving ? 'Saving...' : 'Save Schedule'}
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                className="w-full py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl font-black hover:bg-slate-50 hover:border-slate-300 transition-all"
                            >
                                Cancel
                            </motion.button>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
