import AlertRule from '../models/AlertRule.js';
import AlertNotification from '../models/AlertNotification.js';
import Log from '../models/Log.js';
import emailService from './emailService.js';

class AlertEngine {
    constructor() {
        this.checkInterval = 60000; // 60 seconds 

        this.isRunning = false;
    
        this.maxLogsPerQuery = 100; 
    }

    start() {
        if (this.isRunning) {
            console.log('Alert Engine is already running');
            return;
        }

        this.isRunning = true;
        console.log('Alert Engine started - checking rules every 60 seconds');

        this.checkAllRules();
        
        this.intervalId = setInterval(() => {
            this.checkAllRules();
        }, this.checkInterval);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.isRunning = false;
            console.log('Alert Engine stopped');
        }
    }

    async checkAllRules() {
        try {
            const rules = await AlertRule.find({ enabled: true }).limit(50);
            console.log(`Checking ${rules.length} active alert rules...`);
            
            for (const rule of rules) {
                try {
                    await this.checkRule(rule);
                } catch (error) {
                    console.error(`Error checking rule ${rule.name}:`, error.message);
                }
            }
        } catch (error) {
            console.error('Error in checkAllRules:', error.message);
        }
    }

    async checkRule(rule) {
        try {
            switch (rule.condition.type) {
                case 'threshold':
                    await this.checkThreshold(rule);
                    break;
                case 'frequency':
                    await this.checkFrequency(rule);
                    break;
                case 'pattern':
                    await this.checkPattern(rule);
                    break;
            }
        } catch (error) {
            console.error('Error checking alert rule:', error);
        }
    }

    // Threshold-based alerting
    async checkThreshold(rule) {
        const query = {
            tenant: rule.tenant,
            timestamp: {
                $gte: new Date(Date.now() - 5 * 60 * 1000)
            }
        };

        if (rule.condition.filters) {
            Object.entries(rule.condition.filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    query[key] = value;
                }
            });
        }

        if (rule.condition.field && rule.condition.operator) {
            const operatorMap = {
                'eq': '$eq',    // equals
                'ne': '$ne',    // not equals
                'gt': '$gt',    // greater than
                'gte': '$gte',  // greater than or equal
                'lt': '$lt',    // less than
                'lte': '$lte',  // less than or equal
            };

            const mongoOp = operatorMap[rule.condition.operator];
            if (mongoOp) {
                query[rule.condition.field] = {
                    [mongoOp]: rule.condition.value
                };
            }
        }

        const logs = await Log.find(query)
            .limit(this.maxLogsPerQuery) 
            .sort({ timestamp: -1 })
            .lean();   

        if (logs.length > 0) {
            await this.triggerAlert(rule, logs);
        }
    }

    // Frequency-based alerting
    async checkFrequency(rule) {
        const timeWindowMs = (rule.condition.timeWindow || 5) * 60 * 1000;

        const query = {
            tenant: rule.tenant,
            timestamp: {
                $gte: new Date(Date.now() - timeWindowMs)
            }
        };

        if (rule.condition.filters) {
            Object.entries(rule.condition.filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    query[key] = value;
                }
            });
        }

        const count = await Log.countDocuments(query);
        const threshold = rule.condition.count || 5;

        if (count >= threshold) {
            const logs = await Log.find(query)
                .limit(Math.min(this.maxLogsPerQuery, 20))
                .sort({ timestamp: -1 })
                .lean();
                
            await this.triggerAlert(rule, logs, {
                count,       
                threshold,     
                timeWindow: rule.condition.timeWindow 
            });
        }
    }

    // Pattern-based alerting
    async checkPattern(rule) {
        const query = {
            tenant: rule.tenant,
            timestamp: {
                $gte: new Date(Date.now() - 10 * 60 * 1000)
            }
        };

        if (rule.condition.value) {
            query.$or = [
                { message: { $regex: rule.condition.value, $options: 'i' } },  // Case-insensitive
                { raw: { $regex: rule.condition.value, $options: 'i' } }
            ];
        }

        if (rule.condition.filters) {
            Object.entries(rule.condition.filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    query[key] = value;
                }
            });
        }

        const logs = await Log.find(query)
            .limit(Math.min(this.maxLogsPerQuery, 20))  // Limit results
            .sort({ timestamp: -1 })
            .lean();

        if (logs.length > 0) {
            await this.triggerAlert(rule, logs);
        }
    }

    // Trigger alert actions
    async triggerAlert(rule, logs, metadata = {}) {
        try {
            if (rule.lastTriggered) {
                const timeSinceLastTrigger = Date.now() - rule.lastTriggered.getTime();
                const cooldownMs = 5 * 60 * 1000; // 5 minutes cooldown
                
                if (timeSinceLastTrigger < cooldownMs) {
                    const remaining = Math.round((cooldownMs - timeSinceLastTrigger) / 1000);
                    console.log(`Alert "${rule.name}" in cooldown (${remaining}s remaining)`);
                    return; 
                }
            }

            let severity = 'medium';
            if (logs.some(log => log.severity >= 9)) severity = 'critical';       // Emergency/Critical
            else if (logs.some(log => log.severity >= 7)) severity = 'high';      // Error/Warning
            else if (logs.some(log => log.severity >= 5)) severity = 'medium';    // Notice/Info
            else severity = 'low';                                                  // Debug

            const notification = new AlertNotification({
                ruleId: rule._id,
                ruleName: rule.name,
                tenant: rule.tenant,
                severity,
                title: rule.name,
                message: this.generateAlertMessage(rule, logs, metadata),
                matchedLogs: logs.slice(0, 5).map(log => ({
                    logId: log._id,
                    timestamp: log.timestamp,
                    message: (log.message || log.raw || '').substring(0, 200) 
                })),
                status: 'new' 
            });

            await notification.save();

            rule.lastTriggered = new Date();
            rule.triggerCount = (rule.triggerCount || 0) + 1;
            await rule.save();

            // EXECUTE ACTIONS: Perform configured actions (webhook, email, etc.)
            for (const action of rule.actions || []) {
                try {
                    await this.executeAction(action, notification);
                } catch (error) {
                    console.error(`Error executing action ${action.type}:`, error.message);
                }
            }

            // SEND EMAIL NOTIFICATION (always send for critical/high severity)
            if (severity === 'critical' || severity === 'high') {
                try {
                    await emailService.sendAlertEmail(notification);
                } catch (error) {
                    console.error('Failed to send alert email:', error.message);
                }
            }

            console.log(`Alert triggered: "${rule.name}" - ${severity.toUpperCase()} - ${logs.length} matching logs`);
        } catch (error) {
            console.error(`Error in triggerAlert for "${rule.name}":`, error.message);
        }
    }

    generateAlertMessage(rule, logs, metadata) {
        if (rule.condition.type === 'frequency') {
            return `Detected ${metadata.count} occurrences in ${metadata.timeWindow} minutes (threshold: ${metadata.threshold})`;
        } else if (rule.condition.type === 'threshold') {
            return `Found ${logs.length} logs matching threshold condition`;
        } else {
            return `Pattern matched ${logs.length} logs`;
        }
    }

    async executeAction(action, notification) {
       switch (action.type) {
            case 'ui':
                // Notification already saved to database
                break;
            case 'webhook':
                await this.sendWebhook(action.config.url, notification);
                break;
        }
    }

    // Send alert to external webhook URL 
    async sendWebhook(url, notification) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    alert: notification.ruleName,
                    severity: notification.severity,
                    message: notification.message,
                    timestamp: notification.triggered_at,
                })
            });
            console.log(`Webhook sent to ${url}: ${response.status}`);
        } catch (error) {
            console.error('Webhook error:', error);
        }
    }
}

export default new AlertEngine();