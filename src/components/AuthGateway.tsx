import React, { useState } from 'react';
import { db, type LocalUser } from '../services/db';
import { Database, Lock, User, UserPlus, LogIn, AlertCircle, RefreshCw } from 'lucide-react';

interface AuthGatewayProps {
  onLoginSuccess: (user: LocalUser) => void;
}

export const AuthGateway: React.FC<AuthGatewayProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Client-side SHA-256 password hashing via Web Crypto API
  const hashPassword = async (pwd: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pwd);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const hashed = await hashPassword(password);
      const cleanUsername = username.trim().toLowerCase();

      if (isLogin) {
        // Find user by username
        const existingUser = await db.users.where('username').equals(cleanUsername).first();
        if (existingUser && existingUser.passwordHash === hashed) {
          localStorage.setItem('active_user_session', existingUser.id);
          onLoginSuccess(existingUser);
        } else {
          setError('Invalid username or password.');
        }
      } else {
        // Sign Up
        const existingUser = await db.users.where('username').equals(cleanUsername).first();
        if (existingUser) {
          setError('Username is already taken.');
        } else {
          const newUser: LocalUser = {
            id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            username: cleanUsername,
            passwordHash: hashed,
          };
          await db.users.put(newUser);
          localStorage.setItem('active_user_session', newUser.id);
          onLoginSuccess(newUser);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-gateway-overlay">
      <div className="auth-glowing-backdrop" />
      <div className="auth-card glass-panel">
        <div className="auth-card-header">
          <div className="auth-icon-container">
            <Database className="auth-db-icon" />
          </div>
          <h1 className="auth-title">Knowledge Canvas</h1>
          <p className="auth-subtitle">Your local private knowledge workspace</p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => {
              setIsLogin(true);
              setError('');
            }}
          >
            <LogIn className="icon-xs" /> Login
          </button>
          <button
            type="button"
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => {
              setIsLogin(false);
              setError('');
            }}
          >
            <UserPlus className="icon-xs" /> Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error-block">
              <AlertCircle className="icon-sm" />
              <span>{error}</span>
            </div>
          )}

          <div className="auth-input-group">
            <label className="auth-label">Username</label>
            <div className="auth-input-wrapper">
              <User className="auth-input-icon" />
              <input
                type="text"
                className="node-input auth-input"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrapper">
              <Lock className="auth-input-icon" />
              <input
                type="password"
                className="node-input auth-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary auth-submit-btn" disabled={loading}>
            {loading ? (
              <RefreshCw className="icon spinning" />
            ) : isLogin ? (
              <>
                <LogIn className="icon-sm" /> Log In
              </>
            ) : (
              <>
                <UserPlus className="icon-sm" /> Register Account
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

