// Service layer for Role entity. Handles business logic and delegates data access to the repository.
const { roleRepository } = require('./role.repository');

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
        return roleRepository.create({
            rolName: data.rolName,
            status: data.status || 'active'
            
        })
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