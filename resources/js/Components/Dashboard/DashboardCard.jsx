import React from 'react';

export default function DashboardCard({ icon, title, value, subtitle, bgGradient }) {
    return (
        <div className={`bg-gradient-to-br ${bgGradient} rounded-lg shadow-lg p-6 text-white overflow-hidden relative`}>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
            
            <div className="relative z-10 flex items-start justify-between">
                <div>
                    <p className="text-white text-opacity-80 text-sm font-medium">{title}</p>
                    <h3 className="text-4xl font-bold mt-2">{value}</h3>
                    <p className="text-white text-opacity-70 text-xs mt-2">{subtitle}</p>
                </div>
                <div className="opacity-80">
                    {icon}
                </div>
            </div>
        </div>
    );
}
