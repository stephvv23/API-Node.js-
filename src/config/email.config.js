/**
 * Email Configuration
 * Nodemailer configuration for sending emails
 * 
 * Required environment variables:
 * - EMAIL_HOST: SMTP server (e.g., smtp.gmail.com)
 * - EMAIL_PORT: SMTP port (e.g., 587 for TLS, 465 for SSL)
 * - EMAIL_USER: Sender user/email
 * - EMAIL_PASSWORD: Password or app password
 * - EMAIL_FROM: Email that will appear as sender
 */

const nodemailer = require('nodemailer');

// Nodemailer transporter configuration
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true' || false, // true for SSL (port 465)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);


module.exports = {
  transporter,
  emailFrom: process.env.EMAIL_FROM || process.env.EMAIL_USER,
};
