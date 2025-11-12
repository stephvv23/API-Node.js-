/**
 * Password Recovery Service
 * Service for password recovery management
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const prisma = require('../lib/prisma');
const { sendPasswordResetEmail } = require('../utils/email.util');

class PasswordRecoveryService {
  /**
   * Request password recovery
   * Generates a token and sends email to the user
   * @param {string} email - User's email
   * @returns {Promise<Object>} Operation result
   */
  async requestPasswordReset(email) {
    try {
      // Verify that the user exists
      const user = await prisma.user.findUnique({
        where: { email },
        select: { email: true, name: true, status: true }
      });

      if (!user) {
        throw new Error('El correo electrónico no está registrado en el sistema');
      }

      // Verify that the user is active
      if (user.status !== 'active') {
        throw new Error('La cuenta no está activa');
      }

      // Generate unique and secure token
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Hash the token for DB storage (additional security)
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      // Set expiration (30 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);

      // Invalidate previous tokens from the same user (optional)
      await prisma.passwordResetToken.updateMany({
        where: { 
          email,
          used: false,
          expiresAt: { gte: new Date() }
        },
        data: { used: true }
      });

      // Save new token in the database
      await prisma.passwordResetToken.create({
        data: {
          email,
          token: hashedToken,
          expiresAt,
          used: false
        }
      });

      // Send email with the original token (not the hash)
      await sendPasswordResetEmail(email, resetToken, user.name);

      return {
        success: true,
        message: 'Se ha enviado un correo con las instrucciones para restablecer tu contraseña'
      };

    } catch (error) {
      console.error('Error en requestPasswordReset:', error);
      throw error;
    }
  }

  /**
   * Verify if a token is valid
   * @param {string} token - Token to verify
   * @returns {Promise<Object>} Token information
   */
  async verifyResetToken(token) {
    try {
      // Hash the received token
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Search for token in the database
      const tokenRecord = await prisma.passwordResetToken.findUnique({
        where: { token: hashedToken },
        select: {
          id: true,
          email: true,
          expiresAt: true,
          used: true
        }
      });

      // Validations
      if (!tokenRecord) {
        throw new Error('Token inválido');
      }

      if (tokenRecord.used) {
        throw new Error('El token ya ha sido utilizado');
      }

      if (new Date() > tokenRecord.expiresAt) {
        throw new Error('El token ha expirado');
      }

      return {
        valid: true,
        email: tokenRecord.email,
        tokenId: tokenRecord.id
      };

    } catch (error) {
      console.error('Error en verifyResetToken:', error);
      throw error;
    }
  }

  /**
   * Reset password using a valid token
   * @param {string} token - Recovery token
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Operation result
   */
  async resetPassword(token, newPassword) {
    try {
      // Verify token
      const tokenData = await this.verifyResetToken(token);

      // Validate password
      if (!newPassword || newPassword.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres');
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Hash the token
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Update password and mark token as used (transaction)
      await prisma.$transaction([
        // Update user password
        prisma.user.update({
          where: { email: tokenData.email },
          data: { password: hashedPassword }
        }),
        // Mark token as used
        prisma.passwordResetToken.update({
          where: { token: hashedToken },
          data: { used: true }
        })
      ]);

      return {
        success: true,
        message: 'Contraseña actualizada exitosamente'
      };

    } catch (error) {
      console.error('Error en resetPassword:', error);
      throw error;
    }
  }

  /**
   * Clean expired tokens (maintenance task)
   * Run periodically with a cron job
   */
  async cleanExpiredTokens() {
    try {
      const result = await prisma.passwordResetToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { used: true }
          ]
        }
      });

      return result;
    } catch (error) {
      console.error('Error en cleanExpiredTokens:', error);
      throw error;
    }
  }
}

module.exports = new PasswordRecoveryService();
