// Service layer for RoleWindow entity. Handles business logic and delegates data access to the repository.
const { roleWindowRepository } = require ('./roleWindows.repository');
// add the controller that the permissions are activated or deactivated depending on the others
const roleWindowService = {
    // List windows, optionally filtered by status, with pagination.
    listWindows: async ({
        status = 'active', take, skip} = {}) => {
            return roleWindowRepository.listWindows({
                status, 
                take,
                skip
        });
    },
    // List role-window permissions, with permission filters and pagination.
    list: async ({
        create = 1, read = 1, update = 1, remove = 1,take, skip} = {}) => {
            return roleWindowRepository.list({
                create, read, update, remove, take, skip
        });
    },
    // Get a role-window permission by composite IDs.
    getByIds: async (idRole, idWindow) => {
        return roleWindowRepository.getByIds(idRole, idWindow);
    },
    // Create or update a role-window permission.
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
    // Update a role-window permission by composite IDs.
    update: async (idRole, idWindow, data) => {
    const toInt = (v, name) => {
        const n = Number(v);
        if (!Number.isInteger(n)) throw new Error(`${name} inválido`);
        return n;
    };
    const toBool = v => v === true || v === 1 || v === '1' || v === 'true' || v === 'on';

    const roleId   = toInt(idRole, 'idRole');
    const windowId = toInt(idWindow, 'idWindow');

    const flags = {
        create: toBool(data.create),
        read:   toBool(data.read),
        update: toBool(data.update),
        remove: toBool(data.remove), 
    };

    return roleWindowRepository.update(roleId, windowId, flags);
    },


    // Delete a role-window permission by composite IDs.
    delete: async (idRole, idWindow) => {
        return roleWindowRepository.delete(idRole, idWindow);
    }
}
module.exports = { roleWindowService };