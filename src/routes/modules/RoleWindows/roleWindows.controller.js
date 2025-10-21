const { roleWindowService } = require('./roleWindows.service');
const { ValidationRules } = require('../../../utils/validator');

const roleWindowController = {
    // List all windows with status filter
    listWindows: async (req, res) => {
        try {
            const status = (req.query.status || 'active').toLowerCase();
            const allowed = ['active', 'inactive', 'all'];
            if (!allowed.includes(status)) {
                return res.validationErrors(['Status must be "active", "inactive" or "all"']);
            }
            const data = await roleWindowService.listWindows({ status });
            return res.success(data);
        } catch (error) {
            console.error('[ROLEWINDOWS] listWindows error:', error);
            return res.error('Error retrieving windows');
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
                return res.validationErrors(['Permissions must be 0 or 1']);
            }
            const data = await roleWindowService.list({ create, read, update, remove });
            return res.success(data);
        } catch (error) {
            console.error('[ROLEWINDOWS] list error:', error);
            return res.error('Error retrieving role-window permissions');
        }
    },

    // Get a role-window permission by composite IDs
    getByIds: async (req, res) => {
        const { idRole, idWindow } = req.params;
        if (!ValidationRules.onlyNumbers(idRole) === true) {
            return res.validationErrors(['idRole must be a number']);
        }
        if (!ValidationRules.onlyNumbers(idWindow) === true) {
            return res.validationErrors(['idWindow must be a number']);
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
            return res.validationErrors(['idRole must be a number']);
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
            errors.push('idRole and idWindow are required');
        }
        if (!ValidationRules.onlyNumbers(idRole) === true) {
            errors.push('idRole must be a number');
        }
        if (!ValidationRules.onlyNumbers(idWindow) === true) {
            errors.push('idWindow must be a number');
        }
        const allowed = [1, 0];
        ['create', 'read', 'update', 'remove'].forEach(flag => {
            if (![0, 1, '0', '1', true, false].includes(req.body[flag])) {
                errors.push(`${flag} must be 0 or 1`);
            }
        });
        if (errors.length > 0) {
            return res.validationErrors(errors);
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
            return res.status(201).success(newRoleWindow, 'Role-Window created successfully');
        } catch (error) {
            console.error('[ROLEWINDOWS] create error:', error);
            return res.error('Error creating role-window');
        }
    },

            // Update a role-window permission by composite IDs
            update: async (req, res) => {
                const { idRole, idWindow } = req.params;
                // Validate IDs before any logic
                if (!ValidationRules.onlyNumbers(idRole) === true) {
                    return res.validationErrors(['idRole must be a number']);
                }
                if (!ValidationRules.onlyNumbers(idWindow) === true) {
                    return res.validationErrors(['idWindow must be a number']);
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
                    return res.success(updated, 'Role-Window updated successfully');
                } catch (error) {
                    if (error.code === 'P2025') {
                        return res.notFound('Role-Window');
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
                    return res.validationErrors(['idRole must be a number']);
                }
                if (!ValidationRules.onlyNumbers(idWindow) === true) {
                    return res.validationErrors(['idWindow must be a number']);
                }
                // Check existence before delete
                const exists = await roleWindowService.getByIds(idRole, idWindow);
                if (!exists) {
                    return res.notFound('Role-Window');
                }
                try {
                    const deletedRoleWindow = await roleWindowService.delete(idRole, idWindow);
                    return res.success(deletedRoleWindow, 'Role-Window deleted successfully');
                } catch (error) {
                    if (error.code === 'P2025') {
                        return res.notFound('Role-Window');
                    }
                    console.error('[ROLEWINDOWS] delete error:', error);
                    return res.error('Error deleting role-window');
                }
            },
};

module.exports = { roleWindowController };