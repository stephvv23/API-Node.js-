// modules/assets/assets.service.js
const { AssetsRepository } = require('./assets.repository');

// AssetsService contains business logic for asset operations.
// It interacts with AssetsRepository for database actions.
const AssetsService = {
  // Returns a list of all assets
  list: () => AssetsRepository.list(),

  // Retrieves an asset by id
  get: (idAsset) => AssetsRepository.findById(idAsset),

  // Creates a new asset
  create: async (data) => {
    return AssetsRepository.create(data);
  },

  // Updates asset data by id
  update: async (idAsset, data) => {
    return AssetsRepository.update(idAsset, data);
  },

  // Deletes an asset by id
  delete: (idAsset) => AssetsRepository.remove(idAsset),

  // Lists assets filtered by user email
  listByUserEmail: async (email) => {
    try {
      // Assuming there's a userAssets table linking users and assets
      return await AssetsRepository.listByUserEmail(email);
    } catch (e) {
      throw new Error(`[AssetsService.listByUserEmail] ${e.message}`);
    }
  },
};
module.exports = { AssetsService };
