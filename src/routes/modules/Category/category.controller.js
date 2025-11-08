// Controller for Category entity. Handles HTTP requests and responses, input validation, and calls the service layer.
const { categoryService } = require('./category.service');
const ApiError = require('../../../utils/apiResponse').ApiError;
const { EntityValidators, ValidationRules } = require('../../../utils/validator');
const { SecurityLogService } = require('../../../services/securitylog.service');

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

        // Trim string fields to avoid whitespace issues
        const trimmedBody = ValidationRules.trimStringFields(req.body);
        
        const validation = EntityValidators.category(trimmedBody, { partial: false });
        
        if (!validation.isValid) {
            return res.validationErrors(validation.errors);
        }
        const allCategories = await categoryService.list({ status: 'all' });
        if (allCategories.some(c => c.name === trimmedBody.name)) {
            return res.validationErrors(['Ya existe una categoría con ese nombre']);
        }
        try {
            const newCategory = await categoryService.create(trimmedBody);

            const userEmail = req.user?.sub;
            await SecurityLogService.log({
                email: userEmail,
                action: 'CREATE',
                description: `Categoría creada: ` +
                `ID: "${newCategory.idCategory}", ` +
                `Nombre: "${newCategory.name}", ` +
                `Estado: "${newCategory.status}"`,
                affectedTable: 'Category',
            });
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
        
        const exists = await categoryService.getById(id);
        if (!exists) {
            return res.notFound('Categoría');
        }
        // Trim string fields to avoid whitespace issues
        const trimmedBody = ValidationRules.trimStringFields(req.body);
        
        const validation = EntityValidators.category(trimmedBody, { partial: true });
        
        if (!validation.isValid) {
            return res.validationErrors(validation.errors);
        }
        if (trimmedBody.name) {
            const existName = await categoryService.findByName(trimmedBody.name);
            const existId =
                existName?.id ?? 
                existName?.idCategory ?? 
                existName?._id ?? 
                existName?.ID;
            if (existName && String(existId) !== String(id)) {
                return res.validationErrors(['Ya existe una categoría con ese nombre']);
            }
        }

        const previousCategory = await categoryService.getById(id);

        
        const userEmail = req.user?.sub;
        try {
            const updatedCategory = await categoryService.update(id, trimmedBody);
            const nameUnchanged = previousCategory.name === updatedCategory.name;
            const movedInactiveToActive =
            previousCategory.status === 'inactive' && updatedCategory.status === 'active';
            const movedActiveToInactive =
            previousCategory.status === 'active' && updatedCategory.status === 'inactive';
            const statusChanged = movedInactiveToActive || movedActiveToInactive;

            if (statusChanged && nameUnchanged) {
            const action = movedInactiveToActive ? 'REACTIVATE' : 'DEACTIVATE';
            await SecurityLogService.log({
                email: userEmail,
                action,
                description:
                `Categoría ${action === 'REACTIVATE' ? 'reactivada' : 'desactivada'}: ` +
                `ID: "${id}", ` +
                `Nombre: "${updatedCategory.name}", ` +
                `Estado: "${updatedCategory.status}"`,
                affectedTable: 'Category',
            });
            } else {
            await SecurityLogService.log({
                email: userEmail,
                action: 'UPDATE',
                description:
                `Categoría actualizada: ` +
                `ID: "${id}", ` +
                `Nombre: "${updatedCategory.name}", ` +
                `Estado: "${updatedCategory.status}"`,
                affectedTable: 'Category',
            });
            }
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
            const userEmail = req.user?.sub;
            await SecurityLogService.log({
                email: userEmail,
                action: 'DELETE',
                description: `Categoría eliminada: ` +
                `ID: "${deletedCategory.idCategory}", ` +
                `Nombre: "${deletedCategory.name}", ` +
                `Estado: "${deletedCategory.status}"`,
                affectedTable: 'Category',
            });
            return res.success(deletedCategory, 'Categoría eliminada exitosamente');
        } catch (error) {
            return res.error('Error al eliminar la categoría');
        }
    }

}

module.exports = { categoryController };