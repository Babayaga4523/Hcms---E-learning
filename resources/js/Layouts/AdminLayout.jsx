import React from 'react';
import AdminSidebar from '@/Components/Admin/AdminSidebar';

export default function AdminLayout({ children, user }) {
    return (
        <>
            {/* Sidebar */}
            <AdminSidebar user={user} />

            {/* Main Content Area - Adjusted for fixed sidebar on desktop */}
            <div className="min-h-screen bg-slate-50 flex flex-col md:ml-[280px]">
                {/* Page Content */}
                <main className="flex-1 w-full px-4 sm:px-6 md:px-8 py-6 md:py-8 overflow-x-hidden">
                    <div className="max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </>
    );
}
