import express from 'express';
import multer from 'multer';
import Log from '../models/Log.js';
import normalizer from '../services/normalizer.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.use(authenticate);

router.post('/', async (req, res) => {
    try {
        const tenant = req.tenant || req.user.tenant || 'default';
        const events = Array.isArray(req.body) ? req.body : [req.body];
        const normalized = events.map(event => normalizer.normalizeEvent(event, tenant, 'http'));
        const result = await Log.insertMany(normalized);
        console.log(`Ingested ${result.length} logs for tenant: ${tenant}`);
        console.log('Sample log:', result[0]);
        res.status(200).json({
            success: true,
            count: normalized.length,
            message: `Ingested ${normalized.length} log(s)`
        });
    } catch (error) {
        console.error('Ingest error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/syslog', async (req, res) => {
    try {
        const tenant = req.tenant || req.user.tenant || 'default';
        const logs = Array.isArray(req.body) ? req.body : [req.body];
        const normalized = logs.map(log => normalizer.normalizeSyslog(log, tenant));
        await Log.insertMany(normalized);
        res.status(200).json({
            success: true,
            count: normalized.length,
            message: `Ingested ${normalized.length} syslog(s)`
        });
    } catch (error) {
        console.error('Syslog ingest error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/text', async (req, res) => {
    try {
        const tenant = req.tenant || req.user.tenant || 'default';
        const source = req.headers['x-source'] || 'text';
        const logs = Array.isArray(req.body) ? req.body : [req.body];
        const normalized = logs.map(log => {
            let logStr;
            if (typeof log === 'string') {
                logStr = log;
            } else if (typeof log === 'object') {
                logStr = log.message || JSON.stringify(log);
            } else {
                logStr = String(log);
            }
            return normalizer.normalizeString(logStr, tenant, source);
        });
        await Log.insertMany(normalized);
        res.status(200).json({
            success: true,
            count: normalized.length,
            message: `Ingested ${normalized.length} text log(s)`
        });
    } catch (error) {
        console.error('Text ingest error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/file', upload.single('logfile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }
        const tenant = req.tenant || req.user.tenant || 'default';
        const source = req.headers['x-source'] || 'file-upload';
        const fileContent = req.file.buffer.toString('utf8');
        let logs = [];
        const filename = req.file.originalname.toLowerCase();
        if (filename.endsWith('.json')) {
            const parsed = JSON.parse(fileContent);
            logs = Array.isArray(parsed) ? parsed : [parsed];
        } else if (filename.endsWith('.jsonl') || filename.endsWith('.ndjson')) {
            logs = fileContent.split('\n')
                .filter(line => line.trim())
                .map(line => JSON.parse(line));
        } else {
            logs = fileContent.split('\n')
                .filter(line => line.trim())
                .map(line => ({ message: line }));
        }
        const normalized = logs.map(log => normalizer.normalizeEvent(log, tenant, source));
        await Log.insertMany(normalized);
        console.log(`Ingested ${normalized.length} logs from file: ${req.file.originalname}`);
        res.status(200).json({
            success: true,
            count: normalized.length,
            filename: req.file.originalname,
            message: `Ingested ${normalized.length} log(s) from file`
        });
    } catch (error) {
        console.error('File ingest error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/aws', async (req, res) => {
    try {
        const tenant = req.tenant || req.user.tenant || 'default';
        let events = [];
        if (req.body.Records && Array.isArray(req.body.Records)) {
            events = req.body.Records;
        } else if (Array.isArray(req.body)) {
            events = req.body;
        } else {
            events = [req.body];
        }
        const normalized = events.map(event => normalizer.normalizeAWSCloudTrail(event, tenant));
        await Log.insertMany(normalized);
        console.log(`AWS CloudTrail: Ingested ${normalized.length} events`);
        res.status(200).json({
            success: true,
            count: normalized.length,
            source: 'aws-cloudtrail',
            message: `Ingested ${normalized.length} CloudTrail event(s)`
        });
    } catch (error) {
        console.error('AWS CloudTrail ingest error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;