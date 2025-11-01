const { CancerSurvivorRepository } = require('./cancerSurvivor.repository');

const CancerSurvivorService = {
  /**
   * Get all cancers for a survivor
   * @param {number} idSurvivor - Survivor ID
   */
  getBySurvivor: async (idSurvivor) => {
    return CancerSurvivorRepository.getBySurvivor(idSurvivor);
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
   * Remove a cancer from a survivor (hard delete)
   */
  delete: async (idSurvivor, idCancer) => {
    return CancerSurvivorRepository.delete(idSurvivor, idCancer);
  }
};

module.exports = { CancerSurvivorService };
