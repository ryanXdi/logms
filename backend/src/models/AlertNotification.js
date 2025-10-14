import mongoose from 'mongoose';

const alertNotificationSchema = new mongoose.Schema({
    ruleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AlertRule',
        required: true
    },
    ruleName: String,
    tenant: {
        type: String,
        required: true,
        index: true
    },
    severity: {
        type: String,
        enum: ['critical', 'high', 'medium', 'low'],
        default: 'medium'
    },
    title: String,
    message: String,

    matchedLogs: [{
        logId: mongoose.Schema.Types.ObjectId,
        timestamp: Date,
        message: String
    }],
    status: {
        type: String,
        enum: ['new', 'acknowledged', 'resolved'],
        default: 'new'
    },

    triggered_at: {
        type: Date,
        default: Date.now,
        index: true
    }
},{
    timestamps: false
});

alertNotificationSchema.index({ tenant: 1, triggered_at: -1 });
alertNotificationSchema.index({ tenant: 1, status: 1 });

export default mongoose.model('AlertNotification', alertNotificationSchema);