import { useState, useEffect } from 'react';
import { saveLocally, syncUnsynced } from './services/offlineDB';
import type { AttendanceRecord } from './services/types';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import Reports from './components/Reports';
import { supabase } from './supabaseClient';

const App = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'clock' | 'dashboard' | 'reports'>('clock');
  const [clockedIn, setClockedIn] = useState(() => {
    return localStorage.getItem('clockedIn') === 'true';
  });
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('employee');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) setUserRole(data.role);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) setUserRole(data.role);
          });
      } else {
        setUserRole('employee');
        localStorage.removeItem('clockedIn');
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    syncUnsynced(user?.id);
    const handleOnline = () => syncUnsynced(user?.id);
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user]);

  const recordAttendance = (type: 'clock-in' | 'clock-out') => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const record: AttendanceRecord = {
          type,
          timestamp: Date.now(),
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          synced: false,
        };
        try {
          await saveLocally(record);
          setLocation({ lat: record.lat, lng: record.lng });
          setError(null);

          if (type === 'clock-in') {
            setClockedIn(true);
            localStorage.setItem('clockedIn', 'true');
          } else {
            setClockedIn(false);
            localStorage.removeItem('clockedIn');
          }

          syncUnsynced(user?.id);
        } catch (e) {
          setError('Failed to save record offline.');
        }
      },
      (err) => {
        setError(`Location error: ${err.message}`);
        setLocation(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSignOut = async () => {
    localStorage.removeItem('clockedIn');
    await supabase.auth.signOut();
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>;
  }

  if (!user) {
    return <Auth />;
  }

  const isAnalystOrAdmin = userRole === 'analyst' || userRole === 'admin';

  return (
    <div>
      <nav className="navbar">
        <h1>⏱️ StaffClock</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
            👤 {user.email}
          </span>
          <div className="nav-links">
            <button
              onClick={() => setView('clock')}
              className={`nav-btn ${view === 'clock' ? 'active' : ''}`}
            >
              ⏱️ Clock
            </button>
            {isAnalystOrAdmin && (
              <button
                onClick={() => setView('dashboard')}
                className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`}
              >
                📊 Live Dashboard
              </button>
            )}
            {isAnalystOrAdmin && (
              <button
                onClick={() => setView('reports')}
                className={`nav-btn ${view === 'reports' ? 'active' : ''}`}
              >
                📈 Analytics
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="nav-btn"
              style={{ borderColor: 'rgba(255,255,255,0.3)' }}
            >
              🚪 Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="container">
        {view === 'reports' && isAnalystOrAdmin ? (
          <Reports />
        ) : view === 'dashboard' && isAnalystOrAdmin ? (
          <Dashboard />
        ) : (
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Attendance</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Professional attendance with geolocation. Works offline.
            </p>
            <div className={`status-badge ${clockedIn ? 'clocked-in' : 'clocked-out'}`}>
              {clockedIn ? '🟢 Currently Clocked In' : '🔴 Currently Clocked Out'}
            </div>
            <div className="btn-group">
              <button
                onClick={() => recordAttendance('clock-in')}
                disabled={clockedIn}
                className="btn btn-success"
              >
                ➕ Clock In Now
              </button>
              <button
                onClick={() => recordAttendance('clock-out')}
                disabled={!clockedIn}
                className="btn btn-danger"
              >
                ➖ Clock Out Now
              </button>
            </div>
            {location && (
              <div className="feedback success">
                ✅ Location captured: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </div>
            )}
            {error && (
              <div className="feedback error">
                ❌ {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;