const prisma = require('../../../lib/prisma.js');

const EmergencyContactSurvivorRepository = {
  /**
   * Get all emergency contacts for a specific survivor
   * @param {number} idSurvivor - Survivor ID
   * @param {string} status - Filter by status ('active', 'inactive', 'all'). Default: 'active'
   * @returns {Promise<Array>} List of emergency contacts with details
   */
  getBySurvivor: (idSurvivor, status = 'active') => {
    const where = { idSurvivor: Number(idSurvivor) };
    
    // Add status filter if not 'all'
    if (status !== 'all') {
      where.status = status;
    }
    
    return prisma.emergencyContactSurvivor.findMany({
      where,
      select: {
        idEmergencyContact: true,
        idSurvivor: true,
        status: true,
        emergencyContact: {
          select: {
            idEmergencyContact: true,
            nameEmergencyContact: true,
            emailEmergencyContact: true,
            relationship: true,
            status: true
          }
        }
      }
    });
  },

  /**
   * Get a specific emergency contact-survivor relation
   * @param {number} idSurvivor - Survivor ID
   * @param {number} idEmergencyContact - Emergency Contact ID
   * @returns {Promise<Object|null>} Emergency contact-survivor relation or null
   */
  findOne: (idSurvivor, idEmergencyContact) =>
    prisma.emergencyContactSurvivor.findUnique({
      where: {
        idEmergencyContact_idSurvivor: {
          idEmergencyContact: Number(idEmergencyContact),
          idSurvivor: Number(idSurvivor)
        }
      },
      select: {
        idEmergencyContact: true,
        idSurvivor: true,
        status: true,
        emergencyContact: {
          select: {
            idEmergencyContact: true,
            nameEmergencyContact: true,
            emailEmergencyContact: true,
            relationship: true,
            status: true
          }
        }
      }
    }),

  /**
   * Add an emergency contact to a survivor
   * @param {number} idSurvivor - Survivor ID
   * @param {number} idEmergencyContact - Emergency Contact ID
   * @param {string} status - Status (default: 'active')
   * @returns {Promise<Object>} Created emergency contact-survivor relation
   */
  create: (idSurvivor, idEmergencyContact, status = 'active') =>
    prisma.emergencyContactSurvivor.create({
      data: {
        idSurvivor: Number(idSurvivor),
        idEmergencyContact: Number(idEmergencyContact),
        status
      },
      select: {
        idEmergencyContact: true,
        idSurvivor: true,
        status: true,
        emergencyContact: {
          select: {
            idEmergencyContact: true,
            nameEmergencyContact: true,
            emailEmergencyContact: true,
            relationship: true,
            status: true
          }
        }
      }
    }),

  /**
   * Update emergency contact-survivor relation status
   * @param {number} idSurvivor - Survivor ID
   * @param {number} idEmergencyContact - Emergency Contact ID
   * @param {Object} data - Data to update (status)
   * @returns {Promise<Object>} Updated emergency contact-survivor relation
   */
  update: (idSurvivor, idEmergencyContact, data) =>
    prisma.emergencyContactSurvivor.update({
      where: {
        idEmergencyContact_idSurvivor: {
          idEmergencyContact: Number(idEmergencyContact),
          idSurvivor: Number(idSurvivor)
        }
      },
      data,
      select: {
        idEmergencyContact: true,
        idSurvivor: true,
        status: true,
        emergencyContact: {
          select: {
            idEmergencyContact: true,
            nameEmergencyContact: true,
            emailEmergencyContact: true,
            relationship: true,
            status: true
          }
        }
      }
    }),

  /**
   * Delete (soft delete) an emergency contact from a survivor
   * Changes status to 'inactive' instead of removing the record
   * @param {number} idSurvivor - Survivor ID
   * @param {number} idEmergencyContact - Emergency Contact ID
   * @returns {Promise<Object>} Updated emergency contact-survivor relation with inactive status
   */
  delete: (idSurvivor, idEmergencyContact) =>
    prisma.emergencyContactSurvivor.update({
      where: {
        idEmergencyContact_idSurvivor: {
          idEmergencyContact: Number(idEmergencyContact),
          idSurvivor: Number(idSurvivor)
        }
      },
      data: { status: 'inactive' },
      select: {
        idEmergencyContact: true,
        idSurvivor: true,
        status: true,
        emergencyContact: {
          select: {
            idEmergencyContact: true,
            nameEmergencyContact: true,
            emailEmergencyContact: true,
            relationship: true,
            status: true
          }
        }
      }
    })
};

module.exports = { EmergencyContactSurvivorRepository };
