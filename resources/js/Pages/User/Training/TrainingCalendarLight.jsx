import React, { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { Head } from '@inertiajs/react';
import {
    Calendar as CalendarIcon, ChevronLeft, ChevronRight,
    Clock, MapPin, Video, Filter, X
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';

// ============================================
// UTILITY FUNCTIONS (Lightweight)
// ============================================

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

const parseEventDateTime = (event) => {
    if (event.start) {
        const startDate = new Date(event.start);
        const eventDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const startTime = startDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        return { eventDate, startTime };
    }
    if (event.date && event.start_time) {
        return { eventDate: normalizeDate(event.date), startTime: event.start_time };
    }
    if (event.date) {
        return { eventDate: normalizeDate(event.date), startTime: '' };
    }
    return { eventDate: null, startTime: '' };
};

// ============================================
// MEMOIZED SUB-COMPONENTS (Prevent re-renders)
// ============================================

const EventPill = memo(({ event, onClick }) => {
    const isOnline = isOnlineEvent(event.location);
    const { startTime } = parseEventDateTime(event);

    return (
        <button
            onClick={(e) => { e.stopPropagation(); onClick?.(event); }}
            className={`w-full text-left px-2 py-1.5 rounded-lg mb-1 text-xs font-bold truncate flex items-center gap-1.5 border-l-4 shadow-sm transition-colors ${
                isOnline
                ? 'bg-blue-50 text-blue-700 border-blue-500 hover:bg-blue-100'
                : 'bg-emerald-50 text-emerald-700 border-emerald-500 hover:bg-emerald-100'
            }`}
        >
            {isOnline ? <Video size={10} /> : <MapPin size={10} />}
            <span className="truncate">{startTime} {event.title}</span>
        </button>
    );
});

const CalendarDay = memo(({ day, events = [], isCurrentMonth, isToday, onClick, onEventClick }) => {
    const hasEvents = events && events.length > 0;

    return (
        <div
            onClick={() => day && onClick?.(day)}
            className={`bg-white min-h-[140px] p-2 relative group hover:bg-slate-50 transition-colors cursor-pointer flex flex-col border-b border-r border-slate-200 ${isToday ? 'bg-indigo-50/30' : ''}`}
        >
            <div className="flex justify-between items-start mb-2">
                <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${
                    isToday
                    ? 'bg-slate-900 text-white shadow-lg'
                    : isCurrentMonth
                    ? 'text-slate-900'
                    : 'text-slate-400'
                }`}>
                    {day ? day.getDate() : ''}
                </span>
            </div>

            <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
                {hasEvents && events.slice(0, 3).map((event, i) => (
                    <EventPill key={i} event={event} onClick={onEventClick} />
                ))}
                {hasEvents && events.length > 3 && (
                    <div className="text-xs text-slate-400 px-2 py-1">+{events.length - 3} more</div>
                )}
            </div>
        </div>
    );
});

const FilterCheckbox = memo(({ label, count, checked, onChange }) => (
    <div 
        className="flex items-center justify-between py-2 cursor-pointer select-none" 
        onClick={onChange}
    >
        <label className="flex items-center gap-2 cursor-pointer flex-1">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="w-4 h-4 rounded border-slate-300 cursor-pointer accent-indigo-600"
            />
            <span className="text-sm font-medium text-slate-700">{label}</span>
        </label>
        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
            {count}
        </span>
    </div>
));

FilterCheckbox.displayName = 'FilterCheckbox';

const EventDetailModal = memo(({ event, isOpen, onClose }) => {
    if (!isOpen || !event) return null;

    const isOnline = isOnlineEvent(event.location);
    const { startTime } = parseEventDateTime(event);

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
                {/* Close Button */}
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-lg font-bold text-slate-900">{event.title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition"
                    >
                        <X size={18} className="text-slate-400" />
                    </button>
                </div>

                {/* Event Details */}
                <div className="space-y-3">
                    {/* Start Time */}
                    <div className="flex items-start gap-3">
                        <Clock size={18} className="text-indigo-600 mt-1 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-slate-600 font-semibold mb-1">WAKTU MULAI</p>
                            <p className="text-sm font-bold text-slate-900">{startTime}</p>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-3">
                        {isOnline ? (
                            <Video size={18} className="text-blue-600 mt-1 flex-shrink-0" />
                        ) : (
                            <MapPin size={18} className="text-emerald-600 mt-1 flex-shrink-0" />
                        )}
                        <div>
                            <p className="text-xs text-slate-600 font-semibold mb-1">LOKASI</p>
                            <p className="text-sm font-bold text-slate-900">{event.location || 'TBD'}</p>
                        </div>
                    </div>

                    {/* Description */}
                    {event.description && (
                        <div className="pt-3 border-t border-slate-200">
                            <p className="text-xs text-slate-600 font-semibold mb-2">DESKRIPSI</p>
                            <p className="text-sm text-slate-700">{event.description}</p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-bold text-sm transition"
                    >
                        Tutup
                    </button>
                    {isOnline && event.location && (
                        <a
                            href={event.location}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-sm transition text-center"
                        >
                            Buka Link
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
});

// ============================================
// MAIN COMPONENT
// ============================================

export default function TrainingCalendarLight({ auth }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [trainings, setTrainings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [filters, setFilters] = useState({ online: true, onsite: true });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchPreview, setSearchPreview] = useState([]);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showDateFilter, setShowDateFilter] = useState(false);

    // ============================================
    // FETCH SCHEDULES (Lightweight API call)
    // ============================================

    useEffect(() => {
        const fetchSchedules = async () => {
            try {
                setLoading(true);
                let url = '/api/user/training-schedules';
                const params = new URLSearchParams();
                
                if (dateFrom) params.append('dateFrom', dateFrom);
                if (dateTo) params.append('dateTo', dateTo);
                
                if (params.toString()) url += `?${params.toString()}`;
                
                const res = await fetch(url, {
                    headers: { 'Accept': 'application/json' }
                });
                if (res.ok) {
                    const data = await res.json();
                    setTrainings(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error('Error fetching schedules:', err);
                setTrainings([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSchedules();
    }, [dateFrom, dateTo]);

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

    // ============================================
    // MEMOIZED CALCULATIONS
    // ============================================

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
                if (eventDate) {
                    const key = eventDate.toDateString();
                    if (!map[key]) map[key] = [];
                    map[key].push(t);
                }
            } catch (e) {
                console.error('Parse error:', e);
            }
        });
        return map;
    }, [trainings]);

    const filteredTrainings = useMemo(() => {
        return trainings.filter(t => {
            const isOnline = isOnlineEvent(t.location);
            const matchesFilter = (isOnline && filters.online) || (!isOnline && filters.onsite);
            const matchesSearch = !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesFilter && matchesSearch;
        });
    }, [trainings, filters, searchQuery]);

    const upcomingEvents = useMemo(() => {
        const now = new Date();
        return filteredTrainings
            .filter(t => {
                const { eventDate } = parseEventDateTime(t);
                return eventDate && eventDate >= normalizeDate(now);
            })
            .sort((a, b) => new Date(a.start || a.date) - new Date(b.start || b.date))
            .slice(0, 5);
    }, [filteredTrainings]);

    const monthStats = useMemo(() => {
        const online = filteredTrainings.filter(t => isOnlineEvent(t.location)).length;
        const onsite = filteredTrainings.filter(t => !isOnlineEvent(t.location)).length;
        return { online, onsite };
    }, [filteredTrainings]);

    // ============================================
    // CALLBACKS
    // ============================================

    const handleFilterChange = useCallback((type) => {
        setFilters(prev => ({ ...prev, [type]: !prev[type] }));
    }, []);

    const handlePrevMonth = useCallback(() => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    }, [currentMonth]);

    const handleNextMonth = useCallback(() => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    }, [currentMonth]);

    const handleToday = useCallback(() => {
        setCurrentMonth(new Date());
    }, []);

    const handleDayClick = useCallback((day) => {
        setSelectedDate(day);
    }, []);

    const handleEventClick = useCallback((event) => {
        setSelectedEvent(event);
    }, []);

    const handleCloseModal = useCallback(() => {
        setSelectedEvent(null);
    }, []);

    const monthYear = currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const today = normalizeDate(new Date());

    // ============================================
    // RENDER
    // ============================================

    return (
        <AppLayout user={auth?.user}>
            <Head title="Jadwal Training" />

            <div className="pb-20">

                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-600 text-[10px] font-bold uppercase tracking-wider rounded-full">
                                Jadwal Anda
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Jadwal Training</h1>
                        <p className="text-slate-500 font-medium mt-1">Lihat dan kelola jadwal pelatihan Anda.</p>
                    </div>
                </div>

                <div className="flex flex-col xl:flex-row gap-8">

                    {/* --- LEFT SIDEBAR (FILTERS & UPCOMING) --- */}
                    <div className="w-full xl:w-[320px] flex flex-col gap-6">

                        {/* Filters Card */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-2">
                                <Filter size={14} /> Filter
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <FilterCheckbox
                                        label="Online Training"
                                        count={monthStats.online}
                                        checked={filters.online}
                                        onChange={() => handleFilterChange('online')}
                                    />
                                    <FilterCheckbox
                                        label="On-site Workshop"
                                        count={monthStats.onsite}
                                        checked={filters.onsite}
                                        onChange={() => handleFilterChange('onsite')}
                                    />
                                </div>

                                {/* Date Range Filter */}
                                <div className="pt-4 border-t border-slate-100">
                                    <button
                                        onClick={() => setShowDateFilter(!showDateFilter)}
                                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors font-bold text-sm text-slate-700"
                                    >
                                        <span>📅 Date Range</span>
                                        <span className={`transition-transform ${showDateFilter ? 'rotate-180' : ''}`}>▼</span>
                                    </button>
                                    {showDateFilter && (
                                        <div className="mt-3 space-y-3 animate-in fade-in duration-200">
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Dari</label>
                                                <input
                                                    type="date"
                                                    value={dateFrom}
                                                    onChange={(e) => setDateFrom(e.target.value)}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Hingga</label>
                                                <input
                                                    type="date"
                                                    value={dateTo}
                                                    onChange={(e) => setDateTo(e.target.value)}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>
                                            {(dateFrom || dateTo) && (
                                                <button
                                                    onClick={() => { setDateFrom(''); setDateTo(''); }}
                                                    className="w-full px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                                                >
                                                    Hapus Filter
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Upcoming Events List */}
                        <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden flex-1 min-h-[300px]">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>

                            <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-6 flex items-center gap-2 relative z-10">
                                <Clock size={14} /> Jadwal Mendatang
                            </h3>

                            <div className="space-y-4 relative z-10">
                                {loading ? (
                                    <p className="text-slate-500 text-sm">Memuat jadwal...</p>
                                ) : upcomingEvents.length === 0 ? (
                                    <p className="text-slate-500 text-sm">Tidak ada jadwal mendatang.</p>
                                ) : (
                                    upcomingEvents.map(ev => (
                                        <div
                                            key={ev.id}
                                            onClick={() => handleEventClick(ev)}
                                            className="group flex gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/10"
                                        >
                                            <div className="flex flex-col items-center justify-center bg-white/10 w-12 h-14 rounded-lg border border-white/10 group-hover:border-indigo-400/50 group-hover:bg-indigo-500/10 transition-colors flex-shrink-0">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">
                                                    {new Date(ev.start || ev.date).toLocaleString('id-ID', { month: 'short' })}
                                                </span>
                                                <span className="text-lg font-bold text-white">
                                                    {new Date(ev.start || ev.date).getDate()}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-white text-sm truncate group-hover:text-indigo-300 transition-colors">
                                                    {ev.title}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                                        <Clock size={10} /> {parseEventDateTime(ev).startTime}
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
                    <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">

                        {/* Calendar Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-black text-slate-900">
                                    {currentMonth.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                                </h2>
                                <div className="flex bg-slate-100 p-1 rounded-xl">
                                    <button onClick={handlePrevMonth} className="p-2 hover:bg-white rounded-lg text-slate-500 shadow-sm transition-colors"><ChevronLeft size={18} /></button>
                                    <button onClick={handleToday} className="px-4 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors">Hari Ini</button>
                                    <button onClick={handleNextMonth} className="p-2 hover:bg-white rounded-lg text-slate-500 shadow-sm transition-colors"><ChevronRight size={18} /></button>
                                </div>
                            </div>
                            <div className="relative flex-shrink-0 w-48">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M7 1V3M9 1V3M1 5H15M2 7H14V14H2V7Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari jadwal..."
                                    className="pl-10 pr-4 py-2 bg-slate-50 rounded-xl text-sm font-bold border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                                />
                            </div>
                        </div>

                        {/* Days Header */}
                        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
                            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                                <div key={day} className="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Body */}
                        {loading ? (
                            <div className="flex items-center justify-center h-96 text-slate-500">
                                <div className="text-center">
                                    <CalendarIcon size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Memuat...</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-slate-200 gap-[1px]">
                                {monthDays.map((day, i) => (
                                    <CalendarDay
                                        key={i}
                                        day={day}
                                        events={day ? eventsByDate[day.toDateString()] : []}
                                        isCurrentMonth={day && day.getMonth() === currentMonth.getMonth()}
                                        isToday={day && day.toDateString() === today.toDateString()}
                                        onClick={handleDayClick}
                                        onEventClick={handleEventClick}
                                    />
                                ))}
                            </div>
                        )}

                        {trainings.length === 0 && !loading && (
                            <div className="h-96 flex flex-col items-center justify-center text-slate-500">
                                <CalendarIcon size={48} className="mb-2 opacity-50" />
                                <p className="font-bold">Tidak ada jadwal pelatihan</p>
                                <p className="text-sm">Jadwal Anda akan muncul di sini</p>
                            </div>
                        )}
                    </div>

                </div>

                {/* Event Detail Modal */}
                <EventDetailModal
                    event={selectedEvent}
                    isOpen={!!selectedEvent}
                    onClose={handleCloseModal}
                />

            </div>
        </AppLayout>
    );
}
