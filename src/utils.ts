export const formatIndoDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  const cleaned = dateStr.replace(/-/g, '/');
  const parts = cleaned.split('/');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${day} ${months[monthIndex]} ${year}`;
    }
  }
  return dateStr;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// Cache simple GET requests to avoid Rate exceeded errors
const cache = new Map<string, { data: any, timestamp: number }>();

export const fetchWithCache = async (url: string, ttl: number = 5000, headers: HeadersInit = {}) => {
  const now = Date.now();
  if (cache.has(url)) {
    const cached = cache.get(url)!;
    if (now - cached.timestamp < ttl) {
      return cached.data;
    }
  }
  const response = await fetch(url, { headers, credentials: 'include' });
  if (!response.ok) {
    console.error(`Error fetchWithCache: ${url} returned ${response.status} ${response.statusText}`);
    if (response.status === 401) {
      window.dispatchEvent(new Event('auth-error'));
    }
    throw new ApiError(`Failed to fetch ${url}`, response.status);
  }
  const data = await response.json();
  cache.set(url, { data, timestamp: now });
  return data;
};
