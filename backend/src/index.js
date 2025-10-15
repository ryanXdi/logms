import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import ingestRoutes from './routes/ingest.js';
import searchRoutes from './routes/search.js';
import authRoutes from './routes/auth.js';
import alertRoutes from './routes/alerts.js';
import User from './models/User.js';
import { authenticate, enforceTenant } from './middleware/auth.js';
import SyslogServer from './services/syslogServer.js';
import alertEngine from './services/alertEngine.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || process.env.BACKEND_PORT || 4000;

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000,                // 10000 requests per 15 minutes per IP
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,  
  legacyHeaders: false,     
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,                   // 50 requests per 15 minutes
  message: {
    success: false,
    error: 'Too many login attempts, please try again after 15 minutes.'
  },
  skipSuccessfulRequests: true, 
});

const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minute
  max: 3000,                 // 3000 searches per minute
  message: {
    success: false,
    error: 'Too many search requests, please slow down.'
  },
});

const ingestLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minute
  max: 1000,                 // 1000 log submissions per minute
  message: {
    success: false,
    error: 'Too many logs being ingested, please slow down.'
  },
});

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/', generalLimiter);

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/ingest', ingestLimiter, authenticate, enforceTenant, ingestRoutes);
app.use('/api/search', searchLimiter, authenticate, enforceTenant, searchRoutes);
app.use('/api/alerts', authenticate, enforceTenant, alertRoutes);

async function createAdminUser() {
    try {
        const adminEmail = process.env.APP_ADMIN_EMAIL || 'admin@example.com';

        const existingAdmin = await User.findOne({ email: adminEmail });
        if (existingAdmin) {
            return console.log('Admin user exists');
        }

        const admin =  new User({
            email: adminEmail,
            password: process.env.APP_ADMIN_PASSWORD || 'admin123',
            role: 'admin',
            tenant: process.env.DEFAULT_TENANT || 'default'
        });

        await admin.save();
        console.log('Admin user created:', adminEmail);
    } catch (error) {
        console.error('Admin user creation failed', error);
    }
}

app.get('/app/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'logms-demo'
    });
});

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
    const frontendBuildPath = path.join(__dirname, '../../frontend/build');
    app.use(express.static(frontendBuildPath));
    
    // All non-API routes serve the React app
    app.get('*', (req, res) => {
        res.sendFile(path.join(frontendBuildPath, 'index.html'));
    });
} else {
    // Development: API-only mode
    app.use((req, res) => {
        res.status(404).json({ error: 'Not Found' });
    });
}

// MongoDB Connection
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/logms-demo';
        console.log('Connecting to MongoDB...');

        await mongoose.connect(mongoUri);
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

const startServer = async () => {
    await connectDB();
    await createAdminUser();
    
    // Start HTTP API server
    app.listen(PORT, () => {
        console.log('Backend running on port', PORT);
        console.log('Health check endpoint: http://localhost:' + PORT + '/app/health');
    });

    // Start Syslog server
    const syslogServer = new SyslogServer({
        udpPort: process.env.SYSLOG_UDP_PORT || 5140, 
        tcpPort: process.env.SYSLOG_TCP_PORT || 5140,
        host: process.env.SYSLOG_HOST || '0.0.0.0',
        tenant: process.env.DEFAULT_TENANT || 'default'
    });
    
    syslogServer.start();
    
    // Start Alert Engine
    alertEngine.start();
    console.log('Alert engine started');
};

startServer();
