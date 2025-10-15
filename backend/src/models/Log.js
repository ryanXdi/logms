import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
    timestamp: { type: Date, required: true, index: true },
    tenant: { type: String, required: true, index: true },
    source: { type: String, required: true }, // firewall|crowdstrike|aws|m365|ad|api|network
    vendor: { type: String }, // e.g., "CrowdStrike", "AWS", "Palo Alto"
    product: { type: String }, // e.g., "Falcon", "CloudTrail", "PA-220"
    event_type: { type: String }, // e.g., "auth", "network", "system"
    event_subtype: { type: String }, 
    severity: { type: Number, required: true, min: 0, max: 10 }, // 0-10 scale
    action: { type: String }, // allow|deny|create|delete|login|logout|alert
    src_ip: { type: String },
    src_port: { type: Number },
    dst_ip: { type: String },
    dst_port: { type: Number },
    protocol: { type: String }, // TCP|UDP|ICMP|HTTP|HTTPS
    user: { type: String },
    host: { type: String, index: true },
    process: { type: String }, 
    url: { type: String },
    http_method: { type: String }, // GET|POST|PUT|DELETE|PATCH
    status_code: { type: Number }, // HTTP status code
    rule_name: { type: String },
    rule_id: { type: String },
    cloud: {
        account_id: { type: String },
        region: { type: String },
        service: { type: String }
    },
    message: { type: String },
    raw: { type: String, required: true }, // Original log

    // Metadata
    _tags: [String],
    created_at: { 
        type: Date, 
        default: Date.now, 
        index: true 
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for efficient queries
logSchema.index({ tenant: 1, timestamp: -1 });
logSchema.index({ tenant: 1, severity: 1 });
logSchema.index({ tenant: 1, event_type: 1 });
logSchema.index({ tenant: 1, src_ip: 1 });

logSchema.index({ created_at: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 }); // delete after 7 days

export default mongoose.model('Log', logSchema);