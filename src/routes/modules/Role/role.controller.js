const { roleService } = require('./role.service');
const { EntityValidators, ValidationRules } = require('../../../utils/validator');
const { SecurityLogService } = require('../../../services/securitylog.service');

const roleController = {
    // List roles with status filter
    list: async (req, res) => {
        try {
            const status = (req.query.status || 'active').toLowerCase();
            const allowed = ['active', 'inactive', 'all'];
            if (!allowed.includes(status)) {
                return res.validationErrors(['Status debe ser "active", "inactive" o "all"']);
            }
            let data = await roleService.list({ status });
            // Hide roles that the requesting user already has
            const userRoles = req.user?.roles || [];
            if (Array.isArray(userRoles) && userRoles.length) {
                const userRolesLower = userRoles.map(r => String(r).toLowerCase());
                data = data.filter(r => !userRolesLower.includes(String(r.rolName).toLowerCase()));
            }
            return res.success(data);
        } catch (error) {
            console.error('[ROLE] list error:', error);
            return res.error('Error recibiendo los roles');
        }
    },

    // Get a role by ID
    getById: async (req, res) => {
        const { id } = req.params;
        if (!/^[0-9\s]+$/.test(id)) {
            return res.validationErrors(['id debe ser un numero']);
        }
        try {
            const role = await roleService.getById(id);
            if (!role) {
                return res.notFound('Rol');
            }
            return res.success(role);
        } catch (error) {
            console.error('[ROLE] getById error:', error);
            return res.error('error recibiendo el rol');
        }
    },

    // Create a new role
    create: async (req, res) => {
        // Trim string fields to avoid whitespace issues
        const trimmedBody = ValidationRules.trimStringFields(req.body);
        const { rolName, status } = trimmedBody;
        
        // Validate using centralized validator
        const validation = EntityValidators.role({ rolName, status }, { partial: false });
        const errors = [...validation.errors];
        // Check for duplicate role name
        const allRoles = await roleService.list({ status: 'all' });
        if (allRoles.some(c => c.rolName === rolName)) {
            errors.push('un rol con ese nombre ya existe');
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
                description: `Rol creado: ID: "${newRole.idRole}", ` +
                 ` Nombre: "${newRole.rolName}", ` +
                 `Estado: "${newRole.status}"`,
                affectedTable: 'Role',
            });
            return res.status(201).success(newRole, 'Rol creado con éxito');
        } catch (error) {
            console.error('[ROLE] create error:', error);
            return res.error('Error creando el rol');
        }
    },

        // Update a role by ID
        update: async (req, res) => {
            const { id } = req.params;
            
            // Trim string fields to avoid whitespace issues
            const trimmedBody = ValidationRules.trimStringFields(req.body);
            let { rolName, name, status } = trimmedBody;
            
            if (rolName === undefined && name !== undefined) rolName = name;
            // Validate ID
            if (!/^[0-9\s]+$/.test(id)) {
                return res.validationErrors(['id solo puede ser un número']);
            }
            if (Number(id) === 1) {
                return res.status(403).json({
                    success: false,
                    message: 'El rol de admin no puede ser modificado'
                });
            }
            // Check existence before update
            const exists = await roleService.getById(id);
            if (!exists) {
                return res.notFound('Rol');
            }
            // Prevent a user from modifying a role they themselves have
            const userRoles = req.user?.roles || [];
            const userRolesLower = userRoles.map(r => String(r).toLowerCase());
            if (userRolesLower.includes(String(exists.rolName).toLowerCase())) {
                return res.status(403).json({
                    success: false,
                    message: 'No puedes modificar un rol que posees'
                });
            }
            // Validate using centralized validator (partial mode)
            const validation = EntityValidators.role({ rolName, status }, { partial: true });
            const errors = [...validation.errors];
            // Check for duplicate role name if provided
            if (rolName !== undefined && !errors.length) {
                const exist = await roleService.findByName(rolName);
                const existId = exist?.idRole ?? exist?.id ?? exist?._id ?? exist?.ID;
                if (exist && String(existId) !== String(id)) {
                    errors.push('Ya existe un rol con ese nombre');
                }
            }
            if (errors.length > 0) {
                return res.validationErrors(errors);
            }
            const payload = {};
            if (rolName !== undefined) payload.rolName = rolName;
            if (status !== undefined) payload.status = status;
            if (!Object.keys(payload).length) {
                return res.validationErrors(['nada para actualizar']);
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
                        description: `Rol modificado: ID: "${id}", ` +
                            `Nombre: "${updated.rolName}", ` +
                            `Estado: "${updated.status}"`,
                        affectedTable: 'Role',
                    });
                } else {
                    await SecurityLogService.log({
                        email: userEmail,
                        action: 'UPDATE',
                        description: `Rol actualizado: ID: "${id}", ` +
                            `Nombre: "${updated.rolName}", ` +
                            `Estado: "${updated.status}"`,
                        affectedTable: 'Role',
                    });
                }

                return res.success(updated, 'Rol modificado con éxito');
            } catch (error) {
                if (error?.code === 'P2025') {
                    return res.notFound('Rol');
                }
                // Check if it's the admin role protection error
                if (error.message && error.message.includes('ADMIN')) {
                    return res.status(403).json({
                        success: false,
                        message: error.message
                    });
                }
                console.error('[ROLE] update error:', error);
                return res.error('Error al modificar el rol');
            }
        },

        // Soft-delete a role by ID
        delete: async (req, res) => {
            const raw = String(req.params.id ?? '').trim();
            if (!/^\d+$/.test(raw)) {
                return res.validationErrors(['id solo puede ser un número']);
            }
            if (raw == '1') {
                return res.status(403).json({
                    success: false,
                    message: 'El rol de admin no puede ser eliminado'
                });
            }
            const id = Number.parseInt(raw, 10);
            // Check existence before delete
            const exists = await roleService.getById(id);
            if (!exists) {
                return res.notFound('Rol');
            }
            // Prevent a user from deleting a role they themselves have
            const userRoles = req.user?.roles || [];
            const userRolesLower = userRoles.map(r => String(r).toLowerCase());
            if (userRolesLower.includes(String(exists.rolName).toLowerCase())) {
                return res.status(403).json({
                    success: false,
                    message: 'No puedes eliminar un rol que posees'
                });
            }
            try {
                const deleted = await roleService.delete(id);
                const userEmail = req.user?.sub || 'unknown';
                await SecurityLogService.log({
                    email: userEmail,
                    action: 'DELETE',
                    description: `Rol eliminado: ID: "${id}", ` +
                        `Nombre: "${deleted.rolName}", ` +
                        `Estado: "${deleted.status}"`,
                    affectedTable: 'Role',
                });
                return res.success(deleted, 'Rol eliminado con éxito');
            } catch (error) {
                if (error?.code === 'P2025') {
                    return res.notFound('Rol');
                }
                // Check if it's the admin role protection error
                if (error && error.errorCode) {
                    return res.status(400).json({
                        ok: false,
                        error: {
                            code: error.errorCode,
                            message: error.message,
                            status: 400
                        }
                    });
                }
                if (error.message && error.message.includes('ADMIN')) {
                    return res.status(403).json({
                        success: false,
                        message: error.message
                    });
                }
                console.error('[ROLE] delete error:', error);
                return res.error('Error eliminando el rol');
            }
        },
};

module.exports = { roleController };