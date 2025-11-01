const prisma = require('../../../lib/prisma.js');

const CancerSurvivorRepository = {
  /**
   * Get all cancers for a specific survivor
   * @param {number} idSurvivor - Survivor ID
   * @returns {Promise<Array>} List of cancers with details
   */
  getBySurvivor: (idSurvivor) => {
    return prisma.cancerSurvivor.findMany({
      where: { idSurvivor: Number(idSurvivor) },
      select: {
        idCancer: true,
        idSurvivor: true,
        stage: true,
        cancer: {
          select: {
            idCancer: true,
            cancerName: true,
            description: true,
            status: true
          }
        }
      }
    });
  },

  /**
   * Get a specific cancer-survivor relation
   * @param {number} idSurvivor - Survivor ID
   * @param {number} idCancer - Cancer ID
   * @returns {Promise<Object|null>} Cancer-survivor relation or null
   */
  findOne: (idSurvivor, idCancer) =>
    prisma.cancerSurvivor.findUnique({
      where: {
        idCancer_idSurvivor: {
          idCancer: Number(idCancer),
          idSurvivor: Number(idSurvivor)
        }
      },
      select: {
        idCancer: true,
        idSurvivor: true,
        stage: true,
        cancer: {
          select: {
            idCancer: true,
            cancerName: true,
            description: true,
            status: true
          }
        }
      }
    }),

  /**
   * Add a cancer to a survivor
   * @param {number} idSurvivor - Survivor ID
   * @param {number} idCancer - Cancer ID
   * @param {string} stage - Cancer stage
   * @returns {Promise<Object>} Created cancer-survivor relation
   */
  create: (idSurvivor, idCancer, stage) =>
    prisma.cancerSurvivor.create({
      data: {
        idSurvivor: Number(idSurvivor),
        idCancer: Number(idCancer),
        stage
      },
      select: {
        idCancer: true,
        idSurvivor: true,
        stage: true,
        cancer: {
          select: {
            idCancer: true,
            cancerName: true,
            description: true
          }
        }
      }
    }),

  /**
   * Update cancer stage
   * @param {number} idSurvivor - Survivor ID
   * @param {number} idCancer - Cancer ID
   * @param {Object} data - Data to update (stage)
   * @returns {Promise<Object>} Updated cancer-survivor relation
   */
  update: (idSurvivor, idCancer, data) =>
    prisma.cancerSurvivor.update({
      where: {
        idCancer_idSurvivor: {
          idCancer: Number(idCancer),
          idSurvivor: Number(idSurvivor)
        }
      },
      data,
      select: {
        idCancer: true,
        idSurvivor: true,
        stage: true,
        cancer: {
          select: {
            idCancer: true,
            cancerName: true,
            description: true
          }
        }
      }
    }),

  /**
   * Delete (hard delete) a cancer from a survivor
   * Permanently removes the record
   * @param {number} idSurvivor - Survivor ID
   * @param {number} idCancer - Cancer ID
   * @returns {Promise<Object>} Deleted cancer-survivor relation
   */
  delete: (idSurvivor, idCancer) =>
    prisma.cancerSurvivor.delete({
      where: {
        idCancer_idSurvivor: {
          idCancer: Number(idCancer),
          idSurvivor: Number(idSurvivor)
        }
      }
    })
};

module.exports = { CancerSurvivorRepository };
