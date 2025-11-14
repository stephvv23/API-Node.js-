const { PhoneGodparentController } = require('./phoneGodparent.controller');
const { authenticate, authorizeWindow } = require('../../../middlewares/auth.middleware');

module.exports = [
  // Get the phone for a godparent (only one allowed)
  {
    method: 'GET',
    path: '/api/godparents/:id/phone',
    handler: authenticate(
      authorizeWindow('Padrinos', 'read')(PhoneGodparentController.get)
    )
  },

  // Add phone to godparent (only if they don't have one)
  // Body: { "phone": 50312345678 }
  {
    method: 'POST',
    path: '/api/godparents/:id/phone',
    handler: authenticate(
      authorizeWindow('Padrinos', 'create')(PhoneGodparentController.create)
    )
  },

  // Update (replace) phone for godparent
  // Body: { "phone": 50387654321 }
  {
    method: 'PUT',
    path: '/api/godparents/:id/phone',
    handler: authenticate(
      authorizeWindow('Padrinos', 'read', 'update')(PhoneGodparentController.update)
    )
  },

  // Delete phone from godparent
  // COMMENTED OUT - We don't delete phone numbers, only update them
  /* {
    method: 'DELETE',
    path: '/api/godparents/:id/phone',
    handler: authenticate(
      authorizeWindow('Padrinos', 'read', 'delete')(PhoneGodparentController.delete)
    )
  } */
];
