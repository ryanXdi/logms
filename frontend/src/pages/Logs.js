import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LogTable from '../components/LogTable';
import SearchBar from '../components/SearchBar';
import Stats from '../components/Stats';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:4000/api';

function Logs({ onLogout }) {

  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [availableTenants, setAvailableTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState('');
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const isAdmin = user.role === 'admin';

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.error('Authentication error - clearing session');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          onLogout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [onLogout]);

  useEffect(() => {
    setSelectedTenant(user.tenant || 'default');

    if (isAdmin) {
      fetchAvailableTenants();
    }
  }, []);

  const fetchAvailableTenants = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/search/tenants`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success && response.data.tenants) {
        setAvailableTenants(response.data.tenants);
      } else {
        setAvailableTenants(['default']);
      }
    } catch (err) {
      console.error('Failed to fetch tenants:', err);
      setAvailableTenants(['default']);
    }
  };

  const handleTenantChange = (newTenant) => {
    setSelectedTenant(newTenant);
    fetchLogsForTenant(newTenant);
    fetchStatsForTenant(newTenant);
  };

  const fetchLogs = async (searchParams = {}) => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${API_URL}/search`,
        {
          limit: 50,
          ...searchParams
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-tenant-id': selectedTenant || user.tenant || 'default'
          }
        }
      );

      setLogs(response.data.logs);
      setTotal(response.data.total);
    } catch (err) {
      if (err.response?.status !== 401) {
        setError(err.response?.data?.error || 'Failed to fetch logs');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchLogsForTenant = async (tenant, searchParams = {}) => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${API_URL}/search`,
        {
          limit: 50,
          ...searchParams
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-tenant-id': tenant
          }
        }
      );

      setLogs(response.data.logs);
      setTotal(response.data.total);
    } catch (err) {
      if (err.response?.status !== 401) {
        setError(err.response?.data?.error || 'Failed to fetch logs');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/search/stats`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-tenant-id': selectedTenant || user.tenant || 'default'
          }
        }
      );

      setStats(response.data.stats);
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error('Failed to fetch stats:', err);
      }
    }
  };

  const fetchStatsForTenant = async (tenant) => {
    try {
      const response = await axios.post(
        `${API_URL}/search/stats`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-tenant-id': tenant
          }
        }
      );

      setStats(response.data.stats);
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error('Failed to fetch stats:', err);
      }
    }
  };

  useEffect(() => {
    if (selectedTenant) {
      fetchLogs();
      fetchStats();
    }
  }, [selectedTenant]);

  return (
    <div style={{ background: '#f3f4f6', minHeight: '100vh' }}>

      <div style={{ 
        background: 'white', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <div className="responsive-header" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '15px 20px',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <h1 style={{ 
            margin: 0, 
            color: '#111827',
            fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
            flexShrink: 0
          }}>
            LogMS
          </h1>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            flexWrap: 'wrap',
            justifyContent: 'flex-end'
          }}>
            {/* Tenant Switcher for Admins */}
            {isAdmin && availableTenants.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
                <label htmlFor="tenant-select" style={{ 
                  color: '#6b7280', 
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                  display: window.innerWidth < 768 ? 'none' : 'inline'
                }}>
                  Tenant:
                </label>
                <select
                  id="tenant-select"
                  value={selectedTenant}
                  onChange={(e) => handleTenantChange(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    cursor: 'pointer',
                    backgroundColor: 'white',
                    minWidth: '100px'
                  }}
                >
                  {availableTenants.map(tenant => (
                    <option key={tenant} value={tenant}>
                      {tenant}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <span className="user-info" style={{ 
              color: '#6b7280',
              fontSize: '14px',
              whiteSpace: 'nowrap',
              display: window.innerWidth < 640 ? 'none' : 'inline'
            }}>
              {user.email} ({user.role})
            </span>
            <button 
              className="btn btn-primary" 
              onClick={() => window.location.href = '/alerts'}
              style={{ 
                marginRight: '0',
                padding: '8px 12px',
                fontSize: '14px',
                whiteSpace: 'nowrap'
              }}
            >
              Alerts
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={onLogout}
              style={{
                padding: '8px 12px',
                fontSize: '14px'
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        
        {stats && <Stats stats={stats} />}

        <SearchBar onSearch={fetchLogs} />

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

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            Loading logs...
          </div>
        )}

        {!loading && (
          <div style={{ marginBottom: '15px', color: '#6b7280' }}>
            Found {total} log{total !== 1 ? 's' : ''}
          </div>
        )}

        {!loading && <LogTable logs={logs} />}
      </div>
    </div>
  );
}

export default Logs;
