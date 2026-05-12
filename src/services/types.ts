export interface AttendanceRecord {
  id?: number;
  type: 'clock-in' | 'clock-out';
  timestamp: number;
  lat: number;
  lng: number;
  synced: boolean;
}