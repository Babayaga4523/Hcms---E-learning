import React from 'react';
import { Loader } from 'lucide-react';

/**
 * Reusable loading spinner component
 * Can be used as an overlay or inline indicator
 */
export const LoadingSpinner = ({ 
    message = 'Loading...', 
    overlay = false,
    size = 'md',
    className = ''
}) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16'
    };

    const content = (
        <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
            <Loader className={`${sizeClasses[size]} text-blue-600 animate-spin`} />
            {message && <p className="text-sm text-gray-600">{message}</p>}
        </div>
    );

    if (overlay) {
        return (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 shadow-lg">
                    {content}
                </div>
            </div>
        );
    }

    return content;
};

export default LoadingSpinner;
