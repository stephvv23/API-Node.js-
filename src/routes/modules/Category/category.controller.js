// Controller for Category entity. Handles HTTP requests and responses, input validation, and calls the service layer.
const { categoryService } = require('./category.service');
const ApiError = require('../../../utils/apiResponse').ApiError;

const categoryController = {
    // List categories, with status filter and validation.
    list: async (req, res) => {
        const status = (req.query.status || 'active').toLowerCase();
        const allowed = ['active', 'inactive', 'all'];
        if (!allowed.includes(status)) {
            return res.validationErrors(['El estado debe ser "active", "inactive" o "all"']);
        }
        try {
            const data = await categoryService.list({ status });
            return res.success(data);
        } catch (error) {
            return res.error('Error al obtener categorías');
        }
    },

    // Get a category by ID, with validation.
    getById: async (req, res) => {
        const { id } = req.params;
        if (!/^[0-9\s]+$/.test(id)) {
            return res.validationErrors(['El id solo puede ser números']);
        }
        try {
            const category = await categoryService.getById(id);
            if (!category) {
                return res.notFound('Categoría');
            }
            return res.success(category);
        } catch (error) {
            return res.error('Error al obtener la categoría');
        }
    },

    // Create a new category, with input validation.
    create: async (req, res) => {
        const { EntityValidators } = require('../../../utils/validator');
        const validation = EntityValidators.category(req.body, { partial: false });
        if (!validation.isValid) {
            return res.validationErrors(validation.errors);
        }
        const allCategories = await categoryService.list({ status: 'all' });
        if (allCategories.some(c => c.name === req.body.name)) {
            return res.validationErrors(['Ya existe una categoría con ese nombre']);
        }
        try {
            const newCategory = await categoryService.create(req.body);
            return res.status(201).success(newCategory, 'Categoría creada exitosamente');
        } catch (error) {
            return res.error('Error al crear la categoría');
        }
    },

    // Update a category by ID, with validation.
    update: async (req, res) => {
        const { id } = req.params;
        if (!/^[0-9\s]+$/.test(id)) {
            return res.validationErrors(['El id solo puede ser números']);
        }
        // Confirmar existencia antes de editar
        const exists = await categoryService.getById(id);
        if (!exists) {
            return res.notFound('Categoría');
        }
        const { EntityValidators } = require('../../../utils/validator');
        const validation = EntityValidators.category(req.body, { partial: true });
        if (!validation.isValid) {
            return res.validationErrors(validation.errors);
        }
        if (req.body.name) {
            const existName = await categoryService.findByName(req.body.name.trim());
            const existId =
                existName?.id ?? 
                existName?.idCategory ?? 
                existName?._id ?? 
                existName?.ID;
            if (existName && String(existId) !== String(id)) {
                return res.validationErrors(['Ya existe una categoría con ese nombre']);
            }
        }
        try {
            const updatedCategory = await categoryService.update(id, req.body);
            return res.success(updatedCategory, 'Categoría actualizada exitosamente');
        } catch (error) {
            return res.error('Error al actualizar la categoría');
        }
    },

    // Soft-delete a category by ID.
    delete: async (req, res) => {
        const raw = String(req.params.id ?? '').trim();
        if (!/^[0-9\s]+$/.test(raw)) return res.validationErrors(['El id solo puede ser números']);
        const id = Number.parseInt(raw, 10);
        const exists = await categoryService.getById(id);
        if (!exists) {
            return res.notFound('Categoría');
        }
        try {
            const deletedCategory = await categoryService.delete(id);
            return res.success(deletedCategory, 'Categoría eliminada exitosamente');
        } catch (error) {
            return res.error('Error al eliminar la categoría');
        }
    }

}

module.exports = { categoryController };