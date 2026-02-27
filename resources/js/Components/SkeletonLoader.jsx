import React from 'react';
import { motion } from 'framer-motion';

/**
 * Basic animated skeleton component
 * Provides visual loading state with accessible attributes
 */
export const Skeleton = ({ className = '', isLoading = true, ...props }) => (
    <div
        className={`animate-pulse bg-slate-200 rounded ${className}`}
        role={isLoading ? 'status' : undefined}
        aria-live={isLoading ? 'polite' : undefined}
        aria-label={isLoading ? 'Memuat konten' : undefined}
        {...props}
    />
);

/**
 * Skeleton for stat cards (4 columns)
 */
export function SkeletonStats() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {Array(4).fill(0).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-2xl overflow-hidden bg-white border border-slate-100 p-6 shadow-sm"
                >
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-24" />
                        <div className="flex justify-between pt-2">
                            <Skeleton className="h-2 w-1/2" />
                            <Skeleton className="h-2 w-1/4" />
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

/**
 * Skeleton for content cards (3 columns)
 */
export function SkeletonCards({ count = 3 }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {Array(count).fill(0).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-sm"
                >
                    {/* Card Image */}
                    <Skeleton className="w-full h-48" />
                    
                    {/* Card Content */}
                    <div className="p-4 space-y-3">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-5/6" />
                        <div className="flex gap-2 pt-2">
                            <Skeleton className="h-8 flex-1" />
                            <Skeleton className="h-8 flex-1" />
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

/**
 * Skeleton for table rows
 */
export function SkeletonTable({ rows = 5, columns = 4 }) {
    return (
        <div className="space-y-3 w-full">
            {Array(rows).fill(0).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex gap-3 p-4 bg-white rounded-lg border border-slate-100"
                >
                    {Array(columns).fill(0).map((_, j) => (
                        <Skeleton key={j} className="flex-1 h-4" />
                    ))}
                </motion.div>
            ))}
        </div>
    );
}

/**
 * Skeleton for chart/graph area
 */
export function SkeletonChart() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-white border border-slate-100 p-6 shadow-sm"
        >
            <div className="space-y-4">
                {/* Title */}
                <Skeleton className="h-5 w-32" />
                
                {/* Chart Area */}
                <div className="flex items-end justify-between gap-2 h-48 pt-4">
                    {Array(8).fill(0).map((_, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                            <Skeleton className="w-full h-24" />
                            <Skeleton className="h-3 w-3/4" />
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

/**
 * Skeleton for quiz/question cards
 */
export function SkeletonQuestionCard() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white border border-slate-100 p-6 shadow-sm space-y-4"
        >
            {/* Question Number */}
            <Skeleton className="h-4 w-24" />
            
            {/* Question Text */}
            <div className="space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-5/6" />
            </div>
            
            {/* Options */}
            <div className="space-y-2 pt-4">
                {Array(4).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
        </motion.div>
    );
}

/**
 * Skeleton for list items
 */
export function SkeletonList({ items = 5 }) {
    return (
        <div className="space-y-2 w-full">
            {Array(items).fill(0).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex gap-3 p-3 bg-white rounded-lg border border-slate-100"
                >
                    {/* Avatar */}
                    <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                    
                    {/* Content */}
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                    </div>
                    
                    {/* Action */}
                    <Skeleton className="w-8 h-8 rounded flex-shrink-0" />
                </motion.div>
            ))}
        </div>
    );
}

/**
 * Skeleton for section header with breadcrumb
 */
export function SkeletonHeader() {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 mb-8"
        >
            {/* Breadcrumb */}
            <div className="flex gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
            </div>
            
            {/* Title */}
            <Skeleton className="h-8 w-48" />
            
            {/* Subtitle */}
            <Skeleton className="h-3 w-72" />
        </motion.div>
    );
}

/**
 * Skeleton for activity/timeline items
 */
export function SkeletonActivity() {
    return (
        <div className="space-y-3 w-full">
            {Array(4).fill(0).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex gap-4 p-4 bg-white rounded-lg border border-slate-100"
                >
                    {/* Icon */}
                    <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                    
                    {/* Content */}
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-48" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                    
                    {/* Time */}
                    <Skeleton className="h-3 w-12 flex-shrink-0" />
                </motion.div>
            ))}
        </div>
    );
}

/**
 * Skeleton for performance metrics (Radar Chart style)
 */
export function SkeletonRadar() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl bg-white border border-slate-100 p-6 shadow-sm flex items-center justify-center"
        >
            <div className="w-full aspect-square flex items-center justify-center">
                <div className="relative w-full h-full flex items-center justify-center">
                    {/* Concentric circles */}
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="absolute rounded-full border border-slate-200"
                            style={{
                                width: `${(i / 3) * 100}%`,
                                aspectRatio: '1 / 1',
                            }}
                        />
                    ))}
                    
                    {/* Center indicator */}
                    <Skeleton className="w-6 h-6 rounded-full" />
                </div>
            </div>
        </motion.div>
    );
}

/**
 * Skeleton for a large dashboard section
 */
export function SkeletonDashboardSection() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-6 w-full"
        >
            {/* Section Header */}
            <div className="space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-3 w-56" />
            </div>
            
            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array(2).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-40 rounded-lg" />
                ))}
            </div>
        </motion.div>
    );
}

/**
 * Skeleton for badge/pill elements
 */
export function SkeletonBadges() {
    return (
        <div className="flex gap-2 flex-wrap">
            {Array(6).fill(0).map((_, i) => (
                <Skeleton
                    key={i}
                    className="h-6 rounded-full"
                    style={{ width: Math.random() * 60 + 40 }}
                />
            ))}
        </div>
    );
}

/**
 * Skeleton for loading state with spinner overlay
 */
export function SkeletonLoadingOverlay() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
        >
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 border-4 border-white border-t-[#005E54] rounded-full"
            />
        </motion.div>
    );
}

/**
 * Accessible Loading Overlay with spinner
 * Announces loading state to screen readers and prevents interaction
 * 
 * @param {String} label - Status text to announce
 * @param {Boolean} show - Whether to show the overlay
 */
export function LoadingOverlay({ label = 'Memuat', show = true }) {
    if (!show) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
            role="dialog"
            aria-modal="true"
            aria-label={label}
            aria-busy="true"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-white rounded-2xl p-8 shadow-xl flex flex-col items-center gap-4"
            >
                {/* Spinner */}
                <div 
                    className="w-12 h-12 border-4 border-slate-200 border-t-[#005E54] rounded-full animate-spin"
                    role="status"
                    aria-live="polite"
                >
                    <span className="sr-only">{label}</span>
                </div>
                <p className="text-slate-600 font-medium text-sm">{label}...</p>
            </motion.div>
        </div>
    );
}

/**
 * Accessible Loading Spinner (inline)
 * Shows loading state inline with screen reader announcement
 * 
 * @param {String} label - Status text
 * @param {Boolean} inline - If true, displays inline
 */
export function LoadingSpinner({ label = 'Memuat', inline = false }) {
    const spinnerContent = (
        <div className="flex items-center gap-3">
            <div 
                className="w-5 h-5 border-3 border-slate-200 border-t-[#005E54] rounded-full animate-spin"
                role="status"
                aria-live="polite"
            >
                <span className="sr-only">{label}</span>
            </div>
            {label && (
                <span className="text-sm text-slate-600 font-medium">{label}</span>
            )}
        </div>
    );

    if (inline) {
        return spinnerContent;
    }

    return (
        <div className="flex justify-center py-8">
            {spinnerContent}
        </div>
    );
}

export default {
    Skeleton,
    SkeletonStats,
    SkeletonCards,
    SkeletonTable,
    SkeletonChart,
    SkeletonQuestionCard,
    SkeletonList,
    SkeletonHeader,
    SkeletonActivity,
    SkeletonRadar,
    SkeletonDashboardSection,
    SkeletonBadges,
    SkeletonLoadingOverlay,
    LoadingOverlay,
    LoadingSpinner,
};
