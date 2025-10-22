const { ActivityController } = require('./activity.controller');
const { authenticate, authorizeWindow } = require('../../../middlewares/auth.middleware');

module.exports = [
  // protected routes with window-based permissions
  { method: 'GET', path: '/api/activities', handler: authenticate(authorizeWindow('Actividades', 'read')(ActivityController.list)) },
  { method: 'POST', path: '/api/activities', handler: authenticate(authorizeWindow('Actividades', 'read', 'create')(ActivityController.create)) },
  
  // Generic routes with parameters
  { method: 'GET', path: '/api/activities/:idActivity', handler: authenticate(authorizeWindow('Actividades', 'read')(ActivityController.get)) },
  { method: 'PUT', path: '/api/activities/:idActivity', handler: authenticate(authorizeWindow('Actividades', 'read', 'update')(ActivityController.update)) },
  { method: 'PATCH', path: '/api/activities/:idActivity/status', handler: authenticate(authorizeWindow('Actividades', 'read', 'update')(ActivityController.updateStatus)) },
  { method: 'DELETE', path: '/api/activities/:idActivity', handler: authenticate(authorizeWindow('Actividades', 'read', 'delete')(ActivityController.remove)) },
  { method: 'GET', path: '/api/activities/:idActivity/relations', handler: authenticate(authorizeWindow('Actividades', 'read')(ActivityController.getWithRelations)) },
];
