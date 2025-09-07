const { roleWindowRepository } = require ('./roleWindows.repository');
// add the controller that the permissions are activated or deactivated depending on the others
const roleWindowService = {
    listWindows: async ({
        status = 'active', take, skip} = {}) => {
            return roleWindowRepository.listWindows({
                status, 
                take,
                skip
        });
    },
    list: async ({
        create = 1, read = 1, update = 1, remove = 1,take, skip} = {}) => {
            return roleWindowRepository.list({
                create, read, update, remove, take, skip
        });
    },
    getByIds: async (idRole, idWindow) => {
        return roleWindowRepository.getByIds(idRole, idWindow);
    },
    create: async (data) => {
        const toBool = v => v === true || v === 'true' || v === 1 || v === '1';
        return roleWindowRepository.create({
            idRole: data.idRole,
            idWindow: data.idWindow,
            create: toBool(data.create),
            read:   toBool(data.read),
            update: toBool(data.update),
            remove: toBool(data.remove),
        });
    },
    update: async (idRole,idWindow, data) => {
        return roleWindowRepository.update(idRole, idWindow, {
            create: data.create,
            read: data.read,
            update: data.update,
            remove: data.remove,
        });
    },
    delete: async (idRole, idWindow) => {
        return roleWindowRepository.delete(idRole, idWindow);
    }
}
module.exports = { roleWindowService };