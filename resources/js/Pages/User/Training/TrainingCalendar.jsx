import React, { useEffect, useState, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Calendar as CalendarIcon, ChevronLeft, ChevronRight,
    Clock, MapPin, Video, Filter, Search, AlertCircle, X, Users, FileText
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';

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

// Extract date and time from ISO string or date object
const parseEventDateTime = (event) => {
    let eventDate = null;
    let startTime = '';
    
    // If event has 'start' field (ISO format from backend)
    if (event.start) {
        const startDate = new Date(event.start);
        eventDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        startTime = startDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }
    // Fallback: if event has 'date' and 'start_time' fields
    else if (event.date && event.start_time) {
        eventDate = normalizeDate(event.date);
        startTime = event.start_time;
    }
    // Last resort: parse 'date' field only
    else if (event.date) {
        eventDate = normalizeDate(event.date);
        startTime = '';
    }
    
    return { eventDate, startTime };
};

// --- REUSABLE COMPONENTS ---

const EventPill = ({ event, onClick }) => {
    const isOnline = isOnlineEvent(event.location);
    const { eventDate, startTime } = parseEventDateTime(event);

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
                e.stopPropagation();
                onClick?.(event);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    onClick?.(event);
                }
            }}
            className={`w-full text-left px-2 py-1.5 rounded-lg mb-1 text-xs font-bold truncate flex items-center gap-1.5 border-l-4 shadow-sm cursor-pointer ${
                isOnline
                ? 'bg-blue-50 text-blue-700 border-blue-500 hover:bg-blue-100'
                : 'bg-emerald-50 text-emerald-700 border-emerald-500 hover:bg-emerald-100'
            }`}
        >
            {isOnline ? <Video size={10} /> : <MapPin size={10} />}
            <span className="truncate">{startTime} {event.title}</span>
        </motion.div>
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

const CalendarDay = ({ day, events = [], isCurrentMonth, isToday, onClick, onEventClick }) => {
    const hasEvents = events && events.length > 0;
    
    // Generate accessible label for calendar day
    const getDayLabel = () => {
        if (!day) return 'Empty day';
        const dayName = day.toLocaleDateString('id-ID', { weekday: 'long' });
        const dateStr = day.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
        let label = `${dayName}, ${dateStr}`;
        if (hasEvents) {
            label += `, ${events.length} peristiwa`;
        }
        return label;
    };

    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onClick?.(day)}
            role="button"
            tabIndex={0}
            aria-label={getDayLabel()}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick?.(day);
                }
            }}
            className={`h-24 border rounded-lg p-1.5 flex flex-col text-xs relative transition cursor-pointer ${
                isToday
                ? 'bg-indigo-50 border-indigo-200'
                : isCurrentMonth
                ? 'bg-white border-slate-200 hover:border-slate-300'
                : 'bg-slate-50 border-slate-100'
            }`}
        >
            <span className={`font-bold mb-1 ${isToday ? 'text-indigo-600' : isCurrentMonth ? 'text-slate-900' : 'text-slate-400'}`}>
                {day ? day.getDate() : ''}
            </span>
                            <div className="flex-1 overflow-y-auto">
                                {hasEvents && events.slice(0, 2).map((event, i) => (
                                    <EventPill key={i} event={event} onClick={onEventClick} />
                                ))}
                                {hasEvents && events.length > 2 && (
                                    <div className="text-xs text-slate-500 font-bold px-1">+{events.length - 2} more</div>
                                )}
                            </div>
        </motion.div>
    );
};

// Modal untuk menampilkan detail jadwal
const EventDetailModal = ({ event, isOpen, onClose, dayEvents }) => {
    if (!isOpen || !event) return null;

    const isOnline = isOnlineEvent(event.location);
    const { startTime } = parseEventDateTime(event);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200"
            >
                {/* Header */}
                <div className={`p-6 ${isOnline ? 'bg-gradient-to-r from-blue-50 to-blue-100' : 'bg-gradient-to-r from-emerald-50 to-emerald-100'} border-b border-slate-200 flex items-start justify-between`}>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            {isOnline ? (
                                <div className="px-3 py-1 bg-blue-200 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1">
                                    <Video size={12} /> Online
                                </div>
                            ) : (
                                <div className="px-3 py-1 bg-emerald-200 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-1">
                                    <MapPin size={12} /> On-Site
                                </div>
                            )}
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                event.status === 'ongoing' ? 'bg-orange-200 text-orange-700' :
                                event.status === 'scheduled' ? 'bg-indigo-200 text-indigo-700' :
                                'bg-slate-200 text-slate-700'
                            }`}>
                                {event.status || 'scheduled'}
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">{event.title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/50 rounded-lg transition"
                    >
                        <X size={24} className="text-slate-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Program Info */}
                    {event.program && (
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <p className="text-xs text-slate-600 font-semibold mb-1">PROGRAM</p>
                            <h3 className="text-lg font-bold text-slate-900">{event.program.title}</h3>
                            {event.program.category && (
                                <p className="text-sm text-slate-600 mt-2">Kategori: {event.program.category}</p>
                            )}
                        </div>
                    )}

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                            <Clock size={20} className="text-indigo-600 mt-1" />
                            <div>
                                <p className="text-xs text-slate-600 font-semibold mb-1">WAKTU MULAI</p>
                                <p className="text-sm font-bold text-slate-900">{startTime}</p>
                                <p className="text-xs text-slate-600 mt-1">
                                    {new Date(event.start).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>
                        
                        {event.end && (
                            <div className="flex items-start gap-3">
                                <Clock size={20} className="text-indigo-600 mt-1" />
                                <div>
                                    <p className="text-xs text-slate-600 font-semibold mb-1">WAKTU AKHIR</p>
                                    <p className="text-sm font-bold text-slate-900">
                                        {new Date(event.end).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-3">
                        <MapPin size={20} className={isOnline ? 'text-blue-600' : 'text-emerald-600'} />
                        <div>
                            <p className="text-xs text-slate-600 font-semibold mb-1">LOKASI</p>
                            {isOnline ? (
                                <a href={event.location} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-blue-600 hover:underline">
                                    {event.location}
                                </a>
                            ) : (
                                <p className="text-sm font-bold text-slate-900">{event.location || 'Lokasi TBD'}</p>
                            )}
                        </div>
                    </div>

                    {/* Capacity & Enrollment */}
                    {event.capacity && (
                        <div className="flex items-start gap-3">
                            <Users size={20} className="text-purple-600" />
                            <div>
                                <p className="text-xs text-slate-600 font-semibold mb-1">KAPASITAS</p>
                                <p className="text-sm font-bold text-slate-900">
                                    {event.enrolled_count || 0} / {event.capacity} peserta
                                </p>
                                <div className="w-48 h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                                        style={{ width: `${Math.min(100, ((event.enrolled_count || 0) / event.capacity) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {event.description && (
                        <div className="flex gap-3">
                            <FileText size={20} className="text-amber-600 flex-shrink-0 mt-1" />
                            <div>
                                <p className="text-xs text-slate-600 font-semibold mb-2">DESKRIPSI</p>
                                <p className="text-sm text-slate-700 leading-relaxed">{event.description}</p>
                            </div>
                        </div>
                    )}

                    {/* Other Events on Same Day */}
                    {dayEvents && dayEvents.length > 1 && (
                        <div className="border-t pt-6">
                            <p className="text-sm font-bold text-slate-900 mb-3">Jadwal Lain pada Hari Ini ({dayEvents.length} total)</p>
                            <div className="space-y-2">
                                {dayEvents.map((ev, idx) => (
                                    <motion.button
                                        key={idx}
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => onClose()}
                                        className={`w-full text-left p-3 rounded-lg border-l-4 transition ${
                                            ev.id === event.id
                                            ? 'bg-indigo-50 border-indigo-500'
                                            : 'bg-slate-50 border-slate-300 hover:bg-slate-100'
                                        }`}
                                    >
                                        <p className="text-xs font-bold text-slate-600 mb-1">
                                            {new Date(ev.start).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <p className="text-sm font-bold text-slate-900">{ev.title}</p>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t p-6 bg-slate-50 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-bold transition"
                    >
                        Tutup
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default function TrainingCalendar({ auth, flash }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [trainings, setTrainings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [filters, setFilters] = useState({ online: true, onsite: true });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchPreview, setSearchPreview] = useState([]);

    useEffect(() => {
        fetchSchedules();
    }, []);

    // Debounce search preview
    useEffect(() => {
        const handler = setTimeout(() => {
            if (searchQuery.trim()) {
                const filtered = trainings.filter(t => 
                    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
                );
                setSearchPreview(filtered);
            } else {
                setSearchPreview([]);
            }
        }, 300);

        return () => clearTimeout(handler);
    }, [searchQuery, trainings]);

    const fetchSchedules = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/user/training-schedules', { 
                headers: { 'Accept': 'application/json' } 
            });
            if (res.ok) {
                const data = await res.json();
                console.log('User schedules data:', data);
                setTrainings(data.data || data || []);
            } else {
                console.error('API Response Error:', res.status, res.statusText);
                setTrainings([]);
            }
        } catch (err) {
            console.error('Error fetching schedules', err);
            setTrainings([]);
        } finally {
            setLoading(false);
        }
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
                const { eventDate } = parseEventDateTime(t);
                if (!eventDate) return;
                
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
                    const { eventDate } = parseEventDateTime(t);
                    if (!eventDate) return false;
                    
                    const isOnline = isOnlineEvent(t.location);
                    const matchesFilter = (isOnline && filters.online) || (!isOnline && filters.onsite);
                    return eventDate >= today && matchesFilter;
                } catch (err) {
                    console.error('Invalid date for upcoming event:', t, err);
                    return false;
                }
            })
            .sort((a, b) => {
                const { eventDate: dateA } = parseEventDateTime(a);
                const { eventDate: dateB } = parseEventDateTime(b);
                return (dateA || new Date(0)) - (dateB || new Date(0));
            })
            .slice(0, 5);
    }, [trainings, filters]);

    const onlineCount = useMemo(() => 
        trainings.filter(t => isOnlineEvent(t.location)).length
    , [trainings]);
    
    const onsiteCount = useMemo(() => 
        trainings.filter(t => !isOnlineEvent(t.location)).length
    , [trainings]);

    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    const goToToday = () => setCurrentMonth(new Date());

    const monthYear = currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const today = normalizeDate(new Date());

    // Handle calendar day click - show events for that day
    const handleDayClick = (day) => {
        if (!day) return;
        setSelectedDate(day);
        const dayKey = day.toDateString();
        const dayEventsForModal = eventsByDate[dayKey] || [];
        if (dayEventsForModal.length > 0) {
            setSelectedEvent(dayEventsForModal[0]); // Show first event by default
        }
    };

    // Get events for selected date for modal display
    const selectedDateKey = selectedDate ? selectedDate.toDateString() : null;
    const dayEventsForModal = selectedDateKey ? (eventsByDate[selectedDateKey] || []) : [];

    return (
        <AppLayout user={auth?.user}>
            <Head title="Jadwal Training" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                <CalendarIcon size={20} className="text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900">Jadwal Pelatihan Anda</h1>
                        </div>
                        <p className="text-slate-600">Lihat dan kelola jadwal pelatihan yang akan datang</p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Calendar */}
                        <div className="lg:col-span-2">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200"
                            >
                                {/* Calendar Header Controls */}
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-slate-900">{monthYear}</h2>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={prevMonth}
                                            className="p-2 hover:bg-slate-100 rounded-lg transition"
                                            title="Bulan sebelumnya"
                                        >
                                            <ChevronLeft size={20} className="text-slate-600" />
                                        </button>
                                        <button
                                            onClick={goToToday}
                                            className="px-4 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
                                        >
                                            Hari Ini
                                        </button>
                                        <button
                                            onClick={nextMonth}
                                            className="p-2 hover:bg-slate-100 rounded-lg transition"
                                            title="Bulan berikutnya"
                                        >
                                            <ChevronRight size={20} className="text-slate-600" />
                                        </button>
                                    </div>
                                </div>

                                {/* Day Headers */}
                                <div className="grid grid-cols-7 gap-2 mb-4">
                                    {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                                        <div key={day} className="h-10 flex items-center justify-center font-bold text-slate-600 text-sm">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar Grid */}
                                {loading ? (
                                    <div className="h-96 flex items-center justify-center text-slate-500">
                                        <div className="animate-spin">
                                            <CalendarIcon size={32} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-7 gap-2">
                                        {monthDays.map((day, i) => (
                                            <CalendarDay
                                                key={i}
                                                day={day}
                                                events={day ? eventsByDate[day.toDateString()] : []}
                                                isCurrentMonth={day && day.getMonth() === currentMonth.getMonth()}
                                                isToday={day && normalizeDate(day).getTime() === today.getTime()}
                                                onClick={handleDayClick}
                                                onEventClick={(event) => {
                                                    setSelectedEvent(event);
                                                    setSelectedDate(day);
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}

                                {trainings.length === 0 && !loading && (
                                    <div className="h-96 flex flex-col items-center justify-center text-slate-500">
                                        <AlertCircle size={48} className="mb-2 opacity-50" />
                                        <p className="font-bold">Tidak ada jadwal pelatihan</p>
                                        <p className="text-sm">Jadwal pelatihan Anda akan muncul di sini</p>
                                    </div>
                                )}
                            </motion.div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Filters */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <Filter size={18} className="text-indigo-600" />
                                    <h3 className="font-bold text-slate-900">Filter</h3>
                                </div>
                                <div className="space-y-2">
                                    <FilterCheckbox
                                        label="Online"
                                        count={onlineCount}
                                        color="bg-blue-500"
                                        checked={filters.online}
                                        onChange={() => setFilters({ ...filters, online: !filters.online })}
                                    />
                                    <FilterCheckbox
                                        label="On-site"
                                        count={onsiteCount}
                                        color="bg-emerald-500"
                                        checked={filters.onsite}
                                        onChange={() => setFilters({ ...filters, onsite: !filters.onsite })}
                                    />
                                </div>

                                {/* Search */}
                                <div className="mt-4 pt-4 border-t border-slate-200">
                                    <div className="relative">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Cari pelatihan..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            autoComplete="off"
                                            className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                        />

                                        {/* Search Dropdown Preview */}
                                        {searchQuery && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto border border-slate-200">
                                                {searchPreview.length > 0 ? (
                                                    <div className="divide-y divide-slate-200">
                                                        <div className="px-3 py-2 bg-slate-50 text-xs font-bold text-slate-600">
                                                            Ditemukan {searchPreview.length} pelatihan
                                                        </div>
                                                        {searchPreview.slice(0, 5).map((result, idx) => (
                                                            <div
                                                                key={idx}
                                                                onClick={() => setSelectedEvent(result)}
                                                                className="px-3 py-2 hover:bg-slate-50 transition cursor-pointer"
                                                            >
                                                                <p className="font-semibold text-sm text-slate-900 line-clamp-1">{result.title}</p>
                                                                <p className="text-xs text-slate-500 line-clamp-1">{result.location || 'Lokasi tidak tersedia'}</p>
                                                            </div>
                                                        ))}
                                                        {searchPreview.length > 5 && (
                                                            <div className="px-3 py-2 text-center text-xs text-slate-600 border-t border-slate-200">
                                                                +{searchPreview.length - 5} pelatihan lainnya
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="px-3 py-3 text-center text-xs text-slate-500">
                                                        Tidak ada pelatihan ditemukan untuk "{searchQuery}"
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Upcoming Events */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200"
                            >
                                <h3 className="font-bold text-slate-900 mb-4">Jadwal Mendatang</h3>
                                <div className="space-y-3">
                                    {upcomingEvents.length > 0 ? (
                                        upcomingEvents.map((event, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="p-3 border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition"
                                            >
                                                <div className="font-bold text-sm text-slate-900 truncate">{event.title}</div>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                                                    <Clock size={12} />
                                                    <span>{new Date(event.start).toLocaleDateString('id-ID')} {new Date(event.start).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                                                    {isOnlineEvent(event.location) ? (
                                                        <>
                                                            <Video size={12} />
                                                            <span>Online</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <MapPin size={12} />
                                                            <span>{event.location || 'TBD'}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="text-center py-4 text-slate-500 text-sm">
                                            <p>Tidak ada jadwal yang akan datang</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Event Detail Modal */}
                <EventDetailModal
                    event={selectedEvent}
                    isOpen={!!selectedEvent}
                    onClose={() => {
                        setSelectedEvent(null);
                        setSelectedDate(null);
                    }}
                    dayEvents={dayEventsForModal}
                />
            </div>
        </AppLayout>
    );
}

