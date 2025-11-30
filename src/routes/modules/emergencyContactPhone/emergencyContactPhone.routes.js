const { EmergencyContactPhoneController } = require('./emergencyContactPhone.controller');
const { authenticate, authorizeWindow } = require('../../../middlewares/auth.middleware');

module.exports = [
  { method: 'GET', path: '/api/emergencyContacts/:id/phone', handler: authenticate(authorizeWindow('Contactos de emergencia','read')(EmergencyContactPhoneController.get)) },
  { method: 'POST', path: '/api/emergencyContacts/:id/phone', handler: authenticate(authorizeWindow('Contactos de emergencia','create')(EmergencyContactPhoneController.create)) },
  { method: 'PUT', path: '/api/emergencyContacts/:id/phone', handler: authenticate(authorizeWindow('Contactos de emergencia','read','update')(EmergencyContactPhoneController.update)) },
  { method: 'DELETE', path: '/api/emergencyContacts/:id/phone', handler: authenticate(authorizeWindow('Contactos de emergencia','read','delete')(EmergencyContactPhoneController.delete)) },
];
