import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
    timestamp: { type: Date, required: true, index: true },
    tenant: { type: String, required: true, index: true },
    source: { type: String, required: true},
    severity: { type: Number, required: true,  min: 1,  max: 10 },
    host: { type: String, index: true},
    user: { type: String },
    src_ip: String,
    dst_ip: String,
    event_type: String,
    message: String,
    raw: {  type: String, required: true},
    
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

logSchema.index({ tenant: 1, timestamp: -1 });
logSchema.index({ tenant: 1, severity: 1 });

logSchema.index({ created_at: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

export default mongoose.model('Log', logSchema);