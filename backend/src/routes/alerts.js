import express from 'express';
import AlertRule from '../models/AlertRule.js';
import AlertNotification from '../models/AlertNotification.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Note: authenticate and enforceTenant are applied in index.js

// Get all alert rules (viewers can view)
router.get('/rules', async (req, res) => {
    try {
        // Use req.tenant set by enforceTenant middleware (supports admin tenant switching)
        const tenant = req.tenant || req.user.tenant;
        
        const rules = await AlertRule.find({ tenant })
            .sort({ created_at: -1 });
        
        res.json({
            success: true,
            rules
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Create a new alert rule (admin only)
router.post('/rules', requireAdmin, async (req, res) => {
    try {
        // Use req.tenant set by enforceTenant middleware (supports admin tenant switching)
        const tenant = req.tenant || req.user.tenant;
        
        const rule = new AlertRule({
            ...req.body,
            tenant,
            createdBy: req.user.email
        });
        
        await rule.save();
        
        res.status(201).json({
            success: true,
            rule
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get a specific rule
router.get('/rules/:id', async (req, res) => {
    try {
        const rule = await AlertRule.findById(req.params.id);
        
        if (!rule) {
            return res.status(404).json({
                success: false,
                error: 'Rule not found'
            });
        }
        
        res.json({
            success: true,
            rule
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Update a rule (admin only)
router.patch('/rules/:id', requireAdmin, async (req, res) => {
    try {
        const rule = await AlertRule.findById(req.params.id);
        
        if (!rule) {
            return res.status(404).json({
                success: false,
                error: 'Rule not found'
            });
        }
        
        Object.assign(rule, req.body);
        await rule.save();
        
        res.json({
            success: true,
            rule
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Toggle rule enabled/disabled (admin only)
router.patch('/rules/:id/toggle', requireAdmin, async (req, res) => {
    try {
        const rule = await AlertRule.findById(req.params.id);
        
        if (!rule) {
            return res.status(404).json({
                success: false,
                error: 'Rule not found'
            });
        }
        
        rule.enabled = !rule.enabled;
        await rule.save();
        
        res.json({
            success: true,
            rule
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Delete a rule (admin only)
router.delete('/rules/:id', requireAdmin, async (req, res) => {
    try {
        const rule = await AlertRule.findByIdAndDelete(req.params.id);
        
        if (!rule) {
            return res.status(404).json({
                success: false,
                error: 'Rule not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Rule deleted'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/notifications', async (req, res) => {
    try {
        // Use req.tenant set by enforceTenant middleware (supports admin tenant switching)
        const tenant = req.tenant || req.user.tenant;
        const { status, limit = 50 } = req.query;
        
        const query = { tenant };
        if (status) query.status = status;
        
        const notifications = await AlertNotification.find(query)
            .sort({ triggered_at: -1 })
            .limit(parseInt(limit))
            .populate('ruleId', 'name description');
        
        res.json({
            success: true,
            notifications
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.patch('/notifications/:id/acknowledge', async (req, res) => {
    try {
        const notification = await AlertNotification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found'
            });
        }

        notification.status = 'acknowledged';
        await notification.save();
        
        res.json({
            success: true,
            notification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Resolve a notification
router.patch('/notifications/:id/resolve', async (req, res) => {
    try {
        const notification = await AlertNotification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found'
            });
        }

        notification.status = 'resolved';
        await notification.save();
        
        res.json({
            success: true,
            notification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get alert statistics
router.get('/stats', async (req, res) => {
    try {
        // Use req.tenant set by enforceTenant middleware (supports admin tenant switching)
        const tenant = req.tenant || req.user.tenant;
        const { timeRange = '24h' } = req.query;
        
        // Parse time range
        let hoursBack = 24;
        if (timeRange.endsWith('h')) {
            hoursBack = parseInt(timeRange);
        } else if (timeRange.endsWith('d')) {
            hoursBack = parseInt(timeRange) * 24;
        }
        
        const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
        
        const [
            activeRules,
            statusCounts,
            topRules,
            recentNotifications
        ] = await Promise.all([
            // Count active rules
            AlertRule.countDocuments({ tenant, enabled: true }),
            
            // Count notifications by status
            AlertNotification.aggregate([
                { 
                    $match: { 
                        tenant,
                        triggered_at: { $gte: startTime }
                    } 
                },
                { 
                    $group: { 
                        _id: '$status', 
                        count: { $sum: 1 } 
                    } 
                }
            ]),
            
            // Top triggering rules
            AlertNotification.aggregate([
                { 
                    $match: { 
                        tenant,
                        triggered_at: { $gte: startTime }
                    } 
                },
                { 
                    $group: { 
                        _id: '$ruleId',
                        alertName: { $first: '$ruleName' },
                        count: { $sum: 1 } 
                    } 
                },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]),
            
            // Recent notifications
            AlertNotification.find({ tenant })
                .sort({ triggered_at: -1 })
                .limit(10)
                .select('ruleName severity status triggered_at')
        ]);
        
        // Format status counts
        const statusCountsMap = {};
        statusCounts.forEach(item => {
            statusCountsMap[item._id] = item.count;
        });
        
        res.json({
            success: true,
            stats: {
                activeRules,
                statusCounts: statusCountsMap,
                topRules,
                recentNotifications
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;