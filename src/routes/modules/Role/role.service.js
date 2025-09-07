const { roleRepository } = require('./role.repository');

const roleService = {
    list: async ({ status = 'active', take, skip } = {}) => {
        return roleRepository.list({ status, take, skip });

    },

    getById: async (id) => {
        return roleRepository.getById(id);
    },
    create: async (data) => {
        return roleRepository.create({
            rolName: data.rolName,
            status: data.status || 'active'
            
        })
    },
    update: async (id, data) => {
        return roleRepository.update(id, {
            rolName: data.rolName,
            status: data.status || 'active'
        
        })
    },
    delete: async (id) => {
        return roleRepository.update (id, {
            status: 'inactive'
        })
    }
};

module.exports = { roleService };