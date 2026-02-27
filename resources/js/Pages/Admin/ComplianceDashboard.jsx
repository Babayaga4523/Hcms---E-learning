import React, { useEffect, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import {
    AlertCircle, CheckCircle, Clock, TrendingUp, Users,
    BarChart3, Activity, Download, RefreshCw, Filter,
    Info, HelpCircle, ChevronDown, Calendar, TrendingDown, AlertTriangle
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { complianceApi } from '@/Utils/ApiClient';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

const ComplianceDashboard = () => {
    const [summary, setSummary] = useState(null);
    const [nonCompliant, setNonCompliant] = useState([]);
    const [atRisk, setAtRisk] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [errorDetails, setErrorDetails] = useState(null);
    const [selectedModule, setSelectedModule] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [showEscalationInfo, setShowEscalationInfo] = useState(false);
    const [complianceHistory, setComplianceHistory] = useState([]);
    const [complianceBreakdown, setComplianceBreakdown] = useState(null);

    useEffect(() => {
        fetchDashboard();
        fetchComplianceHistory();
    }, []);

    /**
     * Fetch dashboard data with comprehensive error handling
     * Logs API calls for debugging compliance calculation issues
     */
    const fetchDashboard = async () => {
        try {
            setLoading(true);
            setError(null);
            setErrorDetails(null);
            
            console.log('[Compliance] Fetching dashboard from /api/admin/compliance/dashboard');
            const response = await complianceApi.getDashboard();
            
            console.log('[Compliance] Dashboard response received:', {
                total_enrollments: response?.total_enrollments,
                compliant_count: response?.compliant_count,
                non_compliant_count: response?.non_compliant_count,
                escalated_count: response?.escalated_count
            });
            
            setSummary(response);
            
            // Calculate and display compliance breakdown
            if (response) {
                const breakdown = {
                    completedAll: response?.completed_all_programs || 0,
                    passedAll: response?.passed_all_quizzes || 0,
                    meetsThreshold: response?.meets_scoring_threshold || 0,
                    byDepartment: response?.by_department || {}
                };
                setComplianceBreakdown(breakdown);
                
                console.log('[Compliance] Calculation breakdown:', breakdown);
            }
        } catch (err) {
            const errorMsg = err?.response?.data?.message || err?.message || 'Unknown error occurred';
            const statusCode = err?.response?.status;
            
            console.error('[Compliance] API Error:', {
                status: statusCode,
                message: errorMsg,
                endpoint: '/api/admin/compliance/dashboard',
                full_error: err
            });
            
            setError('Failed to load compliance data');
            setErrorDetails({
                status: statusCode,
                message: errorMsg,
                endpoint: '/api/admin/compliance/dashboard',
                timestamp: new Date().toISOString()
            });
        } finally {
            setLoading(false);
        }
    };

    /**
     * Fetch compliance history for trends over time
     * Shows month-over-month compliance rates
     */
    const fetchComplianceHistory = async () => {
        try {
            console.log('[Compliance] Fetching compliance history');
            // Mock data for demonstration - replace with actual API call
            const mockHistory = [
                { month: 'Jan', compliant: 65, nonCompliant: 35, total: 100 },
                { month: 'Feb', compliant: 72, nonCompliant: 28, total: 100 },
                { month: 'Mar', compliant: 68, nonCompliant: 32, total: 100 },
                { month: 'Apr', compliant: 80, nonCompliant: 20, total: 100 },
                { month: 'May', compliant: 78, nonCompliant: 22, total: 100 },
                { month: 'Jun', compliant: 85, nonCompliant: 15, total: 100 },
            ];
            setComplianceHistory(mockHistory);
            console.log('[Compliance] History data loaded:', mockHistory);
        } catch (err) {
            console.error('[Compliance] Failed to fetch history:', err);
        }
    };

    const handleCheckAllCompliance = async () => {
        try {
            setLoading(true);
            await complianceApi.checkAllCompliance();
            await fetchDashboard();
        } catch (err) {
            setError('Failed to check compliance');
        } finally {
            setLoading(false);
        }
    };

    const handleResolveNonCompliance = async (enrollmentId, reason = 'Resolved by admin') => {
        try {
            await complianceApi.resolve(enrollmentId, reason);
            await fetchDashboard();
        } catch (err) {
            console.error('Failed to resolve:', err);
        }
    };

    if (loading && !summary) {
        return (
            <AdminLayout>
                <Head title="Compliance Dashboard" />
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin">
                        <RefreshCw size={40} className="text-blue-500" />
                    </div>
                </div>
            </AdminLayout>
        );
    }

    const escalationBreakdown = summary?.escalation_breakdown || {};
    const escalationData = [
        { name: 'Manager (L1)', value: escalationBreakdown[1] || 0, fill: COLORS[0] },
        { name: 'Dept Head (L2)', value: escalationBreakdown[2] || 0, fill: COLORS[1] },
        { name: 'Executive (L3)', value: escalationBreakdown[3] || 0, fill: COLORS[2] },
    ].filter(item => item.value > 0);

    const complianceData = [
        { name: 'Compliant', value: summary?.compliant_count || 0, fill: COLORS[3] },
        { name: 'Non-Compliant', value: summary?.non_compliant_count || 0, fill: COLORS[0] },
        { name: 'Escalated', value: summary?.escalated_count || 0, fill: COLORS[1] },
    ];

    return (
        <AdminLayout>
            <Head title="Compliance Dashboard" />
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Compliance Dashboard</h1>
                        <p className="text-gray-600 mt-1">Monitor user compliance and manage escalations</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <Calendar size={18} />
                            {showHistory ? 'Hide History' : 'View History'}
                        </button>
                        <button
                            onClick={handleCheckAllCompliance}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            <RefreshCw size={18} />
                            Check All Compliance
                        </button>
                    </div>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg"
                    >
                        <div className="flex items-start gap-3">
                            <AlertTriangle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-red-900">{error}</h3>
                                {errorDetails && (
                                    <div className="mt-2 text-sm text-red-800 bg-red-100 p-3 rounded">
                                        <p><strong>Status Code:</strong> {errorDetails.status || 'Unknown'}</p>
                                        <p><strong>Error:</strong> {errorDetails.message}</p>
                                        <p><strong>Endpoint:</strong> {errorDetails.endpoint}</p>
                                        <div className="mt-3 pt-3 border-t border-red-200">
                                            <p className="font-semibold">💡 Troubleshooting Steps:</p>
                                            <ul className="list-disc list-inside mt-1 space-y-1 text-red-700">
                                                <li>Verify API endpoint is configured correctly</li>
                                                <li>Check network connection and try again</li>
                                                <li>Ensure you have appropriate permissions</li>
                                                <li>Review browser console logs for more details</li>
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Compliance History View */}
                {showHistory && complianceHistory.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white rounded-lg shadow p-6"
                    >
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <TrendingDown size={20} />
                            Compliance Trend (Last 6 Months)
                        </h3>
                        <div style={{ width: '100%', height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={complianceHistory}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis domain={[0, 100]} label={{ value: 'Compliance %', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip formatter={(value) => `${value}%`} />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="compliant"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        dot={{ fill: '#10b981', r: 5 }}
                                        activeDot={{ r: 7 }}
                                        name="Compliant"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="nonCompliant"
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        dot={{ fill: '#ef4444', r: 5 }}
                                        activeDot={{ r: 7 }}
                                        name="Non-Compliant"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                            <p><strong>📊 Insight:</strong> Compliance trend shows improvement from {complianceHistory[0]?.compliant}% to {complianceHistory[complianceHistory.length - 1]?.compliant}% over the period.</p>
                        </div>
                    </motion.div>
                )}

                {/* Compliance Breakdown */}
                {complianceBreakdown && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-6 border border-blue-200"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Info size={20} className="text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Compliance Calculation Breakdown</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded-lg border border-blue-100">
                                <p className="text-sm text-gray-600 font-medium">Modules Completed</p>
                                <p className="text-2xl font-bold text-blue-600 mt-2">{complianceBreakdown.completedAll || 0}</p>
                                <p className="text-xs text-gray-500 mt-1">✓ All required modules finished</p>
                            </div>
                            
                            <div className="bg-white p-4 rounded-lg border border-green-100">
                                <p className="text-sm text-gray-600 font-medium">Quizzes Passed</p>
                                <p className="text-2xl font-bold text-green-600 mt-2">{complianceBreakdown.passedAll || 0}</p>
                                <p className="text-xs text-gray-500 mt-1">✓ Achieved passing score</p>
                            </div>
                            
                            <div className="bg-white p-4 rounded-lg border border-purple-100">
                                <p className="text-sm text-gray-600 font-medium">Scoring Threshold Met</p>
                                <p className="text-2xl font-bold text-purple-600 mt-2">{complianceBreakdown.meetsThreshold || 0}</p>
                                <p className="text-xs text-gray-500 mt-1">✓ ≥ 80% overall score</p>
                            </div>
                        </div>
                        
                        <div className="mt-4 p-3 bg-white rounded border border-blue-100 text-sm text-gray-700">
                            <p><strong>📋 Compliance Formula:</strong></p>
                            <p className="mt-1">User is <strong className="text-green-600">COMPLIANT</strong> when:</p>
                            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
                                <li>Completed ALL assigned modules</li>
                                <li>Passed ALL required quizzes with ≥ 80%</li>
                                <li>Overall training score ≥ 80%</li>
                            </ul>
                        </div>
                    </motion.div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <SummaryCard
                        title="Total Enrollments"
                        value={summary?.total_enrollments || 0}
                        icon={Users}
                        color="blue"
                    />
                    <SummaryCard
                        title="Compliant"
                        value={summary?.compliant_count || 0}
                        icon={CheckCircle}
                        color="green"
                    />
                    <SummaryCard
                        title="Non-Compliant"
                        value={summary?.non_compliant_count || 0}
                        icon={AlertCircle}
                        color="red"
                    />
                    <SummaryCard
                        title="Escalated"
                        value={summary?.escalated_count || 0}
                        icon={TrendingUp}
                        color="orange"
                    />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Compliance Distribution */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-lg shadow p-6"
                    >
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Distribution</h3>
                        <div style={{ width: '100%', height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                <Pie
                                    data={complianceData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, value }) => `${name}: ${value}`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {complianceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                    {/* Escalation Breakdown */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-lg shadow p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Escalation Levels</h3>
                            <button
                                onClick={() => setShowEscalationInfo(!showEscalationInfo)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                title="View escalation workflow"
                            >
                                <Info size={20} className="text-blue-600" />
                            </button>
                        </div>
                        <div style={{ width: '100%', height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={escalationData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#3b82f6">
                                    {escalationData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>

                {/* Escalation Workflow Info Modal */}
                {showEscalationInfo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowEscalationInfo(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto"
                        >
                            <div className="p-6 border-b flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-gray-900">Escalation Workflow</h2>
                                <button
                                    onClick={() => setShowEscalationInfo(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>
                            
                            <div className="p-6 space-y-6">
                                <div className="border-l-4 border-orange-500 pl-4 py-2">
                                    <h3 className="text-lg font-semibold text-orange-900">🟠 Level 1: Manager Escalation</h3>
                                    <p className="text-gray-700 mt-2"><strong>Trigger:</strong> User non-compliant for 7+ days</p>
                                    <p className="text-gray-700"><strong>Owner:</strong> Direct manager of the user</p>
                                    <p className="text-gray-700"><strong>Action:</strong> Manager contacts user, provides training support</p>
                                    <p className="text-gray-700 mt-2"><strong>Count:</strong> <span className="font-bold text-orange-600">{escalationBreakdown[1] || 0}</span> users</p>
                                </div>

                                <div className="border-l-4 border-red-500 pl-4 py-2">
                                    <h3 className="text-lg font-semibold text-red-900">🔴 Level 2: Department Head Escalation</h3>
                                    <p className="text-gray-700 mt-2"><strong>Trigger:</strong> L1 unresolved for 14+ days</p>
                                    <p className="text-gray-700"><strong>Owner:</strong> Department head of the user</p>
                                    <p className="text-gray-700"><strong>Action:</strong> Dept head reviews, may implement consequences</p>
                                    <p className="text-gray-700 mt-2"><strong>Count:</strong> <span className="font-bold text-red-600">{escalationBreakdown[2] || 0}</span> users</p>
                                </div>

                                <div className="border-l-4 border-red-700 pl-4 py-2">
                                    <h3 className="text-lg font-semibold text-red-900">🔴 Level 3: Executive Escalation</h3>
                                    <p className="text-gray-700 mt-2"><strong>Trigger:</strong> L2 unresolved for 21+ days</p>
                                    <p className="text-gray-700"><strong>Owner:</strong> Executive management</p>
                                    <p className="text-gray-700"><strong>Action:</strong> Executive intervention, formal review</p>
                                    <p className="text-gray-700 mt-2"><strong>Count:</strong> <span className="font-bold text-red-700">{escalationBreakdown[3] || 0}</span> users</p>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <h4 className="font-semibold text-blue-900">Resolution Process</h4>
                                    <p className="text-blue-800 text-sm mt-2">
                                        Any escalation level can resolve a non-compliant case by marking the user as compliant.
                                        The system deescalates automatically when user achieves compliance and maintains it for 7+ days.
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 border-t bg-gray-50">
                                <button
                                    onClick={() => setShowEscalationInfo(false)}
                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Non-Compliant Users Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-lg shadow overflow-hidden"
                >
                    <div className="p-6 border-b">
                        <h3 className="text-lg font-semibold text-gray-900">Non-Compliant Users</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">User</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Module</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Escalation Level</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {/* Table data would be populated here */}
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        Load detailed non-compliant users data
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </AdminLayout>
    );
};

const SummaryCard = ({ title, value, icon: Icon, color }) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        red: 'bg-red-50 text-red-600',
        orange: 'bg-orange-50 text-orange-600',
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow p-6"
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-600 text-sm font-medium">{title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                    <Icon size={24} />
                </div>
            </div>
        </motion.div>
    );
};

export default ComplianceDashboard;
