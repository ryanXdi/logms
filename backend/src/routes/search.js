import express from 'express';
import Log from '../models/Log.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/', async (req, res) => {
    try {
        const {
            from = 'now-24h',
            to = 'now',
            event_type,
            severity,
            source,
            host,
            src_ip,
            dst_ip,
            user,
            message,
            limit = 100,
            offset = 0
        } = req.body;

        const tenant = req.tenant || req.user.tenant || 'default';
        console.log(`Search request for tenant: ${tenant}`);

        const timeQuery = {};
        if (from || to) {
            timeQuery.timestamp = {};
            if (from) {
                let fromDate;
                if (from.startsWith('now-')) {
                    const duration = from.substring(4);
                    const unit = duration.slice(-1);
                    const value = parseInt(duration);
                    switch(unit) {
                        case 'h':
                            fromDate = new Date(Date.now() - value * 60 * 60 * 1000);
                            break;
                        case 'd':
                            fromDate = new Date(Date.now() - value * 24 * 60 * 60 * 1000);
                            break;
                        default:
                            fromDate = new Date(from);
                    }
                } else {
                    fromDate = new Date(from);
                }
                timeQuery.timestamp.$gte = fromDate;
            }
            if (to) {
                const toDate = to === 'now' ? new Date() : new Date(to);
                timeQuery.timestamp.$lte = toDate;
            }
        }

        const query = {
            tenant, 
            ...timeQuery,
            ...(event_type && { event_type }),
            ...(severity && { severity: parseInt(severity) }),
            ...(source && { source }),
            ...(host && { host }),
            ...(src_ip && { src_ip }),
            ...(dst_ip && { dst_ip }),
            ...(user && { user })
        };

        if (message) {
            query.$or = [
                { message: { $regex: message, $options: 'i' } },
                { raw: { $regex: message, $options: 'i' } }
            ];
        }

        const logs = await Log.find(query)
            .sort({ timestamp: -1 }) 
            .skip(offset)
            .limit(limit)
            .select('-raw'); 

        const total = await Log.countDocuments(query);

        res.status(200).json({
            success: true,
            total,
            logs
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        }); 
    }
});

router.get('/tenants', async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
        }

        const tenants = await Log.distinct('tenant');
        
        res.json({
            success: true,
            tenants: tenants.sort() 
        });
    } catch (error) {
        console.error('Tenants fetch error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/stats', async (req, res) => {
    try {
        const { from = 'now-24h', to = 'now' } = req.body;
        const tenant = req.tenant || req.user.tenant || 'default';

        const timeQuery = {};
        if (from || to) {
            timeQuery.timestamp = {};
            if (from) {
                const fromDate = from === 'now-24h' 
                    ? new Date(Date.now() - 24 * 60 * 60 * 1000) 
                    : new Date(from);
                timeQuery.timestamp.$gte = fromDate;
            }
            if (to) {
                const toDate = to === 'now' ? new Date() : new Date(to);
                timeQuery.timestamp.$lte = toDate;
            }
        }

        const query = { tenant, ...timeQuery };

        const [
            timeline,        
            severityStats,
            topSources,     
            topIPs,     
            topUsers, 
            eventTypes   
        ] = await Promise.all([

            Log.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: "%Y-%m-%d %H:00", date: "$timestamp" }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } },
                { $limit: 24 } 
            ]),

            Log.aggregate([
                { $match: query },
                { $group: { _id: "$severity", count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]),

            Log.aggregate([
                { $match: query },
                { $group: { _id: "$source", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),

            Log.aggregate([
                { $match: {...query, src_ip: { $ne: null } } },
                { $group: { _id: "$src_ip", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),

            Log.aggregate([
                { $match: {...query, user: { $ne: null } } },
                { $group: { _id: "$user", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),

            Log.aggregate([
                { $match: {...query, event_type: { $ne: null } } },
                { $group: { _id: "$event_type", count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ])
        ]);

        res.json({
            success: true,
            stats: {
                timeline: timeline.map(t => ({
                    time: t._id,
                    count: t.count
                })),
                severity: severityStats.map(s => ({
                    level: s._id,
                    count: s.count
                })),
                sources: topSources.map(s => ({
                    source: s._id,
                    count: s.count
                })),
                topIPs: topIPs.map(ip => ({
                    ip: ip._id,
                    count: ip.count
                })),
                topUsers: topUsers.map(user => ({
                    user: user._id,
                    count: user.count
                })),
                eventTypes: eventTypes.map(type => ({
                    type: type._id,
                    count: type.count
                }))
            }
        });

    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;