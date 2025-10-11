// Service layer for Category entity. Handles business logic and delegates data access to the repository.
const { categoryRepository} = require('./category.repository');  

const categoryService = {
    // List categories, optionally filtered by status, with pagination.
    list: async ({status = 'active', take, skip} = {}) => {
        return categoryRepository.list({status, take, skip});
    },

    // Get a category by its ID.
    getById: async (id) => {
        return categoryRepository.getById(id);
    },
    // Find a category by its name.
    findByName: async (name) => {
        return categoryRepository.findByName(name);
    },
    // Create a new category.
    create: async (data) => {
        return categoryRepository.create({
            name: data.name,
            status: data.status || 'active'
        })
    },
    // Update an existing category by ID.
    update: async (id, data) => {
        return categoryRepository.update(id, {
            name: data.name,
            status: data.status 
        })
    }, 
    // Soft-delete a category (set status to 'inactive').
    delete: async (id) => {
        return categoryRepository.update(id, {
            status: 'inactive'
        })
    }
};

module.exports = { categoryService };