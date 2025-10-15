import React from 'react';

function Stats({ stats }) {
  const getSeverityColor = (level) => {
    if (level >= 9) return '#dc2626'; // Critical - Red
    if (level >= 7) return '#ea580c'; // High - Orange
    if (level >= 5) return '#ca8a04'; // Medium - Yellow
    if (level >= 3) return '#2563eb'; // Low - Blue
    return '#6b7280'; // Info - Gray
  };

  const getMaxCount = (data) => {
    if (!data || data.length === 0) return 0;
    return Math.max(...data.map(item => item.count));
  };

  return (
    <div>
      {(() => {
        const grouped = [];
        
        for (let hour = 0; hour < 24; hour += 2) {
          const timeLabel = `${String(hour).padStart(2, '0')}:00`;
          
          let count = 0;
          if (stats.timeline) {
            stats.timeline.forEach(point => {
              // point.time is in format "YYYY-MM-DD HH:00" in UTC
              // We need to convert to local timezone
              const pointDate = new Date(point.time + ':00Z'); // Add Z to indicate UTC
              const localHour = pointDate.getHours(); // This will convert to local timezone
              
              if (localHour >= hour && localHour < hour + 2) {
                count += point.count;
              }
            });
          }
          
          grouped.push({ time: timeLabel, count });
        }
        
        const maxCount = Math.max(...grouped.map(g => g.count), 1);
        
        return (
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#111827', fontSize: '16px' }}>
              📊 Log Activity - 24 Hour View (2-Hour Intervals, Local Time)
            </h3>
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-end', 
              gap: '8px', 
              height: '80px',
              padding: '10px 0',
              borderBottom: '1px solid #e5e7eb'
            }}>
              {grouped.map((point, idx) => {
                const heightPercent = maxCount > 0 ? (point.count / maxCount) * 100 : 0;
                
                return (
                  <div key={idx} style={{ 
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    height: '100%'
                  }}>
                    <div 
                      style={{
                        width: '100%',
                        height: `${heightPercent}%`,
                        background: '#3b82f6',
                        borderRadius: '4px 4px 0 0',
                        position: 'relative',
                        minHeight: point.count > 0 ? '4px' : '0',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }} 
                      title={`${point.time}: ${point.count} logs`}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#2563eb';
                        e.currentTarget.style.transform = 'scaleY(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#3b82f6';
                        e.currentTarget.style.transform = 'scaleY(1)';
                      }}
                    >
                      <span style={{
                        position: 'absolute',
                        top: '-18px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#374151',
                        whiteSpace: 'nowrap'
                      }}>
                        {point.count}
                      </span>
                    </div>
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#6b7280', 
                      marginTop: '6px',
                      fontWeight: '500'
                    }}>
                      {point.time}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Top N Statistics */}
      <div className="card">
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#111827' }}>
          📈 Top N Statistics
        </h3>

        {/* Severity */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
          <div>
            <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#374151', fontSize: '15px', fontWeight: '600' }}>
              🔴 Severity Distribution
            </h4>
            {stats.severity && stats.severity.length > 0 ? (
              <div style={{ fontSize: '13px' }}>
                {stats.severity
                  .sort((a, b) => b.level - a.level) // Sort from high (10) to low (1)
                  .map((s) => {
                    const maxCount = getMaxCount(stats.severity);
                    const widthPercent = maxCount > 0 ? (s.count / maxCount) * 100 : 0;
                    
                    return (
                      <div key={s.level} style={{ marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '500' }}>Level {s.level}</span>
                          <strong style={{ color: getSeverityColor(s.level) }}>{s.count}</strong>
                        </div>
                        <div style={{ 
                          width: '100%', 
                          height: '8px', 
                          background: '#f3f4f6', 
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${widthPercent}%`,
                            height: '100%',
                            background: getSeverityColor(s.level),
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            ) : (
              <div style={{ color: '#9ca3af', fontSize: '13px' }}>No data</div>
            )}
          </div>

          {/* Top Sources */}
          <div>
            <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#374151', fontSize: '15px', fontWeight: '600' }}>
              📦 Top Sources
            </h4>
            {stats.sources && stats.sources.length > 0 ? (
              <div style={{ fontSize: '13px' }}>
                {stats.sources.slice(0, 5).map((s, idx) => {
                  const maxCount = getMaxCount(stats.sources);
                  const widthPercent = maxCount > 0 ? (s.count / maxCount) * 100 : 0;
                  
                  return (
                    <div key={s.source} style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '500' }}>
                          #{idx + 1} {s.source}
                        </span>
                        <strong style={{ color: '#2563eb' }}>{s.count}</strong>
                      </div>
                      <div style={{ 
                        width: '100%', 
                        height: '8px', 
                        background: '#f3f4f6', 
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${widthPercent}%`,
                          height: '100%',
                          background: '#3b82f6',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ color: '#9ca3af', fontSize: '13px' }}>No data</div>
            )}
          </div>

          {/* Top IPs */}
          <div>
            <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#374151', fontSize: '15px', fontWeight: '600' }}>
              🌐 Top Source IPs
            </h4>
            {stats.topIPs && stats.topIPs.length > 0 ? (
              <div style={{ fontSize: '13px' }}>
                {stats.topIPs.slice(0, 5).map((ip, idx) => {
                  const maxCount = getMaxCount(stats.topIPs);
                  const widthPercent = maxCount > 0 ? (ip.count / maxCount) * 100 : 0;
                  
                  return (
                    <div key={ip.ip} style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '500', fontFamily: 'monospace', fontSize: '12px' }}>
                          #{idx + 1} {ip.ip}
                        </span>
                        <strong style={{ color: '#059669' }}>{ip.count}</strong>
                      </div>
                      <div style={{ 
                        width: '100%', 
                        height: '8px', 
                        background: '#f3f4f6', 
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${widthPercent}%`,
                          height: '100%',
                          background: '#10b981',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ color: '#9ca3af', fontSize: '13px' }}>No data</div>
            )}
          </div>

          {/* Top Event Types */}
          <div>
            <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#374151', fontSize: '15px', fontWeight: '600' }}>
              ⚡ Top Event Types
            </h4>
            {stats.eventTypes && stats.eventTypes.length > 0 ? (
              <div style={{ fontSize: '13px' }}>
                {stats.eventTypes.slice(0, 5).map((type, idx) => {
                  const maxCount = getMaxCount(stats.eventTypes);
                  const widthPercent = maxCount > 0 ? (type.count / maxCount) * 100 : 0;
                  
                  return (
                    <div key={type.type} style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '500' }}>
                          #{idx + 1} {type.type || 'Unknown'}
                        </span>
                        <strong style={{ color: '#7c3aed' }}>{type.count}</strong>
                      </div>
                      <div style={{ 
                        width: '100%', 
                        height: '8px', 
                        background: '#f3f4f6', 
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${widthPercent}%`,
                          height: '100%',
                          background: '#8b5cf6',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ color: '#9ca3af', fontSize: '13px' }}>No data</div>
            )}
          </div>

          {/* Top Users */}
          {stats.topUsers && stats.topUsers.length > 0 && (
            <div>
              <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#374151', fontSize: '15px', fontWeight: '600' }}>
                👤 Top Users
              </h4>
              <div style={{ fontSize: '13px' }}>
                {stats.topUsers.slice(0, 5).map((user, idx) => {
                  const maxCount = getMaxCount(stats.topUsers);
                  const widthPercent = maxCount > 0 ? (user.count / maxCount) * 100 : 0;
                  
                  return (
                    <div key={user.user} style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '500' }}>
                          #{idx + 1} {user.user}
                        </span>
                        <strong style={{ color: '#dc2626' }}>{user.count}</strong>
                      </div>
                      <div style={{ 
                        width: '100%', 
                        height: '8px', 
                        background: '#f3f4f6', 
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${widthPercent}%`,
                          height: '100%',
                          background: '#ef4444',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Stats;
