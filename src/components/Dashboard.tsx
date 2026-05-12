import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface LiveRecord {
  id: number;
  user_id: string;
  type: string;
  timestamp: number;   // Unix milliseconds (browser clock-in time)
  lat: number;
  lng: number;
  created_at: string;  // Server‑generated timestamp
}

const Dashboard = () => {
  const [records, setRecords] = useState<LiveRecord[]>([]);
  const [todayHours, setTodayHours] = useState<string>('0h 0m');

  // Calculate total hours worked today from the list of records
  const calculateTodayHours = (data: LiveRecord[]) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    // Filter for today’s records only (using the local timestamp)
    const todaysRecords = data
      .filter((r) => r.timestamp >= startOfToday)
      .sort((a, b) => a.timestamp - b.timestamp);

    let totalMilliseconds = 0;
    let clockInTime: number | null = null;

    for (const record of todaysRecords) {
      if (record.type === 'clock-in' && clockInTime === null) {
        clockInTime = record.timestamp;
      } else if (record.type === 'clock-out' && clockInTime !== null) {
        totalMilliseconds += record.timestamp - clockInTime;
        clockInTime = null; // reset for next pair
      }
      // ignore unmatched clock-outs or duplicate clock-ins
    }

    const totalMinutes = Math.floor(totalMilliseconds / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  useEffect(() => {
    const newSocket: Socket = io('https://staffclock-backend-1.onrender.com/api');

    fetch('http://localhost:4000/api/attendance')
      .then((res) => res.json())
      .then((data: LiveRecord[]) => {
        setRecords(data);
        setTodayHours(calculateTodayHours(data));
      })
      .catch(console.error);

    newSocket.on('new-attendance', (record: LiveRecord) => {
      setRecords((prev) => {
        const updated = [record, ...prev];
        // recalculate hours after adding new record
        setTodayHours(calculateTodayHours(updated));
        return updated;
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <h2 style={{ marginTop: 0 }}>📊 Live Attendance Dashboard</h2>

      {/* ---- Work Hours Summary ---- */}
      <div style={{
        background: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: '10px',
        padding: '1rem 1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontWeight: 600, color: '#0369a1' }}>
          🕒 Total worked today
        </span>
        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0c4a6e' }}>
          {todayHours}
        </span>
      </div>

      {records.length === 0 ? (
        <div className="empty-state">No attendance records yet. Clock in to see data.</div>
      ) : (
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Time</th>
              <th>Lat</th>
              <th>Lng</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>
                  <span className={`type-badge ${r.type}`}>
                    {r.type}
                  </span>
                </td>
                <td>{new Date(r.created_at).toLocaleString()}</td>
                <td>{Number(r.lat).toFixed(5)}</td>
                <td>{Number(r.lng).toFixed(5)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Dashboard;