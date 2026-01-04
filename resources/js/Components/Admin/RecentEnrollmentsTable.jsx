import React from 'react';

export default function RecentEnrollmentsTable({ enrollments }) {
    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed':
                return <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">Selesai</span>;
            case 'in_progress':
                return <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">Sedang Belajar</span>;
            case 'enrolled':
                return <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">Enrolled</span>;
            default:
                return <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">{status}</span>;
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Karyawan</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Training</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Tanggal</th>
                    </tr>
                </thead>
                <tbody>
                    {enrollments.map((enrollment, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition">
                            <td className="py-3 px-4">
                                <div>
                                    <p className="font-medium text-gray-800">{enrollment.user_name}</p>
                                    <p className="text-xs text-gray-600">{enrollment.user_nip}</p>
                                </div>
                            </td>
                            <td className="py-3 px-4 text-gray-700">{enrollment.module_title}</td>
                            <td className="py-3 px-4">{getStatusBadge(enrollment.status)}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                                {new Date(enrollment.enrolled_at).toLocaleDateString('id-ID')}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
