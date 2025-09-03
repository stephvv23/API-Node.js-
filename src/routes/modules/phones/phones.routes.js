// src/api/routes/phones.routes.js
const { PhonesController } = require('../../modules/phones/phones.controller');

module.exports = [
  // List paginated phones (query ?page=&pageSize=&search=)
  { method: 'GET',    path: '/api/phones',          handler: PhonesController.list },
  // get a phone by id
  { method: 'GET',    path: '/api/phones/:idPhone', handler: PhonesController.get },
  // create a phone
  { method: 'POST',   path: '/api/phones',          handler: PhonesController.create },
  // update a phone by id
  { method: 'PUT',    path: '/api/phones/:idPhone', handler: PhonesController.update },
];
