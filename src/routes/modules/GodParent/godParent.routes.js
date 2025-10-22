const { GodParentController } = require('../../modules/GodParent/godParent.controller');
const { authenticate, authorizeWindow } = require('../../../middlewares/auth.middleware');

module.exports = [

  { method: 'GET', path: '/api/godparents', handler: authenticate(authorizeWindow('Padrinos','read')(GodParentController.getAll)) },
  { method: 'GET', path: '/api/godparents/:id', handler: authenticate(authorizeWindow('Padrinos','read')(GodParentController.getById)) },
  { method: 'POST', path: '/api/godparents', handler: authenticate(authorizeWindow('Padrinos','create')(GodParentController.create)) },
  { method: 'PUT', path: '/api/godparents/:id', handler: authenticate(authorizeWindow('Padrinos','read','update')(GodParentController.update)) },
  { method: 'DELETE', path: '/api/godparents/:id', handler: authenticate(authorizeWindow('Padrinos','read','delete')(GodParentController.delete)) },
  { method: 'GET', path: '/api/godparents/lookup-data', handler: authenticate(authorizeWindow('Padrinos','read')(GodParentController.getLookupData)) },
];