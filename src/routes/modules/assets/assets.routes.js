// modules/assets/assets.routes.js
const { AssetsController } = require('./assets.controller');

module.exports = [
  { method: 'GET',    path: '/api/assets',             handler: AssetsController.list }, // List assets by user email
  { method: 'GET',    path: '/api/assets/:idAsset',    handler: AssetsController.get },
  { method: 'GET',    path: '/api/assets/user/:email',             handler: AssetsController.listByUserEmail }, // List assets by user email
  { method: 'POST',   path: '/api/assets',             handler: AssetsController.create },
  { method: 'PUT',    path: '/api/assets/:idAsset',    handler: AssetsController.update },
  { method: 'DELETE', path: '/api/assets/:idAsset',    handler: AssetsController.delete },
];
