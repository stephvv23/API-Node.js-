const { VolunteerController } = require('../../modules/volunteer/volunteer.controller');
const { authenticate, authorizeWindow } = require('../../../middlewares/auth.middleware');

module.exports = [

  { method: 'GET', path: '/api/volunteers', handler: authenticate(authorizeWindow('Voluntarios','read')(VolunteerController.getAll)) },
  { method: 'GET', path: '/api/volunteers/active', handler: authenticate(authorizeWindow('Voluntarios','read')(VolunteerController.getAllActive)) },
  { method: 'GET', path: '/api/volunteers/:id', handler: authenticate(authorizeWindow('Voluntarios','read')(VolunteerController.getById)) },
  { method: 'POST', path: '/api/volunteers', handler: authenticate(authorizeWindow('Voluntarios','create')(VolunteerController.create)) },
  { method: 'PUT', path: '/api/volunteers/:id', handler: authenticate(authorizeWindow('Voluntarios','read','update')(VolunteerController.update)) },
  { method: 'DELETE', path: '/api/volunteers/:id', handler: authenticate(authorizeWindow('Voluntarios','read','delete')(VolunteerController.delete)) },
];
