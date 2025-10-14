import React, { useState, useEffect } from 'react';
import '../index.css';
import CreateAlertRuleModal from '../components/CreateAlertRuleModal';

function Alerts({ onLogout }) {
  const [activeTab, setActiveTab] = useState('notifications');
  const [notifications, setNotifications] = useState([]);
  const [rules, setRules] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableTenants, setAvailableTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState('');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    conditionType: 'threshold',
    field: 'severity',
    operator: 'gte',
    value: '',
    count: '',
    timeWindow: '',
    pattern: '',
    filterSeverity: '',
    filterEventType: '',
    filterHost: '',
    filterUser: ''
  });
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  const API_URL = process.env.NODE_ENV === 'production' 
    ? '' 
    : 'http://localhost:4000';

  useEffect(() => {
    setSelectedTenant(user.tenant || 'default');

    if (isAdmin) {
      fetchAvailableTenants();
    }
  }, []);

  const fetchAvailableTenants = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/search/tenants`, {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.tenants) {
          setAvailableTenants(data.tenants);
        } else {
          setAvailableTenants(['default']);
        }
      } else {
        setAvailableTenants(['default']);
      }
    } catch (err) {
      console.error('Failed to fetch tenants:', err);
      setAvailableTenants(['default']);
    }
  };

  useEffect(() => {
    if (selectedTenant) {
      fetchData();
      const interval = setInterval(fetchData, 30000); // resfresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [activeTab, selectedTenant]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const tenant = selectedTenant || user.tenant || 'default';
      
      if (activeTab === 'notifications') {
        const response = await fetch(`${API_URL}/api/alerts/notifications?limit=50`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'x-tenant-id': tenant
          }
        });
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          onLogout();
          return;
        }
        if (!response.ok) throw new Error('Failed to fetch notifications');
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else if (activeTab === 'rules') {
        const response = await fetch(`${API_URL}/api/alerts/rules`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'x-tenant-id': tenant
          }
        });
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          onLogout();
          return;
        }
        if (!response.ok) throw new Error('Failed to fetch rules');
        const data = await response.json();
        setRules(data.rules || []); // Fixed: use data.rules
      } else if (activeTab === 'stats') {
        const response = await fetch(`${API_URL}/api/alerts/stats?timeRange=24h`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'x-tenant-id': tenant
          }
        });
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          onLogout();
          return;
        }
        if (!response.ok) throw new Error('Failed to fetch stats');
        const data = await response.json();
        setStats(data.stats || null); 
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeNotification = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const tenant = selectedTenant || user.tenant || 'default';
      const response = await fetch(`${API_URL}/api/alerts/notifications/${id}/acknowledge`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-tenant-id': tenant
        },
        body: JSON.stringify({ notes: 'Acknowledged via UI' })
      });
      if (!response.ok) throw new Error('Failed to acknowledge');
      fetchData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const resolveNotification = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const tenant = selectedTenant || user.tenant || 'default';
      const response = await fetch(`${API_URL}/api/alerts/notifications/${id}/resolve`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-tenant-id': tenant
        },
        body: JSON.stringify({ notes: 'Resolved via UI' })
      });
      if (!response.ok) throw new Error('Failed to resolve');
      fetchData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const toggleRule = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const tenant = selectedTenant || user.tenant || 'default';
      const response = await fetch(`${API_URL}/api/alerts/rules/${id}/toggle`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenant
        }
      });
      if (!response.ok) throw new Error('Failed to toggle rule');
      fetchData(); // Refresh
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const createRule = async () => {
    try {
      const token = localStorage.getItem('token');
      const tenant = selectedTenant || user.tenant || 'default';
      
      const condition = {
        type: newRule.conditionType,
        filters: {}
      };

      if (newRule.conditionType === 'threshold') {
        condition.field = newRule.field;
        condition.operator = newRule.operator;
        condition.value = newRule.field === 'severity' ? parseInt(newRule.value) : newRule.value;
      } else if (newRule.conditionType === 'frequency') {
        condition.count = parseInt(newRule.count);
        condition.timeWindow = parseInt(newRule.timeWindow);
      } else if (newRule.conditionType === 'pattern') {
        condition.value = newRule.pattern;
      }

      // Add filters
      if (newRule.filterSeverity) condition.filters.severity = parseInt(newRule.filterSeverity);
      if (newRule.filterEventType) condition.filters.event_type = newRule.filterEventType;
      if (newRule.filterHost) condition.filters.host = newRule.filterHost;
      if (newRule.filterUser) condition.filters.user = newRule.filterUser;

      const response = await fetch(`${API_URL}/api/alerts/rules`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-tenant-id': tenant
        },
        body: JSON.stringify({
          name: newRule.name,
          description: newRule.description,
          condition,
          actions: [{ type: 'ui' }]
        })
      });

      if (!response.ok) throw new Error('Failed to create rule');
      
      // Reset form and close modal
      setShowCreateModal(false);
      setNewRule({
        name: '',
        description: '',
        conditionType: 'threshold',
        field: 'severity',
        operator: 'gte',
        value: '',
        count: '',
        timeWindow: '',
        pattern: '',
        filterSeverity: '',
        filterEventType: '',
        filterHost: '',
        filterUser: ''
      });
      
      // Refresh rules
      fetchData();
      alert('Alert rule created successfully!');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const deleteRule = async (id, ruleName) => {
    if (!window.confirm(`Are you sure you want to delete the rule "${ruleName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const tenant = selectedTenant || user.tenant || 'default';
      
      const response = await fetch(`${API_URL}/api/alerts/rules/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenant
        }
      });

      if (!response.ok) throw new Error('Failed to delete rule');
      
      // Refresh rules
      fetchData();
      alert('Alert rule deleted successfully!');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getSeverityBadge = (severity) => {
    const colors = {
      info: '#3b82f6',
      warning: '#f59e0b',
      error: '#ef4444',
      critical: '#dc2626'
    };
    return (
      <span style={{
        backgroundColor: colors[severity] || '#6b7280',
        color: 'white',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        {severity?.toUpperCase()}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const colors = {
      new: '#ef4444',
      acknowledged: '#f59e0b',
      resolved: '#10b981'
    };
    return (
      <span style={{
        backgroundColor: colors[status] || '#6b7280',
        color: 'white',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        {status}
      </span>
    );
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>Alert Management</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* Tenant Switcher for Admins */}
          {isAdmin && availableTenants.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label htmlFor="tenant-select-alerts" style={{ color: '#6b7280', fontSize: '14px' }}>
                Viewing Tenant:
              </label>
              <select
                id="tenant-select-alerts"
                value={selectedTenant}
                onChange={(e) => setSelectedTenant(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  cursor: 'pointer',
                  backgroundColor: 'white'
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
          <button 
            onClick={() => window.location.href = '/logs'}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            View Logs
          </button>
          <button 
            onClick={onLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '2px solid #e5e7eb', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('notifications')}
          style={{
            padding: '10px 20px',
            border: 'none',
            backgroundColor: 'transparent',
            borderBottom: activeTab === 'notifications' ? '2px solid #3b82f6' : 'none',
            color: activeTab === 'notifications' ? '#3b82f6' : '#6b7280',
            fontWeight: activeTab === 'notifications' ? 'bold' : 'normal',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Notifications
        </button>
        {/* Only show Rules tab for admins */}
        {isAdmin && (
          <button
            onClick={() => setActiveTab('rules')}
            style={{
              padding: '10px 20px',
              border: 'none',
              backgroundColor: 'transparent',
            borderBottom: activeTab === 'rules' ? '2px solid #3b82f6' : 'none',
            color: activeTab === 'rules' ? '#3b82f6' : '#6b7280',
            fontWeight: activeTab === 'rules' ? 'bold' : 'normal',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Rules
        </button>
        )}
        <button
          onClick={() => setActiveTab('stats')}
          style={{
            padding: '10px 20px',
            border: 'none',
            backgroundColor: 'transparent',
            borderBottom: activeTab === 'stats' ? '2px solid #3b82f6' : 'none',
            color: activeTab === 'stats' ? '#3b82f6' : '#6b7280',
            fontWeight: activeTab === 'stats' ? 'bold' : 'normal',
            cursor: 'pointer'
          }}
        >
          Statistics
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && !loading && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0 }}>Alert Notifications</h2>
            <button
              onClick={fetchData}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🔄 Refresh
            </button>
          </div>
          {notifications.length === 0 ? (
            <div style={{ 
              backgroundColor: '#f3f4f6', 
              padding: '32px', 
              borderRadius: '8px', 
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <p>No notifications yet</p>
              <p style={{ fontSize: '14px' }}>Notifications appear here when alert rules are triggered</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Alert Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Severity</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Triggered At</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Message</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((notif) => (
                    <tr key={notif._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px' }}>{notif.ruleName || notif.title}</td>
                      <td style={{ padding: '12px' }}>{getSeverityBadge(notif.severity)}</td>
                      <td style={{ padding: '12px' }}>{getStatusBadge(notif.status)}</td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>{formatTimestamp(notif.triggered_at)}</td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>{notif.message}</td>
                      <td style={{ padding: '12px' }}>
                        {notif.status === 'new' && (
                          <>
                            <button
                              onClick={() => acknowledgeNotification(notif._id)}
                              style={{
                                padding: '4px 8px',
                                marginRight: '5px',
                                backgroundColor: '#f59e0b',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              Acknowledge
                            </button>
                            <button
                              onClick={() => resolveNotification(notif._id)}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              Resolve
                            </button>
                          </>
                        )}
                        {notif.status === 'acknowledged' && (
                          <button
                            onClick={() => resolveNotification(notif._id)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === 'rules' && !loading && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ margin: '0 0 8px 0' }}>Alert Rules</h2>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                Configure rules to automatically detect issues in your logs and create notifications
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {isAdmin && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  ➕ Create Rule
                </button>
              )}
              <button
                onClick={fetchData}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                🔄 Refresh
              </button>
            </div>
          </div>
          {rules.length === 0 ? (
            <div style={{ 
              backgroundColor: '#f3f4f6', 
              padding: '32px', 
              borderRadius: '8px', 
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <p>No alert rules configured</p>
              <p style={{ fontSize: '14px' }}>Alert rules automatically monitor your logs and trigger notifications when conditions are met</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {rules.map((rule) => (
                <div 
                  key={rule._id} 
                  style={{
                    padding: '16px',
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 8px 0' }}>{rule.name}</h3>
                      <p style={{ margin: '0 0 12px 0', color: '#6b7280' }}>{rule.description}</p>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '14px', flexWrap: 'wrap' }}>
                        <span><strong>Type:</strong> {rule.condition.type}</span>
                        {rule.condition.count && <span><strong>Count:</strong> {rule.condition.count}</span>}
                        {rule.condition.timeWindow && (
                          <span><strong>Time Window:</strong> {rule.condition.timeWindow} minutes</span>
                        )}
                        {rule.condition.field && (
                          <span><strong>Field:</strong> {rule.condition.field} {rule.condition.operator} {rule.condition.value}</span>
                        )}
                        {rule.condition.value && rule.condition.type === 'pattern' && (
                          <span><strong>Pattern:</strong> {rule.condition.value}</span>
                        )}
                        <span>
                          <strong>Triggered:</strong> {rule.triggerCount || 0} times
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {/* Only admins can toggle/delete rules */}
                      {isAdmin ? (
                        <>
                          <button
                            onClick={() => toggleRule(rule._id)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: rule.enabled ? '#10b981' : '#6b7280',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '14px',
                              cursor: 'pointer'
                            }}
                          >
                            {rule.enabled ? 'Enabled' : 'Disabled'}
                          </button>
                          <button
                            onClick={() => deleteRule(rule._id, rule.name)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '14px',
                              cursor: 'pointer'
                            }}
                            title="Delete this rule"
                          >
                            🗑️ Delete
                          </button>
                        </>
                      ) : (
                        <span style={{
                          padding: '6px 12px',
                          backgroundColor: rule.enabled ? '#10b981' : '#6b7280',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}>
                          {rule.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && !loading && stats && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0 }}>Alert Statistics (Last 24h)</h2>
            <button
              onClick={fetchData}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🔄 Refresh
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginTop: '16px' }}>
            <div style={{ padding: '20px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px' }}>Active Rules</h3>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>{stats.activeRules}</p>
            </div>
            
            <div style={{ padding: '20px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px' }}>New Alerts</h3>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>
                {stats.statusCounts?.new || 0}
              </p>
            </div>
            
            <div style={{ padding: '20px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px' }}>Acknowledged</h3>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>
                {stats.statusCounts?.acknowledged || 0}
              </p>
            </div>
            
            <div style={{ padding: '20px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px' }}>Resolved</h3>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
                {stats.statusCounts?.resolved || 0}
              </p>
            </div>
          </div>

          {stats.topRules && stats.topRules.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h3>Top Triggering Rules</h3>
              <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
                {stats.topRules.map((rule, index) => (
                  <div 
                    key={rule._id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: index < stats.topRules.length - 1 ? '1px solid #e5e7eb' : 'none'
                    }}
                  >
                    <span>{rule.alertName || 'Unknown Rule'}</span>
                    <span style={{ fontWeight: 'bold' }}>{rule.count} triggers</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Rule Modal */}
      <CreateAlertRuleModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        newRule={newRule}
        setNewRule={setNewRule}
        onCreateRule={createRule}
      />
    </div>
  );
}

export default Alerts;
