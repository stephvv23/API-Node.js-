const { categoryRepository} = require('./category.repository');  

const categoryService = {
    list: async ({status = 'active', take, skip} = {}) => {
        return categoryRepository.list({status, take, skip});
    },

    getById: async (id) => {
        return categoryRepository.getById(id);
    },
    create: async (data) => {
        return categoryRepository.create({
            name: data.name,
            status: data.status || 'active'
        })
    },
    update: async (id, data) => {
        return categoryRepository.update(id, {
            name: data.name,
            status: data.status || 'active'
        })
    }, 
    delete: async (id) => {
        return categoryRepository.update(id, {
            status: 'inactive'
        })
    }
};

module.exports = { categoryService };