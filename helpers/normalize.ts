export function norm(string?: string, fallback = 'unknown') {
    return (string?.trim().toLowerCase()) || fallback;
  }