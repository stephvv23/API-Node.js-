const prisma = require('../../../lib/prisma.js');

const EmergencyContactSurvivorRepository = {
  /**
   * Get all emergency contacts for a specific survivor
   * @param {number} idSurvivor - Survivor ID
   * @param {Object} options - Pagination options { take, skip }
   * @returns {Promise<Array>} List of emergency contacts with details
   */
  getBySurvivor: (idSurvivor, { take = 10, skip = 0 } = {}) => {
    return prisma.emergencyContactSurvivor.findMany({
      where: { idSurvivor: Number(idSurvivor) },
      take: Number(take),
      skip: Number(skip),
      select: {
        idEmergencyContact: true,
        idSurvivor: true,
        relationshipType: true,
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
        relationshipType: true,
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
   * @param {string} relationshipType - Relationship type between contact and survivor
   * @returns {Promise<Object>} Created emergency contact-survivor relation
   */
  create: (idSurvivor, idEmergencyContact, relationshipType) =>
    prisma.emergencyContactSurvivor.create({
      data: {
        idSurvivor: Number(idSurvivor),
        idEmergencyContact: Number(idEmergencyContact),
        relationshipType: String(relationshipType)
      },
      select: {
        idEmergencyContact: true,
        idSurvivor: true,
        relationshipType: true,
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
   * Update relationship type of an emergency contact-survivor relation
   * @param {number} idSurvivor - Survivor ID
   * @param {number} idEmergencyContact - Emergency Contact ID
   * @param {string} relationshipType - New relationship type
   * @returns {Promise<Object>} Updated emergency contact-survivor relation
   */
  update: (idSurvivor, idEmergencyContact, relationshipType) =>
    prisma.emergencyContactSurvivor.update({
      where: {
        idEmergencyContact_idSurvivor: {
          idEmergencyContact: Number(idEmergencyContact),
          idSurvivor: Number(idSurvivor)
        }
      },
      data: {
        relationshipType: String(relationshipType)
      },
      select: {
        idEmergencyContact: true,
        idSurvivor: true,
        relationshipType: true,
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
   * Delete (hard delete) an emergency contact from a survivor
   * Permanently removes the relation from the database
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
