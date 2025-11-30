const { roleController } = require('./role.controller');
const { authenticate, authorizeWindow } = require('../../../middlewares/auth.middleware');

module.exports = [
    {
        method: 'GET',
        path : '/api/roles',
        handler: authenticate(authorizeWindow('Roles', 'read')(roleController.list))
    
    },
    {
        method: 'GET',
        path: '/api/roles/:id',
        handler: authenticate(authorizeWindow('Roles', 'read')(roleController.getById))
    },
    {
        method: 'POST',
        path: '/api/roles',
        handler: authenticate(authorizeWindow('Roles', 'create')(roleController.create))
    },
    {
        method: 'PUT', 
        path: '/api/roles/:id',
        handler: authenticate(authorizeWindow('Roles', 'update')(roleController.update))
    },
    {
        method: 'DELETE',
        path: '/api/roles/:id',
        handler: authenticate(authorizeWindow('Roles', 'delete')(roleController.delete))
    }
];