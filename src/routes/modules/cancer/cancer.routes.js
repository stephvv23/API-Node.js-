const { CancerController } = require('../../modules/cancer/cancer.controller');
const { authenticate, authorize } = require('../../../middlewares/auth.middleware');


module.exports = [
  { method: 'GET', path: '/api/cancers', handler: authenticate(CancerController.list) },
  { method: 'GET', path: '/api/cancers/:idCancer', handler: authenticate(CancerController.get) },
  { method: 'POST', path: '/api/cancers', handler: authenticate(CancerController.create) },
  { method: 'PUT', path: '/api/cancers/:idCancer', handler: authenticate(CancerController.update) },
  { method: 'DELETE', path: '/api/cancers/:idCancer', handler: authenticate(CancerController.remove) },
  { method: 'PUT', path: '/api/cancers/:idCancer/reactivate', handler: authenticate(CancerController.reactivate) },
];
