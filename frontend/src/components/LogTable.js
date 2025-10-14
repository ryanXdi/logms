import React from 'react';

function LogTable({ logs }) {
  const getSeverityClass = (severity) => {
    if (severity >= 8) return 'severity-high';
    if (severity >= 5) return 'severity-medium';
    return 'severity-low';
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  if (logs.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
        No logs found
      </div>
    );
  }

  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <table className="table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Severity</th>
            <th>Source</th>
            <th>Host</th>
            <th>Message</th>
            <th>User</th>
            <th>Event Type</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log._id}>
              <td style={{ whiteSpace: 'nowrap' }}>
                {formatDate(log.timestamp)}
              </td>
              <td>
                <span className={`severity-badge ${getSeverityClass(log.severity)}`}>
                  {log.severity}
                </span>
              </td>
              <td>{log.source}</td>
              <td>{log.host || '-'}</td>
              <td style={{ maxWidth: '400px', wordBreak: 'break-word' }}>
                {log.message || '-'}
              </td>
              <td>{log.user || '-'}</td>
              <td>{log.event_type || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LogTable;
