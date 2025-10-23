const { ActivityController } = require('./activity.controller');
const { authenticate, authorizeWindow } = require('../../../middlewares/auth.middleware');

module.exports = [
  // protected routes with window-based permissions
  { method: 'GET', path: '/api/activities', handler: authenticate(authorizeWindow('Actividades', 'read')(ActivityController.list)) },
  { method: 'POST', path: '/api/activities', handler: authenticate(authorizeWindow('Actividades', 'read', 'create')(ActivityController.create)) },
  { method: 'GET', path: '/api/activities/lookup-data', handler: authenticate(authorizeWindow('Actividades', 'read')(ActivityController.getLookupData)) },
  
  // Generic routes with parameters
  { method: 'GET', path: '/api/activities/:idActivity', handler: authenticate(authorizeWindow('Actividades', 'read')(ActivityController.get)) },
  { method: 'PUT', path: '/api/activities/:idActivity', handler: authenticate(authorizeWindow('Actividades', 'read', 'update')(ActivityController.update)) },
  { method: 'PATCH', path: '/api/activities/:idActivity/status', handler: authenticate(authorizeWindow('Actividades', 'read', 'update')(ActivityController.updateStatus)) },
  { method: 'DELETE', path: '/api/activities/:idActivity', handler: authenticate(authorizeWindow('Actividades', 'read', 'delete')(ActivityController.remove)) },
  { method: 'GET', path: '/api/activities/:idActivity/relations', handler: authenticate(authorizeWindow('Actividades', 'read')(ActivityController.getWithRelations)) },

  // Relations routes
  // Volunteer relations
  { method: 'GET', path: '/api/activities/:idActivity/volunteers', handler: authenticate(authorizeWindow('Actividades', 'read')(ActivityController.getVolunteers)) },
  { method: 'POST', path: '/api/activities/:idActivity/volunteers', handler: authenticate(authorizeWindow('Actividades', 'read', 'create')(ActivityController.assignVolunteers)) },
  { method: 'DELETE', path: '/api/activities/:idActivity/volunteers', handler: authenticate(authorizeWindow('Actividades', 'read', 'delete')(ActivityController.removeVolunteers)) },
  
  // Survivor relations
  { method: 'GET', path: '/api/activities/:idActivity/survivors', handler: authenticate(authorizeWindow('Actividades', 'read')(ActivityController.getSurvivors)) },
  { method: 'POST', path: '/api/activities/:idActivity/survivors', handler: authenticate(authorizeWindow('Actividades', 'read', 'create')(ActivityController.assignSurvivors)) },
  { method: 'DELETE', path: '/api/activities/:idActivity/survivors', handler: authenticate(authorizeWindow('Actividades', 'read', 'delete')(ActivityController.removeSurvivors)) },
  
  // Godparent relations
  { method: 'GET', path: '/api/activities/:idActivity/godparents', handler: authenticate(authorizeWindow('Actividades', 'read')(ActivityController.getGodparents)) },
  { method: 'POST', path: '/api/activities/:idActivity/godparents', handler: authenticate(authorizeWindow('Actividades', 'read', 'create')(ActivityController.assignGodparents)) },
  { method: 'DELETE', path: '/api/activities/:idActivity/godparents', handler: authenticate(authorizeWindow('Actividades', 'read', 'delete')(ActivityController.removeGodparents)) },

];
