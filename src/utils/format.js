/**
 * Strips the leading "{4-digit-code}-" hospital prefix from a human-readable
 * record number (PO, GRN, bill, item/kit code) for display.
 *
 * Mirrors the backend HospitalIdPrefix.stripHospitalPrefix logic: only a
 * leading 4 digits followed by "-" is removed, so unprefixed codes like
 * "ABC-001" or "SK-001" pass through untouched.
 */
export function stripHospitalPrefix(value) {
    if (typeof value !== 'string') return value;
    return value.replace(/^\d{4}-/, '');
}
