// ============================================================================
// Nama File : client.ts
// Lokasi    : /src/api/client.ts
// Peran     : Helper fetch dasar untuk API Client, mengintegrasikan Authorization header
//             dari local/session storage dan menangani parsing JSON dasar.
// ============================================================================

export function getAuthHeader(): Record<string, string> {
  try {
    const saved = localStorage.getItem('simibu_user') || sessionStorage.getItem('simibu_user');
    if (saved) {
      const u = JSON.parse(saved);
      if (u && u.token) {
        return { 'Authorization': `Bearer ${u.token}` };
      }
    }
  } catch (_) {}
  return {};
}

export async function clientFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = {
    ...getAuthHeader(),
    ...options.headers,
  } as Record<string, string>;

  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    body = JSON.stringify(body);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
    body,
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (_) {}
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}
