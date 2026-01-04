import React from 'react';
import { Trophy, Medal } from 'lucide-react';

export default function TopPerformersTable({ performers }) {
    const getRankIcon = (rank) => {
        switch (rank) {
            case 0:
                return <Trophy className="w-5 h-5 text-amber-500" />;
            case 1:
                return <Medal className="w-5 h-5 text-slate-400" />;
            case 2:
                return <Medal className="w-5 h-5 text-orange-600" />;
            default:
                return <span className="text-lg font-bold text-gray-600">#{rank + 1}</span>;
        }
    };

    return (
        <div className="space-y-3">
            {performers.map((performer, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div className="flex items-center justify-center w-8 h-8">
                        {getRankIcon(idx)}
                    </div>
                    <div className="flex-grow">
                        <h4 className="font-semibold text-gray-800">{performer.name}</h4>
                        <p className="text-xs text-gray-600">{performer.nip}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-blue-600">{performer.certifications}</p>
                        <p className="text-xs text-gray-600">Sertifikat</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
