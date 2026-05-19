const TTL = 3 * 60 * 1000; // 3 minutes
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
    keys.forEach(k => _store.delete(k));
}

export async function withCache(key, fn) {
    const hit = getCached(key);
    if (hit !== null) return hit;
    const data = await fn();
    return setCached(key, data);
}
