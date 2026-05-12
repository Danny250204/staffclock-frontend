import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import MultiMap from './MultiMap';

interface EmployeeHours {
  user_id: string;
  display_name: string;
  hours: string;
}

interface Stats {
  totalHours: string;
  totalEmployees: number;
  avgHours: string;
}

interface MapPoint {
  id: number;
  lat: number;
  lng: number;
  display_name: string;
  timestamp: number;
}

const Reports = () => {
  const [stats, setStats] = useState<Stats>({ totalHours: '0h 0m', totalEmployees: 0, avgHours: '0h 0m' });
  const [employeeHours, setEmployeeHours] = useState<EmployeeHours[]>([]);
  const [range, setRange] = useState<'today' | 'yesterday' | 'week'>('today');
  const [loading, setLoading] = useState(false);
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const now = new Date();
    let start = 0;
    if (range === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    } else if (range === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()).getTime();
    } else if (range === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      start = weekAgo.getTime();
    }

    const { data: attendanceData, error } = await supabase
      .from('attendance')
      .select('id, user_id, type, timestamp, lat, lng')
      .gte('timestamp', start)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    // Fetch profiles from backend (bypasses RLS)
    let profilesData: any[] = [];
    try {
      const res = await fetch('https://staffclock-backend-1.onrender.com/api/profiles');
      profilesData = await res.json();
    } catch (e) {
      console.error('Failed to fetch profiles from backend', e);
    }

    const nameMap: Record<string, string> = {};
    if (profilesData) {
      profilesData.forEach((p: any) => {
        nameMap[p.id] = p.display_name;
      });
    }

    const employeeMap: Record<string, { clockIn: number | null; total: number }> = {};
    attendanceData.forEach((record: any) => {
      if (!employeeMap[record.user_id]) {
        employeeMap[record.user_id] = { clockIn: null, total: 0 };
      }
      if (record.type === 'clock-in' && employeeMap[record.user_id].clockIn === null) {
        employeeMap[record.user_id].clockIn = record.timestamp;
      } else if (record.type === 'clock-out' && employeeMap[record.user_id].clockIn !== null) {
        employeeMap[record.user_id].total += record.timestamp - employeeMap[record.user_id].clockIn!;
        employeeMap[record.user_id].clockIn = null;
      }
    });

    const totalMinutes = Object.values(employeeMap).reduce((sum, emp) => sum + emp.total / 60000, 0);
    const numEmployees = Object.keys(employeeMap).length;
    const avgMinutes = numEmployees > 0 ? totalMinutes / numEmployees : 0;

    const formatHours = (mins: number) => {
      const h = Math.floor(mins / 60);
      const m = Math.floor(mins % 60);
      return `${h}h ${m}m`;
    };

    setStats({
      totalHours: formatHours(totalMinutes),
      totalEmployees: numEmployees,
      avgHours: formatHours(avgMinutes),
    });

    setEmployeeHours(
      Object.entries(employeeMap).map(([userId, data]) => ({
        user_id: userId,
        display_name: nameMap[userId] || userId,
        hours: formatHours(data.total / 60000),
      }))
    );

    const points: MapPoint[] = attendanceData
      .filter((r: any) => r.type === 'clock-in' && r.lat != null && r.lng != null)
      .map((r: any) => ({
        id: r.id,
        lat: Number(r.lat),
        lng: Number(r.lng),
        display_name: nameMap[r.user_id] || r.user_id,
        timestamp: r.timestamp,
      }));
    setMapPoints(points);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [range]);

  const exportCSV = () => {
    const header = 'Employee,Hours\n';
    const rows = employeeHours.map(e => `${e.display_name},${e.hours}`).join('\n');
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${range}.csv`;
    a.click();
  };

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <h2 style={{ marginTop: 0 }}>📊 Analytics</h2>
      <div style={{ marginBottom: '1.5rem' }}>
        <button onClick={() => setRange('today')} className={`nav-btn ${range === 'today' ? 'active' : ''}`} style={{ marginRight: '0.5rem' }}>Today</button>
        <button onClick={() => setRange('yesterday')} className={`nav-btn ${range === 'yesterday' ? 'active' : ''}`} style={{ marginRight: '0.5rem' }}>Yesterday</button>
        <button onClick={() => setRange('week')} className={`nav-btn ${range === 'week' ? 'active' : ''}`}>Last 7 Days</button>
      </div>
      {loading && <p>Loading...</p>}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ flex: 1, background: '#f0f9ff', padding: '1rem', borderRadius: '10px', border: '1px solid #bae6fd' }}>
          <strong>Total hours</strong>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.totalHours}</div>
        </div>
        <div style={{ flex: 1, background: '#f0f9ff', padding: '1rem', borderRadius: '10px', border: '1px solid #bae6fd' }}>
          <strong>Staff</strong>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.totalEmployees}</div>
        </div>
        <div style={{ flex: 1, background: '#f0f9ff', padding: '1rem', borderRadius: '10px', border: '1px solid #bae6fd' }}>
          <strong>Avg hrs/employee</strong>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.avgHours}</div>
        </div>
      </div>
      <h3>Per Employee Breakdown</h3>
      {employeeHours.length === 0 ? (
        <p>No data for this period.</p>
      ) : (
        <>
          <table className="dashboard-table" style={{ marginBottom: '1rem' }}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Hours worked</th>
              </tr>
            </thead>
            <tbody>
              {employeeHours.map((emp) => (
                <tr key={emp.user_id}>
                  <td>{emp.display_name}</td>
                  <td>{emp.hours}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={exportCSV} className="btn btn-success" style={{ padding: '0.5rem 1rem' }}>
            📥 Export CSV
          </button>
        </>
      )}
      <h3 style={{ marginTop: '2rem' }}>🗺 Location Map</h3>
      {mapPoints.length === 0 ? (
        <p>No location data for this period.</p>
      ) : (
        <MultiMap points={mapPoints} />
      )}
    </div>
  );
};

export default Reports;