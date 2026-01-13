
import React, { useEffect, useState, useMemo } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus,
    Clock, MapPin, Video, Filter, Search, Download, MoreHorizontal
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import ScheduleManager from './ScheduleManager';

// --- HELPER FUNCTIONS ---

const isOnlineEvent = (location) => {
    if (!location) return false;
    const loc = location.toLowerCase();
    return loc.includes('http') || loc.includes('zoom') || loc.includes('meet') || loc.includes('teams');
};

const normalizeDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

// --- REUSABLE COMPONENTS ---

const EventPill = ({ event, onClick }) => {
    const isOnline = isOnlineEvent(event.location);

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => { e.stopPropagation(); onClick(event); }}
            className={`w-full text-left px-2 py-1.5 rounded-lg mb-1 text-xs font-bold truncate flex items-center gap-1.5 border-l-4 shadow-sm ${
                isOnline
                ? 'bg-blue-50 text-blue-700 border-blue-500 hover:bg-blue-100'
                : 'bg-emerald-50 text-emerald-700 border-emerald-500 hover:bg-emerald-100'
            }`}
        >
            {isOnline ? <Video size={10} /> : <MapPin size={10} />}
            <span className="truncate">{event.start_time} {event.title}</span>
        </motion.button>
    );
};

const FilterCheckbox = ({ label, count, color, checked, onChange }) => (
    <div className="flex items-center justify-between py-2 group cursor-pointer" onClick={onChange}>
        <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition ${checked ? `${color} border-transparent` : 'border-slate-300 bg-white'}`}>
                {checked && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>
            <span className={`text-sm font-medium transition ${checked ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`}>{label}</span>
        </div>
        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">{count}</span>
    </div>
);

// --- MAIN COMPONENT ---

export default function TrainingCalendar() {
    const { auth } = usePage().props;
    const user = auth?.user || {};

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [trainings, setTrainings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);
    const [showManager, setShowManager] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [filters, setFilters] = useState({ online: true, onsite: true });
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchSchedules();
    }, []);

    const fetchSchedules = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/training-schedules', { headers: { 'Accept': 'application/json' } });
            if (res.ok) {
                const data = await res.json();
                setTrainings(data.data || data || []);
            } else {
                setTrainings([]);
            }
        } catch (err) {
            console.error('Error fetching schedules', err);
            setTrainings([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddEvent = (date) => {
        setSelectedDate(date || new Date());
        setEditingSchedule(null);
        setShowManager(true);
    };

    const handleEditEvent = (event) => {
        setEditingSchedule(event);
        setSelectedDate(new Date(event.date));
        setShowManager(true);
    };

    const handleSaved = () => {
        setShowManager(false);
        setEditingSchedule(null);
        fetchSchedules();
    };

    const monthDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 0);
        const days = [];

        for (let i = 0; i < start.getDay(); i++) days.push(null);
        for (let d = 1; d <= end.getDate(); d++) days.push(new Date(year, month, d));
        while (days.length % 7 !== 0) days.push(null);

        return days;
    }, [currentMonth]);

    const eventsByDate = useMemo(() => {
        const map = {};
        trainings.forEach(t => {
            try {
                const eventDate = normalizeDate(t.date);
                const key = eventDate.toDateString();
                const isOnline = isOnlineEvent(t.location);
                const matchesFilter = (isOnline && filters.online) || (!isOnline && filters.onsite);
                const matchesSearch = !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase());

                if (matchesFilter && matchesSearch) {
                    if (!map[key]) map[key] = [];
                    map[key].push(t);
                }
            } catch (err) {
                console.error('Invalid date for training:', t, err);
            }
        });
        return map;
    }, [trainings, filters, searchQuery]);

    const upcomingEvents = useMemo(() => {
        const today = normalizeDate(new Date());
        return trainings
            .filter(t => {
                try {
                    const eventDate = normalizeDate(t.date);
                    const isOnline = isOnlineEvent(t.location);
                    const matchesFilter = (isOnline && filters.online) || (!isOnline && filters.onsite);
                    return eventDate >= today && matchesFilter;
                } catch (err) {
                    console.error('Invalid date for upcoming event:', t, err);
                    return false;
                }
            })
            .sort((a, b) => normalizeDate(a.date) - normalizeDate(b.date))
            .slice(0, 4);
    }, [trainings, filters]);

    const onlineCount = useMemo(() => 
        trainings.filter(t => isOnlineEvent(t.location)).length
    , [trainings]);
    
    const onsiteCount = useMemo(() => 
        trainings.filter(t => !isOnlineEvent(t.location)).length
    , [trainings]);

    const handleSyncCalendar = () => {
        if (trainings.length === 0) {
            showToast('No training schedules to export', 'info');
            return;
        }

        console.log('Starting calendar sync with', trainings.length, 'events');
        console.log('Sample event data:', trainings[0]);

        // Generate .ics file content
        let icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Wondr Schedule Studio//Training Calendar//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'X-WR-CALNAME:Training Calendar',
            'X-WR-TIMEZONE:Asia/Jakarta'
        ];

        let successCount = 0;
        let errorCount = 0;

        trainings.forEach(event => {
            try {
                // Validate event data
                if (!event.date || !event.start_time || !event.end_time) {
                    console.warn('Missing required fields:', event);
                    errorCount++;
                    return;
                }

                // Parse date safely
                let eventDate;
                if (typeof event.date === 'string') {
                    // Handle "YYYY-MM-DD" format
                    const dateParts = event.date.split('-');
                    if (dateParts.length !== 3) {
                        console.warn('Invalid date format:', event.date);
                        errorCount++;
                        return;
                    }
                    eventDate = new Date(
                        parseInt(dateParts[0]),
                        parseInt(dateParts[1]) - 1,
                        parseInt(dateParts[2]),
                        0, 0, 0
                    );
                } else {
                    eventDate = new Date(event.date);
                }

                // Validate parsed date
                if (isNaN(eventDate.getTime())) {
                    console.warn('Invalid date:', event.date);
                    errorCount++;
                    return;
                }

                // Parse time strings
                const parseTime = (timeStr) => {
                    if (!timeStr) return { hours: 0, minutes: 0 };
                    // Handle both "HH:MM:SS" and "HH:MM" formats
                    const cleanTime = String(timeStr).trim();
                    const parts = cleanTime.split(':');
                    return {
                        hours: parseInt(parts[0]) || 0,
                        minutes: parseInt(parts[1]) || 0
                    };
                };

                const startTime = parseTime(event.start_time);
                const endTime = parseTime(event.end_time);

                // Create full datetime objects
                const startDate = new Date(
                    eventDate.getFullYear(),
                    eventDate.getMonth(),
                    eventDate.getDate(),
                    startTime.hours,
                    startTime.minutes,
                    0
                );

                const endDate = new Date(
                    eventDate.getFullYear(),
                    eventDate.getMonth(),
                    eventDate.getDate(),
                    endTime.hours,
                    endTime.minutes,
                    0
                );

                // Final validation
                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                    console.warn('Invalid datetime created for event:', event);
                    errorCount++;
                    return;
                }

                // Format to ICS datetime format
                const formatIcsDate = (date) => {
                    const pad = (n) => String(n).padStart(2, '0');
                    return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
                };

                const description = (event.description || 'No description provided').replace(/\n/g, '\\n');
                const location = event.location || 'TBD';
                const status = (event.status || 'CONFIRMED').toUpperCase();

                icsContent.push('BEGIN:VEVENT');
                icsContent.push(`UID:${event.id}@wondr-schedule-studio`);
                icsContent.push(`DTSTAMP:${formatIcsDate(new Date())}`);
                icsContent.push(`DTSTART:${formatIcsDate(startDate)}`);
                icsContent.push(`DTEND:${formatIcsDate(endDate)}`);
                icsContent.push(`SUMMARY:${event.title || 'Untitled Event'}`);
                icsContent.push(`DESCRIPTION:${description}`);
                icsContent.push(`LOCATION:${location}`);
                icsContent.push(`STATUS:${status}`);
                icsContent.push('END:VEVENT');

                successCount++;
            } catch (err) {
                console.error('Error processing event:', event, err);
                errorCount++;
            }
        });

        icsContent.push('END:VCALENDAR');

        console.log(`Export complete: ${successCount} success, ${errorCount} errors`);

        if (successCount === 0) {
            showToast('Failed to export events. Check console for details.', 'error');
            return;
        }

        // Create blob and download
        const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `training-calendar-${new Date().toISOString().split('T')[0]}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        if (errorCount > 0) {
            showToast(`Calendar exported with ${successCount} events (${errorCount} events skipped due to errors)`, 'success');
        }
    };

    return (
        <AdminLayout user={user}>
            <Head title="Wondr Scheduler Pro" />

            <div className="pb-20">

                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-slate-900 text-[#D6FF59] text-[10px] font-bold uppercase tracking-wider rounded-full">
                                Event Management
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Training Calendar</h1>
                        <p className="text-slate-500 font-medium mt-1">Visual schedule management with smart filtering.</p>
                    </div>

                    <div className="flex gap-3 relative z-10">
                        <button
                            onClick={handleSyncCalendar}
                            className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm hover:border-slate-300 hover:shadow-md active:scale-95 cursor-pointer"
                            type="button"
                        >
                            <Download size={18} /> Sync Calendar
                        </button>
                        <button
                            onClick={() => handleAddEvent(null)}
                            className="flex items-center gap-2 px-6 py-3 bg-[#D6FF59] text-slate-900 rounded-xl font-bold hover:bg-[#cbf542] transition shadow-lg shadow-lime-200 hover:-translate-y-1 active:scale-95 cursor-pointer"
                            type="button"
                        >
                            <Plus size={18} /> New Schedule
                        </button>
                    </div>
                </div>

                <div className="flex flex-col xl:flex-row gap-8">

                    {/* --- LEFT SIDEBAR (FILTERS & UPCOMING) --- */}
                    <div className="w-full xl:w-[320px] flex flex-col gap-6">

                        {/* Filters Card */}
                        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                            <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-2">
                                <Filter size={14} /> View Filters
                            </h3>
                            <div className="space-y-1">
                                <FilterCheckbox
                                    label="Online Training"
                                    count={onlineCount}
                                    color="bg-blue-500"
                                    checked={filters.online}
                                    onChange={() => setFilters(prev => ({ ...prev, online: !prev.online }))}
                                />
                                <FilterCheckbox
                                    label="On-site Workshop"
                                    count={onsiteCount}
                                    color="bg-emerald-500"
                                    checked={filters.onsite}
                                    onChange={() => setFilters(prev => ({ ...prev, onsite: !prev.onsite }))}
                                />
                            </div>
                        </div>

                        {/* Upcoming Events List */}
                        <div className="bg-slate-900 p-6 rounded-[32px] text-white shadow-xl relative overflow-hidden flex-1 min-h-[300px]">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>

                            <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-6 flex items-center gap-2 relative z-10">
                                <Clock size={14} /> Coming Up
                            </h3>

                            <div className="space-y-4 relative z-10">
                                {loading ? (
                                    <p className="text-slate-500 text-sm">Loading events...</p>
                                ) : upcomingEvents.length === 0 ? (
                                    <p className="text-slate-500 text-sm">No upcoming events.</p>
                                ) : (
                                    upcomingEvents.map(ev => (
                                        <div
                                            key={ev.id}
                                            onClick={() => handleEditEvent(ev)}
                                            className="group flex gap-4 p-3 rounded-2xl hover:bg-white/5 transition cursor-pointer border border-transparent hover:border-white/10"
                                        >
                                            <div className="flex flex-col items-center justify-center bg-white/10 w-12 h-14 rounded-xl border border-white/10 group-hover:border-[#D6FF59]/50 group-hover:bg-[#D6FF59]/10 transition-colors flex-shrink-0">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">
                                                    {new Date(ev.date).toLocaleString('default', { month: 'short' })}
                                                </span>
                                                <span className="text-lg font-bold text-white">
                                                    {new Date(ev.date).getDate()}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-white text-sm truncate group-hover:text-[#D6FF59] transition-colors">
                                                    {ev.title}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                                        <Clock size={10} /> {ev.start_time}
                                                    </span>
                                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                                        {isOnlineEvent(ev.location) ? <Video size={10} /> : <MapPin size={10} />}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* --- MAIN CALENDAR GRID --- */}
                    <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">

                        {/* Calendar Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-black text-slate-900">
                                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </h2>
                                <div className="flex bg-slate-100 p-1 rounded-xl">
                                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2 hover:bg-white rounded-lg text-slate-500 shadow-sm transition"><ChevronLeft size={18} /></button>
                                    <button onClick={() => setCurrentMonth(new Date())} className="px-4 text-xs font-bold text-slate-600 hover:text-slate-900 transition">Today</button>
                                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2 hover:bg-white rounded-lg text-slate-500 shadow-sm transition"><ChevronRight size={18} /></button>
                                </div>
                            </div>
                            <div className="relative flex-shrink-0">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search event..."
                                    className="pl-10 pr-4 py-2 bg-slate-50 rounded-xl text-sm font-bold border-none outline-none focus:ring-2 focus:ring-[#D6FF59]"
                                />
                            </div>
                        </div>

                        {/* Days Header */}
                        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Body */}
                        <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-slate-200 gap-[1px]">
                            {monthDays.map((day, idx) => {
                                if (!day) return <div key={idx} className="bg-[#FAFAFA] min-h-[140px]" />;

                                const dateKey = normalizeDate(day).toDateString();
                                const events = eventsByDate[dateKey] || [];
                                const isToday = normalizeDate(new Date()).toDateString() === dateKey;

                                return (
                                    <div
                                        key={idx}
                                        onClick={() => handleAddEvent(day)}
                                        className={`bg-white min-h-[140px] p-2 relative group hover:bg-slate-50 transition cursor-pointer flex flex-col ${isToday ? 'bg-indigo-50/30' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${
                                                isToday
                                                ? 'bg-slate-900 text-white shadow-lg'
                                                : 'text-slate-500 group-hover:text-slate-900'
                                            }`}>
                                                {day.getDate()}
                                            </span>

                                            {/* Add Button on Hover */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleAddEvent(day); }}
                                                className="opacity-0 group-hover:opacity-100 p-1 bg-[#D6FF59] rounded-lg text-slate-900 hover:scale-110 transition-all shadow-sm"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>

                                        <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
                                            {events.slice(0, 3).map(ev => (
                                                <EventPill key={ev.id} event={ev} onClick={handleEditEvent} />
                                            ))}
                                            {events.length > 3 && (
                                                <div className="text-xs text-slate-400 px-2 py-1">+{events.length - 3} more</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>

                {/* --- SCHEDULE MANAGER (OVERLAY) --- */}
                <AnimatePresence>
                    {showManager && (
                        <ScheduleManager
                            date={selectedDate}
                            schedule={editingSchedule}
                            onClose={() => { setShowManager(false); setEditingSchedule(null); }}
                            onSaved={handleSaved}
                        />
                    )}
                </AnimatePresence>

            </div>
        </AdminLayout>
    );
}
