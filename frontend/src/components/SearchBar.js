import React, { useState } from 'react';

function SearchBar({ onSearch }) {
  const [filters, setFilters] = useState({
    from: 'now-24h',
    to: 'now',
    severity: '',
    source: '',
    event_type: '',
    message: ''
  });

  const handleChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const searchParams = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value && value.trim() !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});

    onSearch(searchParams);
  };

  const handleReset = () => {
    const defaultFilters = {
      from: 'now-24h',
      to: 'now',
      severity: '',
      source: '',
      event_type: '',
      message: ''
    };
    setFilters(defaultFilters);
    onSearch({ from: 'now-24h', to: 'now' });
  };

  return (
    <div className="card">
      <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
        🔍 Search & Filter Logs
      </h3>
      <form onSubmit={handleSubmit}>
        {/* Primary Filters Row */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px', 
          marginBottom: '15px',
          padding: '15px',
          background: '#f9fafb',
          borderRadius: '8px'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
              ⏱️ Time Range
            </label>
            <select name="from" className="input" value={filters.from} onChange={handleChange} style={{ fontSize: '14px' }}>
              <option value="now-1h">Last 1 hour</option>
              <option value="now-6h">Last 6 hours</option>
              <option value="now-24h">Last 24 hours</option>
              <option value="now-7d">Last 7 days</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
              🎯 Severity Level
            </label>
            <select name="severity" className="input" value={filters.severity} onChange={handleChange} style={{ fontSize: '14px' }}>
              <option value="">All Severities</option>
              <option value="10">🔴 Critical (10)</option>
              <option value="9">🔴 Alert (9)</option>
              <option value="8">🟠 High (8)</option>
              <option value="7">🟠 Error (7)</option>
              <option value="6">🟡 Warning (6)</option>
              <option value="5">🟢 Info (5)</option>
              <option value="3">⚪ Debug (3)</option>
              <option value="0">⚫ All (0+)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
              📦 Source Type
            </label>
            <select name="source" className="input" value={filters.source} onChange={handleChange} style={{ fontSize: '14px' }}>
              <option value="">All Sources</option>
              <option value="http">HTTP API</option>
              <option value="syslog">Syslog (UDP/TCP)</option>
              <option value="file-upload">File Upload</option>
              <option value="aws-cloudtrail">AWS CloudTrail</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
              ⚡ Event Type
            </label>
            <select name="event_type" className="input" value={filters.event_type} onChange={handleChange} style={{ fontSize: '14px' }}>
              <option value="">All Events</option>
              <option value="auth">🔐 Authentication</option>
              <option value="network">🌐 Network</option>
              <option value="system">⚙️ System</option>
              <option value="database">� Database</option>
              <option value="application">📱 Application</option>
              <option value="security">🛡️ Security</option>
              <option value="aws">☁️ AWS</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
              � Message Search
            </label>
            <input
              type="text"
              name="message"
              className="input"
              value={filters.message}
              onChange={handleChange}
              placeholder="Search in message or raw log..."
              style={{ fontSize: '14px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', paddingTop: '10px', borderTop: '1px solid #e5e7eb' }}>
          <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span>🔍</span> Search Logs
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleReset} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span>🔄</span> Reset Filters
          </button>
        </div>

        {Object.entries(filters).filter(([key, value]) => value && key !== 'from' && key !== 'to').length > 0 && (
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            background: '#eff6ff', 
            borderRadius: '6px',
            fontSize: '13px'
          }}>
            <strong style={{ color: '#1e40af' }}>Active Filters:</strong>{' '}
            {Object.entries(filters)
              .filter(([key, value]) => value && key !== 'from' && key !== 'to')
              .map(([key, value]) => (
                <span key={key} style={{ 
                  display: 'inline-block',
                  background: '#dbeafe',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  marginLeft: '5px',
                  color: '#1e40af'
                }}>
                  {key}: {value}
                </span>
              ))}
          </div>
        )}
      </form>
    </div>
  );
}

export default SearchBar;
