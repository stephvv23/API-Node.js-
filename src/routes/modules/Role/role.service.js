// Service layer for Role entity. Handles business logic and delegates data access to the repository.
const { roleRepository } = require('./role.repository');
const { roleWindowService } = require('../RoleWindows/roleWindows.service.js');
const ApiError = require('../../../utils/apiResponse').ApiError;

const roleService = {
    // List roles, optionally filtered by status, with pagination.
    list: async ({ status = 'active', take, skip } = {}) => {
        return roleRepository.list({ status, take, skip });

    },

    // Get a role by its ID.
    getById: async (id) => {
        return roleRepository.getById(id);
    },
    // Find a role by its name.
    findByName: async (name) => {
        return roleRepository.findByName(name);
    },
    // Create a new role.
     create: async (data) => {
        const newRole = await roleRepository.create({
            rolName: data.rolName,
            status: data.status || 'active'
        });

        // Assign read permission to "PrincipalPage" window for the new role
        await roleWindowService.create({
            idRole: newRole.idRole,
            idWindow: 5, // PrincipalPage window ID (as per seed.js)
            create: false,
            read: true,
            update: false,
            remove: false
        });

        return newRole;
    },
    // Update a role by ID.
    update: async (id, data) => {
        const roleId = Number(id);
        const isAdminRole = roleId === 1;

        // validate that the admin role is not being deactivated
        if (isAdminRole) {
        // prevent deactivating the admin role
        if (data.status && data.status.toLowerCase() !== 'active') {
            const error = ApiError.badRequest('El rol de administrador no puede ser desactivado.');
            error.errorCode = 'CANNOT_DEACTIVATE_ADMIN_ROLE';
            throw error;
        }
            // ensure that the status is always active
            data.status = 'active';
        }

        return roleRepository.update(id, {
            rolName: data.rolName,
            status: data.status
        });
    },

    // Soft-delete a role (set status to 'inactive').
    delete: async (id) => {
        const roleId = Number(id);
        const isAdminRole = roleId === 1;

        // validate that the admin role is not being deleted
        if (isAdminRole) {
            const error = ApiError.badRequest('El rol de administrador no puede ser eliminado.');
            error.errorCode = 'CANNOT_DELETE_ADMIN_ROLE';
            throw error;
        }

        return roleRepository.update(id, {
            status: 'inactive'
        });
    }
};

module.exports = { roleService };