/**
 * Password Recovery Service
 * Servicio para manejo de recuperación de contraseñas
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const prisma = require('../lib/prisma');
const { sendPasswordResetEmail } = require('../utils/email.util');

class PasswordRecoveryService {
  /**
   * Solicitar recuperación de contraseña
   * Genera un token y envía email al usuario
   * @param {string} email - Email del usuario
   * @returns {Promise<Object>} Resultado de la operación
   */
  async requestPasswordReset(email) {
    try {
      // Verify that the user exists
      const user = await prisma.user.findUnique({
        where: { email },
        select: { email: true, name: true, status: true }
      });

      if (!user) {
        // For security, don't reveal that the email doesn't exist
        return {
          success: true,
          message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña'
        };
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
   * Verificar si un token es válido
   * @param {string} token - Token a verificar
   * @returns {Promise<Object>} Información del token
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
   * Restablecer contraseña usando un token válido
   * @param {string} token - Token de recuperación
   * @param {string} newPassword - Nueva contraseña
   * @returns {Promise<Object>} Resultado de la operación
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

      console.log(`🧹 Tokens limpiados: ${result.count}`);
      return result;
    } catch (error) {
      console.error('Error en cleanExpiredTokens:', error);
      throw error;
    }
  }
}

module.exports = new PasswordRecoveryService();
