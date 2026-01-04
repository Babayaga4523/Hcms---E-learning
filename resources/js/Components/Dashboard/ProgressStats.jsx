import React from 'react';
import { CheckCircle, Clock, TrendingUp, Award } from 'lucide-react';

export default function ProgressStats({ totalTrainings, completedCount, inProgressCount, certifications }) {
    const stats = [
        {
            icon: <CheckCircle className="w-5 h-5" />,
            label: 'Selesai',
            value: completedCount,
            color: 'text-green-600',
            bgColor: 'bg-green-50'
        },
        {
            icon: <Clock className="w-5 h-5" />,
            label: 'Sedang Belajar',
            value: inProgressCount,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
        },
        {
            icon: <TrendingUp className="w-5 h-5" />,
            label: 'Belum Mulai',
            value: totalTrainings - completedCount - inProgressCount,
            color: 'text-gray-600',
            bgColor: 'bg-gray-50'
        },
        {
            icon: <Award className="w-5 h-5" />,
            label: 'Sertifikat',
            value: certifications,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50'
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.map((stat, idx) => (
                <div key={idx} className={`${stat.bgColor} rounded-lg p-4 text-center`}>
                    <div className={`flex justify-center mb-2 ${stat.color}`}>
                        {stat.icon}
                    </div>
                    <h4 className={`text-2xl font-bold ${stat.color} mb-1`}>
                        {stat.value}
                    </h4>
                    <p className="text-xs text-gray-600">{stat.label}</p>
                </div>
            ))}
        </div>
    );
}
