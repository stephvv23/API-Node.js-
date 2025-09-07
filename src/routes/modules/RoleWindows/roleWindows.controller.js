const { roleWindowService } = require('./roleWindows.service');
const ApiError = require('../../../utils/apiError');

const roleWindowController = {
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

    update: async (req, res) => {
        const { idRole,idWindow } = req.params;
        const { create, read, update, remove } = req.body;
        const errors = [];
        if (!/^[0-9]+$/.test(create)) errors.push('El campo create solo puede contener números.');
        else if (Number(create) > 0 && Number(create) < 1 ) errors.push('El create debe ser 1 o 0'); 

        if (!/^[0-9]+$/.test(read)) errors.push('El campo read solo puede contener números.');
        else if (Number(read) > 0 && Number(read) < 1 ) errors.push('El read debe ser 1 o 0');
        
        if (!/^[0-9]+$/.test(update)) errors.push('El campo update solo puede contener números.');
        else if (Number(update) > 0 && Number(update) < 1 ) errors.push('El read debe ser 1 o 0'); 

        if (!/^[0-9]+$/.test(remove)) errors.push('El campo remove solo puede contener números.');
        else if (Number(remove) > 0 && Number(remove) < 1 ) errors.push('El remove debe ser 1 o 0'); 
        
        try {
            const updatedRoleWindow = await roleWindowService.update(idRole, idWindow, {
                create,
                read,
                update,
                remove
            });

            if (!updatedRoleWindow) {
                return res.status(404).json({
                    ok: false, 
                    error: 'roleWindow no encontrado'
                });
            }
            res.json({
                ok: true,
                data: updatedRoleWindow
            })
        } catch (error){
            console.log('[RoleWindow] update error');
            const message = error.message || 'Error al actualizar';
            return res.status(500).json({
                ok: false,
                error: message
            });
        }
    },

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