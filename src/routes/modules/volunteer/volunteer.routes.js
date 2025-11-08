const { VolunteerController } = require('../../modules/volunteer/volunteer.controller');
const { authenticate, authorizeWindow } = require('../../../middlewares/auth.middleware');

module.exports = [
  // Main CRUD operations
  { method: 'GET', path: '/api/volunteers', handler: authenticate(authorizeWindow('Voluntarios','read')(VolunteerController.getAll)) },
  { method: 'GET', path: '/api/volunteers/:id', handler: authenticate(authorizeWindow('Voluntarios','read')(VolunteerController.getById)) },
  { method: 'POST', path: '/api/volunteers', handler: authenticate(authorizeWindow('Voluntarios','create')(VolunteerController.create)) },
  { method: 'PUT', path: '/api/volunteers/:id', handler: authenticate(authorizeWindow('Voluntarios','read','update')(VolunteerController.update)) },
  { method: 'DELETE', path: '/api/volunteers/:id', handler: authenticate(authorizeWindow('Voluntarios','read','delete')(VolunteerController.delete)) },
  
  // Headquarters relationships
  { method: 'GET', path: '/api/volunteers/:id/headquarters', handler: authenticate(authorizeWindow('Voluntarios','read')(VolunteerController.getHeadquarters)) },
  { method: 'POST', path: '/api/volunteers/:id/headquarters', handler: authenticate(authorizeWindow('Voluntarios','read','create')(VolunteerController.addHeadquarters)) },
  { method: 'DELETE', path: '/api/volunteers/:id/headquarters', handler: authenticate(authorizeWindow('Voluntarios','read','delete')(VolunteerController.removeHeadquarters)) },
  
  // Emergency contact relationships
  { method: 'GET', path: '/api/volunteers/:id/emergencyContacts', handler: authenticate(authorizeWindow('Voluntarios','read')(VolunteerController.getEmergencyContacts)) },
  { method: 'POST', path: '/api/volunteers/:id/emergencyContacts', handler: authenticate(authorizeWindow('Voluntarios','read','create')(VolunteerController.addEmergencyContacts)) },
  { method: 'PUT', path: '/api/volunteers/:id/emergencyContacts/:contactId/relationship', handler: authenticate(authorizeWindow('Voluntarios','read','update')(VolunteerController.updateEmergencyContactRelationship)) },
  { method: 'DELETE', path: '/api/volunteers/:id/emergencyContacts', handler: authenticate(authorizeWindow('Voluntarios','read','delete')(VolunteerController.removeEmergencyContacts)) },
];
