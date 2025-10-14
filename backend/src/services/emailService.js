import { Resend } from 'resend';

class EmailService {
    constructor() {
        this.resend = null;
        this.enabled = false;
        this.initialized = false;
    }

    initialize() {
        if (this.initialized) {
            return; // Already initialized
        }
        
        const apiKey = process.env.RESEND_API_KEY;
        
        if (!apiKey || apiKey === 're_your_api_key_here') {
            console.log('📧 Email alerts disabled - RESEND_API_KEY not configured');
            this.initialized = true;
            return;
        }

        try {
            this.resend = new Resend(apiKey);
            this.enabled = true;
            this.initialized = true;
            console.log('📧 Email service initialized with Resend');
        } catch (error) {
            console.error('Failed to initialize Resend:', error.message);
            this.initialized = true;
        }
    }

    async sendAlertEmail(notification) {
        // Lazy initialization - only initialize when first email is sent
        if (!this.initialized) {
            this.initialize();
        }
        
        if (!this.enabled) {
            console.log('📧 Email disabled - skipping notification:', notification._id);
            return { success: false, reason: 'Email service not configured' };
        }

        const from = process.env.ALERT_EMAIL_FROM || 'onboarding@resend.dev';
        const to = process.env.ALERT_EMAIL_TO;

        if (!to) {
            console.error('ALERT_EMAIL_TO not configured');
            return { success: false, reason: 'No recipient configured' };
        }

        try {
            const emailHtml = this.buildAlertEmailHtml(notification);
            const emailText = this.buildAlertEmailText(notification);

            const result = await this.resend.emails.send({
                from: from,
                to: to,
                subject: `🚨 Alert: ${notification.ruleName}`,
                html: emailHtml,
                text: emailText
            });

            const messageId = result?.data?.id || result?.id || 'sent';
            console.log(`📧 Alert email sent successfully:`, messageId);
            return { success: true, messageId };
        } catch (error) {
            console.error('Failed to send email:', error.message);
            return { success: false, error: error.message };
        }
    }

    buildAlertEmailText(notification) {
        return `
🚨 ALERT TRIGGERED

Rule: ${notification.ruleName}
Severity: ${notification.severity}
Tenant: ${notification.tenant}

Message: ${notification.message}

Triggered at: ${new Date(notification.triggeredAt).toLocaleString()}

---
LogDemo Alert System
        `.trim();
    }

    buildAlertEmailHtml(notification) {
        const severityColor = this.getSeverityColor(notification.severity);
        const severityLabel = this.getSeverityLabel(notification.severity);

        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .alert-container {
            background: #ffffff;
            border: 2px solid ${severityColor};
            border-radius: 8px;
            padding: 24px;
            margin: 20px 0;
        }
        .alert-header {
            background: ${severityColor};
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            margin: -24px -24px 20px -24px;
            font-size: 18px;
            font-weight: bold;
        }
        .alert-badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 14px;
            margin-left: 10px;
        }
        .info-row {
            display: flex;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            font-weight: 600;
            color: #6b7280;
            min-width: 120px;
        }
        .info-value {
            color: #111827;
            flex: 1;
        }
        .message-box {
            background: #f9fafb;
            border-left: 4px solid ${severityColor};
            padding: 16px;
            margin: 16px 0;
            border-radius: 4px;
        }
        .footer {
            text-align: center;
            color: #9ca3af;
            font-size: 12px;
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
        }
    </style>
</head>
<body>
    <div class="alert-container">
        <div class="alert-header">
            🚨 Alert Triggered
            <span class="alert-badge">${severityLabel}</span>
        </div>

        <div class="info-row">
            <div class="info-label">Rule Name:</div>
            <div class="info-value"><strong>${notification.ruleName}</strong></div>
        </div>

        <div class="info-row">
            <div class="info-label">Tenant:</div>
            <div class="info-value">${notification.tenant}</div>
        </div>

        <div class="info-row">
            <div class="info-label">Triggered At:</div>
            <div class="info-value">${new Date(notification.triggeredAt).toLocaleString()}</div>
        </div>

        <div class="message-box">
            <div style="font-weight: 600; margin-bottom: 8px;">Message:</div>
            <div>${notification.message}</div>
        </div>

        <div class="footer">
            LogDemo Alert System • Automated Notification
        </div>
    </div>
</body>
</html>
        `.trim();
    }

    getSeverityColor(severity) {
        if (severity === 'critical') return '#dc2626';
        if (severity === 'high') return '#ea580c';
        if (severity === 'medium') return '#ca8a04';
        return '#2563eb';
    }

    getSeverityLabel(severity) {
        return severity.toUpperCase();
    }
}

export default new EmailService();
