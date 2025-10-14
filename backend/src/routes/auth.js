import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid credentials' 
            });
        }        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role,
                tenant: user.tenant
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({
            success: true, 
            token,
            user: {
                email: user.email,
                role: user.role,
                tenant: user.tenant
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/register', async (req, res) => {
    try {
        const { email, password, role = "viewer", tenant } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'Email already registered'
            });
        }

        let userTenant = tenant;
        if (!userTenant) {
            const emailDomain = email.split('@')[1];
            if (emailDomain && emailDomain !== 'example.com' && emailDomain !== 'gmail.com') {
                userTenant = emailDomain.split('.')[0];
            } else {
                userTenant = process.env.DEFAULT_TENANT || 'default';
            }
        }

        const user = new User({
            email,
            password,
            role,
            tenant: userTenant
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: 'Account created successfully. Please login.',
            user: {
                email: user.email,
                role: user.role,
                tenant: user.tenant
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
