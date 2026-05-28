import { useState, useEffect, useRef, useCallback } from 'react';
import { query, subscribe, peek } from '../lib/queryCache';

/**
 * React hook over the SWR cache.
 *
 *   const { data, loading, refetch } = useQuery('grns', getGrns);
 *
 * - On first mount with no cache: returns { data: undefined, loading: true }, then resolves.
 * - On revisit with cached data: returns { data: cached, loading: false } IMMEDIATELY,
 *   triggers a background refetch, swaps in fresh data when it lands.
 * - Multiple components calling useQuery for the same key share one in-flight fetch.
 *
 * @param key      Unique cache key (string or array of primitives — array gets joined).
 * @param fetcher  Async function that returns the data. Wrap your api/client call so it
 *                 returns the un-axios'd payload, e.g. () => getGrns().then(r => r.data).
 * @param opts     { staleMs?, enabled? }
 */
export function useQuery(key, fetcher, { staleMs, enabled = true } = {}) {
    const cacheKey = Array.isArray(key) ? key.join('|') : key;
    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;

    const initial = peek(cacheKey);
    const [data, setData] = useState(initial);
    const [loading, setLoading] = useState(initial === undefined);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;

        const result = query(cacheKey, () => fetcherRef.current(), staleMs ? { staleMs } : undefined);
        if (result.data !== undefined && result.data !== data) {
            setData(result.data);
            setLoading(false);
        }

        result.fresh
            .then(fresh => {
                if (cancelled) return;
                setData(fresh);
                setLoading(false);
                setError(null);
            })
            .catch(err => {
                if (cancelled) return;
                setError(err);
                setLoading(false);
            });

        const unsub = subscribe(cacheKey, (updated) => {
            if (!cancelled) setData(updated);
        });

        return () => { cancelled = true; unsub(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cacheKey, enabled]);

    const refetch = useCallback(() => {
        const result = query(cacheKey, () => fetcherRef.current(), { force: true });
        return result.fresh;
    }, [cacheKey]);

    return { data, loading, error, refetch };
}
