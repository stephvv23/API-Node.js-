// modules/assets/assets.service.js
const { AssetsRepository } = require('./assets.repository');

// Custom error class for validation errors
class ValidationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = statusCode;
  }
}

// AssetsService contains business logic for asset operations.
// It interacts with AssetsRepository for database actions.
const AssetsService = {
  // Returns a list of all assets
  list: () => AssetsRepository.list(),

  // Retrieves an asset by id
  get: (idAsset) => AssetsRepository.findById(idAsset),

  // Creates a new asset
  create: async (data) => {
    // Validate that category exists and is active
    if (data.idCategory) {
      const categoryStatus = await AssetsRepository.categoryExists(data.idCategory);
      if (!categoryStatus.exists) {
        throw new ValidationError('Category does not exist');
      }
      if (!categoryStatus.active) {
        throw new ValidationError('Category is inactive');
      }
    }

    // Validate that headquarter exists and is active
    if (data.idHeadquarter) {
      const headquarterStatus = await AssetsRepository.headquarterExists(data.idHeadquarter);
      if (!headquarterStatus.exists) {
        throw new ValidationError('Headquarter does not exist');
      }
      if (!headquarterStatus.active) {
        throw new ValidationError('Headquarter is inactive');
      }
    }

    return AssetsRepository.create(data);
  },

  // Updates asset data by id
  update: async (idAsset, data) => {
    // Validate category if being updated
    if (data.idCategory) {
      const categoryStatus = await AssetsRepository.categoryExists(data.idCategory);
      if (!categoryStatus.exists) {
        throw new ValidationError('Category does not exist');
      }
      if (!categoryStatus.active) {
        throw new ValidationError('Category is inactive');
      }
    }

    // Validate headquarter if being updated
    if (data.idHeadquarter) {
      const headquarterStatus = await AssetsRepository.headquarterExists(data.idHeadquarter);
      if (!headquarterStatus.exists) {
        throw new ValidationError('Headquarter does not exist');
      }
      if (!headquarterStatus.active) {
        throw new ValidationError('Headquarter is inactive');
      }
    }

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
