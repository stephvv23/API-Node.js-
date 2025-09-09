const { UsersController } = require('../../modules/users/users.controller');

module.exports = [
  // Ojo: login antes que :email
  { method: 'POST', path: '/api/users/login',        handler: UsersController.login },
  { method: 'GET',  path: '/api/users',              handler: UsersController.list },
  { method: 'GET',  path: '/api/users/:email',       handler: UsersController.get },
  { method: 'POST', path: '/api/users',              handler: UsersController.create },
  { method: 'PUT',  path: '/api/users/:email',       handler: UsersController.update },
  { method: 'PATCH',path: '/api/users/:email/status',handler: UsersController.updateStatus },
  { method: 'PATCH',path: '/api/users/:email/password', handler: UsersController.updatePassword },
  { method: 'DELETE', path: '/api/users/:email',     handler: UsersController.remove },
];
