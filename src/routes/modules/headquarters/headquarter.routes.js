const { HeadquarterController } = require('../../modules/headquarters/headquarter.controller');
const { authenticate, authorizeWindow } = require('../../../middlewares/auth.middleware');

module.exports = [

  { method: 'GET', path: '/api/headquarters', handler: authenticate(authorizeWindow('Sedes','read')(HeadquarterController.getAll)) },
  { method: 'GET', path: '/api/headquarters/active', handler: authenticate(authorizeWindow('Sedes','read')(HeadquarterController.getAllActive)) },
  { method: 'GET', path: '/api/headquarters/:id', handler: authenticate(authorizeWindow('Sedes','read')(HeadquarterController.getById)) },
  { method: 'POST', path: '/api/headquarters', handler: authenticate(authorizeWindow('Sedes','create')(HeadquarterController.create)) },
  { method: 'PUT', path: '/api/headquarters/:id', handler: authenticate(authorizeWindow('Sedes','read','update')(HeadquarterController.update)) },
  { method: 'DELETE', path: '/api/headquarters/:id', handler: authenticate(authorizeWindow('Sedes','read','delete')(HeadquarterController.delete)) },
];
