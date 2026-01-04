import React, { useState, useEffect } from 'react';

const TestApiComponent = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        testApiEndpoints();
    }, []);

    const testApiEndpoints = async () => {
        console.log('Testing API endpoints...');
        
        try {
            // Test announcements API
            console.log('Fetching announcements from:', '/api/announcements/active');
            const announcementsResponse = await fetch('/api/announcements/active');
            console.log('Announcements response status:', announcementsResponse.status);
            
            if (announcementsResponse.ok) {
                const announcementsData = await announcementsResponse.json();
                console.log('Announcements data:', announcementsData);
                setAnnouncements(announcementsData);
            } else {
                console.error('Announcements API failed:', announcementsResponse.status);
            }

            // Test notifications API
            console.log('Fetching notifications from:', '/api/user/notifications');
            const notificationsResponse = await fetch('/api/user/notifications', {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                }
            });
            console.log('Notifications response status:', notificationsResponse.status);
            
            if (notificationsResponse.ok) {
                const notificationsData = await notificationsResponse.json();
                console.log('Notifications data:', notificationsData);
                setNotifications(notificationsData);
            } else {
                console.error('Notifications API failed:', notificationsResponse.status);
            }
        } catch (err) {
            console.error('API test error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-4 bg-yellow-100 border border-yellow-300 rounded">Testing API endpoints...</div>;

    return (
        <div className="p-4 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <h3 className="font-bold text-blue-800">API Test Results</h3>
                {error && <p className="text-red-600">Error: {error}</p>}
                
                <div className="mt-2">
                    <h4 className="font-semibold">Announcements ({announcements.length}):</h4>
                    {announcements.length > 0 ? (
                        <ul className="list-disc list-inside">
                            {announcements.map((ann, index) => (
                                <li key={index} className="text-sm">
                                    <strong>{ann.title}</strong> - {ann.type} - {ann.display_type}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-600">No announcements found</p>
                    )}
                </div>

                <div className="mt-2">
                    <h4 className="font-semibold">Notifications ({notifications.length}):</h4>
                    {notifications.length > 0 ? (
                        <ul className="list-disc list-inside">
                            {notifications.map((notif, index) => (
                                <li key={index} className="text-sm">
                                    <strong>{notif.title}</strong> - {notif.type}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-600">No notifications found</p>
                    )}
                </div>

                <button 
                    onClick={testApiEndpoints}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Retry API Test
                </button>
            </div>
        </div>
    );
};

export default TestApiComponent;