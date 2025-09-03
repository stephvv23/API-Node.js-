const { HeadquarterController } = require('./headquarter.controller');

module.exports = [
  { method: 'GET', path: '/api/headquarters/active', handler: HeadquarterController.getAllActive },
  { method: 'GET', path: '/api/headquarters/:id', handler: HeadquarterController.getById },
  { method: 'POST', path: '/api/headquarters', handler: HeadquarterController.create },
  { method: 'PUT', path: '/api/headquarters/:id', handler: HeadquarterController.update },
  { method: 'DELETE', path: '/api/headquarters/:id', handler: HeadquarterController.delete }
];
