const { roleWindowController } = require('./roleWindows.controller');

module.exports = [
    { 
        method: 'GET',
        path: '/api/windows',
        handler: roleWindowController.listWindows
    },
    {
        method: 'GET',
        path: '/api/roleWindows',
        handler: roleWindowController.list
    },
    {
        method: 'GET',
        path: '/api/roleWindows/:idRole/:idWindow',
        handler: roleWindowController.getByIds
    },
    {
        method: 'POST',
        path: '/api/roleWindows',
        handler: roleWindowController.create
    },
    {
        method: 'PUT',
        path: '/api/roleWindows/:idRole/:idWindow',
        handler: roleWindowController.update
    },
    {
        method: 'DELETE',
        path: '/api/roleWindows/:idRole/:idWindow',
        handler: roleWindowController.delete
    }
];