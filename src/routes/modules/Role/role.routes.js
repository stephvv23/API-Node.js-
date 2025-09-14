const { roleController } = require('./role.controller');

module.exports = [
    {
        method: 'GET',
        path : '/api/roles',
        handler: roleController.list
    
    },
    {
        method: 'GET',
        path: '/api/roles/:id',
        handler: roleController.getById
    },
    {
        method: 'POST',
        path: '/api/roles',
        handler: roleController.create
    },
    {
        method: 'PUT', 
        path: '/api/roles/:id',
        handler: roleController.update
    },
    {
        method: 'DELETE',
        path: '/api/roles/:id',
        handler: roleController.delete
    }
];