import React from 'react';
import Navbar from '@/Components/Layout/Navbar';
import Footer from '@/Components/Layout/Footer';

export default function AppLayout({ children, user }) {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar user={user} />
            
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
            
            <Footer />
        </div>
    );
}
