const { categoryService } = require('./category.service');
const ApiError = require('../../../utils/apiError');

const categoryController = {
    list: async(req, res, next) => {
        try {
            const status = (req.query.status || 'active').toLowerCase();
            const allowed = ['active', 'inactive', 'all'];
            if (!allowed.includes(status)) {
                return next(ApiError.badRequest('El estado debe ser "active", "inactive" o "all"'));
            }

            const data = await categoryService.list({status});
            return res.status(200).json({ok: true, data});
        }catch (error) {
            return next (error);
        }
    },

    getById: async (req, res) => {
        const { id } = req.params;
        try {
            const category = await categoryService.getById(id);
            if (!category) {
                return res.status(404).json({ ok: false, error: 'Categoría no encontrada' });
            }
            return res.status(200).json({ ok: true, data: category });
        } catch (error) {
            return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
        }
    },

    create: async(req, res) => {
        const { name, status} = req.body;
        try {
            const newCategory = await categoryService.create({ name, status})
            res.status(201).json({ok: true, data: newCategory});
        } catch (error) {
            console.log('[CATEGORIES]');
            
            return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
        }
    },

    update: async (req, res) => {
        const { id } = req.params;
        const { name, status } = req.body;
        const errors = [];
        if (!name) errors.push('El campo "nombre" es obligatorio.');
        else if (!/^[a-zA-Z0-9\s]+$/.test(name)) errors.push('El campo "nombre" contiene caracteres inválidos.');

        if (!status) errors.push('El campo "estado" es obligatorio.');
        else if (!['active', 'inactive'].includes(status)) errors.push('El campo "estado" debe ser "active" o "inactive".');

        if (errors.length > 0) {
            return res.status(400).json({ ok: false, errors });
        }

        try {
            const updatedCategory = await categoryService.update(id, { name, status });
            if (!updatedCategory) {
                return res.status(404).json({ ok: false, error: 'Categoría no encontrada' });
            }
            res.json({ok: true, data: updatedCategory})
        } catch (error) {
            console.log('[Categories] update error');
            const message = error.message || 'Error al actualizar la categoria';
            return res.status(500).json({ ok: false, error: message });
        }
    },

    delete: async (req, res) => {
        const { id } = req.params;
        try {
            const deletedCategory = await categoryService.delete(id);
            if (!deletedCategory) {
                return res.status(404).json({ ok: false, error: 'Categoría no encontrada' });
            }
            res.json({ ok: true, data: deletedCategory });
        } catch (error) {
            console.log('[Categories] delete error');
            const message = error.message || 'Error al eliminar la categoria';
            return res.status(500).json({ ok: false, error: message });
        }
    }

}

module.exports = { categoryController };