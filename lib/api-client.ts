export class APIError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

export class APIClient {
  private baseUrl: string;

  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  private handleUnauthorized(): never {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    const error = new APIError('Unauthorized', 401);
    throw error;
  }

  async request<T>(
    endpoint: string,
    options?: RequestInit & { params?: Record<string, string | number | boolean> }
  ): Promise<T> {
    const { params, ...requestInit } = options || {};

    const url = new URL(`${this.baseUrl}${endpoint}`, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        ...requestInit,
        credentials: 'include', // Ensure cookies are sent with requests
        headers: {
          'Content-Type': 'application/json',
          ...requestInit.headers,
        },
      });
    } catch (networkError) {
      throw new APIError('Network error. Please check your connection.', 0);
    }

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!response.ok) {
      if (response.status === 401) {
        this.handleUnauthorized();
      }

      if (response.status === 403) {
        this.handleUnauthorized();
      }

      if (isJson) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(
          errorData.error || errorData.message || `Request failed: ${response.status}`,
          response.status
        );
      }
      throw new APIError(
        `Request failed: ${response.status} ${response.statusText}`,
        response.status
      );
    }

    if (isJson) {
      return response.json();
    }

    return {} as T;
  }

  get<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, data?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put<T>(endpoint: string, data?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new APIClient();
