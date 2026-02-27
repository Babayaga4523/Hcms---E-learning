import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import {
    X, Save, Trash2, Calendar, Clock, MapPin,
    Video, User, AlignLeft, AlertCircle,
    CheckCircle2, Plus
} from 'lucide-react';
import showToast from '@/Utils/toast';

/**
 * Optimized ScheduleManager Modal (Light Version)
 * - No Framer Motion animations (significantly reduces bundle size)
 * - CSS transitions only
 * - Simplified layout
 * - Fast rendering
 */

const timeSlots = [
    "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"
];

const durationChips = [
    { label: '+30m', hours: 0.5 },
    { label: '+1h', hours: 1 },
    { label: '+1.5h', hours: 1.5 },
    { label: '+2h', hours: 2 },
];

// Generate unique colors for trainers using HSL (unlimited trainers)
const getTrainerColor = (trainerId) => {
    // Spread colors evenly around the color wheel (0-360 degrees)
    const hue = (trainerId * 60) % 360;
    return `hsl(${hue}, 70%, 50%)`;
};

// --- SIMPLE INPUT GROUP ---
const InputGroup = memo(({ label, icon: Icon, children, hint }) => (
    <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-bold uppercase text-slate-600 tracking-widest">
            {Icon && <Icon size={14} className="text-slate-400" />} {label}
            {hint && <span className="text-[10px] text-slate-400 font-normal">{hint}</span>}
        </label>
        {children}
    </div>
));
InputGroup.displayName = 'InputGroup';

// --- SIMPLE TOGGLE SWITCH ---
const ToggleSwitch = memo(({ options, active, onChange }) => (
    <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
        {options.map((opt) => (
            <button
                key={opt.value}
                onClick={() => onChange(opt.value)}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    active === opt.value
                        ? 'bg-white text-slate-900 shadow-lg shadow-slate-200/50 ring-2 ring-[#D6FF59]'
                        : 'text-slate-500 hover:text-slate-700'
                }`}
            >
                {opt.icon} {opt.label}
            </button>
        ))}
    </div>
));
ToggleSwitch.displayName = 'ToggleSwitch';

// --- SIMPLE TRAINER CARD ---
const TrainerCard = memo(({ trainer, selected, onClick }) => {
    const trainerColor = getTrainerColor(trainer.id); // NEW: Use HSL color generation
    
    return (
        <button
            onClick={onClick}
            className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                selected
                    ? 'border-[#D6FF59] bg-[#D6FF59]/5 shadow-md shadow-lime-200/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
        >
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md flex-shrink-0" style={{ backgroundColor: trainerColor }}>
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
        </button>
    );
});
TrainerCard.displayName = 'TrainerCard';

// --- MAIN COMPONENT ---
export default function ScheduleManagerLight({ date = null, schedule = null, onClose = () => {}, onSaved = () => {} }) {
    const [formData, setFormData] = useState({
        title: '',
        date: date ? new Date(date).toISOString().split('T')[0] : '',
        startTime: '09:00',
        endTime: '11:00',
        sessionType: 'online',  // online/onsite for delivery method
        type: 'training',  // training/deadline/reminder/event - backend type
        location: '',
        link: '',
        trainer_ids: [],
        description: '',
        timezone: 'Asia/Jakarta', // NEW: Add timezone support
    });

    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false); // NEW: Animation state for success feedback
    const [instructors, setInstructors] = useState([]);
    const [loadingInstructors, setLoadingInstructors] = useState(true);

    useEffect(() => {
        fetchInstructors();
    }, []);

    useEffect(() => {
        if (schedule) {
            const trainerIds = schedule.trainer_ids 
                ? (Array.isArray(schedule.trainer_ids) ? schedule.trainer_ids : [schedule.trainer_ids])
                : (schedule.trainer_id ? [schedule.trainer_id] : []);
            
            setFormData({
                title: schedule.title || '',
                date: schedule.date || '',
                startTime: schedule.start_time || '09:00',
                endTime: schedule.end_time || '11:00',
                sessionType: schedule.link ? 'online' : 'onsite',  // Infer from presence of link
                type: schedule.type || 'training',
                location: schedule.location || '',
                link: schedule.link || '',
                trainer_ids: trainerIds,
                description: schedule.description || '',
            });
        }
    }, [schedule]);

    const fetchInstructors = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/training-schedules/instructors', { headers: { 'Accept': 'application/json' } });
            if (res.ok) {
                const data = await res.json();
                // Handle the response structure: { users: [...], departments: [...] }
                setInstructors(data.users || data.data || data || []);
            }
        } catch (err) {
            console.error('Error fetching instructors', err);
        } finally {
            setLoadingInstructors(false);
        }
    }, []);

    const handleSave = useCallback(async () => {
        if (!formData.title.trim()) {
            showToast('Title is required', 'error');
            return;
        }
        if (!formData.date) {
            showToast('Date is required', 'error');
            return;
        }
        
        // NEW: Validate that end_time > start_time
        if (formData.endTime <= formData.startTime) {
            showToast('❌ End time must be after start time', 'error');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                title: formData.title,
                date: formData.date,
                start_time: formData.startTime,
                end_time: formData.endTime,
                type: 'training',  // Backend only accepts: training, deadline, reminder, event
                location: formData.sessionType === 'online' ? formData.link : formData.location,
                link: formData.sessionType === 'online' ? formData.link : null,
                trainer_ids: formData.trainer_ids,
                description: formData.description,
            };

            let url = '/api/admin/training-schedules';
            let method = 'POST';

            if (schedule?.id) {
                url = `/api/admin/training-schedules/${schedule.id}`;
                method = 'PUT';
            }

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                const message = schedule ? 'Schedule updated successfully! ✅' : 'Schedule created successfully! ✅';
                showToast(message, 'success');
                
                // NEW: Show success animation before closing
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                    onSaved();
                }, 1500); // Show animation for 1.5 seconds
            } else {
                const err = await res.json();
                showToast(err.message || 'Error saving schedule', 'error');
            }
        } catch (err) {
            console.error('Error saving schedule', err);
            showToast('Error saving schedule', 'error');
        } finally {
            setSaving(false);
        }
    }, [formData, schedule, onSaved]);

    const handleDelete = useCallback(async () => {
        if (!window.confirm('Are you sure you want to delete this schedule?')) return;

        try {
            const res = await fetch(`/api/admin/training-schedules/${schedule.id}`, {
                method: 'DELETE',
                headers: { 'Accept': 'application/json' },
            });

            if (res.ok) {
                showToast('Schedule deleted', 'success');
                onSaved();
            } else {
                showToast('Error deleting schedule', 'error');
            }
        } catch (err) {
            console.error('Error deleting schedule', err);
            showToast('Error deleting schedule', 'error');
        }
    }, [schedule?.id, onSaved]);

    const handleDurationClick = useCallback((hours) => {
        const start = new Date(`2000-01-01 ${formData.startTime}`);
        const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
        const endTimeStr = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
        setFormData(prev => ({ ...prev, endTime: endTimeStr }));
    }, [formData.startTime]);

    const handleTrainerToggle = useCallback((trainerId) => {
        setFormData(prev => ({
            ...prev,
            trainer_ids: prev.trainer_ids.includes(trainerId)
                ? prev.trainer_ids.filter(id => id !== trainerId)
                : [...prev.trainer_ids, trainerId]
        }));
    }, []);

    const selectedTrainers = useMemo(() => {
        return instructors.filter(t => formData.trainer_ids.includes(t.id));
    }, [instructors, formData.trainer_ids]);

    if (!date && !schedule) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            {/* Backdrop */}
            <div
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl transition-opacity"
            />

            {/* Modal */}
            <div className="bg-white w-full max-w-4xl rounded-[32px] shadow-2xl relative z-10 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="flex justify-between items-start p-8 border-b border-slate-100">
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
                            <button
                                onClick={handleDelete}
                                className="p-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-full transition-colors"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-3 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content - Single Column on Mobile, Two Columns on Desktop */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* LEFT: Form Inputs */}
                        <div className="space-y-6">
                            {/* Title */}
                            <InputGroup label="Title" icon={AlignLeft} hint="(Required)">
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="e.g., Advanced React Workshop"
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-[#D6FF59] focus:ring-2 focus:ring-[#D6FF59]/20 outline-none transition-colors font-medium"
                                />
                            </InputGroup>

                            {/* Date */}
                            <InputGroup label="Date" icon={Calendar}>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-[#D6FF59] focus:ring-2 focus:ring-[#D6FF59]/20 outline-none transition-colors font-medium"
                                />
                            </InputGroup>

                            {/* NEW: Timezone Support */}
                            <InputGroup label="Timezone" hint="(Session timezone)">
                                <select
                                    value={formData.timezone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-[#D6FF59] focus:ring-2 focus:ring-[#D6FF59]/20 outline-none transition-colors font-medium"
                                >
                                    {/* Asia timezones */}
                                    <optgroup label="Asia">
                                        <option value="Asia/Jakarta">Jakarta (UTC+7)</option>
                                        <option value="Asia/Bangkok">Bangkok (UTC+7)</option>
                                        <option value="Asia/Singapore">Singapore (UTC+8)</option>
                                        <option value="Asia/Manila">Manila (UTC+8)</option>
                                        <option value="Asia/Hong_Kong">Hong Kong (UTC+8)</option>
                                        <option value="Asia/Tokyo">Tokyo (UTC+9)</option>
                                    </optgroup>
                                    {/* Americas timezones */}
                                    <optgroup label="Americas">
                                        <option value="America/New_York">New York (UTC-5)</option>
                                        <option value="America/Chicago">Chicago (UTC-6)</option>
                                        <option value="America/Denver">Denver (UTC-7)</option>
                                        <option value="America/Los_Angeles">Los Angeles (UTC-8)</option>
                                    </optgroup>
                                    {/* Europe timezones */}
                                    <optgroup label="Europe">
                                        <option value="Europe/London">London (UTC+0)</option>
                                        <option value="Europe/Paris">Paris (UTC+1)</option>
                                        <option value="Europe/Berlin">Berlin (UTC+1)</option>
                                    </optgroup>
                                </select>
                            </InputGroup>

                            {/* Type Toggle */}
                            <InputGroup label="Type">
                                <ToggleSwitch
                                    options={[
                                        { value: 'online', label: 'Online', icon: <Video size={16} /> },
                                        { value: 'onsite', label: 'On-site', icon: <MapPin size={16} /> },
                                    ]}
                                    active={formData.sessionType}
                                    onChange={(val) => setFormData(prev => ({ ...prev, sessionType: val }))}
                                />
                            </InputGroup>

                            {/* Location/Link */}
                            <InputGroup label={formData.sessionType === 'online' ? 'Meeting Link' : 'Location'} icon={formData.sessionType === 'online' ? Video : MapPin}>
                                {formData.sessionType === 'online' ? (
                                    <input
                                        type="url"
                                        value={formData.link}
                                        onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                                        placeholder="https://zoom.us/j/..."
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-[#D6FF59] focus:ring-2 focus:ring-[#D6FF59]/20 outline-none transition-colors font-medium"
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                        placeholder="e.g., Conference Room A"
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-[#D6FF59] focus:ring-2 focus:ring-[#D6FF59]/20 outline-none transition-colors font-medium"
                                    />
                                )}
                            </InputGroup>

                            {/* Time Range */}
                            <div className="grid grid-cols-2 gap-4">
                                <InputGroup label="Start" icon={Clock}>
                                    <select
                                        value={formData.startTime}
                                        onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-[#D6FF59] focus:ring-2 focus:ring-[#D6FF59]/20 outline-none transition-colors font-medium"
                                    >
                                        {timeSlots.map(slot => (
                                            <option key={slot} value={slot}>{slot}</option>
                                        ))}
                                    </select>
                                </InputGroup>
                                <InputGroup label="End">
                                    <select
                                        value={formData.endTime}
                                        onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-[#D6FF59] focus:ring-2 focus:ring-[#D6FF59]/20 outline-none transition-colors font-medium"
                                    >
                                        {timeSlots.map(slot => (
                                            <option key={slot} value={slot}>{slot}</option>
                                        ))}
                                    </select>
                                </InputGroup>
                            </div>

                            {/* Duration Chips */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-slate-600 tracking-widest">Quick Duration</label>
                                <div className="flex gap-2">
                                    {durationChips.map(chip => (
                                        <button
                                            key={chip.label}
                                            onClick={() => handleDurationClick(chip.hours)}
                                            className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-xs font-bold"
                                        >
                                            {chip.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <InputGroup label="Description">
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Event details..."
                                    rows="3"
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-[#D6FF59] focus:ring-2 focus:ring-[#D6FF59]/20 outline-none transition-colors font-medium resize-none"
                                />
                            </InputGroup>
                        </div>

                        {/* RIGHT: Instructors */}
                        <div className="space-y-6">
                            <InputGroup label="Instructors" icon={User}>
                                {loadingInstructors ? (
                                    <p className="text-slate-500 text-sm py-4">Loading instructors...</p>
                                ) : (
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                        {instructors.map(trainer => (
                                            <TrainerCard
                                                key={trainer.id}
                                                trainer={trainer}
                                                selected={formData.trainer_ids.includes(trainer.id)}
                                                onClick={() => handleTrainerToggle(trainer.id)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </InputGroup>

                            {/* Selected Trainers Summary */}
                            {selectedTrainers.length > 0 && (
                                <div className="pt-4 border-t-2 border-slate-100">
                                    <p className="text-xs font-bold text-slate-600 mb-3 uppercase tracking-wider">
                                        Assigned Instructors ({selectedTrainers.length})
                                    </p>
                                    <div className="space-y-2">
                                        {selectedTrainers.map((trainer, idx) => {
                                            const trainerColor = getTrainerColor(trainer.id); // NEW: Use HSL color generation
                                            return (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[10px]" style={{ backgroundColor: trainerColor }}>
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
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer - Action Buttons */}
                <div className="border-t border-slate-100 p-8 bg-slate-50 flex gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl font-black shadow-lg hover:shadow-xl transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                Save Schedule
                            </>
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl font-black hover:bg-slate-50 hover:border-slate-300 transition-all"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
