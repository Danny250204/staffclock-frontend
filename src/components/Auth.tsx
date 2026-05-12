import { useState } from 'react';
import { supabase } from '../supabaseClient';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (isSignUp) {
      // Create new account
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMessage(error.message);
      else setMessage('Account created! You can now sign in.');
    } else {
      // Sign in
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
      // on success, the session is stored automatically
    }
  };

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '3rem' }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{isSignUp ? 'Create Account' : 'Sign In'}</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 500 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.7rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '1rem',
              }}
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 500 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.7rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '1rem',
              }}
            />
          </div>
          {message && (
            <p style={{ color: message.includes('error') ? '#dc2626' : '#16a34a', marginBottom: '1rem' }}>
              {message}
            </p>
          )}
          <button type="submit" className="btn btn-success" style={{ width: '100%' }}>
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>
        <p style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;