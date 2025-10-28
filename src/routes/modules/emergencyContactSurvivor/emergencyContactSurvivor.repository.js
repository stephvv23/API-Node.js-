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
    
    // Note: EmergencyContactSurvivor doesn't have a status field in schema
    // So we filter by the status of the related EmergencyContact
    
    return prisma.emergencyContactSurvivor.findMany({
      where,
      select: {
        idEmergencyContact: true,
        idSurvivor: true,
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
   * @returns {Promise<Object>} Created emergency contact-survivor relation
   */
  create: (idSurvivor, idEmergencyContact) =>
    prisma.emergencyContactSurvivor.create({
      data: {
        idSurvivor: Number(idSurvivor),
        idEmergencyContact: Number(idEmergencyContact)
      },
      select: {
        idEmergencyContact: true,
        idSurvivor: true,
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
   * Delete (remove) an emergency contact from a survivor
   * Hard delete since EmergencyContactSurvivor doesn't have status field
   * @param {number} idSurvivor - Survivor ID
   * @param {number} idEmergencyContact - Emergency Contact ID
   * @returns {Promise<Object>} Deleted emergency contact-survivor relation
   */
  delete: (idSurvivor, idEmergencyContact) =>
    prisma.emergencyContactSurvivor.delete({
      where: {
        idEmergencyContact_idSurvivor: {
          idEmergencyContact: Number(idEmergencyContact),
          idSurvivor: Number(idSurvivor)
        }
      }
    })
};

module.exports = { EmergencyContactSurvivorRepository };
