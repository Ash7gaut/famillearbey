const API_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      ...options,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error?.message ?? `Erreur ${res.status}`);
    }

    if (res.status === 204) return undefined as T;
    const json = await res.json();
    return json.data;
  }

  get<T>(path: string) {
    return this.request<T>(path);
  }

  post<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  }

  patch<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
  }

  delete(path: string) {
    return this.request<void>(path, { method: 'DELETE' });
  }

  async upload<T>(path: string, file: File, fields?: Record<string, string>) {
    const formData = new FormData();
    formData.append('file', file);
    if (fields) {
      Object.entries(fields).forEach(([k, v]) => formData.append(k, v));
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error?.message ?? `Erreur ${res.status}`);
    }

    const json = await res.json();
    return json.data as T;
  }
}

export const api = new ApiClient(API_URL);
