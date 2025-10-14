import mongoose from 'mongoose';
import AlertRule from '../src/models/AlertRule.js';
import dotenv from 'dotenv';

dotenv.config();

const sampleRules = [
    {
        name: "Multiple Failed Login Attempts",
        description: "Alert when 5 or more failed login attempts occur within 5 minutes",
        enabled: true,
        condition: {
            type: "frequency",
            count: 5,
            timeWindow: 5,
            filters: {
                event_type: "auth",
                severity: 6
            }
        },
        actions: [
            { type: "ui" }
        ]
    },
    {
        name: "Critical Severity Alert",
        description: "Alert on any critical severity logs",
        enabled: true,
        condition: {
            type: "threshold",
            field: "severity",
            operator: "gte",
            value: 9
        },
        actions: [
            { type: "ui" }
        ]
    },
    {
        name: "Network Firewall Blocks",
        description: "Alert when firewall blocks traffic",
        enabled: true,
        condition: {
            type: "pattern",
            value: "blocked|denied|rejected",
            filters: {
                event_type: "network"
            }
        },
        actions: [
            { type: "ui" }
        ]
    }
];

async function seedAlerts() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/logms-demo';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const tenant = process.env.DEFAULT_TENANT || 'default';

        // Check if rules already exist for this tenant
        const existingCount = await AlertRule.countDocuments({ tenant });
        
        if (existingCount > 0) {
            console.log(`${existingCount} alert rules already exist for tenant "${tenant}". Skipping seed.`);
            process.exit(0);
        }

        // Update tenant in sample rules
        const rulesWithTenant = sampleRules.map(rule => ({
            ...rule,
            tenant
        }));

        // Insert sample rules
        await AlertRule.insertMany(rulesWithTenant);
        console.log(`✅ ${rulesWithTenant.length} alert rules created successfully for tenant "${tenant}"`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error seeding alerts:', error);
        process.exit(1);
    }
}

seedAlerts();