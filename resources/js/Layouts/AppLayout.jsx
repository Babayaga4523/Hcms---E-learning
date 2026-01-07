import React from 'react';
import Navbar from '@/Components/Layout/Navbar';
import Footer from '@/Components/Layout/Footer';

export default function AppLayout({ children, user }) {
    return (
        <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
            <Navbar user={user} />
            
            <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
            
            <Footer />
        </div>
    );
}
