import mongoose from 'mongoose';
import Log from '../src/models/Log.js';
import dotenv from 'dotenv';

dotenv.config();

async function ingestTestLogs() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/logms';
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const tenant = process.env.DEFAULT_TENANT || 'acme';
        const now = Date.now();

        // Test 1: Critical severity logs (should trigger "Critical Severity Alert")
        console.log('\n1️⃣  Ingesting critical severity logs...');
        const criticalLogs = [];
        for (let i = 0; i < 3; i++) {
            criticalLogs.push({
                timestamp: new Date(now - i * 1000),
                tenant,
                source: 'system',
                severity: 9, // Critical
                host: 'server-01',
                event_type: 'system',
                message: 'CRITICAL: System memory exhausted',
                raw: `[CRITICAL] System memory exhausted at ${new Date().toISOString()}`,
                _tags: ['test', 'critical']
            });
        }
        await Log.insertMany(criticalLogs);
        console.log(`   ✅ Inserted ${criticalLogs.length} critical logs`);

        // Test 2: Failed login attempts (should trigger "Multiple Failed Login Attempts")
        console.log('\n2️⃣  Ingesting failed login attempts...');
        const failedLogins = [];
        for (let i = 0; i < 6; i++) {
            failedLogins.push({
                timestamp: new Date(now - i * 10000), // Within 1 minute
                tenant,
                source: 'ssh',
                severity: 6, // Warning
                host: 'web-01',
                user: 'admin',
                src_ip: '192.168.1.100',
                event_type: 'auth',
                message: 'Authentication failed for user admin',
                raw: `[AUTH] Failed login attempt from 192.168.1.100`,
                _tags: ['test', 'auth', 'failed']
            });
        }
        await Log.insertMany(failedLogins);
        console.log(`   ✅ Inserted ${failedLogins.length} failed login logs`);

        // Test 3: Firewall blocks (should trigger "Network Firewall Blocks")
        console.log('\n3️⃣  Ingesting firewall block events...');
        const firewallBlocks = [];
        const blockPatterns = ['blocked', 'denied', 'rejected'];
        for (let i = 0; i < 4; i++) {
            const pattern = blockPatterns[i % blockPatterns.length];
            firewallBlocks.push({
                timestamp: new Date(now - i * 5000),
                tenant,
                source: 'firewall',
                severity: 5,
                host: 'gateway',
                src_ip: '203.0.113.45',
                dst_ip: '10.0.0.50',
                event_type: 'network',
                message: `Connection ${pattern} from suspicious IP`,
                raw: `[FIREWALL] Traffic ${pattern}: src=203.0.113.45 dst=10.0.0.50`,
                _tags: ['test', 'network', 'firewall']
            });
        }
        await Log.insertMany(firewallBlocks);
        console.log(`   ✅ Inserted ${firewallBlocks.length} firewall block logs`);

        // Summary
        const totalInserted = criticalLogs.length + failedLogins.length + firewallBlocks.length;
        console.log(`\n📊 Summary:`);
        console.log(`   Total logs inserted: ${totalInserted}`);
        console.log(`   Tenant: ${tenant}`);
        console.log(`\n⏱️  Alert engine checks every 60 seconds...`);
        console.log(`   Wait 1-2 minutes and check the alerts in the UI or API.`);
        console.log(`\n🔍 To check notifications:`);
        console.log(`   curl http://localhost:4000/api/alerts/notifications -H "Authorization: Bearer <token>"`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

ingestTestLogs();
