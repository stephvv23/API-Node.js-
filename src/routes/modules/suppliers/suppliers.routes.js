

const { SupplierController } = require('./suppliers.controller'); // Import the SupplierController
const { authenticate, authorizeWindow } = require('../../../middlewares/auth.middleware'); // Import authentication and authorization middlewares

module.exports = [

  // Define the routes for suppliers with appropriate authentication and authorization
  { method: 'GET', path: '/api/suppliers', handler: authenticate(authorizeWindow('Proveedores','read')(SupplierController.getAll)) },
  { method: 'GET', path: '/api/suppliers/:id', handler: authenticate(authorizeWindow('Proveedores','read')(SupplierController.getById)) },
  { method: 'POST', path: '/api/suppliers', handler: authenticate(authorizeWindow('Proveedores','create')(SupplierController.create)) },
  { method: 'PUT', path: '/api/suppliers/:id', handler: authenticate(authorizeWindow('Proveedores','read','update')(SupplierController.update)) },
  { method: 'DELETE', path: '/api/suppliers/:id', handler: authenticate(authorizeWindow('Proveedores','read','delete')(SupplierController.delete)) },

  // Define lookup data routes for related entities to supplier
  { method: 'GET', path: '/api/suppliers/lookup-data', handler: authenticate(authorizeWindow('Proveedores','read')(SupplierController.getLookupData)) },
  
];
