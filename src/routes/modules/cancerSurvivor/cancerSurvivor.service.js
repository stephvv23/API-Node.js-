const { CancerSurvivorRepository } = require('./cancerSurvivor.repository');

const CancerSurvivorService = {
  /**
   * Get cancers for a survivor with status filter
   * @param {number} idSurvivor - Survivor ID
   * @param {Object} options - Pagination and filter options { take, skip, status }
   */
  getBySurvivor: async (idSurvivor, options = {}) => {
    return CancerSurvivorRepository.getBySurvivor(idSurvivor, options);
  },

  /**
   * Get a specific active cancer-survivor relation
   */
  findOne: async (idSurvivor, idCancer) => {
    return CancerSurvivorRepository.findOne(idSurvivor, idCancer);
  },

  /**
   * Find a cancer-survivor relation regardless of status
   */
  findOneAnyStatus: async (idSurvivor, idCancer) => {
    return CancerSurvivorRepository.findOneAnyStatus(idSurvivor, idCancer);
  },

  /**
   * Add a cancer to a survivor
   */
  create: async (idSurvivor, idCancer, stage) => {
    return CancerSurvivorRepository.create(idSurvivor, idCancer, stage);
  },

  /**
   * Update cancer stage
   */
  update: async (idSurvivor, idCancer, data) => {
    return CancerSurvivorRepository.update(idSurvivor, idCancer, data);
  },

  /**
   * Soft delete - marks the relation as inactive
   */
  softDelete: async (idSurvivor, idCancer) => {
    return CancerSurvivorRepository.softDelete(idSurvivor, idCancer);
  },

  /**
   * Reactivate a previously soft-deleted relation
   */
  reactivate: async (idSurvivor, idCancer) => {
    return CancerSurvivorRepository.reactivate(idSurvivor, idCancer);
  }
};

module.exports = { CancerSurvivorService };
