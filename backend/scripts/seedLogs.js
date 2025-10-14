import mongoose from 'mongoose';
import Log from '../src/models/Log.js';
import dotenv from 'dotenv';

dotenv.config();

// Generate sample logs with realistic patterns
const generateSampleLogs = (count = 100) => {
    const sources = ['apache', 'nginx', 'firewall', 'ssh', 'database', 'application'];
    const hosts = ['web-01', 'web-02', 'db-01', 'api-server', 'gateway'];
    const users = ['admin', 'john.doe', 'jane.smith', 'system', 'root'];
    const ips = ['192.168.1.100', '192.168.1.101', '10.0.0.50', '172.16.0.10', '203.0.113.45'];
    const eventTypes = ['auth', 'network', 'database', 'application', 'system'];
    
    const messages = [
        'User login successful',
        'User login failed - invalid password',
        'Connection established',
        'Connection timeout',
        'Query executed successfully',
        'Database error: connection pool exhausted',
        'Request processed in 45ms',
        'Error: Unable to connect to service',
        'File uploaded successfully',
        'Access denied - insufficient permissions',
        'Firewall blocked incoming connection',
        'SSL certificate verified',
        'Cache hit for key: user_session_123',
        'Background job completed',
        'API rate limit exceeded'
    ];

    const logs = [];
    const now = Date.now();
    
    for (let i = 0; i < count; i++) {
        // Generate timestamps over the last 24 hours
        const timestamp = new Date(now - Math.random() * 24 * 60 * 60 * 1000);
        const source = sources[Math.floor(Math.random() * sources.length)];
        const message = messages[Math.floor(Math.random() * messages.length)];
        
        // Higher severity for error messages
        let severity = 5;
        if (message.includes('error') || message.includes('failed') || message.includes('denied')) {
            severity = Math.floor(Math.random() * 3) + 7; // 7-9
        } else if (message.includes('warning') || message.includes('timeout')) {
            severity = 6;
        } else {
            severity = Math.floor(Math.random() * 3) + 3; // 3-5
        }
        
        const log = {
            timestamp,
            tenant: process.env.DEFAULT_TENANT || 'acme',
            source,
            severity,
            host: hosts[Math.floor(Math.random() * hosts.length)],
            user: Math.random() > 0.3 ? users[Math.floor(Math.random() * users.length)] : undefined,
            src_ip: Math.random() > 0.4 ? ips[Math.floor(Math.random() * ips.length)] : undefined,
            dst_ip: Math.random() > 0.6 ? ips[Math.floor(Math.random() * ips.length)] : undefined,
            event_type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
            message,
            raw: `[${timestamp.toISOString()}] [${source}] ${message}`,
            _tags: [source, 'sample']
        };
        
        logs.push(log);
    }
    
    return logs;
};

async function seedLogs() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/logms';
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // Check existing logs
        const existingCount = await Log.countDocuments({});
        console.log(`Current log count: ${existingCount}`);

        // Generate and insert sample logs
        const sampleLogs = generateSampleLogs(200); // Generate 200 sample logs
        
        console.log(`Inserting ${sampleLogs.length} sample logs...`);
        await Log.insertMany(sampleLogs);
        
        const newCount = await Log.countDocuments({});
        console.log(`✅ Successfully inserted ${sampleLogs.length} logs`);
        console.log(`📊 Total logs in database: ${newCount}`);
        
        // Show some stats
        const stats = await Log.aggregate([
            { $group: { _id: '$severity', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);
        
        console.log('\n📈 Severity distribution:');
        stats.forEach(s => {
            console.log(`  Severity ${s._id}: ${s.count} logs`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding logs:', error);
        process.exit(1);
    }
}

seedLogs();
