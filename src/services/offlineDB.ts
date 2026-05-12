import { openDB } from 'idb';

export interface AttendanceRecord {
  id?: number;
  type: 'clock-in' | 'clock-out';
  timestamp: number;
  lat: number;
  lng: number;
  synced: boolean;
}

const dbPromise = openDB<{
  attendance: {
    key: number;
    value: AttendanceRecord;
  };
}>('staffclock-offline', 1, {
  upgrade(db) {
    db.createObjectStore('attendance', {
      keyPath: 'id',
      autoIncrement: true,
    });
  },
});

export const saveLocally = async (record: AttendanceRecord) => {
  const db = await dbPromise;
  await db.add('attendance', record);
};

export const getUnsynced = async (): Promise<AttendanceRecord[]> => {
  const db = await dbPromise;
  const all = await db.getAll('attendance');
  return all.filter((r) => !r.synced);
};

export const markSynced = async (id: number) => {
  const db = await dbPromise;
  const tx = db.transaction('attendance', 'readwrite');
  const store = tx.objectStore('attendance');
  const record = await store.get(id);
  if (record) {
    record.synced = true;
    await store.put(record);
  }
  await tx.done;
};

const API_BASE = 'https://staffclock-backend-1.onrender.com/api';

export const syncUnsynced = async (userId?: string) => {
  const unsynced = await getUnsynced();
  for (const record of unsynced) {
    try {
      const response = await fetch(`${API_BASE}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: record.type,
          timestamp: record.timestamp,
          lat: record.lat,
          lng: record.lng,
          user_id: userId || 'demo_user',
        }),
      });
      if (response.ok) {
        await markSynced(record.id!);
      }
    } catch (err) {
      console.error('Sync failed for record', record.id, err);
    }
  }
};