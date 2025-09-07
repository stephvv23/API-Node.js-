const { CancerController } = require('../../modules/cancer/cancer.controller');

module.exports = [
  { method: 'GET', path: '/api/cancers', handler: CancerController.list },
  { method: 'GET', path: '/api/cancers/:idCancer', handler: CancerController.get },
  { method: 'POST', path: '/api/cancers', handler: CancerController.create },
  { method: 'PUT', path: '/api/cancers/:idCancer', handler: CancerController.update },
  { method: 'DELETE', path: '/api/cancers/:idCancer', handler: CancerController.remove },
];
