// Import the SupplierController
const { SupplierController } = require('./suppliers.controller');

// Define the routes for suppliers
module.exports = [
  { method: 'GET',    path: '/api/suppliers',                  handler: SupplierController.list },
  { method: 'GET',    path: '/api/suppliers/:idSupplier',      handler: SupplierController.get },
  { method: 'POST',   path: '/api/suppliers',                  handler: SupplierController.create },
  { method: 'PUT',    path: '/api/suppliers/:idSupplier',      handler: SupplierController.update },
  { method: 'DELETE', path: '/api/suppliers/:idSupplier',      handler: SupplierController.delete },
];
