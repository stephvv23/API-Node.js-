const { HeadquarterController } = require('../../modules/headquarters/headquarter.controller');
const { authenticate, authorize } = require('../../../middlewares/auth.middleware');

module.exports = [

  { method: 'GET', path: '/api/headquarters', handler: authenticate(HeadquarterController.getAll) },


  { method: 'GET', path: '/api/headquarters/active', handler: authenticate(HeadquarterController.getAllActive) },


  { method: 'GET', path: '/api/headquarters/:id', handler: authenticate(HeadquarterController.getById) },


  { method: 'POST', path: '/api/headquarters', handler: authenticate(authorize('admin')(HeadquarterController.create)) },


  { method: 'PUT', path: '/api/headquarters/:id', handler: authenticate(authorize('admin')(HeadquarterController.update)) },


  { method: 'DELETE', path: '/api/headquarters/:id', handler: authenticate(authorize('admin')(HeadquarterController.delete)) },
];
