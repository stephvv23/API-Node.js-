const { AssetsService } = require('./assetes.service');

/**
 * AssetsController handles HTTP requests for assets.
 */
const AssetsController = {
  /**
   * List all assets.
   * GET /assets
   */
  list: async (_req, res, next) => {
    try {
      const assets = await AssetsService.list();
      res.json(assets);
    } catch (err) { next(err); }
  },

  /**
   * Get an asset by id.
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
   * Create a new asset.
   * POST /assets
   */
  create: async (req, res, next) => {
    try {
      const asset = await AssetsService.create(req.body);
      res.status(201).json(asset);
    } catch (err) { next(err); }
  },

  /**
   * Update an asset by id.
   * PUT /assets/:idAsset
   */
  update: async (req, res, next) => {
    try {
      const asset = await AssetsService.update(req.params.idAsset, req.body);
      res.json(asset);
    } catch (err) { next(err); }
  },

  /**
   * Delete an asset by id.
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