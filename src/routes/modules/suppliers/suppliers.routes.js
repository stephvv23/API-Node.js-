

const { SupplierController } = require('./suppliers.controller'); // Import the SupplierController
const { authenticate, authorizeWindow } = require('../../../middlewares/auth.middleware'); // Import authentication and authorization middlewares

module.exports = [

  // Define lookup data routes BEFORE :id routes to avoid conflicts
  { method: 'GET', path: '/api/suppliers/lookup-data', handler: authenticate(authorizeWindow('Proveedores','read')(SupplierController.getLookupData)) },

  // Main CRUD operations
  { method: 'GET', path: '/api/suppliers', handler: authenticate(authorizeWindow('Proveedores','read')(SupplierController.getAll)) },
  { method: 'GET', path: '/api/suppliers/:id', handler: authenticate(authorizeWindow('Proveedores','read')(SupplierController.getById)) },
  { method: 'POST', path: '/api/suppliers', handler: authenticate(authorizeWindow('Proveedores','create')(SupplierController.create)) },
  { method: 'PUT', path: '/api/suppliers/:id', handler: authenticate(authorizeWindow('Proveedores','read','update')(SupplierController.update)) },
  { method: 'DELETE', path: '/api/suppliers/:id', handler: authenticate(authorizeWindow('Proveedores','read','delete')(SupplierController.delete)) },

   // Headquarters relationships
  { method: 'GET', path: '/api/suppliers/:id/headquarters', handler: authenticate(authorizeWindow('Proveedores','read')(SupplierController.getHeadquarters)) },
  { method: 'POST', path: '/api/suppliers/:id/headquarters', handler: authenticate(authorizeWindow('Proveedores','read','create')(SupplierController.addHeadquarters)) },
  { method: 'DELETE', path: '/api/suppliers/:id/headquarters', handler: authenticate(authorizeWindow('Proveedores','read','delete')(SupplierController.removeHeadquarters)) },
  
  // Categories relationships
  { method: 'GET', path: '/api/suppliers/:id/categories', handler: authenticate(authorizeWindow('Proveedores','read')(SupplierController.getCategories)) },
  { method: 'POST', path: '/api/suppliers/:id/categories', handler: authenticate(authorizeWindow('Proveedores','read','create')(SupplierController.addCategories)) },
  { method: 'DELETE', path: '/api/suppliers/:id/categories', handler: authenticate(authorizeWindow('Proveedores','read','delete')(SupplierController.removeCategories)) },

  // Phone relationships
  { method: 'GET', path: '/api/suppliers/:id/phones', handler: authenticate(authorizeWindow('Proveedores','read')(SupplierController.getPhones)) },
  { method: 'POST', path: '/api/suppliers/:id/phones', handler: authenticate(authorizeWindow('Proveedores','read','create')(SupplierController.addPhones)) },
  { method: 'DELETE', path: '/api/suppliers/:id/phones', handler: authenticate(authorizeWindow('Proveedores','read','delete')(SupplierController.removePhones)) },
  
];
