const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Configure email transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    this.fromEmail = process.env.SMTP_FROM || 'noreply@atlasnetwork.com';
    this.fromName = process.env.SMTP_FROM_NAME || 'Atlas Network';
  }

  /**
   * Send a generic email
   */
  async sendEmail({ to, subject, html, text }) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('[Email Service] SMTP not configured, skipping email to:', to);
      return { success: false, message: 'SMTP not configured' };
    }

    try {
      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to,
        subject,
        html,
        text: text || this.htmlToText(html)
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('[Email Service] Email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('[Email Service] Failed to send email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(user, referralLink) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #fbbf24 0%, #10b981 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border: 1px solid #e5e7eb;
              border-top: none;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              background: #fbbf24;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              margin-top: 30px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Welcome to Atlas Network!</h1>
          </div>
          <div class="content">
            <p>Hi ${user.username},</p>
            <p>Welcome to Atlas Network! Your account has been successfully created and approved.</p>
            <p>You can now start building your network and earning commissions. Share your referral link with others:</p>
            <p style="background: white; padding: 15px; border-radius: 6px; word-break: break-all; border: 1px solid #e5e7eb;">
              <strong>${referralLink}</strong>
            </p>
            <p>Get started by:</p>
            <ul>
              <li>Exploring your dashboard</li>
              <li>Sharing your referral link</li>
              <li>Tracking your earnings</li>
              <li>Building your network</li>
            </ul>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>Best regards,<br>The Atlas Network Team</p>
          </div>
          <div class="footer">
            <p>© 2024 Atlas Network. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: 'Welcome to Atlas Network! 🎉',
      html
    });
  }

  /**
   * Send commission earned notification
   */
  async sendCommissionEmail(user, amount, fromUser, type) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border: 1px solid #e5e7eb;
              border-top: none;
              border-radius: 0 0 8px 8px;
            }
            .amount {
              font-size: 32px;
              font-weight: bold;
              color: #10b981;
              text-align: center;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              background: #10b981;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              margin-top: 30px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>💰 You Earned a Commission!</h1>
          </div>
          <div class="content">
            <p>Hi ${user.username},</p>
            <p>Great news! You've just earned a commission.</p>
            <div class="amount">+$${amount.toFixed(2)} USDT</div>
            <p><strong>Type:</strong> ${type}</p>
            ${fromUser ? `<p><strong>From:</strong> ${fromUser}</p>` : ''}
            <p>Keep up the great work building your network!</p>
            <p style="text-align: center;">
              <a href="${process.env.APP_URL || 'http://localhost:3000'}/earnings" class="button">View Earnings</a>
            </p>
            <p>Best regards,<br>The Atlas Network Team</p>
          </div>
          <div class="footer">
            <p>© 2024 Atlas Network. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: `💰 You earned $${amount.toFixed(2)} USDT!`,
      html
    });
  }

  /**
   * Send milestone achievement notification
   */
  async sendMilestoneEmail(user, milestone) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border: 1px solid #e5e7eb;
              border-top: none;
              border-radius: 0 0 8px 8px;
            }
            .milestone {
              background: white;
              border: 2px solid #fbbf24;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              text-align: center;
            }
            .button {
              display: inline-block;
              background: #fbbf24;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              margin-top: 30px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏆 Milestone Achieved!</h1>
          </div>
          <div class="content">
            <p>Hi ${user.username},</p>
            <p>Congratulations! You've reached an important milestone in your journey.</p>
            <div class="milestone">
              <h2 style="margin: 0; color: #fbbf24;">${milestone.title}</h2>
              <p style="margin: 10px 0 0 0;">${milestone.description}</p>
            </div>
            <p>Keep pushing forward and reaching new heights!</p>
            <p style="text-align: center;">
              <a href="${process.env.APP_URL || 'http://localhost:3000'}/student/achievements" class="button">View Achievements</a>
            </p>
            <p>Best regards,<br>The Atlas Network Team</p>
          </div>
          <div class="footer">
            <p>© 2024 Atlas Network. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: `🏆 Milestone Achieved: ${milestone.title}`,
      html
    });
  }

  /**
   * Send security alert email
   */
  async sendSecurityAlertEmail(user, eventType, details) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border: 1px solid #e5e7eb;
              border-top: none;
              border-radius: 0 0 8px 8px;
            }
            .alert {
              background: #fef2f2;
              border-left: 4px solid #ef4444;
              padding: 15px;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              background: #ef4444;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              margin-top: 30px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔒 Security Alert</h1>
          </div>
          <div class="content">
            <p>Hi ${user.username},</p>
            <p>We detected a security event on your account that requires your attention.</p>
            <div class="alert">
              <strong>Event Type:</strong> ${eventType}<br>
              <strong>Details:</strong> ${details}<br>
              <strong>Time:</strong> ${new Date().toLocaleString()}
            </div>
            <p>If this was you, no action is needed. If you don't recognize this activity, please secure your account immediately.</p>
            <p style="text-align: center;">
              <a href="${process.env.APP_URL || 'http://localhost:3000'}/student/security" class="button">Review Security</a>
            </p>
            <p>Best regards,<br>The Atlas Network Team</p>
          </div>
          <div class="footer">
            <p>© 2024 Atlas Network. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: '🔒 Security Alert - Atlas Network',
      html
    });
  }

  /**
   * Send withdrawal confirmation email
   */
  async sendWithdrawalEmail(user, amount, status, walletAddress) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border: 1px solid #e5e7eb;
              border-top: none;
              border-radius: 0 0 8px 8px;
            }
            .details {
              background: white;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
            }
            .amount {
              font-size: 24px;
              font-weight: bold;
              color: #3b82f6;
            }
            .button {
              display: inline-block;
              background: #3b82f6;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              margin-top: 30px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Withdrawal ${status === 'pending' ? 'Requested' : 'Update'}</h1>
          </div>
          <div class="content">
            <p>Hi ${user.username},</p>
            <p>Your withdrawal request has been ${status}.</p>
            <div class="details">
              <p><strong>Amount:</strong> <span class="amount">$${amount.toFixed(2)} USDT</span></p>
              <p><strong>Status:</strong> ${status.toUpperCase()}</p>
              <p><strong>Wallet:</strong> ${walletAddress}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            </div>
            ${status === 'pending' ? '<p>Your withdrawal will be processed within 24-48 hours.</p>' : ''}
            ${status === 'completed' ? '<p>The funds have been sent to your wallet.</p>' : ''}
            ${status === 'rejected' ? '<p>If you have questions, please contact support.</p>' : ''}
            <p style="text-align: center;">
              <a href="${process.env.APP_URL || 'http://localhost:3000'}/profile" class="button">View Withdrawals</a>
            </p>
            <p>Best regards,<br>The Atlas Network Team</p>
          </div>
          <div class="footer">
            <p>© 2024 Atlas Network. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: `Withdrawal ${status === 'pending' ? 'Requested' : 'Update'} - $${amount.toFixed(2)} USDT`,
      html
    });
  }

  /**
   * Send new referral notification
   */
  async sendNewReferralEmail(user, newUserEmail) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border: 1px solid #e5e7eb;
              border-top: none;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              background: #10b981;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              margin-top: 30px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 New Referral!</h1>
          </div>
          <div class="content">
            <p>Hi ${user.username},</p>
            <p>Congratulations! Someone just joined your network using your referral link.</p>
            <p><strong>New member:</strong> ${newUserEmail}</p>
            <p>Your network is growing! Keep sharing your referral link to earn more commissions.</p>
            <p style="text-align: center;">
              <a href="${process.env.APP_URL || 'http://localhost:3000'}/network" class="button">View Network</a>
            </p>
            <p>Best regards,<br>The Atlas Network Team</p>
          </div>
          <div class="footer">
            <p>© 2024 Atlas Network. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: '🎉 New member joined your network!',
      html
    });
  }

  /**
   * Convert HTML to plain text (simple version)
   */
  htmlToText(html) {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

module.exports = new EmailService();
