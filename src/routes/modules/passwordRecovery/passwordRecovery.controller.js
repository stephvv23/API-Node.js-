/**
 * Password Recovery Controller
 * Controlador para endpoints de recuperación de contraseña
 */

const passwordRecoveryService = require('../../../services/passwordRecovery.service');

class PasswordRecoveryController {
  /**
   * POST /password-recovery/request
   * Solicitar recuperación de contraseña
   */
  async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;

      // Basic validation
      if (!email) {
        return res.error('El email es requerido', 400);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.error('Formato de email inválido', 400);
      }

      const result = await passwordRecoveryService.requestPasswordReset(email.toLowerCase().trim());
      
      return res.success(result, result.message);

    } catch (error) {
      console.error('Error en requestPasswordReset:', error);
      
      // Handle user not found as Bad Request
      if (error.message.includes('no está registrado en el sistema')) {
        return res.error(error.message, 400);
      }
      
      // Handle inactive account as Bad Request
      if (error.message.includes('No se puede recuperar la contraseña')) {
        return res.error(error.message, 400);
      }
      
      return res.error('Error al procesar la solicitud de recuperación', 500);
    }
  }

  /**
   * POST /password-recovery/verify-token
   * Verify if a token is valid (optional, for UX)
   */
  async verifyToken(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.error('El token es requerido', 400);
      }

      const result = await passwordRecoveryService.verifyResetToken(token);
      
      return res.success({ valid: result.valid }, 'Token válido');

    } catch (error) {
      console.error('Error en verifyToken:', error);
      return res.error(error.message || 'Token inválido o expirado', 400);
    }
  }

  /**
   * POST /password-recovery/reset
   * Reset password with token
   */
  async resetPassword(req, res) {
    try {
      const { token, newPassword, confirmPassword } = req.body;

      // Enhanced validations
      if (!token) {
        return res.error('El token es requerido', 400);
      }
      if (!newPassword) {
        return res.error('La nueva contraseña es requerida', 400);
      }
      if (!confirmPassword) {
        return res.error('La confirmación de contraseña es requerida', 400);
      }

      if (newPassword !== confirmPassword) {
        return res.error('Las contraseñas no coinciden', 400);
      }

      if (newPassword.length < 8) {
        return res.error('La contraseña debe tener al menos 8 caracteres', 400);
      }

      // Validate password complexity (optional)
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
      if (!passwordRegex.test(newPassword)) {
        return res.error('La contraseña debe contener al menos una mayúscula, una minúscula y un número', 400);
      }

      const result = await passwordRecoveryService.resetPassword(token, newPassword);
      
      return res.success(result, result.message);

    } catch (error) {
      console.error('Error en resetPassword:', error);
      return res.error(error.message || 'Error al restablecer la contraseña', 400);
    }
  }
}

module.exports = new PasswordRecoveryController();
