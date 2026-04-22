import { get, set } from 'idb-keyval';

export interface Location {
  lat: number;
  lng: number;
  address?: string; // Optional if we do reverse geocoding
}

export interface CapturedPhoto {
  dataUrl: string;
  location: Location | null;
  timestamp: string;
}

export interface Inspection {
  id: string;
  username: string;
  date: string;
  description: string;
  location: Location | null;
  photos: (string | CapturedPhoto)[];
}

const API_BASE = 'http://localhost:3000/api';

const getAuthToken = () => localStorage.getItem('auth_token');

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  return response.json();
};

export const db = {
  async getInspections(username: string): Promise<Inspection[]> {
    try {
      return await apiRequest('/inspections');
    } catch (error) {
      // Fallback to local storage if API fails
      console.warn('API failed, using local storage', error);
      const key = `inspections_${username}`;
      const data = await get<Inspection[]>(key);
      return data || [];
    }
  },

  async saveInspection(inspection: Inspection): Promise<void> {
    try {
      await apiRequest('/inspections', {
        method: 'POST',
        body: JSON.stringify(inspection),
      });
    } catch (error) {
      // Fallback to local storage
      console.warn('API failed, saving locally', error);
      const key = `inspections_${inspection.username}`;
      const current = await this.getInspections(inspection.username);
      current.push(inspection);
      await set(key, current);
    }
  },

  async deleteInspection(username: string, id: string): Promise<void> {
    try {
      await apiRequest(`/inspections/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      // Fallback to local storage
      console.warn('API failed, deleting locally', error);
      const key = `inspections_${username}`;
      const current = await this.getInspections(username);
      const updated = current.filter(insp => insp.id !== id);
      await set(key, updated);
    }
  }
};
