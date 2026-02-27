import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * ErrorBoundary Component
 *
 * Catches JavaScript errors in child components and displays a fallback UI
 * instead of crashing the entire application. This is critical for ensuring
 * that failures in individual widgets don't crash the entire dashboard.
 *
 * Usage:
 * <ErrorBoundary label="Widget Name">
 *   <SomeWidget />
 * </ErrorBoundary>
 *
 * Props:
 * - label: String - Display name for the widget (shown in error message)
 * - children: React.ReactNode - Child components to be wrapped
 * - onError: Function - Optional callback when error is caught
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state so the next render will show the fallback UI
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /**
   * Log error details for debugging
   * Called after an error has been thrown by a descendant component
   */
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', {
      component: this.props.label || 'Unknown Component',
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      errorInfo,
    });

    // Store error info for debugging
    this.setState({ errorInfo });

    // Call optional callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-1 h-5 w-5" />
          <div className="flex-1">
            <h3 className="font-bold text-red-900">Terjadi Kesalahan</h3>
            <p className="text-sm text-red-700 mt-1">
              {this.props.label || 'Widget'} sedang tidak tersedia. Coba refresh halaman atau hubungi support.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-3 text-xs text-red-600 cursor-pointer">
                <summary className="font-mono underline">Detail Error</summary>
                <pre className="mt-2 whitespace-pre-wrap bg-red-100 p-2 rounded overflow-auto max-h-40 font-mono text-xs">
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo && '\n\n' + this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
