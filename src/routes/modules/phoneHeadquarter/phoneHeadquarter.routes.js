const { PhoneHeadquarterController } = require('./phoneHeadquarter.controller');
const { authenticate, authorizeWindow } = require('../../../middlewares/auth.middleware');

module.exports = [
  // Get the phone for a headquarter (only one allowed)
  {
    method: 'GET',
    path: '/api/headquarters/:id/phone',
    handler: authenticate(
      authorizeWindow('Sedes', 'read')(PhoneHeadquarterController.get)
    )
  },

  // Add phone to headquarter (only if they don't have one)
  // Body: { "phone": 50312345678 }
  {
    method: 'POST',
    path: '/api/headquarters/:id/phone',
    handler: authenticate(
      authorizeWindow('Sedes', 'create')(PhoneHeadquarterController.create)
    )
  },

  // Update (replace) phone for headquarter
  // Body: { "phone": 50387654321 }
  {
    method: 'PUT',
    path: '/api/headquarters/:id/phone',
    handler: authenticate(
      authorizeWindow('Sedes', 'read', 'update')(PhoneHeadquarterController.update)
    )
  },

  // Delete phone from headquarter
  // COMMENTED OUT - We don't delete phone numbers, only update them
  /* {
    method: 'DELETE',
    path: '/api/headquarters/:id/phone',
    handler: authenticate(
      authorizeWindow('Sedes', 'read', 'delete')(PhoneHeadquarterController.delete)
    )
  } */
];
