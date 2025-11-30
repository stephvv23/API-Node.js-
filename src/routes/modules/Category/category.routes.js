const { authorizeWindow, authenticate } = require('../../../middlewares/auth.middleware');
const { categoryController } = require('./category.controller');

module.exports = [
    {
        method: 'GET',
        path: '/api/categories',
    handler: authenticate(authorizeWindow('Categorías', 'read')(categoryController.list))
    },
    {
        method: 'GET',
        path: '/api/categories/:id',
    handler: authenticate(authorizeWindow('Categorías', 'read')(categoryController.getById))
    },
    {
        method: 'POST',
        path: '/api/categories',
    handler: authenticate(authorizeWindow('Categorías', 'create')(categoryController.create))
    },
    {
        method: 'PUT',
        path: '/api/categories/:id',
        handler: authenticate(authorizeWindow('Categorías', 'update')(categoryController.update))
    },
    {
        method: 'DELETE',
        path: '/api/categories/:id',
        handler: authenticate(authorizeWindow('Categorías', 'delete')(categoryController.delete))
    }
];