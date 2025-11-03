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
      // Verificar que el usuario existe
      const user = await prisma.user.findUnique({
        where: { email },
        select: { email: true, name: true, status: true }
      });

      if (!user) {
        // Por seguridad, no revelar que el email no existe
        return {
          success: true,
          message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña'
        };
      }

      // Verificar que el usuario está activo
      if (user.status !== 'active') {
        throw new Error('La cuenta no está activa');
      }

      // Generar token único y seguro
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Hash del token para almacenar en BD (seguridad adicional)
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      // Establecer expiración (30 minutos desde ahora)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);

      // Invalidar tokens previos del mismo usuario (opcional)
      await prisma.passwordResetToken.updateMany({
        where: { 
          email,
          used: false,
          expiresAt: { gte: new Date() }
        },
        data: { used: true }
      });

      // Guardar nuevo token en la base de datos
      await prisma.passwordResetToken.create({
        data: {
          email,
          token: hashedToken,
          expiresAt,
          used: false
        }
      });

      // Enviar email con el token original (no el hash)
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
      // Hash del token recibido
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Buscar token en la base de datos
      const tokenRecord = await prisma.passwordResetToken.findUnique({
        where: { token: hashedToken },
        select: {
          id: true,
          email: true,
          expiresAt: true,
          used: true
        }
      });

      // Validaciones
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
      // Verificar token
      const tokenData = await this.verifyResetToken(token);

      // Validar contraseña
      if (!newPassword || newPassword.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres');
      }

      // Hash de la nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Hash del token
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Actualizar contraseña y marcar token como usado (transacción)
      await prisma.$transaction([
        // Actualizar contraseña del usuario
        prisma.user.update({
          where: { email: tokenData.email },
          data: { password: hashedPassword }
        }),
        // Marcar token como usado
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
   * Limpiar tokens expirados (tarea de mantenimiento)
   * Ejecutar periódicamente con un cron job
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
