const { HeadquarterController } = require('./headquarter.controller');

module.exports = [
  { method: 'GET', path: '/api/headquarters/active', handler: HeadquarterController.getAllActive },
];
