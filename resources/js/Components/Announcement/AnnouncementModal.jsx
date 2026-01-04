import React, { useState, useEffect } from 'react';
import { X, Megaphone, AlertCircle, Wrench, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AnnouncementModal = () => {
    const [modalAnnouncement, setModalAnnouncement] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [dismissedModals, setDismissedModals] = useState(new Set());

    const typeConfig = {
        general: { 
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            icon: Megaphone
        },
        urgent: { 
            color: 'text-red-600',
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200',
            icon: AlertCircle
        },
        maintenance: { 
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200',
            icon: Wrench
        },
        event: { 
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            icon: Calendar
        }
    };

    useEffect(() => {
        // Check if modal announcements have been shown in this session
        const hasSeenModalAnnouncements = sessionStorage.getItem('hasSeenModalAnnouncements');
        
        if (!hasSeenModalAnnouncements) {
            fetchModalAnnouncements();
        }
    }, []);

    const fetchModalAnnouncements = async () => {
        try {
            const response = await fetch('/api/announcements/active');
            if (response.ok) {
                const data = await response.json();
                const modalAnnouncements = data.filter(ann => 
                    ann.display_type === 'modal' && 
                    !dismissedModals.has(ann.id)
                );
                
                if (modalAnnouncements.length > 0) {
                    // Show the first modal announcement
                    setModalAnnouncement(modalAnnouncements[0]);
                    
                    // Mark modal announcements as seen for this session
                    sessionStorage.setItem('hasSeenModalAnnouncements', 'true');
                    
                    // Add a small delay before showing to allow page to load
                    setTimeout(() => {
                        setIsVisible(true);
                    }, 1000);
                }
            } else if (response.status === 401) {
                // User not authenticated
                console.log('User not authenticated for modal announcements');
            }
        } catch (error) {
            console.error('Failed to fetch modal announcements:', error);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        
        // Mark as dismissed in session storage to prevent showing again
        if (modalAnnouncement) {
            const dismissed = JSON.parse(sessionStorage.getItem('dismissedModals') || '[]');
            dismissed.push(modalAnnouncement.id);
            sessionStorage.setItem('dismissedModals', JSON.stringify(dismissed));
            setDismissedModals(new Set(dismissed));
            
            // Clear the current modal
            setTimeout(() => {
                setModalAnnouncement(null);
                
                // Check if there are more modals to show
                fetchModalAnnouncements();
            }, 300);
        }
    };

    // Load dismissed modals from session storage
    useEffect(() => {
        const dismissed = JSON.parse(sessionStorage.getItem('dismissedModals') || '[]');
        setDismissedModals(new Set(dismissed));
    }, []);

    if (!modalAnnouncement || !isVisible) {
        return null;
    }

    const config = typeConfig[modalAnnouncement.type] || typeConfig.general;
    const IconComponent = config.icon;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
                >
                    {/* Close Button */}
                    <button
                        onClick={handleDismiss}
                        className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>

                    {/* Icon */}
                    <div className={`w-16 h-16 mx-auto ${config.bgColor} rounded-full flex items-center justify-center mb-4`}>
                        <IconComponent className={`w-8 h-8 ${config.color}`} />
                    </div>

                    {/* Content */}
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">
                                {modalAnnouncement.title}
                            </h3>
                            {modalAnnouncement.is_featured && (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                    ⭐
                                </span>
                            )}
                        </div>
                        
                        <p className="text-gray-600 mb-6 leading-relaxed">
                            {modalAnnouncement.content}
                        </p>

                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
                            <span className={`px-3 py-1 ${config.bgColor} ${config.color} rounded-full font-medium`}>
                                {modalAnnouncement.type.charAt(0).toUpperCase() + modalAnnouncement.type.slice(1)}
                            </span>
                        </div>

                        <button
                            onClick={handleDismiss}
                            className="w-full py-3 px-4 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
                        >
                            Mengerti
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AnnouncementModal;