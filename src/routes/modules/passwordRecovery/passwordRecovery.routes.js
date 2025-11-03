/**
 * Password Recovery Routes
 * Rutas para recuperación de contraseña
 */

const passwordRecoveryController = require('./passwordRecovery.controller');

module.exports = [
  /**
   * @route   POST /api/password-recovery/request
   * @desc    Solicitar recuperación de contraseña (envía email con token)
   * @access  Public
   * @body    { email: string }
   */
  { 
    method: 'POST', 
    path: '/api/password-recovery/request', 
    handler: passwordRecoveryController.requestPasswordReset 
  },

  /**
   * @route   POST /api/password-recovery/verify-token
   * @desc    Verificar si un token es válido
   * @access  Public
   * @body    { token: string }
   */
  { 
    method: 'POST', 
    path: '/api/password-recovery/verify-token', 
    handler: passwordRecoveryController.verifyToken 
  },

  /**
   * @route   POST /api/password-recovery/reset
   * @desc    Restablecer contraseña con token
   * @access  Public
   * @body    { token: string, newPassword: string, confirmPassword: string }
   */
  { 
    method: 'POST', 
    path: '/api/password-recovery/reset', 
    handler: passwordRecoveryController.resetPassword 
  },
];
