import React, { useState, useEffect, useRef } from 'react';
import { Search, Zap, X, Users, FileText, Heart, Download } from 'lucide-react';
import { router } from '@inertiajs/react';
import axios from 'axios';

// Show success/error messages
const showNotification = (message, type = 'info') => {
    if (type === 'success') {
        alert(`✅ ${message}`);
    } else if (type === 'error') {
        alert(`❌ ${message}`);
    } else {
        alert(message);
    }
};

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef(null);

    // Real command implementations
    const handleBulkReminder = async () => {
        const reminderData = {
            type: 'overdue',
            subject: 'Reminder: Training Belum Diselesaikan',
            message: 'Anda memiliki training yang belum diselesaikan. Mohon segera selesaikan training tersebut sebelum batas waktu.'
        };

        try {
            setIsLoading(true);
            const response = await axios.post('/api/admin/commands/bulk-reminder', reminderData);
            showNotification(`Bulk reminder berhasil dikirim ke ${response.data.count} pengguna`, 'success');
            setIsOpen(false);
        } catch (error) {
            showNotification(error.response?.data?.message || 'Gagal mengirim bulk reminder', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateReport = async () => {
        const reportData = {
            type: 'compliance',
            format: 'pdf',
            date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            date_to: new Date().toISOString().split('T')[0]
        };

        try {
            setIsLoading(true);
            const response = await axios.post('/api/admin/commands/generate-report', reportData);
            showNotification('Report compliance berhasil dibuat', 'success');
            
            if (response.data.download_url) {
                window.open(response.data.download_url, '_blank');
            }
            setIsOpen(false);
        } catch (error) {
            showNotification(error.response?.data?.message || 'Gagal generate report', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleHealthCheck = async () => {
        try {
            setIsLoading(true);
            const response = await axios.post('/api/admin/commands/health-check');
            const { status, checks } = response.data;
            
            let message = `System Health: ${status.toUpperCase()}\n`;
            Object.entries(checks).forEach(([key, check]) => {
                message += `${key}: ${check.status} - ${check.message}\n`;
            });
            
            showNotification(message, status === 'healthy' ? 'success' : 'error');
            setIsOpen(false);
        } catch (error) {
            showNotification(error.response?.data?.message || 'Health check gagal', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackupDatabase = async () => {
        try {
            setIsLoading(true);
            const response = await axios.post('/api/admin/commands/backup-database');
            showNotification(`Database backup berhasil dibuat: ${response.data.filename} (${response.data.size})`, 'success');
            setIsOpen(false);
        } catch (error) {
            showNotification(error.response?.data?.message || 'Backup database gagal', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async (searchQuery, type) => {
        if (!searchQuery.trim()) return;
        
        try {
            setIsLoading(true);
            const response = await axios.get('/api/admin/commands/search', {
                params: { query: searchQuery, type }
            });
            
            if (response.data.results) {
                const allResults = Object.values(response.data.results).flat();
                if (allResults.length > 0) {
                    router.visit(allResults[0].url);
                    setIsOpen(false);
                } else {
                    showNotification('Tidak ada hasil ditemukan', 'info');
                }
            }
        } catch (error) {
            showNotification('Pencarian gagal', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const commands = [
        { 
            category: 'Navigation',
            items: [
                { name: 'Dashboard', description: 'Kembali ke dashboard utama', action: () => router.visit('/admin/dashboard') },
                { name: 'User Management', description: 'Kelola pengguna sistem', action: () => router.visit('/admin/users') },
                { name: 'Training Programs', description: 'Kelola program training', action: () => router.visit('/admin/training-programs') },
                { name: 'Analytics', description: 'Lihat analytics karyawan', action: () => router.visit('/admin/advanced-analytics') },
                { name: 'Reports', description: 'Laporan compliance', action: () => router.visit('/admin/reports/compliance') },
            ]
        },
        {
            category: 'Actions',
            items: [
                { name: 'Send Bulk Reminder', description: 'Kirim notifikasi ke users dengan training overdue', action: handleBulkReminder, icon: Users },
                { name: 'Generate Report', description: 'Export laporan compliance (PDF)', action: handleGenerateReport, icon: FileText },
                { name: 'Run Health Check', description: 'Validasi integritas sistem & database', action: handleHealthCheck, icon: Heart },
                { name: 'Backup Database', description: 'Backup data training ke storage', action: handleBackupDatabase, icon: Download },
            ]
        },
        {
            category: 'Search',
            items: [
                { name: 'Find Module', description: 'Cari materi training', action: () => handleSearch(query, 'modules'), icon: Search },
                { name: 'Find User', description: 'Cari data karyawan', action: () => handleSearch(query, 'users'), icon: Users },
                { name: 'Global Search', description: 'Cari di seluruh sistem', action: () => handleSearch(query, 'all'), icon: Search },
            ]
        }
    ];

    // Keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(!isOpen);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Filter commands based on query
    const filteredCommands = commands.map(category => ({
        ...category,
        items: category.items.filter(item =>
            item.name.toLowerCase().includes(query.toLowerCase()) ||
            item.description.toLowerCase().includes(query.toLowerCase())
        )
    })).filter(category => category.items.length > 0);

    return (
        <>
            {/* Command Palette Toggle Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg hover:shadow-xl transition z-40"
                title="Tekan Cmd+K atau Ctrl+K"
            >
                <Search className="w-4 h-4" />
                <span className="text-sm font-semibold">⌘K</span>
            </button>

            {/* Command Palette Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-32">
                    <div className="w-full max-w-2xl mx-4 bg-white rounded-xl shadow-2xl overflow-hidden">
                        {/* Search Input */}
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
                            <Search className="w-5 h-5 text-gray-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Cari command, module, atau user..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="flex-1 outline-none text-lg"
                                autoFocus
                            />
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Command List */}
                        <div className="max-h-96 overflow-y-auto">
                            {filteredCommands.length > 0 ? (
                                filteredCommands.map((category, catIdx) => (
                                    <div key={catIdx}>
                                        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 sticky top-0">
                                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                                {category.category}
                                            </p>
                                        </div>
                                        {category.items.map((item, itemIdx) => (
                                            <button
                                                key={itemIdx}
                                                onClick={() => {
                                                    item.action();
                                                    setIsOpen(false);
                                                    setQuery('');
                                                }}
                                                className="w-full text-left px-6 py-4 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition"
                                            >
                                                <p className="font-semibold text-gray-900">{item.name}</p>
                                                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                            </button>
                                        ))}
                                    </div>
                                ))
                            ) : (
                                <div className="px-6 py-12 text-center">
                                    <p className="text-gray-500">Tidak ada command yang cocok</p>
                                    <p className="text-sm text-gray-400 mt-2">Coba kata kunci lain</p>
                                </div>
                            )}
                        </div>

                        {/* Footer Tips */}
                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
                            <div className="flex gap-4">
                                <span>⏎ Select</span>
                                <span>↑ ↓ Navigate</span>
                                <span>Esc Close</span>
                            </div>
                            <Zap className="w-4 h-4 text-yellow-500" />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
