import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, Zap } from 'lucide-react';

export default function ModuleHealthCheck({ modules_stats }) {
    const [refreshing, setRefreshing] = useState(false);

    // Simulate health check (in real app, this calls backend API)
    const healthChecks = [
        { 
            module: 'Anti-Money Laundering (AML)', 
            status: 'healthy',
            issues: [],
            lastCheck: '5 menit lalu'
        },
        { 
            module: 'Cybersecurity 101', 
            status: 'warning',
            issues: ['Video link rusak (404)', 'Slide PPT tidak ter-render'],
            lastCheck: '2 jam lalu'
        },
        { 
            module: 'Compliance & Governance', 
            status: 'healthy',
            issues: [],
            lastCheck: '10 menit lalu'
        },
        { 
            module: 'Data Privacy & GDPR', 
            status: 'critical',
            issues: ['Database PDF terputus', 'Pre-test tidak bisa diakses'],
            lastCheck: '30 menit lalu'
        },
    ];

    const healthyCount = healthChecks.filter(h => h.status === 'healthy').length;
    const warningCount = healthChecks.filter(h => h.status === 'warning').length;
    const criticalCount = healthChecks.filter(h => h.status === 'critical').length;

    const handleRefresh = async () => {
        setRefreshing(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        setRefreshing(false);
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Module Health Check</h3>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                    {refreshing ? '🔄 Checking...' : '🔄 Refresh Check'}
                </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-xs text-emerald-700 font-semibold">Healthy</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{healthyCount}</p>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-700 font-semibold">Warning</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{warningCount}</p>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-700 font-semibold">Critical</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{criticalCount}</p>
                </div>
            </div>

            {/* Health Details */}
            <div className="space-y-3">
                {healthChecks.map((check, idx) => (
                    <div 
                        key={idx} 
                        className={`p-4 border rounded-lg ${
                            check.status === 'healthy' ? 'bg-emerald-50 border-emerald-200' :
                            check.status === 'warning' ? 'bg-amber-50 border-amber-200' :
                            'bg-red-50 border-red-200'
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-1">
                                {check.status === 'healthy' && (
                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                )}
                                {check.status === 'warning' && (
                                    <AlertCircle className="w-5 h-5 text-amber-600" />
                                )}
                                {check.status === 'critical' && (
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                )}
                            </div>
                            
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900">{check.module}</p>
                                <p className="text-xs text-gray-600 mt-1">Terakhir dicek: {check.lastCheck}</p>
                                
                                {check.issues.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                        {check.issues.map((issue, i) => (
                                            <p key={i} className="text-xs font-medium text-gray-700">
                                                • {issue}
                                            </p>
                                        ))}
                                        <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 mt-2">
                                            Fix Issues →
                                        </button>
                                    </div>
                                )}
                            </div>

                            {check.status !== 'healthy' && (
                                <div className="text-right">
                                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                                        check.status === 'warning' ? 'bg-amber-100 text-amber-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {check.status.toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                    <Zap className="w-4 h-4 inline mr-1" />
                    💡 <strong>Pro Tip:</strong> Jalankan health check setiap pagi untuk memastikan semua material tetap accessible untuk karyawan.
                </p>
            </div>
        </div>
    );
}
