/**
 * Stale-while-revalidate cache shared across the app.
 *
 * Semantics for `query(key, fetcher)`:
 *   - If there's cached data younger than `staleMs`, return it; don't refetch.
 *   - If there's cached data older than `staleMs`, return it IMMEDIATELY, kick
 *     off a background refetch, notify subscribers when fresh data arrives.
 *   - If no cached data, fetch, cache, return.
 *   - Concurrent calls with the same key share one in-flight promise (dedup).
 *
 * This is what makes revisits feel "instant" — second time you land on a page,
 * the data is already on screen while a quiet refetch happens in the background.
 */

const cache = new Map(); // key -> { data, ts, inFlight, subscribers: Set<fn> }
const DEFAULT_STALE_MS = 30 * 1000; // 30 seconds — re-validate on revisits

function getEntry(key) {
    let e = cache.get(key);
    if (!e) {
        e = { data: undefined, ts: 0, inFlight: null, subscribers: new Set() };
        cache.set(key, e);
    }
    return e;
}

function notify(entry) {
    entry.subscribers.forEach(fn => fn(entry.data));
}

/**
 * Returns { data, fresh }:
 *   data  — currently cached value, or undefined if none yet
 *   fresh — Promise that resolves with the latest data (whether from cache or network)
 */
export function query(key, fetcher, { staleMs = DEFAULT_STALE_MS, force = false } = {}) {
    const entry = getEntry(key);
    const isFresh = !force && entry.data !== undefined && (Date.now() - entry.ts) < staleMs;

    if (isFresh) {
        return { data: entry.data, fresh: Promise.resolve(entry.data) };
    }

    if (!entry.inFlight) {
        entry.inFlight = fetcher()
            .then(result => {
                entry.data = result;
                entry.ts = Date.now();
                notify(entry);
                return result;
            })
            .finally(() => { entry.inFlight = null; });
    }

    return { data: entry.data, fresh: entry.inFlight };
}

/** Subscribe to data changes for a key. Returns an unsubscribe fn. */
export function subscribe(key, fn) {
    const entry = getEntry(key);
    entry.subscribers.add(fn);
    return () => entry.subscribers.delete(fn);
}

/** Read cached value synchronously without triggering a fetch. */
export function peek(key) {
    return cache.get(key)?.data;
}

/** Drop a cached entry — call after mutations. */
export function invalidateKey(key) {
    const entry = cache.get(key);
    if (!entry) return;
    entry.data = undefined;
    entry.ts = 0;
    notify(entry);
}

/**
 * Warm the cache without waiting on it — useful for sidebar hover prefetch.
 * Safe to call repeatedly; dedup ensures only one fetch in flight.
 */
export function prefetch(key, fetcher) {
    const entry = getEntry(key);
    if (entry.inFlight) return entry.inFlight;
    const fresh = (Date.now() - entry.ts) < DEFAULT_STALE_MS && entry.data !== undefined;
    if (fresh) return Promise.resolve(entry.data);
    return query(key, fetcher).fresh;
}
