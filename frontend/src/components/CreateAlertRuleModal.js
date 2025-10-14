import React from 'react';

function CreateAlertRuleModal({ 
  show, 
  onClose, 
  newRule, 
  setNewRule, 
  onCreateRule 
}) {
  if (!show) return null;

  const handleSubmit = () => {
    onCreateRule();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h2 style={{ marginTop: 0 }}>Create Alert Rule</h2>
        
        {/* Basic Info */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Rule Name *</label>
          <input
            type="text"
            value={newRule.name}
            onChange={(e) => setNewRule({...newRule, name: e.target.value})}
            placeholder="e.g., High Severity Errors"
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Description</label>
          <textarea
            value={newRule.description}
            onChange={(e) => setNewRule({...newRule, description: e.target.value})}
            placeholder="Describe what this alert monitors..."
            rows="2"
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
          />
        </div>

        {/* Condition Type */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Alert Type *</label>
          <select
            value={newRule.conditionType}
            onChange={(e) => setNewRule({...newRule, conditionType: e.target.value})}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
          >
            <option value="threshold">Threshold (field meets condition)</option>
            <option value="frequency">Frequency (count over time)</option>
            <option value="pattern">Pattern (regex match)</option>
          </select>
        </div>

        {/* Threshold Conditions */}
        {newRule.conditionType === 'threshold' && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Field *</label>
              <select
                value={newRule.field}
                onChange={(e) => setNewRule({...newRule, field: e.target.value})}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
              >
                <option value="severity">Severity</option>
                <option value="event_type">Event Type</option>
                <option value="host">Host</option>
                <option value="user">User</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Operator *</label>
                <select
                  value={newRule.operator}
                  onChange={(e) => setNewRule({...newRule, operator: e.target.value})}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                >
                  <option value="eq">Equals (=)</option>
                  <option value="ne">Not Equals (≠)</option>
                  <option value="gt">Greater Than (&gt;)</option>
                  <option value="gte">Greater Than or Equal (≥)</option>
                  <option value="lt">Less Than (&lt;)</option>
                  <option value="lte">Less Than or Equal (≤)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Value *</label>
                <input
                  type={newRule.field === 'severity' ? 'number' : 'text'}
                  value={newRule.value}
                  onChange={(e) => setNewRule({...newRule, value: e.target.value})}
                  placeholder={newRule.field === 'severity' ? '0-10' : 'value'}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
              </div>
            </div>
          </>
        )}

        {/* Frequency Conditions */}
        {newRule.conditionType === 'frequency' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Count *</label>
              <input
                type="number"
                value={newRule.count}
                onChange={(e) => setNewRule({...newRule, count: e.target.value})}
                placeholder="e.g., 10"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Time Window (minutes) *</label>
              <input
                type="number"
                value={newRule.timeWindow}
                onChange={(e) => setNewRule({...newRule, timeWindow: e.target.value})}
                placeholder="e.g., 5"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
              />
            </div>
          </div>
        )}

        {/* Pattern Conditions */}
        {newRule.conditionType === 'pattern' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Pattern (regex) *</label>
            <input
              type="text"
              value={newRule.pattern}
              onChange={(e) => setNewRule({...newRule, pattern: e.target.value})}
              placeholder="e.g., error|failed|exception"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            />
          </div>
        )}

        {/* Optional Filters */}
        <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Additional Filters (Optional)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px' }}>Filter by Severity</label>
            <input
              type="number"
              value={newRule.filterSeverity}
              onChange={(e) => setNewRule({...newRule, filterSeverity: e.target.value})}
              placeholder="0-10"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px' }}>Filter by Event Type</label>
            <input
              type="text"
              value={newRule.filterEventType}
              onChange={(e) => setNewRule({...newRule, filterEventType: e.target.value})}
              placeholder="e.g., security"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px' }}>Filter by Host</label>
            <input
              type="text"
              value={newRule.filterHost}
              onChange={(e) => setNewRule({...newRule, filterHost: e.target.value})}
              placeholder="e.g., web-server-01"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px' }}>Filter by User</label>
            <input
              type="text"
              value={newRule.filterUser}
              onChange={(e) => setNewRule({...newRule, filterUser: e.target.value})}
              placeholder="e.g., admin"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!newRule.name || 
              (newRule.conditionType === 'threshold' && !newRule.value) ||
              (newRule.conditionType === 'frequency' && (!newRule.count || !newRule.timeWindow)) ||
              (newRule.conditionType === 'pattern' && !newRule.pattern)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              opacity: !newRule.name ? 0.5 : 1
            }}
          >
            Create Rule
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateAlertRuleModal;
