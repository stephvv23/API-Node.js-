const { roleService } = require('./role.service');
const ApiError = require('../../../utils/apiError')

const roleController = {
    list: async (req, res, next) => {
        try {
            const status = (req.query.status || 'active').toLowerCase();
            const allowed = ['active', 'inactive', 'all'];
            if (!allowed.includes(status)) {
                return next(ApiError.badRequest('El estado debe ser activo, inactivo o todos'));

            }
            const data = await roleService.list({ status });
            return res.status(200).json({ ok: true, data });
        } catch (error) {
            return next(ApiError.internal('Error interno list'));
        }
    },

    getById: async (req, res) => {
        const { id } = req.params;
        try {
            const role = await roleService.getById(id);
            if (!role) {
                return res.status(404).json({ ok: false, error: 'Rol no encontrado' });
            }
            return res.status(200).json({ ok: true, data: role });
        } catch (error) {
            return res.status(500).json({ ok: false, error: 'Error interno del servidor ID' });
        }
    },

    create: async (req, res) => {
        const { rolName, status } = req.body;
        try {
            const newRole = await roleService.create({ rolName, status });
            res.status(201).json({ ok: true, data: newRole });
        } catch (error) {
            return next(ApiError.internal('Error interno create'));
        }

    },

    update: async (req, res) => {
        const{ id } = req.params;
        const { rolName, status } = req.body;
        const errors = [];
        if (!rolName) errors.push('El campo nombre es obligatorio');
        else if (!/^[a-zA-Z0-9\s]+$/.test(rolName)) errors.push('El campo nombre contiene caracteres inválidos');
        if (!status) errors.push('El campo estado es obligatorio');
        else if (!['active', 'inactive'].includes(status)) errors.push('El campo estado debe ser active o inactive');
        if (errors.length > 0) {
            return res.status(400).json({ ok: false, errors });
        }
        try {
            const updatedRole = await roleService.update(id, { rolName, status });
            if (!updatedRole) {
                return res.status(404).json({ ok: false, error: 'Rol no encontrado' });
            }
            return res.status(200).json({ ok: true, data: updatedRole });
        } catch (error) {
            return next(ApiError.internal('Error interno update'));
        }
    },

    delete: async (req, res) => {
        const { id } = req.params;
        try {
            const deletedRole = await roleService.delete(id);
            if (!deletedRole) {
                return res.status(404).json({ ok: false, error: 'Rol no encontrado' });
            }
            return res.status(200).json({ ok: true, data: deletedRole });
        } catch (error) {
            return next(ApiError.internal('Error interno delete'));
        }
    }

};

module.exports = { roleController };