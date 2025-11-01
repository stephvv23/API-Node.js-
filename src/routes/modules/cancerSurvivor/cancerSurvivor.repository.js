const prisma = require('../../../lib/prisma.js');

const CancerSurvivorRepository = {
  /**
   * Get all active cancers for a specific survivor
   * @param {number} idSurvivor - Survivor ID
   * @param {Object} options - Pagination options { take, skip }
   * @returns {Promise<Array>} List of cancers with details
   */
  getBySurvivor: (idSurvivor, { take = 10, skip = 0 } = {}) => {
    return prisma.cancerSurvivor.findMany({
      where: { 
        idSurvivor: Number(idSurvivor),
        status: 'active' // Only return active relations
      },
      take: Number(take),
      skip: Number(skip),
      select: {
        idCancer: true,
        idSurvivor: true,
        stage: true,
        status: true,
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
   * Get a specific cancer-survivor relation (only if active)
   * @param {number} idSurvivor - Survivor ID
   * @param {number} idCancer - Cancer ID
   * @returns {Promise<Object|null>} Cancer-survivor relation or null
   */
  findOne: (idSurvivor, idCancer) =>
    prisma.cancerSurvivor.findFirst({
      where: {
        idCancer: Number(idCancer),
        idSurvivor: Number(idSurvivor),
        status: 'active' // Only return if active
      },
      select: {
        idCancer: true,
        idSurvivor: true,
        stage: true,
        status: true,
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
   * Check if a cancer-survivor relation exists (regardless of status)
   * @param {number} idSurvivor - Survivor ID
   * @param {number} idCancer - Cancer ID
   * @returns {Promise<Object|null>} Cancer-survivor relation or null
   */
  findOneAnyStatus: (idSurvivor, idCancer) =>
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
        status: true,
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
        stage,
        status: 'active'
      },
      select: {
        idCancer: true,
        idSurvivor: true,
        stage: true,
        status: true,
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
        status: true,
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
   * Soft delete a cancer from a survivor
   * Marks the relation as inactive instead of deleting
   * @param {number} idSurvivor - Survivor ID
   * @param {number} idCancer - Cancer ID
   * @returns {Promise<Object>} Updated cancer-survivor relation
   */
  softDelete: (idSurvivor, idCancer) =>
    prisma.cancerSurvivor.update({
      where: {
        idCancer_idSurvivor: {
          idCancer: Number(idCancer),
          idSurvivor: Number(idSurvivor)
        }
      },
      data: {
        status: 'inactive'
      },
      select: {
        idCancer: true,
        idSurvivor: true,
        stage: true,
        status: true
      }
    }),

  /**
   * Reactivate a previously soft-deleted cancer-survivor relation
   * @param {number} idSurvivor - Survivor ID
   * @param {number} idCancer - Cancer ID
   * @returns {Promise<Object>} Reactivated cancer-survivor relation
   */
  reactivate: (idSurvivor, idCancer) =>
    prisma.cancerSurvivor.update({
      where: {
        idCancer_idSurvivor: {
          idCancer: Number(idCancer),
          idSurvivor: Number(idSurvivor)
        }
      },
      data: {
        status: 'active'
      },
      select: {
        idCancer: true,
        idSurvivor: true,
        stage: true,
        status: true,
        cancer: {
          select: {
            idCancer: true,
            cancerName: true,
            description: true
          }
        }
      }
    })
};

module.exports = { CancerSurvivorRepository };
