// src/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/apiError');

// Autenticación: valida JWT y mete el usuario en ctx
// auth.middleware.js
function authenticate(handler) {
  return async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return next(ApiError.unauthorized('Token requerido'));

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = payload; // ahora disponible en controllers
    } catch (err) {
      return next(ApiError.unauthorized('Token inválido o expirado'));
    }

    return handler(req, res, next);
  };
}


// Autorización: verifica que el usuario tenga rol permitido
function authorize(...allowedRoles) {
  return (handler) => {
    return async (req, res, next) => {
      if (!req.user) return next(ApiError.unauthorized('Usuario no autenticado'));

      const hasRole = req.user.roles?.some((r) => allowedRoles.includes(r));
      if (!hasRole) return next(ApiError.forbidden('No tienes permisos suficientes'));

      return handler(req, res, next);
    };
  };
}


module.exports = { authenticate, authorize };
