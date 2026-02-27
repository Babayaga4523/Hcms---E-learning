import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Error Boundary Component
 * 
 * Catches errors in child components and displays user-friendly error message
 * Logs errors to console and optionally to error tracking service
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorCount: 0
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Update state with error details
        this.setState(prevState => ({
            error,
            errorInfo,
            errorCount: prevState.errorCount + 1
        }));

        // Log to console for development
        console.error('🔴 Error caught by boundary:', error);
        console.error('Component stack:', errorInfo?.componentStack);

        // Log to error tracking service (Sentry, etc)
        if (typeof window !== 'undefined' && window.Sentry) {
            window.Sentry.captureException(error, {
                contexts: {
                    react: {
                        componentStack: errorInfo?.componentStack,
                        pageName: this.props.pageName
                    }
                }
            });
        }
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    render() {
        if (this.state.hasError) {
            const isDevelopment = import.meta.env.MODE === 'development';

            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
                    <div className="max-w-md w-full">
                        {/* Error Card */}
                        <div className="bg-white rounded-2xl shadow-lg border border-red-200 overflow-hidden">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-8 text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                                    <AlertTriangle size={32} className="text-white" />
                                </div>
                                <h1 className="text-2xl font-bold text-white">Oops, Ada Kesalahan!</h1>
                                <p className="text-red-50 text-sm mt-2">
                                    Halaman ini mengalami masalah teknis
                                </p>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <p className="text-slate-600 text-sm mb-4">
                                    Tim kami sudah diberitahu tentang masalah ini. Silakan coba:
                                </p>

                                <ul className="space-y-2 mb-6 text-sm text-slate-600">
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-500 font-bold mt-0.5">1</span>
                                        <span>Refresh halaman ini (F5 atau Ctrl+R)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-500 font-bold mt-0.5">2</span>
                                        <span>Kembali ke halaman sebelumnya</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-500 font-bold mt-0.5">3</span>
                                        <span>Hubungi support jika masalah berlanjut</span>
                                    </li>
                                </ul>

                                {/* Error Details (Development Only) */}
                                {isDevelopment && this.state.error && (
                                    <div className="bg-slate-100 rounded-lg p-4 mb-6 border border-slate-300">
                                        <p className="font-mono text-xs text-red-600 mb-2 break-words">
                                            {this.state.error.toString()}
                                        </p>
                                        {this.state.errorInfo?.componentStack && (
                                            <details className="text-xs text-slate-600">
                                                <summary className="cursor-pointer font-semibold mb-2">
                                                    Component Stack
                                                </summary>
                                                <pre className="font-mono text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                                                    {this.state.errorInfo.componentStack}
                                                </pre>
                                            </details>
                                        )}
                                        <p className="text-xs text-slate-500 mt-3">
                                            ✓ Error ID: {Date.now()}-{Math.random().toString(36).substr(2, 9)}
                                        </p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={this.handleReset}
                                        className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                                    >
                                        <RefreshCw size={16} />
                                        Coba Lagi
                                    </button>
                                    <a
                                        href="/admin/dashboard"
                                        className="flex-1 flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 px-4 rounded-lg transition-colors"
                                    >
                                        <Home size={16} />
                                        Ke Dashboard
                                    </a>
                                </div>

                                {/* Error Count Warning */}
                                {this.state.errorCount > 2 && (
                                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <p className="text-xs text-yellow-800">
                                            ⚠️ Masalah terjadi {this.state.errorCount} kali. 
                                            Hubungi support jika terus terjadi.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Helpful Footer */}
                        <div className="text-center text-xs text-slate-500 mt-6">
                            <p>
                                Perlu bantuan? 
                                <a href="mailto:support@hcms.local" className="text-slate-700 hover:text-slate-900 font-semibold">
                                    {' Hubungi Support'}
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Wrapper component for easier usage
 */
export const ErrorWrapper = ({ children, pageName }) => (
    <ErrorBoundary pageName={pageName}>
        {children}
    </ErrorBoundary>
);

/**
 * HOC for wrapping components
 */
export const withErrorBoundary = (Component, pageName) => (props) => (
    <ErrorBoundary pageName={pageName}>
        <Component {...props} />
    </ErrorBoundary>
);

export default ErrorBoundary;
