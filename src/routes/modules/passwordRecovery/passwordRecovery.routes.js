/**
 * Password Recovery Routes
 * Routes for password recovery
 */

const passwordRecoveryController = require('./passwordRecovery.controller');

module.exports = [
  /**
   * @route   POST /api/password-recovery/request
   * @desc    Request password recovery (sends email with token)
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
   * @desc    Verify if a token is valid
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
   * @desc    Reset password with token
   * @access  Public
   * @body    { token: string, newPassword: string, confirmPassword: string }
   */
  { 
    method: 'POST', 
    path: '/api/password-recovery/reset', 
    handler: passwordRecoveryController.resetPassword 
  },
];
