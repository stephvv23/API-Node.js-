const { EmergencyContactController }  = require('./emergencyContact.controller');


module.exports = [
  { method: 'GET',    path: '/api/emergencyContacts',             handler: EmergencyContactController.list },
  { method: 'GET',    path: '/api/emergencyContacts/:idEmergencyContact',    handler: EmergencyContactController.get },
  { method: 'POST',   path: '/api/emergencyContacts',             handler: EmergencyContactController.create },
  { method: 'PUT',    path: '/api/emergencyContacts/:idEmergencyContact',    handler: EmergencyContactController.update },
  { method: 'DELETE', path: '/api/emergencyContacts/:idEmergencyContact',    handler: EmergencyContactController.delete },
];
