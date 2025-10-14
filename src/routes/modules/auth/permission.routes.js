const { PermissionController } = require('./permission.controller');
const { authenticate } = require('../../../middlewares/auth.middleware');

module.exports = [
  {
    method: 'GET',
    path: '/api/permissions/me/windows',
    handler: authenticate(PermissionController.getMyWindows),
  },
];
