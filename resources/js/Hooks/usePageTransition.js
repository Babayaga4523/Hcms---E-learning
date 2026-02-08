import { useEffect, useState } from 'react';
import { router, usePage } from '@inertiajs/react';

/**
 * Hook untuk menangani page loading state
 * Menampilkan loading indicator saat navigasi antar halaman
 */
export const usePageTransition = () => {
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Listener untuk start navigasi
        const handleStart = () => setIsLoading(true);
        
        // Listener untuk finish navigasi
        const handleFinish = () => setIsLoading(false);

        // Register Inertia event listeners
        router.on('start', handleStart);
        router.on('finish', handleFinish);

        return () => {
            router.off('start', handleStart);
            router.off('finish', handleFinish);
        };
    }, []);

    return { isLoading };
};

/**
 * Hook untuk caching data API
 * Mengurangi API calls yang berulang
 */
export const useApiCache = (url, fetcher, options = {}) => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const cacheKey = `api_cache_${url}`;
    const cacheDuration = options.cacheDuration || 5 * 60 * 1000; // 5 menit default

    useEffect(() => {
        const cached = sessionStorage.getItem(cacheKey);
        const cachedTime = sessionStorage.getItem(`${cacheKey}_time`);

        // Gunakan cache jika masih valid
        if (cached && cachedTime) {
            const age = Date.now() - parseInt(cachedTime);
            if (age < cacheDuration) {
                try {
                    setData(JSON.parse(cached));
                    setIsLoading(false);
                    return;
                } catch (e) {
                    console.error('Cache parse error:', e);
                }
            }
        }

        // Fetch data jika cache expired atau tidak ada
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const result = await fetcher();
                setData(result);
                // Simpan ke cache
                sessionStorage.setItem(cacheKey, JSON.stringify(result));
                sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());
            } catch (err) {
                setError(err.message);
                console.error('API fetch error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [url]);

    const clearCache = () => {
        sessionStorage.removeItem(cacheKey);
        sessionStorage.removeItem(`${cacheKey}_time`);
    };

    return { data, isLoading, error, clearCache };
};

/**
 * Hook untuk lazy loading data dengan pagination
 * Menampilkan data secara bertahap tanpa blocking UI
 */
export const useLazyLoad = (items, pageSize = 10) => {
    const [displayedItems, setDisplayedItems] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const totalPages = Math.ceil(items.length / pageSize);

    useEffect(() => {
        // Load items untuk halaman pertama
        setDisplayedItems(items.slice(0, pageSize));
        setCurrentPage(1);
    }, [items, pageSize]);

    const loadMore = async () => {
        if (currentPage >= totalPages) return;

        setIsLoadingMore(true);
        
        // Simulate network delay untuk realism
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const nextPage = currentPage + 1;
        const startIdx = (nextPage - 1) * pageSize;
        const endIdx = startIdx + pageSize;
        
        setDisplayedItems(prev => [...prev, ...items.slice(startIdx, endIdx)]);
        setCurrentPage(nextPage);
        setIsLoadingMore(false);
    };

    return {
        displayedItems,
        isLoadingMore,
        hasMore: currentPage < totalPages,
        loadMore,
        totalPages,
        currentPage
    };
};
