const { EmergencyContactSurvivorController } = require('./emergencyContactSurvivor.controller');
const {
  authenticate,
  authorizeWindow,
} = require('../../../middlewares/auth.middleware');

module.exports = [
  // List all emergency contacts for a survivor
  {
    method: 'GET',
    path: '/api/survivors/:id/emergency-contacts',
    handler: authenticate(
      authorizeWindow('Supervivientes', 'read')(EmergencyContactSurvivorController.list)
    ),
  },

  // Get specific emergency contact of a survivor
  {
    method: 'GET',
    path: '/api/survivors/:id/emergency-contacts/:idEmergencyContact',
    handler: authenticate(
      authorizeWindow('Supervivientes', 'read')(EmergencyContactSurvivorController.getOne)
    ),
  },

  // Add an emergency contact to a survivor
  {
    method: 'POST',
    path: '/api/survivors/:id/emergency-contacts',
    handler: authenticate(
      authorizeWindow('Supervivientes', 'create')(EmergencyContactSurvivorController.create)
    ),
  },

  // Remove an emergency contact from a survivor
  {
    method: 'DELETE',
    path: '/api/survivors/:id/emergency-contacts/:idEmergencyContact',
    handler: authenticate(
      authorizeWindow('Supervivientes', 'delete')(EmergencyContactSurvivorController.delete)
    ),
  },
];
