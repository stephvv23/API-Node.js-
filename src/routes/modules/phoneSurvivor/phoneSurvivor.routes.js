const { PhoneSurvivorController } = require('./phoneSurvivor.controller');
const { authenticate, authorizeWindow } = require('../../../middlewares/auth.middleware');

module.exports = [
  // Get the phone for a survivor (only one allowed)
  {
    method: 'GET',
    path: '/api/survivors/:id/phone',
    handler: authenticate(
      authorizeWindow('Supervivientes', 'read')(PhoneSurvivorController.get)
    )
  },

  // Add phone to survivor (only if they don't have one)
  // Body: { "phone": 50312345678 }
  {
    method: 'POST',
    path: '/api/survivors/:id/phone',
    handler: authenticate(
      authorizeWindow('Supervivientes', 'create')(PhoneSurvivorController.create)
    )
  },

  // Update (replace) phone for survivor
  // Body: { "phone": 50387654321 }
  {
    method: 'PUT',
    path: '/api/survivors/:id/phone',
    handler: authenticate(
      authorizeWindow('Supervivientes', 'read', 'update')(PhoneSurvivorController.update)
    )
  },

  // Delete phone from survivor
  {
    method: 'DELETE',
    path: '/api/survivors/:id/phone',
    handler: authenticate(
      authorizeWindow('Supervivientes', 'read', 'delete')(PhoneSurvivorController.delete)
    )
  }
];

