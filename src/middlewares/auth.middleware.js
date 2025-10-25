// src/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/apiResponse').ApiError;
const { UsersRepository } = require('../routes/modules/users/users.repository');
const { UsersService } = require('../routes/modules/users/users.service');

// authentication validate JWT and put the user in ctx
// auth.middleware.js
/**
 * Middleware to authenticate JWT tokens and check blacklist
 * @param {Function} handler - the controller to execute if authenticated
 */
function authenticate(handler) {
  return async (req, res, next) => {
    try {
      // obtain and validate token
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) {
        return next(ApiError.unauthorized('Token requerido'));
      }

      // check if token is blacklisted 
      const blacklisted = await UsersService.tokenExists(token);

      if (blacklisted) {
        return next(ApiError.unauthorized('Token inválido (logout realizado)'));
      }

      // check the token validity
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = payload; // ← { sub, name, roles, iat, exp }

      // continue to the handler
      return handler(req, res, next);

    } catch (error) {

      // differentiate error types
      if (error.name === 'TokenExpiredError') {
        return next(ApiError.unauthorized('Token expirado'));
      }
      if (error.name === 'JsonWebTokenError') {
        return next(ApiError.unauthorized('Token inválido'));
      }
      console.error('Error en authenticate middleware:', error);
      return next(ApiError.internal('Error interno en autenticación'));
    }
    
    // Check user status from database (real-time verification)
    try {
      const userFromDB = await UsersRepository.findAuthWithRoles(req.user.sub || req.user.email);
      if (!userFromDB) {
        return next(ApiError.unauthorized('Usuario no encontrado'));
      }
      if (!userFromDB.status || userFromDB.status !== 'active') {
        return next(ApiError.unauthorized('Usuario inactivo'));
      }
      
      // Check that user has active roles in database (real-time verification)
      if (!userFromDB.roles || userFromDB.roles.length === 0) {
        return next(ApiError.unauthorized('Usuario sin roles activos'));
      }
    } catch (err) {
      return next(ApiError.unauthorized('Error verificando estado del usuario'));
    }

    return handler(req, res, next);
  };
}


// Authorization: verify that the user has the allowed role
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


// Authorization by window and action permissions
// windowName: string (e.g. 'Cancers' or 'Users')
// actions: any of 'create','read','update','delete'
// NOTE: This method fetches permissions from DB in real-time, ignoring JWT roles
// This ensures that permission changes are applied immediately without requiring JWT refresh
function authorizeWindow(windowName, ...actions) {
  return (handler) => {
    return async (req, res, next) => {
      if (!req.user) return next(ApiError.unauthorized('Usuario no autenticado'));

      try {
        // We only need from JWT to provide user identity (email/sub), actual permissions are fetched from DB
        // This ensures real-time permission updates when roles change in the database
        const auth = await UsersRepository.findAuthWithRoles(req.user.sub || req.user.email);
        
        if (!auth || !Array.isArray(auth.roles)) {
          return next(ApiError.forbidden('No tienes acceso a esta ventana'));
        }

        // Verify that the user is active
        if (auth.status !== 'active') {
          return next(ApiError.forbidden('Usuario inactivo'));
        }

        // collect all windows permissions from roles (already filtered to active roles in DB query)
        if (!auth.roles || auth.roles.length === 0) {
          return next(ApiError.forbidden('El usuario no tiene roles activos'));
        }
        const windows = auth.roles.flatMap((r) => r.role?.windows || []);

        // combine permissions across all roles for the same window (OR semantics)
        const matched = windows.filter((w) => {
          if (!w) return false;
          const name = w.window?.windowName || w.windowName;
          const id = w.window?.idWindow || w.idWindow;
          return (
            (typeof windowName === 'string' && name === windowName) ||
            (typeof windowName === 'number' && id === windowName)
          );
        });

        if (!matched || matched.length === 0) {
          return next(ApiError.forbidden('No tienes acceso a esta ventana'));
        }

        // reduce matched permissions into a single combined permission set (OR across roles)
        const combined = matched.reduce((acc, w) => {
          acc.create = acc.create || !!w.create;
          acc.read = acc.read || !!w.read;
          acc.update = acc.update || !!w.update;
          acc.delete = acc.delete || !!w.delete;
          return acc;
        }, { create: false, read: false, update: false, delete: false });

        // verify each requested action is allowed by the combined permissions
        const invalid = actions.some((act) => !combined[act]);
        if (invalid) {
          return next(ApiError.forbidden('No tienes permisos suficientes para esta acción'));
        }

        return handler(req, res, next);
      } catch (err) {
        return next(ApiError.forbidden('Error verificando permisos'));
      }
    };
  };
}

module.exports = { authenticate, authorize, authorizeWindow };

// Usage examples:
// const { authenticate, authorizeWindow } = require('../../../middlewares/auth.middleware');
//
// Route that requires the user to have 'read' permission on window 'Cancers':
// router.get('/cancers', authenticate(authorizeWindow('Cancers', 'read')(controller.list)));
//
// Route that requires both 'create' and 'update' on window id 8:
// router.post('/cancers', authenticate(authorizeWindow(8, 'create', 'update')(controller.create)));
