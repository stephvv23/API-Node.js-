// Service layer for Role entity. Handles business logic and delegates data access to the repository.
const { roleRepository } = require('./role.repository');
const { roleWindowService } = require('../RoleWindows/roleWindows.service.js');

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
            idWindow: 12, // Assuming 12 is the ID for "PrincipalPage"
            create: false,
            read: true,
            update: false,
            remove: false
        });

        await roleWindowService.assignReadPermissionToPrincipalPage();  // Llamamos al método para asignar a todos los roles

        return newRole;
    },
    // Update a role by ID.
    update: async (id, data) => {
        return roleRepository.update(id, {
        rolName: data.rolName,
        status : data.status
    });
    },

    // Soft-delete a role (set status to 'inactive').
    delete: async (id) => {
        return roleRepository.update (id, {
            status: 'inactive'
        })
    }
};

module.exports = { roleService };