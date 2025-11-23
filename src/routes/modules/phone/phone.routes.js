const { PhoneController } = require('./phone.controller');
const { authenticate } = require('../../../middlewares/auth.middleware');

module.exports = [
  // List all phones
  {
    method: 'GET',
    path: '/api/phones',
    handler: authenticate(PhoneController.list)
  },

  // Get phone by ID
  {
    method: 'GET',
    path: '/api/phones/:id',
    handler: authenticate(PhoneController.getOne)
  }
];
