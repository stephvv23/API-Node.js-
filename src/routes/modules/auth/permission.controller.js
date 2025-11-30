const { PermissionService } = require('./permission.service');

const PermissionController = {
  // GET /api/permissions/me/windows
  getMyWindows: async (req, res) => {
    try {
      const email = req.user?.sub;
      if (!email) return res.error('No autorizado', 401);

      const windows = await PermissionService.getMyWindows(email);
      return res.success(windows);
    } catch (error) {
      
      return res.error('Error al obtener permisos');
    }
  },
};

module.exports = { PermissionController };
