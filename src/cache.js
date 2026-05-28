/**
 * Legacy TTL cache kept for backwards compatibility with code that uses
 * `withCache(key, fn)`. New code should use `src/hooks/useQuery.js` which
 * wraps `src/lib/queryCache.js` (stale-while-revalidate, shared subscribers).
 *
 * `invalidate(key)` invalidates BOTH caches so mutations bust either layer.
 */

import { invalidateKey } from './lib/queryCache';

const TTL = 3 * 60 * 1000;
const _store = new Map();

export function getCached(key) {
    const e = _store.get(key);
    if (!e || Date.now() - e.t > TTL) return null;
    return e.data;
}

export function setCached(key, data) {
    _store.set(key, { data, t: Date.now() });
    return data;
}

export function invalidate(...keys) {
    keys.forEach(k => {
        _store.delete(k);
        invalidateKey(k);
    });
}

export async function withCache(key, fn) {
    const hit = getCached(key);
    if (hit !== null) return hit;
    const data = await fn();
    return setCached(key, data);
}
