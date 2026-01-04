import React, { useState, useEffect } from 'react';
import { X, Megaphone, AlertCircle, Wrench, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AnnouncementBanner = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [dismissed, setDismissed] = useState(new Set());
    const [loading, setLoading] = useState(true);

    const typeConfig = {
        general: { 
            color: 'bg-blue-500',
            icon: Megaphone,
            textColor: 'text-blue-800',
            bgColor: 'bg-blue-50'
        },
        urgent: { 
            color: 'bg-red-500',
            icon: AlertCircle,
            textColor: 'text-red-800',
            bgColor: 'bg-red-50'
        },
        maintenance: { 
            color: 'bg-orange-500',
            icon: Wrench,
            textColor: 'text-orange-800',
            bgColor: 'bg-orange-50'
        },
        event: { 
            color: 'bg-green-500',
            icon: Calendar,
            textColor: 'text-green-800',
            bgColor: 'bg-green-50'
        }
    };

    useEffect(() => {
        // Check if announcements have been shown in this session
        const hasSeenAnnouncements = sessionStorage.getItem('hasSeenAnnouncements');
        
        if (!hasSeenAnnouncements) {
            fetchActiveAnnouncements();
        } else {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (announcements.length > 1) {
            const interval = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % announcements.length);
            }, 5000); // Rotate every 5 seconds

            return () => clearInterval(interval);
        }
    }, [announcements.length]);

    const fetchActiveAnnouncements = async () => {
        try {
            const response = await fetch('/api/announcements/active');
            if (response.ok) {
                const data = await response.json();
                const bannerAnnouncements = data.filter(ann => ann.display_type === 'banner');
                setAnnouncements(bannerAnnouncements);
                
                // Mark announcements as seen for this session
                if (bannerAnnouncements.length > 0) {
                    sessionStorage.setItem('hasSeenAnnouncements', 'true');
                }
            } else if (response.status === 401) {
                console.log('User not authenticated for announcements');
                setAnnouncements([]);
            } else {
                console.error('Failed to fetch announcements:', response.status);
            }
        } catch (error) {
            console.error('Failed to fetch announcements:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDismiss = (announcementId) => {
        setDismissed(prev => new Set([...prev, announcementId]));
        
        // If current announcement is dismissed, go to next one
        if (announcements[currentIndex]?.id === announcementId) {
            setCurrentIndex((prev) => (prev + 1) % announcements.length);
        }
    };

    // Filter out dismissed announcements
    const visibleAnnouncements = announcements.filter(ann => !dismissed.has(ann.id));
    
    if (loading || visibleAnnouncements.length === 0) {
        return null;
    }

    const currentAnnouncement = visibleAnnouncements[currentIndex % visibleAnnouncements.length];
    const config = typeConfig[currentAnnouncement.type] || typeConfig.general;
    const IconComponent = config.icon;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={currentAnnouncement.id}
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className={`relative ${config.bgColor} border-l-4 ${config.color.replace('bg-', 'border-')} shadow-sm`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className={`flex-shrink-0 w-8 h-8 ${config.color} rounded-full flex items-center justify-center`}>
                                <IconComponent className="h-4 w-4 text-white" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                    <h3 className={`font-bold text-sm ${config.textColor}`}>
                                        {currentAnnouncement.title}
                                    </h3>
                                    {currentAnnouncement.is_featured && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                            ⭐ Featured
                                        </span>
                                    )}
                                </div>
                                <p className={`text-sm ${config.textColor} opacity-80 truncate`}>
                                    {currentAnnouncement.content}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            {/* Pagination dots for multiple announcements */}
                            {visibleAnnouncements.length > 1 && (
                                <div className="flex space-x-1">
                                    {visibleAnnouncements.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentIndex(index)}
                                            className={`w-2 h-2 rounded-full transition-all ${
                                                index === currentIndex % visibleAnnouncements.length
                                                    ? `${config.color}`
                                                    : 'bg-gray-300 hover:bg-gray-400'
                                            }`}
                                        />
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={() => handleDismiss(currentAnnouncement.id)}
                                className={`flex-shrink-0 p-1 rounded-full ${config.textColor} hover:bg-white hover:bg-opacity-20 transition-colors`}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AnnouncementBanner;