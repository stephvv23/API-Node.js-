
// Import the EmergencyContactController
const { EmergencyContactController }  = require('./emergencyContact.controller');
const { authenticate, authorizeWindow } = require('../../../middlewares/auth.middleware');

// Define the routes for emergency contacts
module.exports = [
  { method: 'GET',    path: '/api/emergencyContacts',                          handler: authenticate(authorizeWindow('ContactosEmergencia', 'read')(EmergencyContactController.list)) },
  { method: 'GET',    path: '/api/emergencyContacts/:idEmergencyContact',      handler: authenticate(authorizeWindow('ContactosEmergencia', 'read')(EmergencyContactController.get)) },
  { method: 'POST',   path: '/api/emergencyContacts',                          handler: authenticate(authorizeWindow('ContactosEmergencia', 'create')(EmergencyContactController.create)) },
  { method: 'PUT',    path: '/api/emergencyContacts/:idEmergencyContact',      handler: authenticate(authorizeWindow('ContactosEmergencia', 'read', 'update')(EmergencyContactController.update)) },
  { method: 'DELETE', path: '/api/emergencyContacts/:idEmergencyContact',      handler: authenticate(authorizeWindow('ContactosEmergencia', 'read', 'delete')(EmergencyContactController.delete)) },
];

