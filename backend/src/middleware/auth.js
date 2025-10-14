import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if(!token) {
            return res.status(401).json({error: 'Authentication required'});
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.userId);

        if(!user) {
            return res.status(401).json({ 
                success: false, 
                error: 'User not found' 
            });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({error: 'Invalid token'});
    }
};

export const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

export const enforceTenant = (req, res, next) => {
    const requestedTenant = req.headers['x-tenant-id'] || 'default';

    if (req.user.role === 'admin') {
        req.tenant = requestedTenant;
        return next();
    }

    if (req.user.tenant !== requestedTenant) {
        return res.status(403).json({ error: 'Tenant access denied' });
    }

    req.tenant = req.user.tenant;
    next();
};