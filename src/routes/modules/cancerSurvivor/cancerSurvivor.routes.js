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

  // Update cancer stage/status for a survivor
  {
    method: 'PUT',
    path: '/api/survivors/:id/cancers/:idCancer',
    handler: authenticate(
      authorizeWindow('Supervivientes', 'read', 'update')(CancerSurvivorController.update)
    ),
  },

  // Remove a cancer from a survivor
  {
    method: 'DELETE',
    path: '/api/survivors/:id/cancers/:idCancer',
    handler: authenticate(
      authorizeWindow('Supervivientes', 'read', 'delete')(CancerSurvivorController.delete)
    ),
  },
];

