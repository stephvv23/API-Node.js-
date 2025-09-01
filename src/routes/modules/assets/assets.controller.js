const { AssetsService } = require('./asstes.service');

/**
 * AssetsController maneja las peticiones HTTP para assets.
 */
const AssetsController = {
  /**
   * Listar todos los assets.
   * GET /assets
   */
  list: async (_req, res, next) => {
    try {
      const assets = await AssetsService.list();
      res.json(assets);
    } catch (err) { next(err); }
  },

  /**
   * Obtener un asset por id.
   * GET /assets/:idAsset
   */
  get: async (req, res, next) => {
    try {
      const asset = await AssetsService.get(req.params.idAsset);
      if (!asset) return res.status(404).json({ message: 'Asset no encontrado' });
      res.json(asset);
    } catch (err) { next(err); }
  },

  /**
   * Crear un nuevo asset.
   * POST /assets
   */
  create: async (req, res, next) => {
    try {
      const asset = await AssetsService.create(req.body);
      res.status(201).json(asset);
    } catch (err) { next(err); }
  },

  /**
   * Actualizar un asset por id.
   * PUT /assets/:idAsset
   */
  update: async (req, res, next) => {
    try {
      const asset = await AssetsService.update(req.params.idAsset, req.body);
      res.json(asset);
    } catch (err) { next(err); }
  },

  /**
   * Eliminar un asset por id.
   * DELETE /assets/:idAsset
   */
  delete: async (req, res, next) => {
    try {
      await AssetsService.delete(req.params.idAsset);
      res.status(204).end();
    } catch (err) { next(err); }
  },
};

module.exports = { AssetsController };