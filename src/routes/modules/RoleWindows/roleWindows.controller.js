// Controller for RoleWindow entity. Handles HTTP requests, validation, and calls the service layer.
const { roleWindowService } = require('./roleWindows.service');
const ApiError = require('../../../utils/apiError');

const roleWindowController = {
    // List windows, with status filter and validation.
    listWindows: async(req, res, next) => {
        try {
            const status = (req.query.status || 'active').toLowerCase();
            const allowed = ['active', 'inactive', 'all'];
            if (!allowed.includes(status)){
                return next(ApiError.badRequest('El estado debe ser active, inactive o all'));
            }

            const data = await roleWindowService.listWindows({status});
            return res.status(200).json({ok: true, data});
        } catch (error) {
            return next(error);
        }
    },
    // List role-window permissions, with permission filters.
    list: async (req, res, next) => {
        try {
            const create = (Number(req.query.create) || 0);
            const update = (Number(req.query.update) || 0);
            const read = (Number(req.query.read) || 0);
            const remove = (Number(req.query.delete) || 0);

            const allowed = [1,0];

            if(!allowed.includes(create) || !allowed.includes(read) || !allowed.includes(update) || !allowed.includes(remove)) {
                return next(ApiError.badRequest('Los permisos no estan correctos'));
            }

            const data = await roleWindowService.list({create, read, update, remove});
            return res.status(200).json({ok: true, data});
            
        } catch (error) {
            return next(error);
        }
    },
    // Get a role-window permission by composite IDs.
    getByIds: async (req, res) => {
        const { idRole, idWindow } = req.params;
        try {
            const roleWindow = await roleWindowService.getByIds(idRole, idWindow);
            if(!roleWindow) {
                return res.status(404).json({
                    ok: false, error: 'roleWindow no encontrado'
                });
            }
            return res.status(200).json({ 
                ok: true, 
                data: roleWindow 
            });
        } catch(error) {
            return res.status(500).json({
                ok: false,
                error: 'Error interno del servidor'
            });
        }
    },

    // Create a new role-window permission.
    create: async (req, res) => {
        const { idRole, idWindow, create, read, update, remove } = req.body;
        try {
             if ([idRole, idWindow].some(v => v === undefined)) {
                return res.status(400).json({ ok:false, error: 'idRole y idWindow son requeridos' });
            }
            const newRoleWindow = await roleWindowService.create({
                idRole: Number(idRole),
                idWindow: Number(idWindow),
                create: Number(create),
                read: Number(read),
                update: Number(update),
                remove: Number(remove),
            });
            res.status(201).json({
                ok: true, 
                data: newRoleWindow
            })
        } catch (error) {
            console.log['[ROLEWINDOWS]'];

            return res.status(500).json({
                ok: false,
                error: 'Error interno del servidor'
            })
        } 
    },

    // Update a role-window permission by composite IDs.
    update: async (req, res) => {
        const { idRole, idWindow } = req.params;

        const asBool = v => v === true || v === 1 || v === '1' || v === 'true';

        const flags = {
            create: asBool(req.body.create),
            read:   asBool(req.body.read),
            update: asBool(req.body.update),
            remove: asBool(req.body.remove ?? req.body.delete), 
        };

        try {
            const updated = await roleWindowService.update(idRole, idWindow, flags);
            return res.json({ ok: true, data: updated });
        } catch (error) {
            console.error('[RoleWindow] update error', error);
            return res.status(500).json({ ok: false, error: error.message || 'Error al actualizar' });
        }
    },

    // Delete a role-window permission by composite IDs.
    delete: async (req, res) => {
        const { idRole, idWindow } = req.params;
        try {
            const deletedRoleWindow = await roleWindowService.delete(idRole, idWindow);
            if(!deletedRoleWindow) {
                return res.status(404).json({
                    ok: false, 
                    error: 'role no encontrado'
                });
            }
            res,json({
                ok: true,
                data: deletedRoleWindow
            });
        } catch (error) {
            console.log('[RoleWindow] delete error');
            const message = error.message || 'Error al eliminar roleWindow';
            return res.status(500).json({
                ok: false,
                error: message
            });
        }
    }
}

module.exports = { roleWindowController };