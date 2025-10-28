const prisma = require('../../../lib/prisma.js');

const CancerSurvivorRepository = {
  /**
   * Get all cancers for a specific survivor
   * @param {number} idSurvivor - Survivor ID
   * @param {string} status - Filter by status ('active', 'inactive', 'all'). Default: 'active'
   * @returns {Promise<Array>} List of cancers with details
   */
  getBySurvivor: (idSurvivor, status = 'active') => {
    const where = { idSurvivor: Number(idSurvivor) };
    
    // Add status filter if not 'all'
    if (status !== 'all') {
      where.status = status;
    }

    return prisma.cancerSurvivor.findMany({
      where,
      select: {
        idCancer: true,
        idSurvivor: true,
        status: true,
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
        status: true,
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
   * @param {string} status - Status (default: 'active')
   * @returns {Promise<Object>} Created cancer-survivor relation
   */
  create: (idSurvivor, idCancer, stage, status = 'active') =>
    prisma.cancerSurvivor.create({
      data: {
        idSurvivor: Number(idSurvivor),
        idCancer: Number(idCancer),
        stage,
        status
      },
      select: {
        idCancer: true,
        idSurvivor: true,
        status: true,
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
   * Update cancer stage or status
   * @param {number} idSurvivor - Survivor ID
   * @param {number} idCancer - Cancer ID
   * @param {Object} data - Data to update (stage, status)
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
        status: true,
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
   * Delete (soft delete) a cancer from a survivor
   * Changes status to 'inactive' instead of removing the record
   * @param {number} idSurvivor - Survivor ID
   * @param {number} idCancer - Cancer ID
   * @returns {Promise<Object>} Updated cancer-survivor relation with inactive status
   */
  delete: (idSurvivor, idCancer) =>
    prisma.cancerSurvivor.update({
      where: {
        idCancer_idSurvivor: {
          idCancer: Number(idCancer),
          idSurvivor: Number(idSurvivor)
        }
      },
      data: { status: 'inactive' },
      select: {
        idCancer: true,
        idSurvivor: true,
        status: true,
        stage: true,
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
