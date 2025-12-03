export class APIClient {
  private baseUrl: string

  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl
  }

  async request<T>(
    endpoint: string,
    options?: RequestInit & { params?: Record<string, string | number | boolean> }
  ): Promise<T> {
    const { params, ...requestInit } = options || {}

    const url = new URL(`${this.baseUrl}${endpoint}`, window.location.origin)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value))
      })
    }

    let response: Response
    try {
      response = await fetch(url.toString(), {
        ...requestInit,
        headers: {
          'Content-Type': 'application/json',
          ...requestInit.headers,
        },
      })
    } catch (networkError) {
      throw new Error('Network error. Please check your connection.')
    }

    const contentType = response.headers.get('content-type') || ''
    const isJson = contentType.includes('application/json')

    if (!response.ok) {
      if (isJson) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.error || errorData.message || `Request failed: ${response.status}`
        )
      }
      throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    }

    if (isJson) {
      return response.json()
    }

    // For successful non-JSON responses, return empty object
    return {} as T
  }

  get<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  post<T>(endpoint: string, data?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  put<T>(endpoint: string, data?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  delete<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}

export const apiClient = new APIClient()
