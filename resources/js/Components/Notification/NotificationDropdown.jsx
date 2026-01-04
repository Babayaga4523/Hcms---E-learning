import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Clock, AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationDropdown = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const typeConfig = {
        info: { color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Info },
        success: { color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle },
        warning: { color: 'text-orange-600', bgColor: 'bg-orange-50', icon: AlertCircle },
        error: { color: 'text-red-600', bgColor: 'bg-red-50', icon: XCircle },
    };

    useEffect(() => {
        if (isOpen && user) {
            fetchNotifications();
        }
    }, [isOpen, user]);

    const fetchNotifications = async () => {
        if (!user) return;
        
        try {
            setLoading(true);
            const response = await fetch('/api/user/notifications', {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.is_read).length);
            } else if (response.status === 401) {
                console.log('User not authenticated for notifications');
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const response = await fetch(`/api/user/notifications/${notificationId}/read`, {
                method: 'PATCH',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                }
            });

            if (response.ok) {
                setNotifications(prev => prev.map(n => 
                    n.id === notificationId ? { ...n, is_read: true } : n
                ));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Baru saja';
        if (diffInMinutes < 60) return `${diffInMinutes}m lalu`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h lalu`;
        return `${Math.floor(diffInMinutes / 1440)}d lalu`;
    };

    return (
        <div className="relative">
            {/* Bell Icon Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            >
                <Bell size={20} />
                
                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
            </button>

            {/* Dropdown Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div 
                            className="fixed inset-0 z-10"
                            onClick={() => setIsOpen(false)}
                        />
                        
                        {/* Dropdown */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                                <h3 className="font-semibold text-gray-900">Notifikasi</h3>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Notifications List */}
                            <div className="max-h-96 overflow-y-auto">
                                {loading ? (
                                    <div className="p-4 text-center text-gray-500">
                                        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                                        Loading...
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">
                                        <Bell className="mx-auto w-8 h-8 mb-2 text-gray-300" />
                                        <p>Tidak ada notifikasi</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {notifications.slice(0, 10).map((notification) => {
                                            const config = typeConfig[notification.type] || typeConfig.info;
                                            const IconComponent = config.icon;

                                            return (
                                                <motion.div
                                                    key={notification.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                                                        !notification.is_read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                                                    }`}
                                                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                                                >
                                                    <div className="flex items-start space-x-3">
                                                        <div className={`flex-shrink-0 w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center`}>
                                                            <IconComponent className={`w-4 h-4 ${config.color}`} />
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                                                    {notification.title}
                                                                </h4>
                                                                {!notification.is_read && (
                                                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2"></div>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                                                                {notification.message}
                                                            </p>
                                                            <div className="flex items-center mt-2 text-xs text-gray-400">
                                                                <Clock className="w-3 h-3 mr-1" />
                                                                {formatDate(notification.created_at)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {notifications.length > 0 && (
                                <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-lg">
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-2 px-4 rounded hover:bg-white transition-colors"
                                    >
                                        Lihat Semua Notifikasi
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationDropdown;