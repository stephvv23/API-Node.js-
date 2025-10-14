// src/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/apiError');
const { UsersRepository } = require('../routes/modules/users/users.repository');

// authentication validate JWT and put the user in ctx
// auth.middleware.js
function authenticate(handler) {
  return async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return next(ApiError.unauthorized('Token requerido'));

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = payload; // now available in controllers
    } catch (err) {
      return next(ApiError.unauthorized('Token inválido o expirado'));
    }

    try {
      // Verify that the user exists and is active in the database
      const user = await UsersRepository.findAuthWithRoles(req.user.sub || req.user.email);
      
      if (!user) {
        return next(ApiError.unauthorized('Usuario no encontrado'));
      }
      
      if (user.status !== 'active') {
        return next(ApiError.unauthorized('Usuario inactivo'));
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

        // collect all windows permissions from active roles only
        const windows = auth.roles
          .filter((r) => r.role?.status === 'active') // Only include active roles
          .flatMap((r) => r.role?.windows || []);

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
