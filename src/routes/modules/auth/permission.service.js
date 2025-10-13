const { PermissionRepository } = require('./permission.repository');

const PermissionService = {
  getMyWindows: (email) => PermissionRepository.getWindowsForUser(email),
};

module.exports = { PermissionService };