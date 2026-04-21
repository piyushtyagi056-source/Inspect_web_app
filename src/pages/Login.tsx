import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Both username and password are required.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    const success = await login(username, password);
    if (!success) {
      setError('Invalid credentials.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-bg-shapes">
        <div className="bg-shape bg-shape-1"></div>
        <div className="bg-shape bg-shape-2"></div>
        <div className="bg-shape bg-shape-3"></div>
      </div>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem 2rem', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <ShieldCheck size={48} color="var(--color-primary)" style={{ marginBottom: '1rem' }} />
          <h1 style={{ fontSize: '1.5rem', textAlign: 'center' }}>Inspection Hub</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.5rem', textAlign: 'center' }}>
            Welcome back
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(209, 52, 56, 0.1)', color: 'var(--color-danger)', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.875rem', borderLeft: '3px solid var(--color-danger)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Inspector ID / Username</label>
            <input
              id="username"
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. jsmith"
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }} 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>
        
        <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
           <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
             Enterprise Inspection Platform
           </p>
        </div>
      </div>
    </div>
  );
}
