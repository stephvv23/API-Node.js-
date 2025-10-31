
const { SupplierController } = require('./suppliers.controller');
const { authenticate, authorizeWindow } = require('../../../middlewares/auth.middleware');

module.exports = [
  { method: 'GET', path: '/api/suppliers', handler: authenticate(authorizeWindow('Proveedores','read')(SupplierController.getAll)) },
  { method: 'GET', path: '/api/suppliers/:id', handler: authenticate(authorizeWindow('Proveedores','read')(SupplierController.getById)) },
  { method: 'POST', path: '/api/suppliers', handler: authenticate(authorizeWindow('Proveedores','create')(SupplierController.create)) },
  { method: 'PUT', path: '/api/suppliers/:id', handler: authenticate(authorizeWindow('Proveedores','read','update')(SupplierController.update)) },
  { method: 'DELETE', path: '/api/suppliers/:id', handler: authenticate(authorizeWindow('Proveedores','read','delete')(SupplierController.delete)) },
  { method: 'GET', path: '/api/suppliers/lookup-data', handler: authenticate(authorizeWindow('Proveedores','read')(SupplierController.getLookupData)) },
  { method: 'GET', path: '/api/suppliers/lookup-data-create', handler: authenticate(authorizeWindow('Proveedores','create')(SupplierController.getLookupData)) },
];
