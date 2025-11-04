# Password Recovery Module - Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup & Configuration](#setup--configuration)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Frontend Integration](#frontend-integration)
7. [Email Templates](#email-templates)
8. [Security Features](#security-features)
9. [Error Handling](#error-handling)
10. [Testing Guide](#testing-guide)
11. [Maintenance](#maintenance)
12. [Troubleshooting](#troubleshooting)

---

## Overview

The Password Recovery Module allows users to securely reset their passwords through a token-based email verification system. The module follows industry best practices for security and user experience.

### Features

- ✅ Secure token generation with SHA256 hashing
- ✅ Token expiration (30 minutes)
- ✅ Single-use tokens
- ✅ Email notifications with branded templates
- ✅ Password complexity validation
- ✅ User enumeration prevention
- ✅ Transaction-based password updates
- ✅ Responsive email design

### Flow Diagram

```
User requests reset → Token generated → Email sent → User clicks link
→ Frontend form → Password validated → Token verified → Password updated
```

---

## Architecture

### File Structure

```
src/
├── config/
│   └── email.config.js           # Nodemailer configuration
├── services/
│   └── passwordRecovery.service.js  # Business logic
├── routes/
│   └── modules/
│       └── passwordRecovery/
│           ├── passwordRecovery.controller.js  # Request handlers
│           └── passwordRecovery.routes.js      # Route definitions
└── utils/
    └── email.util.js             # Email sending utility

prisma/
└── schema.prisma                 # Database schema with PasswordResetToken model

docs/
└── README-Password-Recovery-Module.md  # This file
```

### Layer Responsibilities

| Layer | File | Responsibility |
|-------|------|----------------|
| **Routes** | `passwordRecovery.routes.js` | Define HTTP endpoints and methods |
| **Controller** | `passwordRecovery.controller.js` | Validate requests, handle responses |
| **Service** | `passwordRecovery.service.js` | Business logic, token management |
| **Utility** | `email.util.js` | Email sending, template generation |
| **Config** | `email.config.js` | SMTP configuration |

---

## Setup & Configuration

### 1. Environment Variables

Add the following variables to your `.env` file:

```bash
# Email Configuration (for password recovery)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com

# Frontend URL (for reset password link)
FRONTEND_URL=http://localhost:5504

# Server Port
PORT=3000
```

### 2. Gmail Setup (Recommended)

For Gmail accounts:

1. Enable 2-Factor Authentication
2. Generate an App Password:
   - Go to Google Account → Security
   - Select "2-Step Verification"
   - Scroll to "App passwords"
   - Generate password for "Mail"
3. Use the generated password in `EMAIL_PASSWORD`

### 3. Database Migration

Run the Prisma migration to create the `PasswordResetToken` table:

```bash
npx prisma migrate dev --name add_password_reset_token
```

Or use `db push` for development:

```bash
npx prisma db push
```

### 4. Install Dependencies

Ensure these packages are installed:

```bash
npm install nodemailer bcrypt crypto
```

### 5. Frontend Setup

Place the password reset HTML file at:
```
/View/password/reset-password.html
```

---

## Database Schema

### PasswordResetToken Model

```prisma
model PasswordResetToken {
  id        Int      @id @default(autoincrement())
  email     String   @db.VarChar(150)
  token     String   @db.VarChar(255) @unique
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([email])
  @@index([token])
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | Int | Primary key |
| `email` | String | User's email requesting reset |
| `token` | String | SHA256 hashed token (unique) |
| `expiresAt` | DateTime | Token expiration timestamp |
| `used` | Boolean | Whether token has been consumed |
| `createdAt` | DateTime | Token creation timestamp |

### Indexes

- **email**: Fast lookup of user's tokens
- **token**: Fast token validation

---

## API Endpoints

### 1. Request Password Reset

**Endpoint:** `POST /api/password-recovery/request`

**Access:** Public (no authentication required)

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Se ha enviado un correo con las instrucciones para restablecer tu contraseña"
  },
  "message": "Se ha enviado un correo con las instrucciones para restablecer tu contraseña"
}
```

**Error Responses:**

| Status | Condition | Response |
|--------|-----------|----------|
| 400 | Missing email | `{ "success": false, "message": "El email es requerido" }` |
| 400 | Invalid email format | `{ "success": false, "message": "Formato de email inválido" }` |
| 400 | Inactive account | `{ "success": false, "message": "La cuenta no está activa" }` |
| 500 | Server error | `{ "success": false, "message": "Error al procesar la solicitud de recuperación" }` |

**Validations:**
- ✅ Email is required
- ✅ Email format is valid (regex validation)
- ✅ User exists in database
- ✅ User account is active

**Process:**
1. Validates email format
2. Checks if user exists and is active
3. Generates secure 32-byte token
4. Hashes token with SHA256 for storage
5. Sets 30-minute expiration
6. Invalidates old unused tokens
7. Saves token to database
8. Sends email with reset link

---

### 2. Verify Token

**Endpoint:** `POST /api/password-recovery/verify-token`

**Access:** Public

**Purpose:** Optional endpoint for frontend to verify token before showing reset form

**Request Body:**
```json
{
  "token": "abc123def456..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "valid": true
  },
  "message": "Token válido"
}
```

**Error Responses:**

| Status | Condition | Response |
|--------|-----------|----------|
| 400 | Missing token | `{ "success": false, "message": "El token es requerido" }` |
| 400 | Invalid token | `{ "success": false, "message": "Token inválido" }` |
| 400 | Token already used | `{ "success": false, "message": "El token ya ha sido utilizado" }` |
| 400 | Expired token | `{ "success": false, "message": "El token ha expirado" }` |

**Validations:**
- ✅ Token exists in database
- ✅ Token has not been used
- ✅ Token has not expired

---

### 3. Reset Password

**Endpoint:** `POST /api/password-recovery/reset`

**Access:** Public

**Request Body:**
```json
{
  "token": "abc123def456...",
  "newPassword": "NewSecure123",
  "confirmPassword": "NewSecure123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Contraseña actualizada exitosamente"
  },
  "message": "Contraseña actualizada exitosamente"
}
```

**Error Responses:**

| Status | Condition | Response |
|--------|-----------|----------|
| 400 | Missing token | `{ "success": false, "message": "El token es requerido" }` |
| 400 | Missing newPassword | `{ "success": false, "message": "La nueva contraseña es requerida" }` |
| 400 | Missing confirmPassword | `{ "success": false, "message": "La confirmación de contraseña es requerida" }` |
| 400 | Passwords don't match | `{ "success": false, "message": "Las contraseñas no coinciden" }` |
| 400 | Password too short | `{ "success": false, "message": "La contraseña debe tener al menos 8 caracteres" }` |
| 400 | Weak password | `{ "success": false, "message": "La contraseña debe contener al menos una mayúscula, una minúscula y un número" }` |
| 400 | Token errors | Same as verify-token endpoint |

**Password Requirements:**
- ✅ Minimum 8 characters
- ✅ At least one uppercase letter (A-Z)
- ✅ At least one lowercase letter (a-z)
- ✅ At least one number (0-9)

**Validations:**
- ✅ All required fields present
- ✅ Passwords match
- ✅ Password meets length requirement
- ✅ Password meets complexity requirement
- ✅ Token is valid (same checks as verify endpoint)

**Process:**
1. Validates all inputs
2. Verifies token validity
3. Hashes new password with bcrypt (10 rounds)
4. Updates password and marks token as used in a transaction
5. Returns success message

---

## Frontend Integration

### HTML Form Example

```html
<form id="resetPasswordForm">
  <input 
    type="password" 
    id="newPassword" 
    name="newPassword" 
    required
    minlength="8"
    placeholder="Nueva contraseña"
  >
  
  <input 
    type="password" 
    id="confirmPassword" 
    name="confirmPassword" 
    required
    minlength="8"
    placeholder="Confirmar contraseña"
  >
  
  <button type="submit">Restablecer contraseña</button>
</form>

<div id="message"></div>
```

### JavaScript Implementation

```javascript
// Extract token from URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

// Form submission
document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  try {
    const response = await fetch('http://localhost:3000/api/password-recovery/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: token,
        newPassword: newPassword,
        confirmPassword: confirmPassword
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Show success message
      document.getElementById('message').textContent = data.message;
      // Redirect to login after 3 seconds
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 3000);
    } else {
      // Show error message
      document.getElementById('message').textContent = data.message;
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('message').textContent = 'Error de conexión';
  }
});
```

### Required Frontend File Location

```
/View/password/reset-password.html
```

This path is configured in `email.util.js`:
```javascript
const resetUrl = `${cleanBaseUrl}/password/reset-password.html?token=${resetToken}`;
```

---

## Email Templates

### Email Design

The email uses a responsive table-based layout with Funcavida branding:

**Colors:**
- Background: `#F4F2EF` (cream)
- Card: `#ffffff` (white)
- Primary: `#ff9f2a` (orange)
- Footer: `#262525` (dark)

**Structure:**
1. Brand name (FUNCAVIDA)
2. Title (Recuperación de Contraseña)
3. Greeting with user's name
4. Explanation text
5. Orange CTA button
6. Alternative copy/paste link
7. Expiration warning
8. Footer with copyright

### Email Content Variables

| Variable | Source | Example |
|----------|--------|---------|
| `userName` | User.name from database | "Juan Pérez" |
| `resetUrl` | Generated with token | `http://localhost:5504/password/reset-password.html?token=abc123` |
| `year` | Current year | 2025 |

### Customizing Email Template

Edit the HTML in `src/utils/email.util.js`:

```javascript
const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin: 0; padding: 40px 20px; background-color: #F4F2EF;">
    <!-- Your custom template here -->
  </body>
  </html>
`;
```

**Important Notes:**
- Use inline styles (no external CSS)
- Use table-based layout for email client compatibility
- Test in major email clients (Gmail, Outlook, Apple Mail)
- Keep total width under 600px
- Avoid JavaScript (not supported in emails)

---

## Security Features

### 1. Token Security

**Random Generation:**
```javascript
const resetToken = crypto.randomBytes(32).toString('hex');
```
- Uses cryptographically secure random bytes
- 32 bytes = 256 bits of entropy
- Hexadecimal encoding (64 characters)

**Hashing:**
```javascript
const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
```
- SHA256 hashing before database storage
- Original token sent via email (not stored)
- Prevents token exposure if database is compromised

### 2. Password Security

**Bcrypt Hashing:**
```javascript
const hashedPassword = await bcrypt.hash(newPassword, 10);
```
- 10 salt rounds (industry standard)
- Adaptive hashing (slower over time as hardware improves)
- Secure against rainbow table attacks

**Complexity Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Regex: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/`

### 3. Token Expiration

```javascript
const expiresAt = new Date();
expiresAt.setMinutes(expiresAt.getMinutes() + 30);
```
- Tokens expire 30 minutes after creation
- Strict expiration checking
- No grace period

### 4. Single-Use Tokens

```javascript
await prisma.passwordResetToken.update({
  where: { token: hashedToken },
  data: { used: true }
});
```
- Token marked as used after successful reset
- Cannot be reused even if not expired
- Prevents replay attacks

### 5. User Enumeration Prevention

```javascript
if (!user) {
  return {
    success: true,
    message: 'Si el correo existe, recibirás instrucciones...'
  };
}
```
- Same response for existing and non-existing users
- Prevents attackers from discovering valid email addresses
- Security through obscurity

### 6. Old Token Invalidation

```javascript
await prisma.passwordResetToken.updateMany({
  where: { 
    email,
    used: false,
    expiresAt: { gte: new Date() }
  },
  data: { used: true }
});
```
- New token request invalidates previous tokens
- Prevents accumulation of valid tokens
- User can only have one active reset token

### 7. Transaction Integrity

```javascript
await prisma.$transaction([
  prisma.user.update({ /* update password */ }),
  prisma.passwordResetToken.update({ /* mark used */ })
]);
```
- Password update and token marking in single transaction
- All-or-nothing operation
- Database consistency guaranteed

---

## Error Handling

### Controller-Level Errors

All controller methods use try-catch blocks:

```javascript
try {
  // Operation
} catch (error) {
  console.error('Error en [method]:', error);
  return res.error('User-friendly message', statusCode);
}
```

### Service-Level Errors

Service methods throw descriptive errors:

```javascript
if (!tokenRecord) {
  throw new Error('Token inválido');
}
```

### Email Sending Errors

Email failures are handled gracefully:

```javascript
if (!process.env.EMAIL_USER) {
  console.log('📧 [SIMULATED] Email that would be sent:', { to, subject });
  return { success: true, simulated: true };
}
```

**Simulation Mode:**
- Activates if email credentials not configured
- Logs email details to console
- Doesn't crash application
- Useful for development/testing

### Common Error Scenarios

| Error | Cause | Solution |
|-------|-------|----------|
| "El token es requerido" | Missing token in request | Include token in body |
| "Token inválido" | Token not found in DB | Request new reset |
| "El token ha expirado" | Token > 30 minutes old | Request new reset |
| "El token ya ha sido utilizado" | Token already consumed | Request new reset |
| "La cuenta no está activa" | User status is 'inactive' | Contact support |
| "Error al enviar correo" | SMTP connection failed | Check email config |
| "Las contraseñas no coinciden" | Frontend validation error | Ensure fields match |

---

## Testing Guide

### 1. Manual Testing - Happy Path

**Step 1: Request Password Reset**
```bash
curl -X POST http://localhost:3000/api/password-recovery/request \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

Expected: Success response + email sent

**Step 2: Check Email**
- Open email inbox for user@example.com
- Verify email received
- Check reset link format
- Verify token in URL

**Step 3: Verify Token (Optional)**
```bash
curl -X POST http://localhost:3000/api/password-recovery/verify-token \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_TOKEN_HERE"}'
```

Expected: `{"success": true, "data": {"valid": true}}`

**Step 4: Reset Password**
```bash
curl -X POST http://localhost:3000/api/password-recovery/reset \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_TOKEN_HERE",
    "newPassword": "NewPassword123",
    "confirmPassword": "NewPassword123"
  }'
```

Expected: Success message

**Step 5: Verify Login**
- Try logging in with old password (should fail)
- Try logging in with new password (should succeed)

### 2. Edge Case Testing

**Test Expired Token:**
1. Request reset
2. Wait 31 minutes
3. Try to use token
4. Expected: "El token ha expirado"

**Test Used Token:**
1. Request reset
2. Successfully reset password
3. Try to use same token again
4. Expected: "El token ya ha sido utilizado"

**Test Invalid Token:**
```bash
curl -X POST http://localhost:3000/api/password-recovery/reset \
  -H "Content-Type: application/json" \
  -d '{
    "token": "invalid-fake-token",
    "newPassword": "Test123",
    "confirmPassword": "Test123"
  }'
```

Expected: "Token inválido"

**Test Weak Password:**
```bash
curl -X POST http://localhost:3000/api/password-recovery/reset \
  -H "Content-Type: application/json" \
  -d '{
    "token": "VALID_TOKEN",
    "newPassword": "weak",
    "confirmPassword": "weak"
  }'
```

Expected: Password validation errors

**Test Non-Existent Email:**
```bash
curl -X POST http://localhost:3000/api/password-recovery/request \
  -H "Content-Type: application/json" \
  -d '{"email": "nonexistent@example.com"}'
```

Expected: Success response (security - no enumeration)

**Test Inactive User:**
1. Set user status to 'inactive' in database
2. Request password reset
3. Expected: "La cuenta no está activa"

### 3. Database Verification

**Check Token Created:**
```sql
SELECT * FROM PasswordResetToken 
WHERE email = 'user@example.com' 
ORDER BY createdAt DESC 
LIMIT 1;
```

**Check Token Expiration:**
```sql
SELECT 
  email,
  token,
  expiresAt,
  used,
  (expiresAt > NOW()) as is_valid,
  TIMESTAMPDIFF(MINUTE, NOW(), expiresAt) as minutes_remaining
FROM PasswordResetToken
WHERE email = 'user@example.com';
```

**Check Password Updated:**
```sql
SELECT email, password, status 
FROM User 
WHERE email = 'user@example.com';
```

Note: Password should be bcrypt hash starting with `$2b$10$`

### 4. Email Testing

**Test Email Rendering:**
1. Send test email to yourself
2. Check rendering in:
   - Gmail (web, mobile)
   - Outlook (web, desktop)
   - Apple Mail (macOS, iOS)
3. Verify all elements display correctly
4. Test link clickability
5. Test responsive design on mobile

**Test Email Content:**
- [ ] User name appears correctly
- [ ] Reset URL is clickable
- [ ] Token is in URL
- [ ] Expiration notice is visible
- [ ] Branding/colors are correct
- [ ] Footer information is present

---

## Maintenance

### 1. Token Cleanup

Expired and used tokens should be periodically removed from the database.

**Manual Cleanup:**
```javascript
const passwordRecoveryService = require('./src/services/passwordRecovery.service');
await passwordRecoveryService.cleanExpiredTokens();
```

**Automated Cleanup (Cron Job):**

Install node-cron:
```bash
npm install node-cron
```

Create `src/jobs/cleanup.js`:
```javascript
const cron = require('node-cron');
const passwordRecoveryService = require('../services/passwordRecovery.service');

// Run every day at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('🧹 Running token cleanup...');
  await passwordRecoveryService.cleanExpiredTokens();
});
```

Add to `src/server.js`:
```javascript
require('./jobs/cleanup');
```

### 2. Monitoring

**Metrics to Track:**
- Number of password reset requests per day
- Success rate of password resets
- Average time between request and reset
- Number of expired tokens
- Email sending failures

**Logging:**
Add monitoring to service methods:
```javascript
console.log('[PASSWORD_RECOVERY] Reset requested for:', email);
console.log('[PASSWORD_RECOVERY] Token generated, expires at:', expiresAt);
console.log('[PASSWORD_RECOVERY] Password reset successful for:', email);
```

### 3. Security Audits

**Monthly Checklist:**
- [ ] Review password complexity requirements
- [ ] Check token expiration time (30 min appropriate?)
- [ ] Verify email template has no security issues
- [ ] Review error messages for information leakage
- [ ] Check for failed reset attempts (potential attacks)
- [ ] Verify bcrypt rounds still appropriate (10 rounds)
- [ ] Review token generation randomness

### 4. Database Maintenance

**Indexes:**
Verify indexes exist and are used:
```sql
SHOW INDEX FROM PasswordResetToken;
```

**Table Size Monitoring:**
```sql
SELECT 
  COUNT(*) as total_tokens,
  SUM(used = 1) as used_tokens,
  SUM(used = 0 AND expiresAt < NOW()) as expired_tokens,
  SUM(used = 0 AND expiresAt >= NOW()) as valid_tokens
FROM PasswordResetToken;
```

**Cleanup Old Records:**
```sql
-- Manual cleanup (can also use cleanExpiredTokens method)
DELETE FROM PasswordResetToken 
WHERE used = 1 OR expiresAt < NOW();
```

---

## Troubleshooting

### Issue: Emails Not Sending

**Symptoms:**
- Request succeeds but no email received
- Console shows simulation message

**Diagnosis:**
```bash
# Check email configuration
echo $EMAIL_USER
echo $EMAIL_HOST
```

**Solutions:**
1. Verify `EMAIL_USER` and `EMAIL_PASSWORD` in `.env`
2. For Gmail: Use App Password, not regular password
3. Check SMTP server and port
4. Verify email service is not blocking Node.js
5. Check spam folder
6. Review console logs for specific errors

**Test SMTP Connection:**
```javascript
const { transporter } = require('./src/config/email.config');
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ SMTP Error:', error);
  } else {
    console.log('✅ SMTP Ready');
  }
});
```

---

### Issue: Token Not Found

**Symptoms:**
- "Token inválido" error
- Token exists in database

**Diagnosis:**
```javascript
// Compare tokens
console.log('Token from URL:', token);
console.log('Hashed:', crypto.createHash('sha256').update(token).digest('hex'));
```

**Solutions:**
1. Verify token is complete in URL (no truncation)
2. Check for URL encoding issues
3. Verify token wasn't modified
4. Check database for token existence:
```sql
SELECT * FROM PasswordResetToken WHERE token = 'HASHED_TOKEN';
```

---

### Issue: Token Expired Immediately

**Symptoms:**
- Token shows as expired right after creation

**Diagnosis:**
```javascript
const expiresAt = new Date();
expiresAt.setMinutes(expiresAt.getMinutes() + 30);
console.log('Current time:', new Date());
console.log('Expires at:', expiresAt);
```

**Solutions:**
1. Check server timezone
2. Verify database timezone
3. Check system clock synchronization
4. Verify expiration logic in code

---

### Issue: Password Not Updating

**Symptoms:**
- Success message received
- Can still login with old password

**Diagnosis:**
```sql
SELECT email, password, updated_at 
FROM User 
WHERE email = 'user@example.com';
```

**Solutions:**
1. Check transaction completed successfully
2. Verify bcrypt hashing is working
3. Check User table has `password` column
4. Verify email matches exactly (case-sensitive)
5. Check for database constraints

---

### Issue: Frontend Can't Connect

**Symptoms:**
- CORS errors in browser console
- Network errors
- "Failed to fetch"

**Solutions:**
1. Verify backend is running on correct port
2. Check CORS configuration in server
3. Verify frontend URL matches request
4. Check browser console for specific errors
5. Test endpoint with Postman/cURL first

**Enable CORS (if needed):**
```javascript
// In server.js
const cors = require('cors');
app.use(cors());
```

---

### Issue: Password Validation Failing

**Symptoms:**
- "La contraseña debe contener..." error
- Password meets visual requirements

**Diagnosis:**
```javascript
const password = "Test123";
const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
console.log('Password:', password);
console.log('Has lowercase:', /(?=.*[a-z])/.test(password));
console.log('Has uppercase:', /(?=.*[A-Z])/.test(password));
console.log('Has number:', /(?=.*\d)/.test(password));
console.log('Passes:', regex.test(password));
```

**Solutions:**
1. Check for hidden characters (copy/paste issues)
2. Verify regex pattern is correct
3. Test password against regex separately
4. Check frontend isn't modifying password

---

### Debug Mode

Enable detailed logging in controller:

```javascript
// In passwordRecovery.controller.js
async resetPassword(req, res) {
  console.log('📥 Raw body:', req.body);
  console.log('📥 Token:', req.body.token);
  console.log('📥 New password length:', req.body.newPassword?.length);
  console.log('📥 Passwords match:', req.body.newPassword === req.body.confirmPassword);
  // ... rest of method
}
```

---

## Additional Resources

### Related Documentation
- [README-Patron-Response-Methods.md](./README-Patron-Response-Methods.md) - Response method patterns
- [README-Patron-SecurityLogService.md](./README-Patron-SecurityLogService.md) - Security logging
- [README-Patron-EntityValidators.md](./README-Patron-EntityValidators.md) - Validation patterns

### External Resources
- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Bcrypt Documentation](https://www.npmjs.com/package/bcrypt)
- [Prisma Documentation](https://www.prisma.io/docs)
- [OWASP Password Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

### Support
For issues or questions:
1. Check this documentation
2. Review console logs
3. Test with Postman/cURL
4. Check database state
5. Contact development team

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Nov 2025 | Initial implementation |

---

**Last Updated:** November 4, 2025
