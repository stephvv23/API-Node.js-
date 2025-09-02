// modules/assets/assets.routes.js
const { AssetsController } = require('./assets.controller');

module.exports = [
  { method: 'GET',    path: '/api/assets',             handler: AssetsController.list },
  { method: 'GET',    path: '/api/assets/:idAsset',    handler: AssetsController.get },
  { method: 'POST',   path: '/api/assets',             handler: AssetsController.create },
  { method: 'PUT',    path: '/api/assets/:idAsset',    handler: AssetsController.update },
  { method: 'DELETE', path: '/api/assets/:idAsset',    handler: AssetsController.delete },
];
