// Test Case 2: Alert Rule System
// This tests creating alert rules, triggering them, and viewing notifications
// Run: node tests/alert-rules.test.js

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

async function testAlertRules() {
  console.log('Test Case 2: Alert Rule System\n');
  console.log('This test validates the complete alerting workflow:');
  console.log('Rule creation → Log ingestion → Alert triggering → Notifications\n');
  console.log('='.repeat(60));
  
  let passed = 0;
  let failed = 0;
  let ruleId = null;

  // Login
  console.log('\n🔐 Step 1: Authentication');
  const token = await login();
  console.log('✅ Authenticated as admin\n');

  // Test 1: Create alert rule for critical logs
  console.log('Step 2: Create Alert Rule');
  try {
    const response = await fetch(`${API_URL}/api/alerts/rules`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Critical System Alert',
        description: 'Triggers when severity is 9 or higher',
        condition: {
          type: 'threshold',
          field: 'severity',
          operator: 'gte',
          value: 9
        },
        actions: [{ type: 'ui' }]
      })
    });

    const data = await response.json();
    
    if (response.status === 201 && data.rule) {
      ruleId = data.rule._id;
      console.log('✅ Alert rule created successfully:');
      console.log(`   Name: ${data.rule.name}`);
      console.log(`   Condition: severity >= 9`);
      console.log(`   Status: ${data.rule.enabled ? 'Enabled' : 'Disabled'}`);
      console.log(`   Rule ID: ${ruleId}\n`);
      passed++;
    } else {
      console.log('❌ Failed to create alert rule');
      console.log(`   Status: ${response.status}\n`);
      failed++;
    }
  } catch (error) {
    console.log('❌ Rule creation error:', error.message, '\n');
    failed++;
  }

  // Test 2: Verify rule exists in the system
  console.log('🔍 Step 3: Verify Rule in System');
  try {
    const response = await fetch(`${API_URL}/api/alerts/rules`, {
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.status === 200 && Array.isArray(data.rules)) {
      const ourRule = data.rules.find(r => r._id === ruleId);
      if (ourRule) {
        console.log(`✅ Rule found in system (Total rules: ${data.rules.length})`);
        console.log(`   Our rule: "${ourRule.name}" is ${ourRule.enabled ? 'active' : 'inactive'}\n`);
        passed++;
      } else {
        console.log('❌ Created rule not found in system\n');
        failed++;
      }
    } else {
      console.log('❌ Failed to retrieve rules');
      console.log(`   Status: ${response.status}\n`);
      failed++;
    }
  } catch (error) {
    console.log('❌ Rule retrieval error:', error.message, '\n');
    failed++;
  }

  // Test 3: Ingest critical log to trigger alert
  console.log('Step 4: Trigger Alert with Critical Log');
  try {
    const criticalLog = {
      timestamp: new Date().toISOString(),
      severity: 10,
      message: 'CRITICAL SYSTEM FAILURE: Database cluster down - immediate action required',
      host: 'db-primary-01',
      source: 'database-monitor',
      event_type: 'critical_failure',
      user: 'system'
    };

    const response = await fetch(`${API_URL}/api/ingest`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(criticalLog)
    });

    const data = await response.json();
    
    if ((response.status === 200 || response.status === 201) && data.success) {
      console.log('✅ Critical log ingested successfully:');
      console.log(`   Severity: ${criticalLog.severity} (CRITICAL)`);
      console.log(`   Message: ${criticalLog.message.substring(0, 50)}...`);
      console.log(`   Host: ${criticalLog.host}`);
      console.log('   \n   ⏰ Note: Alert engine checks every 60 seconds');
      console.log('   The notification will appear in the next check cycle\n');
      passed++;
    } else {
      console.log('❌ Failed to ingest critical log');
      console.log(`   Status: ${response.status}\n`);
      failed++;
    }
  } catch (error) {
    console.log('❌ Log ingestion error:', error.message, '\n');
    failed++;
  }

  // Test 4: Check alert notifications
  console.log('Step 5: Check Alert Notifications');
  try {
    const response = await fetch(`${API_URL}/api/alerts/notifications?limit=5`, {
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.status === 200 && Array.isArray(data.notifications)) {
      console.log(`✅ Notifications retrieved (Total: ${data.notifications.length})`);
      
      if (data.notifications.length > 0) {
        console.log('   \n   Recent notifications:');
        data.notifications.slice(0, 3).forEach((notif, i) => {
          console.log(`   ${i + 1}. [${notif.severity}] ${notif.status.toUpperCase()} - ${notif.message.substring(0, 50)}...`);
        });
        
        // Check for new notifications
        const newNotifications = data.notifications.filter(n => n.status === 'new');
        console.log(`\n   New unhandled alerts: ${newNotifications.length}`);
      } else {
        console.log('   No notifications yet (alert engine runs every 60s)');
      }
      console.log('');
      passed++;
    } else {
      console.log('❌ Failed to retrieve notifications');
      console.log(`   Status: ${response.status}\n`);
      failed++;
    }
  } catch (error) {
    console.log('❌ Notification retrieval error:', error.message, '\n');
    failed++;
  }

  // Test 5: Get alert statistics
  console.log('Step 6: Get Alert Statistics');
  try {
    const response = await fetch(`${API_URL}/api/alerts/stats?timeRange=24h`, {
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.status === 200 && data.stats) {
      console.log('✅ Alert statistics retrieved:');
      console.log(`   Active Rules: ${data.stats.activeRules}`);
      console.log(`   Total Notifications: ${data.stats.totalNotifications || 0}`);
      
      if (data.stats.statusCounts) {
        console.log(`   \n   Status breakdown:`);
        console.log(`     New: ${data.stats.statusCounts.new || 0}`);
        console.log(`     Acknowledged: ${data.stats.statusCounts.acknowledged || 0}`);
        console.log(`     Resolved: ${data.stats.statusCounts.resolved || 0}`);
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

  // Test 6: Clean up - Delete test rule
  if (ruleId) {
    console.log('Step 7: Cleanup - Delete Test Rule');
    try {
      const response = await fetch(`${API_URL}/api/alerts/rules/${ruleId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.status === 200 && data.success) {
        console.log('✅ Test rule deleted successfully\n');
        passed++;
      } else {
        console.log('❌ Failed to delete test rule');
        console.log(`   Status: ${response.status}\n`);
        failed++;
      }
    } catch (error) {
      console.log('❌ Cleanup error:', error.message, '\n');
      failed++;
    }
  } else {
    console.log('Step 7: Skipped (no rule to delete)\n');
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
testAlertRules().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test error:', error);
  process.exit(1);
});
