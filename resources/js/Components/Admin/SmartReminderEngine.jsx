import React, { useState, useEffect } from 'react';
import { Send, Users, Calendar, MessageSquare, CheckCircle, Clock, Trash2, Edit2 } from 'lucide-react';
import axios from 'axios';

export default function SmartReminderEngine() {
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        department_id: '',
        recipient_users: [],
        send_now: false,
        scheduled_at: ''
    });

    const departments = ['Finance', 'Operations', 'HR', 'IT', 'Marketing'];

    // Fetch reminders and users
    useEffect(() => {
        fetchReminders();
        // In a real app, fetch users from API
        // For now, simulate with sample data
        setAllUsers([
            { id: 1, name: 'John Doe', department: 'Finance' },
            { id: 2, name: 'Jane Smith', department: 'Operations' },
            { id: 3, name: 'Mike Johnson', department: 'HR' },
            // ... more users
        ]);
        setLoading(false);
    }, []);

    const fetchReminders = async () => {
        try {
            const response = await axios.get('/api/admin/reminders');
            setReminders(response.data.data || response.data);
        } catch (error) {
            console.error('Error fetching reminders:', error);
            setReminders([]);
        }
    };

    const handleCreateReminder = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                recipient_users: selectedUsers.map(u => u.id),
            };
            
            const response = await axios.post('/api/admin/reminders', payload);
            setReminders([response.data.reminder, ...reminders]);
            setFormData({
                title: '',
                message: '',
                department_id: '',
                recipient_users: [],
                send_now: false,
                scheduled_at: ''
            });
            setSelectedUsers([]);
            setShowCreateForm(false);
        } catch (error) {
            console.error('Error creating reminder:', error);
            alert('Failed to create reminder: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleSendReminder = async (reminderId) => {
        try {
            const response = await axios.post(`/api/admin/reminders/${reminderId}/send`);
            fetchReminders();
            alert('Reminder sent successfully!');
        } catch (error) {
            console.error('Error sending reminder:', error);
            alert('Failed to send reminder');
        }
    };

    const handleDeleteReminder = async (reminderId) => {
        if (!confirm('Are you sure you want to delete this reminder?')) return;
        try {
            await axios.delete(`/api/admin/reminders/${reminderId}`);
            setReminders(reminders.filter(r => r.id !== reminderId));
        } catch (error) {
            console.error('Error deleting reminder:', error);
            alert('Failed to delete reminder');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'sent':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'scheduled':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'draft':
                return 'bg-gray-100 text-gray-800 border-gray-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'sent':
                return <CheckCircle className="w-4 h-4" />;
            case 'scheduled':
                return <Clock className="w-4 h-4" />;
            default:
                return <MessageSquare className="w-4 h-4" />;
        }
    };

    if (loading) {
        return <div className="text-center py-12">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Smart Reminder Engine</h2>
                    <p className="text-gray-600">📧 Batch send smart reminders to employees</p>
                </div>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                    <Send className="w-5 h-5" />
                    Create Reminder
                </button>
            </div>

            {/* Create Form */}
            {showCreateForm && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                    <form onSubmit={handleCreateReminder} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Reminder Title
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Batch: Finance - Compliance Training"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Target Department
                                </label>
                                <select
                                    value={formData.department_id}
                                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">All Departments</option>
                                    {departments.map((dept) => (
                                        <option key={dept} value={dept}>
                                            {dept}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Message
                            </label>
                            <textarea
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                placeholder="Enter reminder message..."
                                rows="3"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={formData.send_now}
                                        onChange={(e) => setFormData({ ...formData, send_now: e.target.checked })}
                                    />
                                    Send Now
                                </label>
                            </div>
                            {!formData.send_now && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Schedule Time
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.scheduled_at}
                                        onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                            >
                                Create & Send Reminder
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Reminders List */}
            <div className="grid grid-cols-1 gap-4">
                {reminders.map((reminder) => (
                    <div key={reminder.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-bold text-gray-900">{reminder.title}</h3>
                                    <span className={`flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-semibold ${getStatusColor(reminder.status)}`}>
                                        {getStatusIcon(reminder.status)}
                                        {reminder.status === 'sent' ? 'Sent' : reminder.status === 'scheduled' ? 'Scheduled' : 'Draft'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleDeleteReminder(reminder.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-900">{reminder.recipient_count}</p>
                                <p className="text-xs text-gray-600 flex items-center justify-center gap-1">
                                    <Users className="w-3 h-3" />
                                    Recipients
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-semibold text-gray-900">
                                    {reminder.sent_count || 0}
                                </p>
                                <p className="text-xs text-gray-600">Sent</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-semibold text-gray-900">
                                    {reminder.opened_count || 0}
                                </p>
                                <p className="text-xs text-gray-600">Opened</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium">
                                View Details
                            </button>
                            {reminder.status === 'draft' && (
                                <button
                                    onClick={() => handleSendReminder(reminder.id)}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                                >
                                    Send Now
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {reminders.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No reminders created yet</p>
                </div>
            )}
        </div>
    );
}
