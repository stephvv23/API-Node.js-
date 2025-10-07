const { UsersController } = require('../../modules/users/users.controller');
const { authenticate, authorize } = require('../../../middlewares/auth.middleware');

module.exports = [
  // Login no requiere token
  { method: 'POST', path: '/api/users/login', handler: UsersController.login },

  // Protegidos con JWT
  { method: 'GET', path: '/api/users', handler: authenticate(UsersController.list) },
  { method: 'GET', path: '/api/users/:email', handler: authenticate(UsersController.get) },
  { method: 'POST', path: '/api/users', handler: authenticate(authorize('admin')(UsersController.create)) },
  { method: 'PUT', path: '/api/users/:email', handler: authenticate(authorize('admin')(UsersController.update)) },
  { method: 'PATCH', path: '/api/users/:email/status', handler: authenticate(authorize('admin')(UsersController.updateStatus)) },
  { method: 'PATCH', path: '/api/users/:email/password', handler: authenticate(UsersController.updatePassword) },
  { method: 'DELETE', path: '/api/users/:email', handler: authenticate(authorize('admin')(UsersController.remove)) },
];
