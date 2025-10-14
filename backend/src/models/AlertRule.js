import mongoose from 'mongoose';

const alertRuleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    tenant: {
        type: String,
        required: true,
        index: true
    },
    enabled: {
        type: Boolean,
        default: true
    },

    condition: {
        type: {
            type: String,
            enum: ['threshold', 'frequency', 'pattern'],
            required: true
        },

        field: String,
        operator: {
            type: String,
            enum: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains']
        },
        value: mongoose.Schema.Types.Mixed,

        count: Number,
        timeWindow: Number,

        filters: {
            severity: Number,
            event_type: String,
            host: String,
            user: String,
            src_ip: String
        }
    },

    actions: [{
        type: {
            type: String,
            enum: ['webhook', 'ui'],
            required: true
        },
        config: mongoose.Schema.Types.Mixed
    }],

    lastTriggered: Date,
    triggerCount: {
        type: Number,
        default: 0
    }, 
    createdBy: String,
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date, 
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

alertRuleSchema.index({ tenant: 1, enabled: 1})

export default mongoose.model('AlertRule', alertRuleSchema);