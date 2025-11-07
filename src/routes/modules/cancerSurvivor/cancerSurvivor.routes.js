const { CancerSurvivorController } = require('./cancerSurvivor.controller');
const {
  authenticate,
  authorizeWindow,
} = require('../../../middlewares/auth.middleware');

module.exports = [
  // List all cancers for a survivor
  {
    method: 'GET',
    path: '/api/survivors/:id/cancers',
    handler: authenticate(
      authorizeWindow('Supervivientes', 'read')(CancerSurvivorController.list)
    ),
  },

  // Get specific cancer of a survivor
  {
    method: 'GET',
    path: '/api/survivors/:id/cancers/:idCancer',
    handler: authenticate(
      authorizeWindow('Supervivientes', 'read')(CancerSurvivorController.getOne)
    ),
  },

  // Add a cancer to a survivor
  {
    method: 'POST',
    path: '/api/survivors/:id/cancers',
    handler: authenticate(
      authorizeWindow('Supervivientes', 'create')(CancerSurvivorController.create)
    ),
  },


  // Toggle status (activate/deactivate) a cancer from a survivor
  {
    method: 'PATCH',
    path: '/api/survivors/:id/cancers/:idCancer/status',
    handler: authenticate(
      authorizeWindow('Supervivientes', 'read', 'update')(CancerSurvivorController.toggleStatus)
    ),
  },
];

