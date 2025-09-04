const { categoryController } = require('./category.controller');

module.exports = [
    {
        method: 'GET',
        path: '/api/categories',
        handler: categoryController.list
    },
    {
        method: 'GET',
        path: '/api/categories/:id',
        handler: categoryController.getById
    },
    {
        method: 'POST',
        path: '/api/categories',
        handler: categoryController.create
    },
    {
        method: 'PUT',
        path: '/api/categories/:id',
        handler: categoryController.update
    },
    {
        method: 'DELETE',
        path: '/api/categories/:id',
        handler: categoryController.delete
    }
];