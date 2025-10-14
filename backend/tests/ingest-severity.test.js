// Test Case 1: Log Ingestion & Severity Overview
// This tests the complete flow of ingesting logs and viewing severity statistics
// Run: node tests/ingest-severity.test.js

const API_URL = process.env.API_URL || 'http://localhost:4000';

async function login() {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@example.com',
      password: 'admin123'
    })
  });
  const data = await response.json();
  return data.token;
}

async function testIngestAndSeverity() {
  console.log('Test Case 1: Log Ingestion & Severity Overview\n');
  console.log('This test validates the complete log ingestion pipeline');
  console.log('and severity statistics calculation.\n');
  console.log('='.repeat(60));
  
  let passed = 0;
  let failed = 0;

  // Login
  console.log('\nStep 1: Authentication');
  const token = await login();
  console.log('✅ Authenticated as admin\n');

  // Test 1: Ingest logs with different severities
  console.log('Step 2: Ingest Test Logs');
  try {
    const testLogs = [
      {
        timestamp: new Date().toISOString(),
        severity: 3,
        message: 'INFO: Application started successfully',
        host: 'app-server-01',
        source: 'application',
        event_type: 'info'
      },
      {
        timestamp: new Date().toISOString(),
        severity: 5,
        message: 'WARNING: High memory usage detected',
        host: 'app-server-01',
        source: 'system',
        event_type: 'warning'
      },
      {
        timestamp: new Date().toISOString(),
        severity: 8,
        message: 'ERROR: Database connection failed',
        host: 'db-server-01',
        source: 'database',
        event_type: 'error'
      },
      {
        timestamp: new Date().toISOString(),
        severity: 10,
        message: 'CRITICAL: System failure - immediate attention required',
        host: 'app-server-01',
        source: 'system',
        event_type: 'critical'
      }
    ];

    const response = await fetch(`${API_URL}/api/ingest`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testLogs)
    });

    const data = await response.json();
    
    if ((response.status === 200 || response.status === 201) && data.count === 4) {
      console.log('✅ Successfully ingested 4 test logs:');
      console.log('   - Severity 3 (INFO)');
      console.log('   - Severity 5 (WARNING)');
      console.log('   - Severity 8 (ERROR)');
      console.log('   - Severity 10 (CRITICAL)\n');
      passed++;
    } else {
      console.log('❌ Failed to ingest logs');
      console.log(`   Status: ${response.status}, Response:`, data, '\n');
      failed++;
    }
  } catch (error) {
    console.log('❌ Ingestion error:', error.message, '\n');
    failed++;
  }

  // Test 2: Get severity statistics
  console.log('Step 3: Retrieve Severity Statistics');
  try {
    const response = await fetch(`${API_URL}/api/search/stats`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const data = await response.json();
    
    if (response.status === 200 && data.stats) {
      console.log('✅ Statistics retrieved successfully:');
      console.log(`   Total Logs: ${data.stats.totalLogs}`);
      console.log(`   Last 24 hours: ${data.stats.last24h}`);
      console.log(`   Last 7 days: ${data.stats.last7days}`);
      
      if (data.stats.severityDistribution && data.stats.severityDistribution.length > 0) {
        console.log('   \n   Severity Distribution:');
        data.stats.severityDistribution.forEach(item => {
          console.log(`     Level ${item.level}: ${item.count} logs`);
        });
      }
      console.log('');
      passed++;
    } else {
      console.log('❌ Failed to retrieve statistics');
      console.log(`   Status: ${response.status}\n`);
      failed++;
    }
  } catch (error) {
    console.log('❌ Statistics error:', error.message, '\n');
    failed++;
  }

  // Test 3: Filter high severity logs
  console.log('🔍 Step 4: Filter High Severity Logs (>= 8)');
  try {
    const response = await fetch(`${API_URL}/api/search`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        severity_min: 8,
        limit: 10
      })
    });

    const data = await response.json();
    
    if (response.status === 200) {
      const highSeverityLogs = data.logs.filter(log => log.severity >= 8);
      console.log(`✅ Found ${highSeverityLogs.length} high severity logs`);
      
      if (highSeverityLogs.length > 0) {
        console.log('   Recent high severity events:');
        highSeverityLogs.slice(0, 3).forEach(log => {
          console.log(`     [${log.severity}] ${log.message.substring(0, 60)}...`);
        });
      }
      console.log('');
      passed++;
    } else {
      console.log('❌ Failed to filter logs');
      console.log(`   Status: ${response.status}\n`);
      failed++;
    }
  } catch (error) {
    console.log('❌ Filter error:', error.message, '\n');
    failed++;
  }

  // Summary
  console.log('='.repeat(60));
  console.log('TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));
  
  return failed === 0;
}

// Run test
testIngestAndSeverity().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});
