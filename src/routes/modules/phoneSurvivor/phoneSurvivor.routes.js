const { PhoneSurvivorController } = require('./phoneSurvivor.controller');
const { authenticate, authorizeWindow } = require('../../../middlewares/auth.middleware');

module.exports = [
  // List all phones for a survivor
  {
    method: 'GET',
    path: '/api/survivors/:id/phones',
    handler: authenticate(
      authorizeWindow('Supervivientes', 'read')(PhoneSurvivorController.list)
    )
  },

  // Get specific phone for a survivor
  {
    method: 'GET',
    path: '/api/survivors/:id/phones/:idPhone',
    handler: authenticate(
      authorizeWindow('Supervivientes', 'read')(PhoneSurvivorController.getOne)
    )
  },

  // Add phone to survivor (finds or creates phone by number)
  // Body: { "phone": 50312345678 }
  {
    method: 'POST',
    path: '/api/survivors/:id/phones',
    handler: authenticate(
      authorizeWindow('Supervivientes', 'create')(PhoneSurvivorController.create)
    )
  },

  // Update phone for survivor (changes relation to existing phone)
  // Body: { "idPhone": 5 }
  {
    method: 'PUT',
    path: '/api/survivors/:id/phones/:idPhone',
    handler: authenticate(
      authorizeWindow('Supervivientes', 'update')(PhoneSurvivorController.update)
    )
  },

  // Delete phone from survivor (hard delete)
  {
    method: 'DELETE',
    path: '/api/survivors/:id/phones/:idPhone',
    handler: authenticate(
      authorizeWindow('Supervivientes', 'delete')(PhoneSurvivorController.delete)
    )
  }
];
