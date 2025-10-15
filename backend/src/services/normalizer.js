const severityMap = {
    // Syslog severities (RFC 5424)
    'emerg': 10,    // System is unusable
    'alert': 9,     // Action must be taken immediately
    'crit': 8,      // Critical conditions
    'error': 7,     // Error conditions
    'warning': 6,   // Warning conditions
    'notice': 5,    // Normal but significant conditions
    'info': 4,      // Informational messages
    'debug': 3,     // Debug-level messages
    

    'fatal': 10,
    'critical': 8,
    'high': 8,
    'medium': 5,
    'low': 3,

    'DEFAULT': 5
};

class LogNormalizer {
    normalizeEvent(event, tenant = 'default', source = 'api') {
        if (typeof event === 'string') {
            try {
                event = JSON.parse(event);
            } catch (e) {
                return this.normalizeString(event, tenant, source);
            }
        }

        const normalized = {
            timestamp: this.parseTimestamp(event.timestamp || event['@timestamp'] || new Date()),
            tenant,
            source,
            severity: this.parseSeverity(event.severity || event.level || event.priority),
            vendor: event.vendor || event.source_vendor || null,
            product: event.product || event.source_product || null,
            event_type: event.event_type || event.category || 'generic',
            event_subtype: event.event_subtype || event.subcategory || null,
            action: event.action || event.event_action || null,
            src_ip: event.src_ip || event.source_ip || event.client_ip || null,
            src_port: event.src_port || event.source_port || null,
            dst_ip: event.dst_ip || event.dest_ip || event.target_ip || event.server_ip || null,
            dst_port: event.dst_port || event.dest_port || event.server_port || null,
            protocol: event.protocol || event.network_protocol || null,
            user: event.user || event.username || event.account || event.user_id || null,
            host: event.host || event.hostname || event.server || null,
            process: event.process || event.process_name || event.program || null,
            url: event.url || event.request_url || event.uri || null,
            http_method: event.http_method || event.method || event.request_method || null,
            status_code: event.status_code || event.http_status || event.response_code || null,
            rule_name: event.rule_name || event.policy_name || null,
            rule_id: event.rule_id || event.policy_id || null,
            cloud: {
                account_id: event.cloud?.account_id || event.account_id || event.aws_account_id || null,
                region: event.cloud?.region || event.region || event.aws_region || null,
                service: event.cloud?.service || event.service || event.service_name || null
            },
            message: event.message || event.msg || event.description || null,
            raw: typeof event === 'string' ? event : JSON.stringify(event),
            _tags: Array.isArray(event._tags) ? [...event._tags] : [source]
        };

        return normalized;
    }

    normalizeSyslog(event) {
        const normalized = this.normalizeEvent(event, event.tenant || 'default', 'syslog');
        normalized._tags.push('syslog');
        normalized.vendor = normalized.vendor || 'syslog';

        if (event.message) {
            // Enhanced pattern extraction
            const patterns = {
                user: /user[=:](\S+)/i,
                src_ip: /(?:src|source)[=:]?(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/i,
                dst_ip: /(?:dst|dest|destination)[=:]?(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/i,
                src_port: /sport[=:]?(\d+)/i,
                dst_port: /dport[=:]?(\d+)/i,
                protocol: /proto[=:]?(tcp|udp|icmp)/i,
                action: /action[=:]?(accept|deny|drop|allow|block)/i
            };

            Object.entries(patterns).forEach(([field, pattern]) => {
                const match = event.message.match(pattern);
                if (match && !normalized[field]) {
                    normalized[field] = match[1];
                }
            });

            // Detect event types
            const msgLower = event.message.toLowerCase();
            if (msgLower.includes('login') || msgLower.includes('auth')) {
                normalized.event_type = 'auth';
                normalized.action = msgLower.includes('failed') ? 'deny' : 'allow';
            } else if (msgLower.includes('firewall') || msgLower.includes('blocked')) {
                normalized.event_type = 'network';
                normalized.action = msgLower.includes('accept') || msgLower.includes('allow') ? 'allow' : 'deny';
            }
        }

        return normalized;
    }

    normalizeAWSCloudTrail(event, tenant = 'default') {
        const userIdentity = event.userIdentity || {};
        const requestParams = event.requestParameters || {};
        const responseElements = event.responseElements || {};
        
        let severity = 5;
    
        if (event.errorCode || event.errorMessage) {
            severity = 7; 
        }
        if (event.eventName && (
            event.eventName.includes('Delete') ||
            event.eventName.includes('Terminate') ||
            event.eventName.includes('Disable')
        )) {
            severity = 8;
        }
        
        if (event.eventName === 'ConsoleLogin') {
            severity = event.responseElements?.ConsoleLogin === 'Failure' ? 8 : 5;
        }

        const normalized = {
            // Core fields
            timestamp: this.parseTimestamp(event.eventTime || new Date()),
            tenant,
            source: 'aws-cloudtrail',
            severity,
            
            // Source identification
            vendor: 'aws',
            product: 'cloudtrail',
            
            // Event classification
            event_type: event.eventSource?.split('.')[0] || 'aws',
            event_subtype: event.eventCategory || null,
            action: event.eventName,
            
            // Network fields
            src_ip: event.sourceIPAddress,
            
            // Identity and host
            user: userIdentity.userName || userIdentity.principalId || userIdentity.type,
            host: event.awsRegion,
            process: event.eventSource,
            
            // Cloud provider fields
            cloud: {
                account_id: event.userIdentity?.accountId || event.recipientAccountId || null,
                region: event.awsRegion || null,
                service: event.eventSource?.replace('.amazonaws.com', '') || null
            },
            
            // Message and raw data
            message: `${event.eventName} by ${userIdentity.userName || userIdentity.type} from ${event.sourceIPAddress}`,
            raw: JSON.stringify(event),
            _tags: ['aws', 'cloudtrail', event.eventSource?.split('.')[0] || 'aws']
        };

        if (event.errorCode) {
            normalized.message += ` - ERROR: ${event.errorCode}`;
            normalized._tags.push('error');
        }

        return normalized;
    }

    parseTimestamp(ts) {
        if (ts instanceof Date) return ts;
        if (typeof ts === 'number') return new Date(ts);
        if (typeof ts === 'string') {
            const parsed = new Date(ts);
            return isNaN(parsed) ? new Date() : parsed;
        }
        return new Date();
    }

    parseSeverity(sev) {
        if (typeof sev === 'number') return Math.min(Math.max(sev, 0), 10);
        return severityMap[String(sev).toLowerCase()] || severityMap['DEFAULT'];
    }

    normalizeString(str, tenant, source) {
        return {
            timestamp: new Date(),
            tenant,
            source,
            severity: severityMap['DEFAULT'],
            event_type: 'generic',
            message: str,
            raw: str,
            _tags: ['raw_string']
        };
    }
}

export default new LogNormalizer();