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
            
            host: event.host || event.hostname || event.server,
            user: event.user || event.username || event.account,
            src_ip: event.src_ip || event.source_ip || event.client_ip,
            dst_ip: event.dst_ip || event.dest_ip || event.target_ip,
            event_type: event.event_type || 'generic',
            message: event.message || event.msg || event.description,
            raw: typeof event === 'string' ? event : JSON.stringify(event),
            _tags: Array.isArray(event._tags) ? [...event._tags] : [source]
        };

        return normalized;
    }

    normalizeSyslog(event) {
        const normalized = this.normalizeEvent(event, event.tenant || 'default', 'syslog');
        normalized._tags.push('syslog');

        if (event.message) {
            const patterns = {
                user: /user[=:](\S+)/i,
                src_ip: /src[=:](\S+)/i,
                dst_ip: /dst[=:](\S+)/i
            };

            Object.entries(patterns).forEach(([field, pattern]) => {
                const match = event.message.match(pattern);
                if (match && !normalized[field]) {
                    normalized[field] = match[1];
                }
            });

            if (event.message.toLowerCase().includes('login')) {
                normalized.event_type = 'auth';
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
            timestamp: new Date(),
            tenant,
            source: 'aws-cloudtrail',
            severity,
            
            host: event.awsRegion,
            user: userIdentity.userName || userIdentity.principalId || userIdentity.type,
            src_ip: event.sourceIPAddress,
            dst_ip: null,
            event_type: event.eventSource?.split('.')[0] || 'aws',
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
        if (typeof sev === 'number') return Math.min(Math.max(sev, 1), 10);
        return severityMap[String(sev).toLowerCase()] || severityMap['DEFAULT'];
    }

    normalizeString(str, tenant, source) {
        return {
            timestamp: new Date(),
            tenant,
            source,
            severity: severityMap['DEFAULT'],
            message: str,
            raw: str,
            _tags: ['raw_string']
        };
    }
}

export default new LogNormalizer();