import React from 'react';
import { motion } from 'framer-motion';

export const PageLoadingState = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center"
        >
            <div className="flex flex-col items-center gap-4">
                {/* Loading Spinner */}
                <div className="relative w-12 h-12">
                    <svg className="animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                </div>
                <p className="text-gray-600 font-medium">Memuat halaman...</p>
            </div>
        </motion.div>
    );
};

export const SkeletonLoader = ({ count = 5, className = 'h-12' }) => {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    className={`${className} bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg`}
                    animate={{
                        backgroundPosition: ['0% 0%', '100% 0%'],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'linear'
                    }}
                />
            ))}
        </div>
    );
};

export const CardSkeleton = ({ count = 3 }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    className="bg-white rounded-lg p-6 border border-gray-200"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
                    <div className="space-y-2">
                        <div className="h-4 bg-gray-100 rounded w-full" />
                        <div className="h-4 bg-gray-100 rounded w-5/6" />
                    </div>
                </motion.div>
            ))}
        </div>
    );
};
