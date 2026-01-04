import React from 'react';

export default function AdminStatCard({ icon, title, value, subtitle, bgGradient, trend, highlight }) {
    return (
        <div className={`bg-gradient-to-br ${bgGradient} rounded-lg shadow-lg p-6 text-white overflow-hidden relative ${highlight ? 'ring-2 ring-yellow-300' : ''}`}>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-12 -mt-12"></div>

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div className="opacity-80">
                        {icon}
                    </div>
                    {trend && (
                        <span className="text-xs font-semibold bg-white bg-opacity-20 px-2 py-1 rounded-full">
                            {trend}
                        </span>
                    )}
                </div>

                <h3 className="text-white text-opacity-80 text-sm font-medium">{title}</h3>
                <p className="text-4xl font-bold mt-2">{value}</p>
                <p className="text-white text-opacity-70 text-xs mt-3">{subtitle}</p>
            </div>
        </div>
    );
}
