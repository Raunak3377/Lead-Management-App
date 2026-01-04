
import { ApiResponse } from './types';

// The production endpoint for the Google Apps Script backend
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbyxwN1BhctjCrZ4Sb5r-kJDdYZDUD8KhuFGONuzDoUKKthFqxZnkbovKe-XrvOYgBee0A/exec';

class ApiClient {
  private token: string | null = localStorage.getItem('crm_token');

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('crm_token', token);
    } else {
      localStorage.removeItem('crm_token');
    }
  }

  async request<T>(route: string, options: RequestInit = {}, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(API_BASE_URL);
    // Set route as a dedicated parameter
    url.searchParams.set('route', route);
    
    // Set auth token if present
    if (this.token) {
      url.searchParams.set('token', this.token);
    }

    // Append any additional parameters (for GET requests usually)
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        url.searchParams.set(key, val);
      }
    });

    try {
      const response = await fetch(url.toString(), {
        ...options,
        mode: 'cors',
        headers: {
          // Use text/plain to avoid CORS preflight issues with Google Apps Script
          'Content-Type': 'text/plain;charset=utf-8',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'API Request failed');
      }

      return result.data as T;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async get<T>(route: string, params: Record<string, string> = {}): Promise<T> {
    return this.request<T>(route, { method: 'GET' }, params);
  }

  async post<T>(route: string, body: any): Promise<T> {
    return this.request<T>(route, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(route: string, body: any): Promise<T> {
    return this.request<T>(route, {
      method: 'POST', // GAS handles POST/GET best; use _method spoofing for logic
      body: JSON.stringify({ ...body, _method: 'PUT' }),
    });
  }
}

export const api = new ApiClient();
