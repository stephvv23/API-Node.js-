const { PermissionService } = require('./permission.service');

const PermissionController = {
  // GET /api/permissions/me/windows
  getMyWindows: async (req, res) => {
    try {
      const email = req.user?.sub;
      if (!email) return res.status(401).json({ message: 'Unauthorized' });

      const windows = await PermissionService.getMyWindows(email);
      res.json(windows);
    } catch (e) {
      console.error('[PERMISSIONS] getMyWindows error:', e);
      res.status(500).json({ message: 'Error al obtener permisos' });
    }
  },
};

module.exports = { PermissionController };
