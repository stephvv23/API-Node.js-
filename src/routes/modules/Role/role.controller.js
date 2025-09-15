// Controller for Role entity. Handles HTTP requests, validation, and calls the service layer.
const { roleService } = require('./role.service');
const ApiError = require('../../../utils/apiError')

const roleController = {
    // List roles, with status filter and validation.
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

    // Get a role by ID, with validation.
    getById: async (req, res) => {
        const { id } = req.params;
        if (!/^[0-9\s]+$/.test(id)) return res.status(400).json({ok: false, error: 'el id solo puede ser numeros'});
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

    // Create a new role, with input validation.
    create: async (req, res) => {
        const errors = [];
        
        const { rolName, status } = req.body;
        if (!rolName) errors.push('El campo nombre es obligatorio.');
        else if (!/^[a-zA-Z0-9\s]+$/.test(rolName)) errors.push('El campo nombre tiene caracteres invalidos');
        else if (rolName.length > 50) errors.push ('El campo nombre no puede tener mas de 50 caracteres');

        if (!status) errors.push('El campo estado es obligatorio');
        else if (!['active', 'inactive'].includes(status)) errors.push('El estado solo puede ser active o inactive');
        else if(status.length > 25) errors.push('El campo estado no puede tener mas de 25 caracteres');

        const allRols = await roleService.list({ status: 'all'})
        if (allRols.some(c => c.rolName === rolName)){
            errors.push('Ya existe un rol con ese nombre');
        }
        if (errors.length > 0){
            return res.status(400).json({ok: false, errors});
        }
        try {
            const newRole = await roleService.create({ rolName, status });
            res.status(201).json({ ok: true, data: newRole });
        } catch (error) {
            return next(ApiError.internal('Error interno create'));
        }

    },

    // Update a role by ID, with validation.
    update: async (req, res, next) => {
        const { id } = req.params;
        // Accepts 'rolName' or 'name' as alias
        let { rolName, name, status } = req.body;
        if (rolName === undefined && name !== undefined) rolName = name;

        const errors = [];

        // ID validation (digits only)
        if (!/^\d+$/.test(String(id))) {
            errors.push('El id solo puede contener números');
        }

        // Name validation (if present)
        if (rolName !== undefined) {
            const trimmed = String(rolName).trim();
            if (!trimmed) errors.push('El campo nombre es obligatorio');
            else if (!/^[a-zA-Z0-9\s]+$/.test(trimmed)) errors.push('El campo nombre tiene caracteres inválidos');
            else if (trimmed.length > 50) errors.push('El campo nombre no puede tener más de 50 caracteres');

            if (!errors.length) {
            const exist = await roleService.findByName(trimmed);
            const existId =
                exist?.idRole ?? exist?.id ?? exist?._id ?? exist?.ID;
            if (exist && String(existId) !== String(id)) {
                errors.push('Ya existe un rol con ese nombre');
            }
            }
            // if passed validation, normalize
            rolName = String(rolName).trim();
        }

        // Status validation (if present)
        if (status !== undefined) {
            if (!['active', 'inactive'].includes(String(status))) {
            errors.push('El campo estado debe ser "active" o "inactive"');
            } else if (String(status).length > 25) {
            errors.push('El campo estado no puede tener más de 25 caracteres');
            }
            status = String(status).trim();
        }

        if (errors.length) return res.status(400).json({ ok: false, errors });

        const payload = {};
        if (rolName !== undefined) payload.rolName = rolName; // correct key
        if (status  !== undefined) payload.status  = status;

        if (!Object.keys(payload).length) {
            return res.status(400).json({ ok: false, errors: ['Nada para actualizar'] });
        }

        try {
            const updated = await roleService.update(id, payload);
            if (!updated) return res.status(404).json({ ok: false, error: 'Rol no encontrado' });
            return res.status(200).json({ ok: true, data: updated });
        } catch (err) {
            return next?.(err) ?? res.status(500).json({ ok:false, error:'Error interno update' });
        }
    },


    // Soft-delete a role by ID.
    delete: async (req, res) => {
        const { id } = req.params;
        
        if (!/^[0-9\s]+$/.test(id)) return res.status(400).json({ok: false, error: 'el id solo puede ser numeros'});

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