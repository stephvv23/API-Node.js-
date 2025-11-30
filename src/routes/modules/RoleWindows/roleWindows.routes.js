const { roleWindowController } = require('./roleWindows.controller');
const { authenticate, authorizeWindow } = require('../../../middlewares/auth.middleware');

module.exports = [
    { 
        method: 'GET',
        path: '/api/windows',
        handler: authenticate(authorizeWindow('Roles','read')(roleWindowController.listWindows)) 
    },
    {
        method: 'GET',
        path: '/api/roleWindows',
        handler: authenticate(authorizeWindow('Roles','read')(roleWindowController.list))
    },
    {
        method: 'GET',
        path: '/api/roleWindows/:idRole/:idWindow',
        handler: authenticate(authorizeWindow('Roles','read')(roleWindowController.getByIds))
    },
    {
        method: 'GET',
        path: '/api/roleWindows/:idRole',
        handler: authenticate(authorizeWindow('Roles','read')(roleWindowController.getByIdRole))
    },
    {
        method: 'POST',
        path: '/api/roleWindows',
        handler: authenticate(authorizeWindow('Roles','create')(roleWindowController.create))
    },
    {
        method: 'PUT',
        path: '/api/roleWindows/:idRole/:idWindow',
        handler: authenticate(authorizeWindow('Roles','update')(roleWindowController.update))
    },
    {
        method: 'DELETE',
        path: '/api/roleWindows/:idRole/:idWindow',
        handler: authenticate(authorizeWindow('Roles','delete')(roleWindowController.delete))
    }
];