import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for managing async operations with loading and error states
 * Provides consistent error handling across the application
 */
export const useAsyncState = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const abortControllerRef = useRef(null);

    const execute = useCallback(async (asyncFunction, onSuccess = null, onError = null) => {
        try {
            setLoading(true);
            setError(null);
            
            // Cancel previous request if still pending
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            
            abortControllerRef.current = new AbortController();
            const result = await asyncFunction(abortControllerRef.current.signal);
            
            if (onSuccess) {
                onSuccess(result);
            }
            
            return result;
        } catch (err) {
            // Skip errors from aborted requests
            if (err.name !== 'AbortError') {
                const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
                setError(errorMessage);
                console.error('Async operation error:', err);
                
                if (onError) {
                    onError(err);
                }
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const retry = useCallback(async (asyncFunction, onSuccess = null, onError = null) => {
        return execute(asyncFunction, onSuccess, onError);
    }, [execute]);

    return {
        loading,
        error,
        execute,
        clearError,
        retry,
        isLoading: loading,
        hasError: !!error,
    };
};

export default useAsyncState;
