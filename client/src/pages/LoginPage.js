import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login, guestLogin } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    try {
      await guestLogin();
      toast.success('Welcome, Guest!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGuestLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <span>🔖</span>
          <h1>Welcome Back</h1>
          <p>Sign in to your bookmark manager</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border)' }} />
          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>or</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border)' }} />
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ width: '100%' }}
          onClick={handleGuestLogin}
          disabled={guestLoading}
        >
          {guestLoading ? 'Entering...' : 'Continue as Guest'}
        </button>
        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}
