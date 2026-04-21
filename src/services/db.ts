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

export const db = {
  async getInspections(username: string): Promise<Inspection[]> {
    const key = `inspections_${username}`;
    const data = await get<Inspection[]>(key);
    return data || [];
  },

  async saveInspection(inspection: Inspection): Promise<void> {
    const key = `inspections_${inspection.username}`;
    const current = await this.getInspections(inspection.username);
    current.push(inspection);
    await set(key, current);
  },

  async deleteInspection(username: string, id: string): Promise<void> {
    const key = `inspections_${username}`;
    const current = await this.getInspections(username);
    const updated = current.filter(insp => insp.id !== id);
    await set(key, updated);
  }
};
