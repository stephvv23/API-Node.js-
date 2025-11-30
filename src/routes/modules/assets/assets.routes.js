// modules/assets/assets.routes.js
const { AssetsController } = require('./assets.controller');
const { authenticate, authorizeWindow } = require('../../../middlewares/auth.middleware');

module.exports = [
  // Protected routes with window-based permissions
  { method: 'GET',    path: '/api/assets',             handler: authenticate(authorizeWindow('Activos', 'read')(AssetsController.list)) },
  { method: 'GET',    path: '/api/assets/:idAsset',    handler: authenticate(authorizeWindow('Activos', 'read')(AssetsController.get)) },
  { method: 'GET',    path: '/api/assets/user/:email', handler: authenticate(authorizeWindow('Activos', 'read')(AssetsController.listByUserEmail)) },
  { method: 'POST',   path: '/api/assets',             handler: authenticate(authorizeWindow('Activos', 'read', 'create')(AssetsController.create)) },
  { method: 'PUT',    path: '/api/assets/:idAsset',    handler: authenticate(authorizeWindow('Activos', 'read', 'update')(AssetsController.update)) },
  { method: 'DELETE', path: '/api/assets/:idAsset',    handler: authenticate(authorizeWindow('Activos', 'read', 'delete')(AssetsController.delete)) },
];
