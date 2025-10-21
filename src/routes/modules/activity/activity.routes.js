const { ActivityController } = require('./activity.controller');
const { authenticate, authorizeWindow } = require('../../../middlewares/auth.middleware');

module.exports = [
  // protected routes with window-based permissions
  { method: 'GET', path: '/api/activities', handler: authenticate(authorizeWindow('Actividades', 'read')(ActivityController.list)) },
  { method: 'POST', path: '/api/activities', handler: authenticate(authorizeWindow('Actividades', 'read', 'create')(ActivityController.create)) },
  
  // Specific query routes (must come before generic :idActivity routes)
  { method: 'GET', path: '/api/activities/headquarter/:idHeadquarter', handler: authenticate(authorizeWindow('Actividades', 'read')(ActivityController.getByHeadquarter)) },
  { method: 'GET', path: '/api/activities/date-range', handler: authenticate(authorizeWindow('Actividades', 'read')(ActivityController.getByDateRange)) },
  { method: 'GET', path: '/api/activities/type/:type', handler: authenticate(authorizeWindow('Actividades', 'read')(ActivityController.getByType)) },
  { method: 'GET', path: '/api/activities/modality/:modality', handler: authenticate(authorizeWindow('Actividades', 'read')(ActivityController.getByModality)) },
  
  // Generic routes with parameters (must come after specific routes)
  { method: 'GET', path: '/api/activities/:idActivity', handler: authenticate(authorizeWindow('Actividades', 'read')(ActivityController.get)) },
  { method: 'PUT', path: '/api/activities/:idActivity', handler: authenticate(authorizeWindow('Actividades', 'read', 'update')(ActivityController.update)) },
  { method: 'PATCH', path: '/api/activities/:idActivity/status', handler: authenticate(authorizeWindow('Actividades', 'read', 'update')(ActivityController.updateStatus)) },
  { method: 'DELETE', path: '/api/activities/:idActivity', handler: authenticate(authorizeWindow('Actividades', 'read', 'delete')(ActivityController.remove)) },
  { method: 'GET', path: '/api/activities/:idActivity/relations', handler: authenticate(authorizeWindow('Actividades', 'read')(ActivityController.getWithRelations)) },
];
