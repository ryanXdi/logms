import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:4000/api';

function Login({ onLogin }) {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    try {
      const endpoint = isRegisterMode ? '/auth/register' : '/auth/login';
      
      const response = await axios.post(`${API_URL}${endpoint}`, {
        email,
        password
      });

      if (response.data.success) {
        if (isRegisterMode) {
          setIsRegisterMode(false);
          setError(''); 
          alert('Account created successfully! Please login with your credentials.');
          setPassword('');
        } else {
          localStorage.setItem('user', JSON.stringify(response.data.user));
          onLogin(response.data.token);
        }
      }
    } catch (err) {
      const action = isRegisterMode ? 'Registration' : 'Login';
      setError(err.response?.data?.error || `${action} failed. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#f3f4f6'
    }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '10px', color: '#111827' }}>
          Log Management System
        </h2>
        
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '20px',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          {isRegisterMode ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(false);
                  setError('');
                  setEmail('admin@example.com');
                  setPassword('admin123');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                  font: 'inherit'
                }}
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(true);
                  setError('');
                  setEmail('');
                  setPassword('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                  font: 'inherit'
                }}
              >
                Create Account
              </button>
            </>
          )}
        </div>

        {error && (
          <div style={{ 
            background: '#fee2e2', 
            color: '#991b1b', 
            padding: '12px', 
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '500' }}>
              Email
            </label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#374151', fontWeight: '500' }}>
              Password
            </label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              minLength={6}
            />
            {isRegisterMode && (
              <small style={{ display: 'block', marginTop: '4px', color: '#6b7280', fontSize: '12px' }}>
                Minimum 6 characters
              </small>
            )}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading 
              ? (isRegisterMode ? 'Creating Account...' : 'Signing in...') 
              : (isRegisterMode ? 'Create Account' : 'Sign In')
            }
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
