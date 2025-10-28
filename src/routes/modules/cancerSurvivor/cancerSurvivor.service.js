const { CancerSurvivorRepository } = require('./cancerSurvivor.repository');

const CancerSurvivorService = {
  /**
   * Get all cancers for a survivor
   * @param {number} idSurvivor - Survivor ID
   * @param {string} status - Filter by status ('active', 'inactive', 'all'). Default: 'active'
   */
  getBySurvivor: async (idSurvivor, status = 'active') => {
    return CancerSurvivorRepository.getBySurvivor(idSurvivor, status);
  },

  /**
   * Get a specific cancer-survivor relation
   */
  findOne: async (idSurvivor, idCancer) => {
    return CancerSurvivorRepository.findOne(idSurvivor, idCancer);
  },

  /**
   * Add a cancer to a survivor
   */
  create: async (idSurvivor, idCancer, stage, status = 'active') => {
    return CancerSurvivorRepository.create(idSurvivor, idCancer, stage, status);
  },

  /**
   * Update cancer stage or status
   */
  update: async (idSurvivor, idCancer, data) => {
    return CancerSurvivorRepository.update(idSurvivor, idCancer, data);
  },

  /**
   * Remove a cancer from a survivor
   */
  delete: async (idSurvivor, idCancer) => {
    return CancerSurvivorRepository.delete(idSurvivor, idCancer);
  }
};

module.exports = { CancerSurvivorService };
