const { PhoneVolunteerController } = require('./phoneVolunteer.controller');
const { authenticate, authorizeWindow } = require('../../../middlewares/auth.middleware');

module.exports = [
  // Get the phone for a volunteer (only one allowed)
  {
    method: 'GET',
    path: '/api/volunteers/:id/phone',
    handler: authenticate(
      authorizeWindow('Voluntarios', 'read')(PhoneVolunteerController.get)
    )
  },

  // Add phone to volunteer (only if they don't have one)
  // Body: { "phone": 50312345678 }
  {
    method: 'POST',
    path: '/api/volunteers/:id/phone',
    handler: authenticate(
      authorizeWindow('Voluntarios', 'create')(PhoneVolunteerController.create)
    )
  },

  // Update (replace) phone for volunteer
  // Body: { "phone": 50387654321 }
  {
    method: 'PUT',
    path: '/api/volunteers/:id/phone',
    handler: authenticate(
      authorizeWindow('Voluntarios', 'read', 'update')(PhoneVolunteerController.update)
    )
  },

  // Delete phone from volunteer
  // COMMENTED OUT - We don't delete phone numbers, only update them
  /* {
    method: 'DELETE',
    path: '/api/volunteers/:id/phone',
    handler: authenticate(
      authorizeWindow('Voluntarios', 'read', 'delete')(PhoneVolunteerController.delete)
    )
  } */
];
