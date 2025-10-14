// modules/assets/assets.routes.js
const { AssetsController } = require('./assets.controller');
const { authenticate } = require('../../../middlewares/auth.middleware');

module.exports = [
  { method: 'GET',    path: '/api/assets',             handler: authenticate(AssetsController.list) }, // List assets by user email
  { method: 'GET',    path: '/api/assets/:idAsset',    handler: authenticate(AssetsController.get) },
  { method: 'GET',    path: '/api/assets/user/:email', handler: authenticate(AssetsController.listByUserEmail) }, // List assets by user email
  { method: 'POST',   path: '/api/assets',             handler: authenticate(AssetsController.create) },
  { method: 'PUT',    path: '/api/assets/:idAsset',    handler: authenticate(AssetsController.update) },
  { method: 'DELETE', path: '/api/assets/:idAsset',    handler: authenticate(AssetsController.delete) },
];
//alackofbar