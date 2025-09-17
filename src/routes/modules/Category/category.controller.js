// Controller for Category entity. Handles HTTP requests and responses, input validation, and calls the service layer.
const { categoryService } = require('./category.service');
const ApiError = require('../../../utils/apiError');

const categoryController = {
    // List categories, with status filter and validation.
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

    // Get a category by ID, with validation.
    getById: async (req, res) => {
        const { id } = req.params;
        if (!/^[0-9\s]+$/.test(id)) 
            return res.status(404).json({ok: false, error: 'El id solo puede ser numeros'});

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

    // Create a new category, with input validation.
    create: async(req, res) => {
        const { name, status} = req.body;
        const errors = [];
        if (!name) errors.push('El campo "nombre" es obligatorio.');
        else if (!/^[a-zA-Z0-9\s]+$/.test(name)) errors.push('El campo "nombre" contiene caracteres inválidos.');
        else if(name.length > 150) errors.push('El campo nombre no puede tener mas de 150 caracteres');

        if (!status) errors.push('El campo "estado" es obligatorio.');
        else if (!['active', 'inactive'].includes(status)) errors.push('El campo "estado" debe ser "active" o "inactive".');
        else if(status.length > 25) errors.push('El campo status no puede tener mas de 25 caracteres');
        
        const allCategories = await categoryService.list({ status: 'all' })
        if (allCategories.some(c => c.name === name)) {
            errors.push('Ya existe una categoria con ese nombre');
        }
        if (errors.length > 0) {
            return res.status(400).json({ ok: false, errors });
        }
        try {
            const newCategory = await categoryService.create({ name, status})
            res.status(201).json({ok: true, data: newCategory});
        } catch (error) {
            console.log('[CATEGORIES]');
            
            return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
        }
    },

    // Update a category by ID, with validation.
    update: async (req, res) => {
        const { id } = req.params;
        const { name, status } = req.body;
        const errors = [];

        if (name !== undefined) {
            const trimmed = String(name).trim();
            if (!trimmed) errors.push('El campo "nombre" es obligatorio.');
            else if (!/^[a-zA-Z0-9\s]+$/.test(trimmed)) errors.push('El campo "nombre" contiene caracteres inválidos.');
            else if (trimmed.length > 150) errors.push('El campo nombre no puede tener mas de 150 caracteres');

            const existName = await categoryService.findByName(trimmed);
            const existId =
            existName?.id ?? 
            existName?.idCategory ?? 
            existName?._id ?? 
            existName?.ID;

            if (existName && String(existId) !== String(id)) {
            errors.push('ya existe una categoria con ese nombre');
            }
        }

        if (status !== undefined) {
            if (!['active', 'inactive'].includes(status))
            errors.push('El campo "estado" debe ser "active" o "inactive".');
            else if (String(status).length > 25)
            errors.push('El campo status no puede tener mas de 25 caracteres');
        }
        if (!/^[0-9\s]+$/.test(id)) 
            errors.push('El id solo puede ser numeros');
        

        if (errors.length) return res.status(400).json({ ok: false, errors });

        const payload = {};
        if (name !== undefined) payload.name = String(name).trim();
        if (status !== undefined) payload.status = status;

        if (!Object.keys(payload).length)
            return res.status(400).json({ ok: false, errors: ['Nada para actualizar'] });

        try {
            const updatedCategory = await categoryService.update(id, payload);
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

    // Soft-delete a category by ID.
    delete: async (req, res) => {
        const raw = String(req.params.id ?? '').trim();
        

        if (!/^[0-9\s]+$/.test(raw)) return res.status(400).json({ok: false, error: 'el id solo puede ser numeros'});
        
        const id = Number.parseInt(raw, 10);
        
        try {
            const deletedCategory = await categoryService.delete(id);
            if (!deletedCategory) {
                return res.status(404).json({ ok: false, error: 'Categoría no encontrada' });
            }
            return res.json({ ok: true, data: deletedCategory });
        } catch (error) {
            console.log('[Categories] delete error');
            const message = error.message || 'Error al eliminar la categoria';
            return res.status(500).json({ ok: false, error: message });
        }
    }

}

module.exports = { categoryController };