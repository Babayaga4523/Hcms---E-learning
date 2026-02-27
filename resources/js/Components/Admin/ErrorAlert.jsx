import React from 'react';
import { AlertCircle, X, RefreshCw } from 'lucide-react';

/**
 * Reusable error alert component for consistent error display
 * Shows error message with dismiss and retry options
 */
export const ErrorAlert = ({ 
    error, 
    onDismiss, 
    onRetry, 
    title = 'Something went wrong',
    className = ''
}) => {
    if (!error) return null;

    return (
        <div className={`bg-red-50 border border-red-200 rounded-lg p-4 mb-4 ${className}`}>
            <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-red-900 mb-1">{title}</h3>
                    <p className="text-red-800 text-sm break-words">{error}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-red-700 hover:text-red-900 hover:bg-red-100 rounded transition-colors"
                            title="Retry"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Retry
                        </button>
                    )}
                    {onDismiss && (
                        <button
                            onClick={onDismiss}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            title="Dismiss"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ErrorAlert;
