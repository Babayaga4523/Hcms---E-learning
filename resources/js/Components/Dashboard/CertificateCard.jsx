import React from 'react';
import { Award, CheckCircle } from 'lucide-react';

export default function CertificateCard({ training }) {
    return (
        <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg hover:shadow-md transition">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                    <Award className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-grow">
                    <h4 className="font-semibold text-gray-800 line-clamp-1">
                        {training.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <p className="text-xs text-gray-600">
                            Selesai: {training.completed_at && 
                            new Date(training.completed_at).toLocaleDateString('id-ID')}
                        </p>
                    </div>
                    {training.final_score && (
                        <p className="text-xs text-amber-700 mt-1">
                            Nilai: <span className="font-bold">{training.final_score}%</span>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
