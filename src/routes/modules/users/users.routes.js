const { UsersController } = require('../../modules/users/users.controller');
const { authenticate, authorizeWindow } = require('../../../middlewares/auth.middleware');

module.exports = [
  // Login not protected with token because is to get the token
  { method: 'POST', path: '/api/users/login', handler: UsersController.login },
  { method: 'POST', path: '/api/users/logout', handler: authenticate(UsersController.logout)},

  // protected routes with window-based permissions
  { method: 'GET', path: '/api/users', handler: authenticate(authorizeWindow('Usuarios', 'read')(UsersController.list)) },
  { method: 'GET', path: '/api/users/:email', handler: authenticate(authorizeWindow('Usuarios', 'read')(UsersController.get)) },
  { method: 'POST', path: '/api/users', handler: authenticate(authorizeWindow('Usuarios', 'read', 'create')(UsersController.create)) },
  { method: 'PUT', path: '/api/users/:email', handler: authenticate(authorizeWindow('Usuarios', 'read', 'update')(UsersController.update)) },
  { method: 'PATCH', path: '/api/users/:email/status', handler: authenticate(authorizeWindow('Usuarios', 'read', 'update')(UsersController.updateStatus)) },
  { method: 'PATCH', path: '/api/users/:email/password', handler: authenticate(UsersController.updatePassword) }, // any authenticated user can change their password
  { method: 'DELETE', path: '/api/users/:email', handler: authenticate(authorizeWindow('Usuarios', 'read', 'delete')(UsersController.remove)) },
];
