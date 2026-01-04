import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ModulesStatsChart({ modules }) {
    return (
        <ResponsiveContainer width="100%" height={400}>
            <BarChart data={modules}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                    dataKey="title" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    interval={0}
                    tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip 
                    contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                    }}
                />
                <Legend />
                <Bar dataKey="total_enrollments" fill="#3b82f6" name="Total Enrollment" />
                <Bar dataKey="completed_count" fill="#10b981" name="Selesai" />
            </BarChart>
        </ResponsiveContainer>
    );
}
