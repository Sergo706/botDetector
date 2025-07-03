export function norm(string, fallback = 'unknown') {
    return (string?.trim().toLowerCase()) || fallback;
}
