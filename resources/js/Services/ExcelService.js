/**
 * ExcelService - Singleton service for loading SheetJS library
 * 
 * This service ensures the SheetJS library is loaded only once from CDN,
 * even if multiple ExcelViewer components mount simultaneously.
 * 
 * Benefits:
 * - Reduces redundant library downloads (saves ~500KB bandwidth per duplicate load)
 * - Improves performance when viewing multiple Excel files
 * - Caches the library promise to reuse across all components
 * - Gracefully handles loading errors
 */

class ExcelService {
    constructor() {
        this.promise = null; // Stores the loading promise
        this.isLoading = false;
    }

    /**
     * Load SheetJS library from CDN
     * Returns a promise that resolves to the XLSX object
     * 
     * @returns {Promise<Object>} The XLSX library object
     * @throws {Error} If library fails to load
     */
    async loadSheetJS() {
        // If already loaded globally, return immediately
        if (window.XLSX) {
            return Promise.resolve(window.XLSX);
        }

        // If already loading, return existing promise (avoid duplicate requests)
        if (this.promise) {
            return this.promise;
        }

        // Create new loading promise
        this.promise = new Promise((resolve, reject) => {
            this.isLoading = true;

            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
            script.async = true;
            script.type = 'text/javascript';

            // Success: library loaded
            script.onload = () => {
                this.isLoading = false;
                
                if (window.XLSX) {
                    console.log('[ExcelService] SheetJS library loaded successfully');
                    resolve(window.XLSX);
                } else {
                    reject(new Error('XLSX object not available after script load'));
                }
            };

            // Error: script failed to load
            script.onerror = () => {
                this.isLoading = false;
                this.promise = null; // Reset promise to allow retry
                
                const errorMsg = 'Failed to load SheetJS library from CDN';
                console.error('[ExcelService]', errorMsg);
                reject(new Error(errorMsg));
            };

            // Timeout: script took too long
            const timeoutId = setTimeout(() => {
                this.isLoading = false;
                this.promise = null; // Reset promise to allow retry
                
                const errorMsg = 'SheetJS library load timeout (30s)';
                console.error('[ExcelService]', errorMsg);
                reject(new Error(errorMsg));
            }, 30000); // 30 second timeout

            script.onload = (originalOnload => () => {
                clearTimeout(timeoutId);
                originalOnload.call(script);
            })(script.onload);

            script.onerror = (originalOnerror => () => {
                clearTimeout(timeoutId);
                originalOnerror.call(script);
            })(script.onerror);

            // Append to document to trigger load
            document.head.appendChild(script);
        });

        return this.promise;
    }

    /**
     * Check if library is currently loading
     * @returns {boolean} true if library is being loaded
     */
    isLibraryLoading() {
        return this.isLoading;
    }

    /**
     * Check if library is already loaded
     * @returns {boolean} true if XLSX is available globally
     */
    isLibraryLoaded() {
        return !!window.XLSX;
    }

    /**
     * Reset the service (useful for testing)
     */
    reset() {
        this.promise = null;
        this.isLoading = false;
    }
}

// Export singleton instance
export default new ExcelService();
