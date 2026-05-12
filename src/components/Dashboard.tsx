import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface LiveRecord {
  id: number;
  user_id: string;
  type: string;
  timestamp: number;
  lat: number;
  lng: number;
  created_at: string;
}

const Dashboard = () => {
  const [records, setRecords] = useState<LiveRecord[]>([]);

  useEffect(() => {
    const newSocket: Socket = io('https://staffclock-backend-1.onrender.com');
    fetch('https://staffclock-backend-1.onrender.com/api/attendance')
      .then(res => res.json())
      .then(setRecords)
      .catch(console.error);

    newSocket.on('new-attendance', (record: LiveRecord) => {
      setRecords(prev => [record, ...prev]);
    });
    return () => { newSocket.disconnect(); };
  }, []);

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <h2 style={{ marginTop: 0 }}>📊 Live Attendance Dashboard</h2>
      {records.length === 0 ? (
        <div className="empty-state">No attendance records yet.</div>
      ) : (
        <table className="dashboard-table">
          <thead>
            <tr><th>ID</th><th>Type</th><th>Time</th><th>Lat</th><th>Lng</th></tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td><span className={`type-badge ${r.type}`}>{r.type}</span></td>
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