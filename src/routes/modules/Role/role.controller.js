const { roleService } = require('./role.service');
const { EntityValidators } = require('../../../utils/validator');
const { SecurityLogService } = require('../../../services/securitylog.service');

const roleController = {
    // List roles with status filter
    list: async (req, res) => {
        try {
            const status = (req.query.status || 'active').toLowerCase();
            const allowed = ['active', 'inactive', 'all'];
            if (!allowed.includes(status)) {
                return res.validationErrors(['Status must be "active", "inactive" or "all"']);
            }
            const data = await roleService.list({ status });
            return res.success(data);
        } catch (error) {
            console.error('[ROLE] list error:', error);
            return res.error('Error retrieving roles');
        }
    },

    // Get a role by ID
    getById: async (req, res) => {
        const { id } = req.params;
        if (!/^[0-9\s]+$/.test(id)) {
            return res.validationErrors(['id must be a number']);
        }
        try {
            const role = await roleService.getById(id);
            if (!role) {
                return res.notFound('Role');
            }
            return res.success(role);
        } catch (error) {
            console.error('[ROLE] getById error:', error);
            return res.error('Error retrieving role');
        }
    },

    // Create a new role
    create: async (req, res) => {
        const { rolName, status } = req.body;
        // Validate using centralized validator
        const validation = EntityValidators.role({ rolName, status }, { partial: false });
        const errors = [...validation.errors];
        // Check for duplicate role name
        const allRoles = await roleService.list({ status: 'all' });
        if (allRoles.some(c => c.rolName === rolName)) {
            errors.push('A role with that name already exists');
        }
        if (errors.length > 0) {
            return res.validationErrors(errors);
        }
        try {
            const newRole = await roleService.create({ rolName, status });
            const userEmail = req.user?.sub || 'unknown';
            await SecurityLogService.log({
                email: userEmail,
                action: 'CREATE',
                description: `Role created: ID: "${newRole.idRole}", ` +
                 ` Name: "${newRole.rolName}", ` +
                 `Status: "${newRole.status}"`,
                affectedTable: 'Role',
            });
            return res.status(201).success(newRole, 'Role created successfully');
        } catch (error) {
            console.error('[ROLE] create error:', error);
            return res.error('Error creating role');
        }
    },

        // Update a role by ID
        update: async (req, res) => {
            const { id } = req.params;
            let { rolName, name, status } = req.body;
            if (rolName === undefined && name !== undefined) rolName = name;
            // Validate ID
            if (!/^[0-9\s]+$/.test(id)) {
                return res.validationErrors(['id must be a number']);
            }
            // Check existence before update
            const exists = await roleService.getById(id);
            if (!exists) {
                return res.notFound('Role');
            }
            // Validate using centralized validator (partial mode)
            const validation = EntityValidators.role({ rolName, status }, { partial: true });
            const errors = [...validation.errors];
            // Check for duplicate role name if provided
            if (rolName !== undefined && !errors.length) {
                const exist = await roleService.findByName(String(rolName).trim());
                const existId = exist?.idRole ?? exist?.id ?? exist?._id ?? exist?.ID;
                if (exist && String(existId) !== String(id)) {
                    errors.push('A role with that name already exists');
                }
            }
            if (errors.length > 0) {
                return res.validationErrors(errors);
            }
            const payload = {};
            if (rolName !== undefined) payload.rolName = String(rolName).trim();
            if (status !== undefined) payload.status = String(status).trim();
            if (!Object.keys(payload).length) {
                return res.validationErrors(['Nothing to update']);
            }
            const previousRole = await roleService.getById(id);
            const userEmail = req.user?.sub || 'unknown';
            try {
                const updated = await roleService.update(id, payload);
                
                const nameUnchanged = previousRole.rolName === updated.rolName;
                const movedInactiveToActive =
                    previousRole.status === 'inactive' && updated.status === 'active';
                const movedActiveToInactive =
                    previousRole.status === 'active' && updated.status === 'inactive';
                const statusChanged = movedInactiveToActive || movedActiveToInactive;

                if (statusChanged && nameUnchanged) {
                    const action = movedInactiveToActive ? 'REACTIVATE' : 'DEACTIVATE';
                        await SecurityLogService.log({
                        email: userEmail,
                        action,
                        description: `Role updated: ID: "${id}", ` +
                            `Name: "${updated.rolName}", ` +
                            `Status: "${updated.status}"`,
                        affectedTable: 'Role',
                    });
                } else {
                    await SecurityLogService.log({
                        email: userEmail,
                        action: 'UPDATE',
                        description: `Role updated: ID: "${id}", ` +
                            `Name: "${updated.rolName}", ` +
                            `Status: "${updated.status}"`,
                        affectedTable: 'Role',
                    });
                }
                
                return res.success(updated, 'Role updated successfully');
            } catch (error) {
                if (error?.code === 'P2025') {
                    return res.notFound('Role');
                }
                console.error('[ROLE] update error:', error);
                return res.error('Error updating role');
            }
        },

        // Soft-delete a role by ID
        delete: async (req, res) => {
            const raw = String(req.params.id ?? '').trim();
            if (!/^\d+$/.test(raw)) {
                return res.validationErrors(['id must be a number']);
            }
            const id = Number.parseInt(raw, 10);
            // Check existence before delete
            const exists = await roleService.getById(id);
            if (!exists) {
                return res.notFound('Role');
            }
            try {
                const deleted = await roleService.delete(id);
                const userEmail = req.user?.sub || 'unknown';
                await SecurityLogService.log({
                    email: userEmail,
                    action: 'DELETE',
                    description: `Role deleted: ID: "${id}", ` +
                        `Name: "${deleted.rolName}", ` +
                        `Status: "${deleted.status}"`,
                    affectedTable: 'Role',
                });
                return res.success(deleted, 'Role deleted successfully');
            } catch (error) {
                if (error?.code === 'P2025') {
                    return res.notFound('Role');
                }
                console.error('[ROLE] delete error:', error);
                return res.error('Error deleting role');
            }
        },
};

module.exports = { roleController };