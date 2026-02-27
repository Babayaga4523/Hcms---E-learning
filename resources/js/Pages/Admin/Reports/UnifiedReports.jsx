import React, { useState, useEffect, useMemo, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import {
    BarChart3, Users, Award, TrendingUp, Download, RefreshCw,
    Calendar, Search, CheckCircle, AlertCircle, Clock, Zap,
    BookOpen, Target, Activity, PieChart as PieIcon, LineChart as LineIcon,
    ArrowUp, ArrowDown, Eye, Filter, X, Printer, Share2, Shield, ChevronDown, Trophy,
    AlertTriangle, CheckCircle2, Map as MapIcon, Layers, ChevronUp, FileText, AlertOctagon,
    MoreHorizontal, ArrowUpRight, Sliders, Building2, HelpCircle, Info, TrendingDown, User, FileText as FilePdfIcon
} from 'lucide-react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    ScatterChart, Scatter
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from '@/Components/Admin/AdminSidebar';

// PDF Export Libraries (client-side)
let jsPDF, html2canvas;
try {
    jsPDF = require('jspdf').jsPDF;
    html2canvas = require('html2canvas');
} catch (e) {
    console.warn('PDF export libraries not available. Install: npm install jspdf html2canvas');
}

// --- Mocking Inertia & Layout for Preview ---
const Head = ({ title }) => {
    useEffect(() => { document.title = title; }, [title]);
    return null;
};

// --- Modern Clean Style System (Wondr Light) ---
const ModernStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F8FAFC; color: #1e293b; }
        
        /* Wondr Color Tokens */
        :root {
            --wondr-dark: #002824;
            --wondr-green: #005E54;
            --wondr-lime: #D6F84C;
        }

        .wondr-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 20px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
        }
        
        .wondr-card:hover {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);
            transform: translateY(-2px);
            border-color: rgba(0, 94, 84, 0.2);
        }

        .chart-tooltip {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 12px;
            color: #0f172a;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .tab-btn {
            padding: 8px 16px;
            border-radius: 12px;
            font-size: 0.875rem;
            font-weight: 600;
            color: #64748b;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
            white-space: nowrap;
        }
        
        .tab-btn:hover {
            background-color: #f1f5f9;
            color: #002824;
        }
        
        .tab-btn.active {
            background-color: #002824;
            color: #D6F84C;
            box-shadow: 0 4px 12px rgba(0, 40, 36, 0.15);
        }

        .animate-fade-in { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Chart Container Sizing - Fix recharts responsive container issues */
        .chart-container {
            width: 100%;
            height: 100%;
            min-width: 300px;
            min-height: 300px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* Tailwind height utilities fix */
        .h-48 {
            height: 12rem;
            display: flex;
            flex-direction: column;
        }

        .h-64 {
            height: 16rem;
            display: flex;
            flex-direction: column;
        }

        .h-96 {
            height: 24rem;
            display: flex;
            flex-direction: column;
        }

        .recharts-responsive-container {
            width: 100% !important;
            height: 100% !important;
            display: flex !important;
        }

        .recharts-wrapper {
            width: 100% !important;
            height: 100% !important;
        }

        .recharts-surface {
            display: flex;
        }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    `}</style>
);

// --- Helper Components ---

const StatCardLight = ({ icon: Icon, label, value, color = 'blue', trend = null, trendValue = null, delay = 0 }) => {
    // Light & Clean Color Palette
    const themes = {
        green: { iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', trendColor: 'text-emerald-600', trendBg: 'bg-emerald-50' },
        blue: { iconBg: 'bg-blue-50', iconColor: 'text-blue-600', trendColor: 'text-blue-600', trendBg: 'bg-blue-50' },
        purple: { iconBg: 'bg-purple-50', iconColor: 'text-purple-600', trendColor: 'text-purple-600', trendBg: 'bg-purple-50' },
        orange: { iconBg: 'bg-orange-50', iconColor: 'text-orange-600', trendColor: 'text-orange-600', trendBg: 'bg-orange-50' },
        red: { iconBg: 'bg-red-50', iconColor: 'text-red-600', trendColor: 'text-red-600', trendBg: 'bg-red-50' },
        indigo: { iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600', trendColor: 'text-indigo-600', trendBg: 'bg-indigo-50' }
    };
    
    const theme = themes[color] || themes.blue;

    return (
        <div 
            className="wondr-card p-6 animate-fade-in flex flex-col justify-between h-full"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${theme.iconBg} ${theme.iconColor}`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        trend === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                        {trend === 'up' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                        {trendValue}
                    </div>
                )}
            </div>
            <div>
                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{label}</p>
            </div>
        </div>
    );
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="chart-tooltip">
                <p className="font-bold text-xs text-slate-400 mb-2 uppercase tracking-wide">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-slate-600 font-medium capitalize">{entry.name}:</span>
                        <span className="font-bold text-slate-900">{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// --- Utility Functions for Caching & Data Processing ---

/**
 * Report Cache Manager
 * Caches report data for 5 minutes to reduce API calls
 */
class ReportCacheManager {
    constructor() {
        this.cache = new Map();
        this.timers = new Map();
    }

    getCacheKey(filters) {
        return JSON.stringify(filters);
    }

    has(filters) {
        const key = this.getCacheKey(filters);
        return this.cache.has(key);
    }

    get(filters) {
        const key = this.getCacheKey(filters);
        return this.cache.get(key);
    }

    set(filters, data) {
        const key = this.getCacheKey(filters);
        
        // Clear existing timer for this key
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
        }

        this.cache.set(key, data);

        // Expire cache after 5 minutes (300000ms)
        const timer = setTimeout(() => {
            this.cache.delete(key);
            this.timers.delete(key);
        }, 5 * 60 * 1000);

        this.timers.set(key, timer);
    }

    clear() {
        this.cache.clear();
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers.clear();
    }
}

const reportCache = new ReportCacheManager();

/**
 * Data Sampling for Large Datasets
 * Reduces chart rendering performance issues with 1000+ data points
 * @param {Array} data - Original data array
 * @param {Number} maxPoints - Maximum data points to keep (default: 100)
 * @returns {Array} Sampled data
 */
const sampleData = (data, maxPoints = 100) => {
    if (!Array.isArray(data) || data.length <= maxPoints) {
        return data;
    }

    const step = Math.ceil(data.length / maxPoints);
    const sampled = [];

    for (let i = 0; i < data.length; i += step) {
        sampled.push(data[i]);
    }

    // Always include the last point to maintain data continuity
    if (sampled[sampled.length - 1] !== data[data.length - 1]) {
        sampled.push(data[data.length - 1]);
    }

    return sampled;
};

/**
 * PDF Export Handler
 * Converts report HTML to PDF using jsPDF + html2canvas
 * @param {String} reportTitle - Title for the PDF
 * @param {String} elementId - ID of element to export
 */
const exportReportToPDF = async (reportTitle, elementId = 'report-content') => {
    try {
        if (!jsPDF || !html2canvas) {
            alert('⚠️ PDF export tidak tersedia. Install dependencies: npm install jspdf html2canvas');
            return;
        }

        const element = document.getElementById(elementId);
        if (!element) {
            alert('❌ Element tidak ditemukan untuk export');
            return;
        }

        // Show progress
        const progressMsg = document.createElement('div');
        progressMsg.textContent = '⏳ Generating PDF...';
        progressMsg.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: #002824; color: #D6F84C; padding: 12px 16px; border-radius: 8px; z-index: 9999; font-weight: bold;';
        document.body.appendChild(progressMsg);

        // Convert HTML to canvas
        const canvas = await html2canvas(element, {
            scale: 2,
            backgroundColor: '#ffffff',
            allowTaint: true,
            useCORS: true
        });

        // Create PDF
        const pdf = new jsPDF({
            orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pdf.internal.pageSize.getWidth() - 10;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 5;

        // Add image to PDF (handling multiple pages if needed)
        pdf.addImage(imgData, 'PNG', 5, position, imgWidth, imgHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 5, position, imgWidth, imgHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();
        }

        // Add metadata
        pdf.setProperties({
            title: reportTitle,
            subject: 'HCMS Learning Report',
            author: 'HCMS System',
            keywords: 'learning,report,compliance',
            creator: 'Unified Reports'
        });

        // Download PDF
        pdf.save(`${reportTitle}-${new Date().toISOString().split('T')[0]}.pdf`);

        // Remove progress message
        document.body.removeChild(progressMsg);
    } catch (error) {
        console.error('PDF Export Error:', error);
        alert('❌ Gagal mengekspor ke PDF: ' + error.message);
    }
};

// --- Main Component ---

export default function UnifiedReports({
    stats: initialStats,
    compliance_trend,
    departmentLeaderboard: initialLeaderboard,
    prePostAnalysis: initialPrePost,
    learningImpactSummary,
    atRiskUsers: initialAtRisk,
    certificateStats: initialCertStats,
    questionItemAnalysis,
    // Additional backend data
    moduleStats,
    totalEnrolledUsers,
    learnerProgress,
    examPerformance,
    questionPerformance,
    trendData,
    topPerformers,
    strugglers,
    engagementScore,
    departmentPassRates,
    overdueTraining,
    overdueCount,
    urgentCount,
    learningDurationStats,
    dropoutPredictions,
    peakPerformanceTime,
    usersByDepartment,
    usersByStatus,
    dateRange
}) {
    // Get current user from Inertia
    const { auth, flash } = usePage().props;
    const currentUser = auth?.user || { name: 'Pengguna', role: 'Admin' };

    // Use real backend data - no fallbacks
    const stats = initialStats || {};
    const departmentLeaderboard = initialLeaderboard || [];
    const atRiskUsers = initialAtRisk || [];
    const certificateData = initialCertStats || {};
    const questions = questionItemAnalysis || [];
    const prePostData = initialPrePost || [];
    const learningImpact = learningImpactSummary || {};

    // --- State ---
    const [activeTab, setActiveTab] = useState('executive');
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportFormat, setExportFormat] = useState('excel'); // 'excel' or 'pdf'
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        department: 'all',
        status: 'all'
    });
    const reportContentRef = useRef(null);

    useEffect(() => {
        setAnalyticsLoading(true);
        const timer = setTimeout(() => setAnalyticsLoading(false), 500);
        return () => clearTimeout(timer);
    }, [activeTab]);

    // Persist active tab to localStorage
    useEffect(() => {
        localStorage.setItem('unifiedReportsTab', activeTab);
    }, [activeTab]);

    // AUTO-DOWNLOAD when flash message contains download_link (Cara 2: Generate & Redirect)
    useEffect(() => {
        // Flash-based download no longer needed - controller streams directly
        console.log('✓ Unified Reports page loaded');
    }, []);

    /**
     * Enhanced Export Handler with PDF support and progress feedback
     * Supports both Excel and PDF formats
     */
    const handleExport = async (format = 'excel') => {
        try {
            setIsExporting(true);
            setShowExportMenu(false);
            
            if (format === 'pdf') {
                // PDF Export with html2canvas
                await exportReportToPDF('HCMS-Report', 'report-content');
            } else {
                // Excel Export (existing functionality)
                // Get current date range if available
                const startDate = new URLSearchParams(window.location.search).get('start_date') || '';
                const endDate = new URLSearchParams(window.location.search).get('end_date') || '';
                
                // Build query string
                let queryString = '/admin/reports/export-excel';
                if (startDate || endDate) {
                    const params = new URLSearchParams();
                    if (startDate) params.append('start_date', startDate);
                    if (endDate) params.append('end_date', endDate);
                    queryString += '?' + params.toString();
                }
                
                // Trigger download - controller streams Excel directly to browser
                // Browser will automatically download the file
                window.location.href = queryString;
            }
            
            // Reset after a delay
            setTimeout(() => setIsExporting(false), 1500);
        } catch (error) {
            console.error('Export error:', error);
            alert(`❌ Gagal mengekspor data: ${error.message}`);
            setIsExporting(false);
        }
    };

    const exportTabData = (type) => {
        alert(`Exporting ${type} data...`);
    };

    // --- Render Functions ---

    const renderExecutiveDashboard = () => (
        <div className="space-y-6 animate-fade-in">
            {/* Alert Section */}
            {atRiskUsers.length > 0 && (
                <div className="bg-white border-l-4 border-red-500 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-red-50 p-3 rounded-full text-red-600">
                            <AlertOctagon size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-slate-900">Perhatian Diperlukan</h4>
                            <p className="text-slate-600">{atRiskUsers.length} karyawan berisiko gagal dalam pelatihan wajib. Segera lakukan intervensi.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setActiveTab('dropout')} 
                        className="px-6 py-2.5 bg-red-50 text-red-700 font-bold rounded-lg hover:bg-red-100 transition whitespace-nowrap"
                    >
                        Lihat Detail Risiko
                    </button>
                </div>
            )}

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCardLight icon={Users} label="Total Users" value={stats.total_users || 0} color="blue" delay={0} />
                <StatCardLight icon={TrendingUp} label="Avg. Completion" value={`${stats.avg_completion || stats.compliance_rate || 0}%`} color="green" trend="up" trendValue="5%" delay={100} />
                <StatCardLight icon={Zap} label="Engagement" value={`${stats.engagement_score || 8.5}/10`} color="orange" delay={200} />
                <StatCardLight icon={AlertCircle} label="Dropout Risk" value={atRiskUsers?.length || 0} color="red" delay={300} />
                <StatCardLight icon={Shield} label="Compliance" value={`${Math.round(stats.compliance_rate || 0)}%`} color="purple" delay={400} />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Leaderboard Table */}
                <div className="lg:col-span-2 wondr-card p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                                <Trophy size={20} />
                            </div>
                            <h3 className="font-bold text-lg text-slate-900">Department Leaderboard</h3>
                        </div>
                        <div className="flex gap-2">
                             <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-700 transition"><Filter size={18} /></button>
                             <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-700 transition"><MoreHorizontal size={18} /></button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    <th className="px-4 py-3">Rank</th>
                                    <th className="px-4 py-3">Department</th>
                                    <th className="px-4 py-3 text-center">Users</th>
                                    <th className="px-4 py-3 text-center">Completion</th>
                                    <th className="px-4 py-3 text-right">Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {departmentLeaderboard && departmentLeaderboard.length > 0 ? departmentLeaderboard.map((dept, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-600">
                                            {idx < 3 ? <span className="text-lg mr-1">{dept.badge || '⭐'}</span> : <span className="text-slate-400 mr-2 font-bold">#{dept.rank || idx + 1}</span>}
                                        </td>
                                        <td className="px-4 py-3 font-bold text-slate-800">{dept.department || 'Unknown'}</td>
                                        <td className="px-4 py-3 text-center text-slate-500 font-medium">{dept.total_users || 0}</td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500" style={{ width: `${dept.completion_rate || 0}%` }}></div>
                                                </div>
                                                <span className="text-xs font-bold text-emerald-700">{dept.completion_rate || 0}%</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-slate-900">{dept.engagement_score || 0}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-6 text-center text-slate-500">Tidak ada data departemen tersedia</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Quick Actions & Recent */}
                <div className="space-y-6">
                     <div className="wondr-card p-6">
                        <h3 className="font-bold text-lg text-slate-900 mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            <button className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition text-sm font-semibold text-slate-700 group">
                                <span className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-200 transition">
                                        <FileText size={18} />
                                    </div>
                                    Monthly Report
                                </span>
                                <ChevronDown size={16} className="text-slate-400" />
                            </button>
                            <button className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition text-sm font-semibold text-slate-700 group">
                                <span className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg group-hover:bg-emerald-200 transition">
                                        <Users size={18} />
                                    </div>
                                    Manage Users
                                </span>
                                <ArrowUpRight size={16} className="text-slate-400" />
                            </button>
                            <button className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition text-sm font-semibold text-slate-700 group">
                                <span className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg group-hover:bg-purple-200 transition">
                                        <Shield size={18} />
                                    </div>
                                    Compliance
                                </span>
                                <ArrowUpRight size={16} className="text-slate-400" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="wondr-card p-6">
                         <h3 className="font-bold text-lg text-slate-900 mb-2">Risk Overview</h3>
                         <div className="h-48 w-full">
                             <ResponsiveContainer width="100%" height="100%">
                                 <PieChart>
                                    <Pie
                                        data={(() => {
                                            const lowRisk = (atRiskUsers?.filter(u => u.risk_level === 'at-risk').length || 0);
                                            const mediumRisk = (atRiskUsers?.filter(u => u.risk_level === 'urgent').length || 0);
                                            const highRisk = (atRiskUsers?.filter(u => u.risk_level === 'overdue').length || 0);
                                            return [
                                                { name: 'Low Risk', value: lowRisk || 1, color: '#10B981' },
                                                { name: 'Medium', value: mediumRisk || 1, color: '#F59E0B' },
                                                { name: 'High Risk', value: highRisk || 1, color: '#EF4444' },
                                            ];
                                        })()}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {[
                                            { color: '#10B981' },
                                            { color: '#F59E0B' },
                                            { color: '#EF4444' },
                                        ].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend iconType="circle" />
                                 </PieChart>
                             </ResponsiveContainer>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderPeakPerformance = () => {
        const peakHoursData = peakPerformanceTime?.peak_hours || peakPerformanceTime?.peakHours || [];
        const worstHoursData = peakPerformanceTime?.worst_hours || peakPerformanceTime?.worstHours || [];
        const peakHours = Array.isArray(peakHoursData) ? peakHoursData.filter(p => p)?.slice(0, 5) || [] : [];
        const worstHours = Array.isArray(worstHoursData) ? worstHoursData.filter(p => p)?.slice(0, 5) || [] : [];
        const topPerformer = topPerformers?.[0];

        return (
            <div className="space-y-6 animate-fade-in">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCardLight icon={TrendingUp} label="Engagement Score" value={`${engagementScore || 0}%`} color="blue" delay={0} />
                    <StatCardLight icon={Clock} label="Peak Hours Count" value={peakHours.length} color="emerald" delay={100} />
                    <StatCardLight icon={AlertCircle} label="Worst Hours" value={worstHours.length} color="orange" delay={200} />
                    <StatCardLight icon={User} label="Top Performer" value={topPerformer?.name || 'N/A'} color="purple" delay={300} isSmall={true} />
                </div>

                {/* Peak vs Worst Hours */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Peak Hours */}
                    <div className="wondr-card p-6">
                        <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                            <CheckCircle2 className="text-emerald-600" size={20} />
                            Peak Performance hours
                        </h3>
                        {peakHours.length > 0 ? (
                            <div className="space-y-2">
                                {peakHours.map((hour, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                        <div>
                                            <p className="font-bold text-slate-900">{hour.time_slot || hour.day || `Slot ${idx + 1}`}</p>
                                            <p className="text-xs text-slate-500">{hour.engagement_count || hour.attempts || 0} aktif</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${hour.performance_score || hour.score || 0}%` }}></div>
                                            </div>
                                            <span className="font-bold text-emerald-700 text-xs w-10 text-right">{hour.performance_score || hour.score || 0}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-slate-400 py-6">Tidak ada data peak hours</div>
                        )}
                    </div>

                    {/* Worst Hours */}
                    <div className="wondr-card p-6">
                        <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                            <AlertCircle className="text-red-600" size={20} />
                            Worst Performance hours
                        </h3>
                        {worstHours.length > 0 ? (
                            <div className="space-y-2">
                                {worstHours.map((hour, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                                        <div>
                                            <p className="font-bold text-slate-900">{hour.time_slot || hour.day || `Slot ${idx + 1}`}</p>
                                            <p className="text-xs text-slate-500">{hour.engagement_count || hour.attempts || 0} aktif</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                <div className="bg-red-500 h-2 rounded-full" style={{ width: `${hour.performance_score || hour.score || 0}%` }}></div>
                                            </div>
                                            <span className="font-bold text-red-700 text-xs w-10 text-right">{hour.performance_score || hour.score || 0}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-slate-400 py-6">Tidak ada data worst hours</div>
                        )}
                    </div>
                </div>

                {/* Trend Chart */}
                {trendData && trendData.length > 0 && (
                    <div className="wondr-card p-6">
                        <h3 className="font-bold text-lg text-slate-900 mb-4">Trend Penyelesaian - Periode: {dateRange?.start || 'N/A'} s/d {dateRange?.end || 'N/A'}</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={sampleData(trendData, 100)}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="day_name" tick={{ fill: '#64748B', fontSize: 12 }} />
                                    <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Line type="monotone" dataKey="completion" stroke="#005E54" strokeWidth={2} name="Penyelesaian" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        {trendData.length > 100 && (
                            <p className="text-xs text-slate-500 mt-3 text-center">📊 Data sampling applied: {trendData.length} points reduced to 100 for better performance</p>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderLearningImpact = () => {
        const totalModules = learningImpactSummary?.total_modules_with_tests || 0;
        const improvedModules = learningImpactSummary?.modules_with_improvement || 0;
        const overallGain = learningImpactSummary?.overall_improvement || 0;
        const avgGain = totalModules > 0 ? Math.round((parseFloat(overallGain) || 0) / totalModules) : 0;

        return (
            <div className="space-y-6 animate-fade-in">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCardLight 
                        icon={BookOpen} 
                        label="Total Modules" 
                        value={totalModules}
                        color="blue"
                        delay={0}
                    />
                    <StatCardLight 
                        icon={CheckCircle} 
                        label="Modules Improved" 
                        value={improvedModules}
                        color="emerald"
                        delay={100}
                    />
                    <StatCardLight 
                        icon={TrendingUp} 
                        label="Overall Improvement" 
                        value={`${overallGain}%`}
                        color="green"
                        delay={200}
                    />
                    <StatCardLight 
                        icon={ArrowUpRight} 
                        label="Rata-rata Gain" 
                        value={`${avgGain}%`}
                        color="cyan"
                        delay={300}
                    />
                </div>

                {/* Pre/Post Analysis Table */}
                {prePostData && prePostData.length > 0 ? (
                    <div className="wondr-card p-6">
                        <h3 className="font-bold text-lg text-slate-900 mb-6">Analisis Pre-Post Test - Pencapaian Peningkatan Kompetensi</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2 border-slate-200 text-left text-xs font-bold text-slate-700 uppercase bg-slate-50">
                                        <th className="px-4 py-4">Modul/Program</th>
                                        <th className="px-4 py-4 text-center">Pre-Test Rata-rata</th>
                                        <th className="px-4 py-4 text-center">Post-Test Rata-rata</th>
                                        <th className="px-4 py-4 text-center">Peningkatan Poin</th>
                                        <th className="px-4 py-4 text-center">% Peningkatan</th>
                                        <th className="px-4 py-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {prePostData.map((item, idx) => {
                                        const improvement = (item.avg_posttest || 0) - (item.avg_pretest || 0);
                                        const improvementPct = item.avg_pretest > 0 ? Math.round((improvement / item.avg_pretest) * 100) : 0;
                                        return (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-4 font-semibold text-slate-800">{item.module_title || `Module ${idx + 1}`}</td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded font-bold text-sm">{item.avg_pretest || 0}</span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded font-bold text-sm">{item.avg_posttest || 0}</span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className={`font-bold text-sm ${improvement > 0 ? 'text-emerald-700' : improvement < 0 ? 'text-red-700' : 'text-slate-500'}`}>
                                                        {improvement > 0 ? '+' : ''}{improvement}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className={`font-bold text-sm ${improvementPct > 0 ? 'text-emerald-700' : improvementPct < 0 ? 'text-red-700' : 'text-slate-500'}`}>
                                                        {improvementPct > 0 ? '+' : ''}{improvementPct}%
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className={`px-3 py-1 rounded text-xs font-bold ${
                                                        improvement > 5 ? 'bg-emerald-100 text-emerald-700' :
                                                        improvement > 0 ? 'bg-blue-100 text-blue-700' :
                                                        improvement < -5 ? 'bg-red-100 text-red-700' :
                                                        'bg-slate-100 text-slate-700'
                                                    }`}>
                                                        {improvement > 5 ? 'Excellent' : improvement > 0 ? 'Good' : improvement < -5 ? 'Decline' : 'Stable'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="wondr-card p-6 text-center text-slate-400 py-12">
                        Tidak ada data analisis pre-post test
                    </div>
                )}
            </div>
        );
    };

    const renderCompliance = () => {
        const totalDepts = departmentPassRates?.length || 0;
        const avgPassRate = totalDepts > 0 ? Math.round(
            departmentPassRates
                .map(d => {
                    const rate = parseFloat(d.pass_rate) || 0;
                    return isNaN(rate) ? 0 : rate;
                })
                .reduce((sum, rate) => sum + rate, 0) / totalDepts
        ) : 0;
        const bestDept = departmentPassRates?.[0];
        const worstDept = departmentPassRates?.[departmentPassRates.length - 1];

        return (
            <div className="space-y-6 animate-fade-in">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCardLight icon={Building2} label="Total Department" value={totalDepts} color="blue" delay={0} />
                    <StatCardLight icon={TrendingUp} label="Rata-rata Pass Rate" value={`${avgPassRate}%`} color="emerald" delay={100} />
                    <StatCardLight icon={Award} label="Best Department" value={bestDept?.name || 'N/A'} color="gold" delay={200} isSmall={true} />
                    <StatCardLight icon={AlertCircle} label="Needs Attention" value={worstDept?.name || 'N/A'} color="orange" delay={300} isSmall={true} />
                </div>

                {/* Trend & Department Rates */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Compliance Trend Chart */}
                    <div className="wondr-card p-6">
                        <h3 className="font-bold text-lg text-slate-900 mb-4">Compliance Trend</h3>
                        {compliance_trend && compliance_trend.length > 0 ? (
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={sampleData(compliance_trend, 100)}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 12 }} />
                                        <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="completed" stroke="#005E54" fill="#D6F84C" />
                                    </AreaChart>
                                </ResponsiveContainer>
                                {compliance_trend.length > 100 && (
                                    <p className="text-xs text-slate-500 mt-2 text-center">📊 Data sampling: {compliance_trend.length} points → 100</p>
                                )}
                            </div>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-slate-400">
                                Tidak ada data compliance
                            </div>
                        )}
                    </div>

                    {/* Department Pass Rates */}
                    <div className="wondr-card p-6">
                        <h3 className="font-bold text-lg text-slate-900 mb-4">Department Pass Rates</h3>
                        {departmentPassRates && departmentPassRates.length > 0 ? (
                            <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {departmentPassRates.map((dept, idx) => {
                                    const isExcellent = (dept.pass_rate || 0) >= 80;
                                    const isGood = (dept.pass_rate || 0) >= 60;
                                    const isBorder = isExcellent ? 'emerald' : isGood ? 'blue' : 'orange';
                                    return (
                                        <div key={idx} className={`p-4 rounded-lg border-l-4 border-${isBorder}-500 bg-slate-50 hover:bg-slate-100 transition-colors`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div>
                                                    <h4 className="font-bold text-slate-900 text-sm">{dept.name}</h4>
                                                    <p className="text-xs text-slate-500">{dept.passed_count || 0} / {dept.total_count || 0} selesai</p>
                                                </div>
                                                <span className={`font-bold px-3 py-1 rounded-full text-xs ${
                                                    isExcellent ? 'bg-emerald-100 text-emerald-700' :
                                                    isGood ? 'bg-blue-100 text-blue-700' :
                                                    'bg-orange-100 text-orange-700'
                                                }`}>
                                                    {dept.pass_rate || 0}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                                <div className={`h-3 rounded-full transition-all ${
                                                    isExcellent ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
                                                    isGood ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                                                    'bg-gradient-to-r from-orange-500 to-orange-600'
                                                }`} style={{ width: `${dept.pass_rate || 0}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center text-slate-400 py-6">Tidak ada data department rates</div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderQuestions = () => {
        const totalQuestions = questionItemAnalysis?.length || 0;
        const criticalQuestions = questionItemAnalysis?.filter(q => q.severity === 'critical')?.length || 0;
        const avgDifficulty = totalQuestions > 0 ? Math.round(
            questionItemAnalysis
                .map(q => {
                    const diff = parseFloat(q.difficulty_index) || 0;
                    return isNaN(diff) ? 0 : diff;
                })
                .reduce((sum, diff) => sum + diff, 0) / totalQuestions
        ) : 0;
        const highFailureRate = questionItemAnalysis?.filter(q => (parseFloat(q.difficulty_index) || 0) > 70)?.length || 0;

        return (
            <div className="space-y-6 animate-fade-in">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCardLight icon={HelpCircle} label="Total Questions" value={totalQuestions} color="blue" delay={0} />
                    <StatCardLight icon={AlertTriangle} label="Difficulty (Avg)" value={`${avgDifficulty}%`} color="orange" delay={100} />
                    <StatCardLight icon={AlertOctagon} label="High Failure Rate" value={highFailureRate} color="red" delay={200} />
                    <StatCardLight icon={AlertCircle} label="Critical Issues" value={criticalQuestions} color="pink" delay={300} />
                </div>

                {/* Questions Analysis Table */}
                <div className="wondr-card p-6">
                    <h3 className="font-bold text-lg text-slate-900 mb-6">Analisis Pertanyaan (Question Item Analysis)</h3>
                    {questionItemAnalysis && questionItemAnalysis.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2 border-slate-200 text-left text-xs font-bold text-slate-700 uppercase bg-slate-50">
                                        <th className="px-4 py-4">Pertanyaan</th>
                                        <th className="px-4 py-4 text-center">Total Attempts</th>
                                        <th className="px-4 py-4 text-center">Wrong Answers</th>
                                        <th className="px-4 py-4 text-center">Difficulty Index</th>
                                        <th className="px-4 py-4 text-center">Severity</th>
                                        <th className="px-4 py-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {questionItemAnalysis.map((q, idx) => {
                                        const failureRate = q.total_attempts > 0 ? Math.round((q.wrong_attempts / q.total_attempts) * 100) : 0;
                                        const severity = q.severity || (q.difficulty_index > 70 ? 'critical' : q.difficulty_index > 50 ? 'warning' : 'ok');
                                        return (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-4 text-slate-800 text-sm font-semibold max-w-xs truncate">{q.question || `Question ${idx + 1}`}</td>
                                                <td className="px-4 py-4 text-center text-slate-600">{q.total_attempts || 0}</td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="bg-red-50 text-red-700 px-3 py-1 rounded font-bold text-sm">{q.wrong_attempts || 0}</span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <div className="flex items-center gap-2 justify-center">
                                                        <div className="w-12 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                            <div className={`h-2 rounded-full ${
                                                                (q.difficulty_index || 0) > 70 ? 'bg-red-500' :
                                                                (q.difficulty_index || 0) > 50 ? 'bg-amber-500' :
                                                                'bg-emerald-500'
                                                            }`} style={{ width: `${q.difficulty_index || 0}%` }}></div>
                                                        </div>
                                                        <span className="font-bold text-slate-900 text-xs w-8 text-right">{q.difficulty_index || 0}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className={`px-3 py-1 rounded text-xs font-bold ${
                                                        severity === 'critical' ? 'bg-red-100 text-red-700' :
                                                        severity === 'warning' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-green-100 text-green-700'
                                                    }`}>
                                                        {severity}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold hover:bg-blue-200 transition">
                                                        Review
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center text-slate-400 py-12">Tidak ada data analisis pertanyaan</div>
                    )}
                </div>
            </div>
        );
    };

    const renderDropout = () => {
        const atRiskCount = atRiskUsers?.length || 0;
        const highRiskCount = atRiskUsers?.filter(u => u.risk_level === 'high' || u.risk_level === 'overdue')?.length || 0;
        const mediumRiskCount = atRiskUsers?.filter(u => u.risk_level === 'medium' || u.risk_level === 'urgent')?.length || 0;
        const lowRiskCount = atRiskUsers?.filter(u => u.risk_level === 'low')?.length || 0;

        return (
            <div className="space-y-6 animate-fade-in">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCardLight icon={AlertCircle} label="Total At-Risk" value={atRiskCount} color="red" delay={0} />
                    <StatCardLight icon={AlertTriangle} label="High Risk" value={highRiskCount} color="orange" delay={100} />
                    <StatCardLight icon={AlertOctagon} label="Medium Risk" value={mediumRiskCount} color="amber" delay={200} />
                    <StatCardLight icon={CheckCircle} label="Low Risk" value={lowRiskCount} color="yellow" delay={300} />
                </div>

                {/* Risk Distribution & Users Table */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Risk Distribution Pie Chart */}
                    <div className="wondr-card p-6">
                        <h3 className="font-bold text-lg text-slate-900 mb-4">Risk Distribution</h3>
                        {atRiskCount > 0 ? (
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'High', value: highRiskCount, fill: '#dc2626' },
                                                { name: 'Medium', value: mediumRiskCount, fill: '#f59e0b' },
                                                { name: 'Low', value: lowRiskCount, fill: '#fbbf24' }
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, value }) => `${name}: ${value}`}
                                            outerRadius={80}
                                        >
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-slate-400">
                                No at-risk users
                            </div>
                        )}
                    </div>

                    {/* At-Risk Users Table */}
                    <div className="lg:col-span-2 wondr-card p-6">
                        <h3 className="font-bold text-lg text-slate-900 mb-4">Users Berisiko Dropout</h3>
                        {atRiskUsers && atRiskUsers.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b-2 border-slate-200 text-left text-xs font-bold text-slate-700 uppercase bg-slate-50">
                                            <th className="px-3 py-3">Nama</th>
                                            <th className="px-3 py-3">Department</th>
                                            <th className="px-3 py-3 text-center">Days Inactive</th>
                                            <th className="px-3 py-3 text-center">Risk</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {atRiskUsers.slice(0, 10).map((user, idx) => {
                                            const riskColor = user.risk_level === 'high' || user.risk_level === 'overdue' ? 'red' :
                                                              user.risk_level === 'medium' || user.risk_level === 'urgent' ? 'amber' :
                                                              'yellow';
                                            return (
                                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-3 py-3 font-semibold text-slate-800">{user.name || 'N/A'}</td>
                                                    <td className="px-3 py-3 text-slate-600 text-xs">{user.department || 'N/A'}</td>
                                                    <td className="px-3 py-3 text-center">
                                                        <span className="font-bold text-slate-900">{user.days_inactive || 0}d</span>
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                            riskColor === 'red' ? 'bg-red-100 text-red-700' :
                                                            riskColor === 'amber' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                            {user.risk_level}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                {atRiskUsers.length > 10 && (
                                    <div className="mt-3 text-center text-xs text-slate-500 font-semibold">
                                        Showing 10 of {atRiskUsers.length} at-risk users
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center text-slate-400 py-8">Tidak ada users yang berisiko dropout</div>
                        )}
                    </div>
                </div>

                {/* Methodology Box */}
                <div className="wondr-card p-6 border-l-4 border-blue-500 bg-blue-50">
                    <div className="flex gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <Info size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 mb-2">Metodologi Prediksi Dropout</h4>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Risk ditentukan dari 4 faktor: Inaktivitas (40% bobot), Progress Module (25%), Ujian Failed (20%), dan Engagement Score (15%).
                                Users dengan total skor di atas threshold dimasukkan kategori "At-Risk". Lakukan intervensi sesuai risk level untuk menurunkan dropout rate.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // --- NEW: Render Functions dari Comprehensive ---

    const renderProgramStats = () => {
        const totalModules = moduleStats?.length || 0;
        const totalEnrolled = totalEnrolledUsers || 0;  // Use unique enrolled users count from backend
        const totalCompleted = moduleStats?.reduce((sum, m) => sum + (m.total_completed || 0), 0) || 0;
        const avgCompletion = totalModules > 0 ? Math.round(
            moduleStats
                .map(m => {
                    const rate = parseFloat(m.completion_rate) || 0;
                    return isNaN(rate) ? 0 : rate;
                })
                .reduce((sum, rate) => sum + rate, 0) / totalModules
        ) : 0;

        return (
            <div className="space-y-6 animate-fade-in">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCardLight icon={BookOpen} label="Total Program" value={totalModules} color="blue" delay={0} />
                    <StatCardLight icon={Users} label="Total Peserta" value={totalEnrolled} color="green" delay={100} />
                    <StatCardLight icon={CheckCircle} label="Selesai" value={totalCompleted} color="emerald" delay={200} />
                    <StatCardLight icon={TrendingUp} label="Rata-rata Completion" value={`${avgCompletion}%`} color="orange" delay={300} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Program List */}
                    <div className="lg:col-span-2 wondr-card p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Program/Modul Terdaftar</h3>
                        {moduleStats && moduleStats.length > 0 ? (
                            <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                                {moduleStats.slice(0, 15).map((prog, idx) => (
                                    <div key={idx} className="border border-slate-100 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-900 text-sm">{idx + 1}. {prog.module_name || prog.title || prog.name || 'N/A'}</h4>
                                                <p className="text-xs text-slate-500 mt-1">{prog.total_completed || 0} / {prog.total_enrolled || 0} selesai</p>
                                            </div>
                                            <span className={`text-lg font-bold px-3 py-1 rounded-full text-xs ${
                                                (prog.completion_rate || 0) >= 80 ? 'bg-emerald-100 text-emerald-700' :
                                                (prog.completion_rate || 0) >= 50 ? 'bg-blue-100 text-blue-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                                {prog.completion_rate || 0}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all" style={{ width: `${prog.completion_rate || 0}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-slate-400 py-8">Tidak ada data program</div>
                        )}
                    </div>

                    {/* Distribution Chart */}
                    <div className="wondr-card p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Distribusi Peserta</h3>
                        {moduleStats && moduleStats.length > 0 ? (
                            <div style={{ width: '100%', height: '350px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={moduleStats.slice(0, 8)}
                                            dataKey="total_enrolled"
                                            nameKey="title"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={70}
                                            label={({ title, value }) => `${value}`}
                                        >
                                            {moduleStats.slice(0, 8).map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'][index % 8]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => `${value} peserta`} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-80 flex items-center justify-center text-slate-400">Tidak ada data</div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderLearnerData = () => {
        const totalLearners = learnerProgress?.length || 0;
        const completedLearners = learnerProgress?.filter(l => l.status === 'completed').length || 0;
        const inProgressLearners = learnerProgress?.filter(l => l.status === 'in_progress').length || 0;
        const avgCompletion = totalLearners > 0 ? Math.round(
            learnerProgress
                .map(l => {
                    const pct = parseFloat(l.completion_percentage) || 0;
                    return isNaN(pct) ? 0 : pct;
                })
                .reduce((sum, pct) => sum + pct, 0) / totalLearners
        ) : 0;

        return (
            <div className="space-y-6 animate-fade-in">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCardLight icon={Users} label="Total Karyawan" value={totalLearners} color="blue" delay={0} />
                    <StatCardLight icon={CheckCircle} label="Selesai" value={completedLearners} color="emerald" delay={100} />
                    <StatCardLight icon={Activity} label="Sedang Belajar" value={inProgressLearners} color="orange" delay={200} />
                    <StatCardLight icon={TrendingUp} label="Rata-rata Progress" value={`${avgCompletion}%`} color="purple" delay={300} />
                </div>

                {/* Learners Table */}
                <div className="wondr-card p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Detail Karyawan</h3>
                    {learnerProgress && learnerProgress.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b-2 border-slate-200">
                                    <tr>
                                        {['No', 'Nama Karyawan', 'Departemen', 'Status', 'Program', 'Progress', 'Terakhir Aktif'].map((col) => (
                                            <th key={col} className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                {col}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {learnerProgress.slice(0, 20).map((learner, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 text-sm text-slate-900 font-medium">{idx + 1}</td>
                                            <td className="px-4 py-3 text-sm font-semibold text-slate-900">{learner.learner_name || learner.name || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{learner.department || '-'}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                    learner.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                                    learner.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {learner.status === 'completed' ? '✓ Selesai' : learner.status === 'in_progress' ? '⟳ Aktif' : '○ Pending'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-bold text-slate-900 text-center">{learner.modules_completed || 0}/ {learner.modules_enrolled || 0}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 bg-slate-200 rounded-full h-2">
                                                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{ width: `${learner.completion_percentage || 0}%` }} />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700 w-10 text-right">{learner.completion_percentage || 0}%</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-500">{learner.last_activity || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center text-slate-400 py-8">Tidak ada data karyawan</div>
                    )}
                </div>
            </div>
        );
    };

    const renderAssessmentData = () => {
        const topCount = topPerformers?.length || 0;
        const struggleCount = strugglers?.length || 0;
        const topAvg = topCount > 0 ? Math.round(
            topPerformers
                .map(t => {
                    const rate = parseFloat(t.completion_rate) || 0;
                    return isNaN(rate) ? 0 : rate;
                })
                .reduce((sum, rate) => sum + rate, 0) / topCount
        ) : 0;
        const struggleAvg = struggleCount > 0 ? Math.round(
            strugglers
                .map(s => {
                    const rate = parseFloat(s.completion_rate) || 0;
                    return isNaN(rate) ? 0 : rate;
                })
                .reduce((sum, rate) => sum + rate, 0) / struggleCount
        ) : 0;

        return (
            <div className="space-y-6 animate-fade-in">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCardLight icon={Award} label="Top Performers" value={topCount} color="yellow" delay={0} />
                    <StatCardLight icon={AlertCircle} label="Memerlukan Perhatian" value={struggleCount} color="red" delay={100} />
                    <StatCardLight icon={TrendingUp} label="Rata-rata Top" value={`${topAvg}%`} color="green" delay={200} />
                    <StatCardLight icon={TrendingDown} label="Rata-rata Bottom" value={`${struggleAvg}%`} color="orange" delay={300} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Performers */}
                    <div className="wondr-card p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Award className="w-5 h-5 text-yellow-600" />
                            <h3 className="text-lg font-bold text-slate-900">Performa Terbaik</h3>
                            <span className="ml-auto text-sm text-slate-600">{topCount} karyawan</span>
                        </div>
                        {topPerformers && topPerformers.length > 0 ? (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                                {topPerformers.slice(0, 15).map((performer, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 hover:bg-yellow-50 rounded-lg transition-colors border-b last:border-b-0">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-bold text-yellow-600">#{idx + 1}</span>
                                            <div>
                                                <p className="font-semibold text-slate-900 text-sm">{performer.name}</p>
                                                <p className="text-xs text-slate-500">{performer.department}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-yellow-600">{performer.completion_rate || 0}%</div>
                                            <p className="text-xs text-slate-500">{performer.completed || 0} selesai</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-slate-400 py-8">Tidak ada top performers</div>
                        )}
                    </div>

                    {/* Needs Attention */}
                    <div className="wondr-card p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <h3 className="text-lg font-bold text-slate-900">Memerlukan Perhatian</h3>
                            <span className="ml-auto text-sm text-slate-600">{struggleCount} karyawan</span>
                        </div>
                        {strugglers && strugglers.length > 0 ? (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                                {strugglers.slice(0, 15).map((learner, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 hover:bg-red-50 rounded-lg transition-colors border-b last:border-b-0">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-bold text-red-600">⚠ {idx + 1}</span>
                                            <div>
                                                <p className="font-semibold text-slate-900 text-sm">{learner.name}</p>
                                                <p className="text-xs text-slate-500">{learner.department}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-red-600">{learner.completion_rate || 0}%</div>
                                            <p className="text-xs text-slate-500">{learner.completed || 0}/{learner.total_modules || 0}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-slate-400 py-8">Tidak ada struggling learners</div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderTrends = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            {/* Enrollment & Completion Trends */}
            <div className="wondr-card p-6">
                <div className="flex items-center gap-2 mb-6">
                    <LineIcon className="w-5 h-5 text-cyan-600" />
                    <h3 className="text-lg font-bold text-slate-900">Tren Pembelajaran</h3>
                </div>
                {trendData && trendData.length > 0 ? (
                    <div style={{ width: '100%', height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sampleData(trendData, 100)}>
                                <defs>
                                    <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="name" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="completion" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCompletion)" name="Penyelesaian" />
                            </AreaChart>
                        </ResponsiveContainer>
                        {trendData.length > 100 && (
                            <p className="text-xs text-slate-500 mt-2 text-center">📊 Data sampling: {trendData.length} points → 100</p>
                        )}
                    </div>
                ) : (
                    <div className="h-72 flex items-center justify-center text-slate-400">
                        <p>Tidak ada data tren</p>
                    </div>
                )}
            </div>

            {/* Department Statistics */}
            <div className="wondr-card p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Users className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-bold text-slate-900">Statistik Departemen</h3>
                </div>
                {usersByDepartment && usersByDepartment.length > 0 ? (
                    <div style={{ width: '100%', height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={usersByDepartment.slice(0, 8)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="name" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" fill="#f59e0b" name="Jumlah Karyawan" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-72 flex items-center justify-center text-slate-400">
                        <p>Tidak ada data departemen</p>
                    </div>
                )}
            </div>
        </div>
    );

    // --- Helper Component: Light Stat Card (Redefined here to ensure scope access) ---
    const StatCardLight = ({ icon: Icon, label, value, color = 'blue', trend = null, trendValue = null, delay = 0 }) => {
        const themes = {
            green: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-600' },
            blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600' },
            purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-600' },
            orange: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-600' },
            red: { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-600' },
            indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'text-indigo-600' }
        };
        const theme = themes[color] || themes.blue;

        return (
            <div 
                className="wondr-card p-6 animate-fade-in flex flex-col justify-between h-full"
                style={{ animationDelay: `${delay}ms` }}
            >
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl ${theme.bg}`}>
                        <Icon size={24} className={theme.icon} />
                    </div>
                    {trend && (
                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            trend === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                            {trend === 'up' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                            {trendValue}
                        </div>
                    )}
                </div>
                <div>
                    <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{label}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800">
            <ModernStyles />
            
            {/* Get current user from Inertia */}
            <AdminSidebar user={currentUser} />

            <div className="md:ml-[280px]">
                <main className="p-6 md:p-10 max-w-[1600px]">
                    
                    {/* --- HEADER --- */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
                        <div>
                            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                                <span className="p-2 bg-[#002824] rounded-lg text-[#D6F84C]"><Activity size={24} /></span>
                                Laporan
                            </h1>
                            <p className="text-slate-500 mt-2 font-medium ml-1">Monitoring performa pembelajaran & kepatuhan secara real-time.</p>
                        </div>
                        
                        <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Search..." 
                                    className="pl-9 pr-4 py-2 text-sm bg-slate-50 border-none rounded-lg w-40 focus:w-60 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                            </div>
                            <div className="h-6 w-[1px] bg-slate-200"></div>
                            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition"><Filter size={18}/></button>
                            
                            {/* Export Button with Dropdown Menu */}
                            <div className="relative">
                                <button 
                                    onClick={() => setShowExportMenu(!showExportMenu)}
                                    disabled={isExporting}
                                    className="flex items-center gap-2 bg-[#002824] text-[#D6F84C] px-4 py-2 rounded-lg text-sm font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Download size={16} /> 
                                    {isExporting ? '⏳ Exporting...' : 'Export'}
                                    <ChevronDown size={14} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                {showExportMenu && (
                                    <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                                        <button
                                            onClick={() => handleExport('excel')}
                                            disabled={isExporting}
                                            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-slate-700 font-medium transition disabled:opacity-50"
                                        >
                                            <Download size={14} /> Excel (XLSX)
                                        </button>
                                        <button
                                            onClick={() => handleExport('pdf')}
                                            disabled={isExporting}
                                            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium transition disabled:opacity-50"
                                        >
                                            <FilePdfIcon size={14} /> PDF Document
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* --- NAVIGATION TABS (COMPREHENSIVE + UNIFIED) --- */}
                    <div className="flex overflow-x-auto gap-2 mb-8 pb-2">
                        {[
                            { id: 'executive', label: 'Overview', icon: '📊' },
                            { id: 'trends', label: 'Trends & Stats', icon: '📈' },
                            { id: 'programs', label: 'Programs', icon: '📚' },
                            { id: 'learners', label: 'Learners', icon: '👥' },
                            { id: 'assessment', label: 'Assessment', icon: '🎯' },
                            { id: 'heatmap', label: 'Peak Performance', icon: '🔥' },
                            { id: 'learning', label: 'Impact Analysis', icon: '📊' },
                            { id: 'compliance', label: 'Compliance', icon: '✅' },
                            { id: 'questions', label: 'Questions', icon: '❓' },
                            { id: 'dropout', label: 'Dropout Risk', icon: '⚠️' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`tab-btn ${activeTab === tab.id ? 'active' : 'hover:bg-white hover:text-slate-700'}`}
                                title={tab.label}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* --- DYNAMIC CONTENT --- */}
                    <AnimatePresence mode="wait">
                        {analyticsLoading ? (
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="h-96 flex items-center justify-center"
                            >
                                <div className="animate-spin w-10 h-10 border-4 border-[#005E54] border-t-transparent rounded-full"></div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }} 
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {activeTab === 'executive' && renderExecutiveDashboard()}
                                {activeTab === 'trends' && renderTrends()}
                                {activeTab === 'programs' && renderProgramStats()}
                                {activeTab === 'learners' && renderLearnerData()}
                                {activeTab === 'assessment' && renderAssessmentData()}
                                {activeTab === 'heatmap' && renderPeakPerformance()}
                                {activeTab === 'learning' && renderLearningImpact()}
                                {activeTab === 'compliance' && renderCompliance()}
                                {activeTab === 'questions' && renderQuestions()}
                                {activeTab === 'dropout' && renderDropout()}
                            </motion.div>
                        )}
                    </AnimatePresence>

                </main>
            </div>
        </div>
    );
};