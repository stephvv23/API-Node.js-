const { roleWindowService } = require('./roleWindows.service');
const { ValidationRules } = require('../../../utils/validator');
const { SecurityLogService } = require('../../../services/securitylog.service');

const roleWindowController = {
    // List all windows with status filter
    listWindows: async (req, res) => {
        try {
            const status = (req.query.status || 'active').toLowerCase();
            const allowed = ['active', 'inactive', 'all'];
            if (!allowed.includes(status)) {
                return res.validationErrors(['estatus solo puede ser "active", "inactive" o "all"']);
            }
            const data = await roleWindowService.listWindows({ status });
            return res.success(data);
        } catch (error) {
            console.error('[ROLEWINDOWS] listWindows error:', error);
            return res.error('Error recibiendo las ventanas');
        }
    },

    // List role-window permissions with permission filters
    list: async (req, res) => {
        try {
            const create = (Number(req.query.create) || 0);
            const update = (Number(req.query.update) || 0);
            const read = (Number(req.query.read) || 0);
            const remove = (Number(req.query.delete) || 0);
            const allowed = [1, 0];
            if (!allowed.includes(create) || !allowed.includes(read) || !allowed.includes(update) || !allowed.includes(remove)) {
                return res.validationErrors(['Permisos solo pueden ser 0 o 1']);
            }
            const data = await roleWindowService.list({ create, read, update, remove });
            return res.success(data);
        } catch (error) {
            console.error('[ROLEWINDOWS] list error:', error);
            return res.error('Error recibiendo los permisos de role-ventana');
        }
    },

    // Get a role-window permission by composite IDs
    getByIds: async (req, res) => {
        const { idRole, idWindow } = req.params;
        if (!ValidationRules.onlyNumbers(idRole) === true) {
            return res.validationErrors(['idRole solo puede ser un número']);
        }
        if (!ValidationRules.onlyNumbers(idWindow) === true) {
            return res.validationErrors(['idWindow solo puede ser un número']);
        }
        try {
            const roleWindow = await roleWindowService.getByIds(idRole, idWindow);
            if (!roleWindow) {
                return res.notFound('Role-Window');
            }
            return res.success(roleWindow);
        } catch (error) {
            console.error('[ROLEWINDOWS] getByIds error:', error);
            return res.error('Error retrieving role-window');
        }
    },

    // Get all role-windows by role ID
    getByIdRole: async (req, res) => {
        const { idRole } = req.params;
        if (!ValidationRules.onlyNumbers(idRole) === true) {
            return res.validationErrors(['idRole debe ser un número']);
        }
        try {
            const roleWindow = await roleWindowService.getByIdRole(idRole);
            if (!roleWindow) {
                return res.notFound('Role-Window');
            }
            return res.success(roleWindow);
        } catch (error) {
            console.error('[ROLEWINDOWS] getByIdRole error:', error);
            return res.error('Error retrieving role-window by role');
        }
    },

    // Create a new role-window permission
    create: async (req, res) => {
        const { idRole, idWindow, create, read, update, remove } = req.body;
        const errors = [];
        if (idRole === undefined || idWindow === undefined) {
            errors.push('idRole y idWindow son requeridos');
        }
        if (!ValidationRules.onlyNumbers(idRole) === true) {
            errors.push('idRole solo puede ser un número');
        }
        if (!ValidationRules.onlyNumbers(idWindow) === true) {
            errors.push('idWindow solo puede ser un número');
        }
        const allowed = [1, 0];
        ['create', 'read', 'update', 'remove'].forEach(flag => {
            if (![0, 1, '0', '1', true, false].includes(req.body[flag])) {
                errors.push(`${flag} solo puede ser 0 o 1`);
            }
        });
        if (errors.length > 0) {
            return res.validationErrors(errors);
        }
        
        // Prevent modification of admin role (idRole: 1)
        if (Number(idRole) === 1) {
            return res.status(403).json({
                success: false,
                message: 'no se puede modificar los permisos del rol administrador'
            });
        }
        
        try {
            const newRoleWindow = await roleWindowService.create({
                idRole: Number(idRole),
                idWindow: Number(idWindow),
                create: Number(create),
                read: Number(read),
                update: Number(update),
                remove: Number(remove),
            });

            const userEmail = req.user?.sub || 'unknown';
            await SecurityLogService.log({
                email: userEmail,
                action: 'CREATE',
                description: `Role-Window created: Role ID: "${newRoleWindow.idRole}", ` +
                    `Window ID: "${newRoleWindow.idWindow}", ` +
                    `Permissions: ` +
                    `[create: ${newRoleWindow.create}, ` +
                    `read: ${newRoleWindow.read}, ` +
                    `update: ${newRoleWindow.update}, ` +
                    `remove: ${newRoleWindow.delete}]`,
                affectedTable: 'RoleWindow',
            });

            return res.status(201).success(newRoleWindow, 'Role-Window creado exitosamente');
        } catch (error) {
            // Check if it's the admin role protection error
            if (error.message && error.message.includes('ADMIN')) {
                return res.status(403).json({
                    success: false,
                    message: error.message
                });
            }
            console.error('[ROLEWINDOWS] create error:', error);
            return res.error('Error creando role-window');
        }
    },

            // Update a role-window permission by composite IDs
            update: async (req, res) => {
                const { idRole, idWindow } = req.params;
                // Validate IDs before any logic
                if (!ValidationRules.onlyNumbers(idRole) === true) {
                    return res.validationErrors(['idRole solo puede ser un número']);
                }
                if (!ValidationRules.onlyNumbers(idWindow) === true) {
                    return res.validationErrors(['idWindow solo puede ser un número']);
                }
                if (idRole ===1) {
                    return res.validationErrors(['No se pueden modificar los permisos del rol administrador']);
                }
                // Check existence before update
                const exists = await roleWindowService.getByIds(idRole, idWindow);
                if (!exists) {
                    return res.notFound('Role-Window');
                }
                const asBool = v => v === true || v === 1 || v === '1' || v === 'true';
                const flags = {
                    create: asBool(req.body.create),
                    read: asBool(req.body.read),
                    update: asBool(req.body.update),
                    remove: asBool(req.body.remove ?? req.body.delete),
                };
                try {
                    const updated = await roleWindowService.update(idRole, idWindow, flags);

                    const userEmail = req.user?.sub || 'unknown';
                    await SecurityLogService.log({
                        email: userEmail,
                        action: 'UPDATE',
                        description: `Role-Window modificado: Role ID: "${idRole}", ` +
                            `Window ID: "${idWindow}", ` +
                            `New Permissions: ` +
                            `[create: ${flags.create}, ` +
                            `read: ${flags.read}, ` +
                            `update: ${flags.update}, ` +
                            `remove: ${flags.delete}]`,
                        affectedTable: 'RoleWindow',
                    });
                    return res.success(updated, 'Role-Window modificado con éxito');
                } catch (error) {
                    if (error.code === 'P2025') {
                        return res.notFound('Role-Window');
                    }
                    // Check if it's the admin role protection error
                    if (error.message && error.message.includes('No se puede modificar los permisos del rol administrador')) {
                        return res.status(403).json({
                            success: false,
                            message: error.message
                        });
                    }
                    console.error('[ROLEWINDOWS] update error:', error);
                    return res.error('Error updating role-window');
                }
            },

            // Delete a role-window permission by composite IDs
            delete: async (req, res) => {
                const { idRole, idWindow } = req.params;
                // Validate IDs before any logic
                if (!ValidationRules.onlyNumbers(idRole) === true) {
                    return res.validationErrors(['idRole debe ser un número']);
                }
                if (!ValidationRules.onlyNumbers(idWindow) === true) {
                    return res.validationErrors(['idWindow debe ser un número']);
                }
                if( idRole ==1) {
                    return res.validationErrors(['No se pueden eliminar los permisos del rol administrador']);
                }
                // Check existence before delete
                const exists = await roleWindowService.getByIds(idRole, idWindow);
                if (!exists) {
                    return res.notFound('Role-Window');
                }
                try {
                    const deletedRoleWindow = await roleWindowService.delete(idRole, idWindow);

                    const userEmail = req.user?.sub || 'unknown';
                    await SecurityLogService.log({
                        email: userEmail,
                        action: 'DELETE',
                        description: `Role-Window deleted: Role ID: "${idRole}", Window ID: "${idWindow}"`,
                        affectedTable: 'RoleWindow',
                    });
                    return res.success(deletedRoleWindow, 'Role-Window eliminado exitosamente');
                } catch (error) {
                    if (error.code === 'P2025') {
                        return res.notFound('Role-Window');
                    }
                    // Check if it's the admin role protection error
                    if (error.message && error.message.includes('ADMIN')) {
                        return res.status(403).json({
                            success: false,
                            message: error.message
                        });
                    }
                    console.error('[ROLEWINDOWS] delete error:', error);
                    return res.error('Error eliminando role-window');
                }
            },
};

module.exports = { roleWindowController };