const { EmergencyContactSurvivorRepository } = require('./emergencyContactSurvivor.repository');

const EmergencyContactSurvivorService = {
  /**
   * Get all emergency contacts for a survivor
   * @param {number} idSurvivor - Survivor ID
   * @param {string} status - Filter by status ('active', 'inactive', 'all'). Default: 'active'
   */
  getBySurvivor: async (idSurvivor, status = 'active') => {
    const contacts = await EmergencyContactSurvivorRepository.getBySurvivor(idSurvivor, status);
    
    // Filter by emergency contact status if needed
    if (status === 'all') {
      return contacts;
    }
    
    return contacts.filter(c => c.emergencyContact.status === status);
  },

  /**
   * Get a specific emergency contact-survivor relation
   */
  findOne: async (idSurvivor, idEmergencyContact) => {
    return EmergencyContactSurvivorRepository.findOne(idSurvivor, idEmergencyContact);
  },

  /**
   * Add an emergency contact to a survivor
   * @param {number} idSurvivor - Survivor ID
   * @param {number} idEmergencyContact - Emergency Contact ID
   * @param {string} status - Status (default: 'active')
   */
  create: async (idSurvivor, idEmergencyContact, status = 'active') => {
    return EmergencyContactSurvivorRepository.create(idSurvivor, idEmergencyContact, status);
  },

  /**
   * Update emergency contact-survivor relation status
   * @param {number} idSurvivor - Survivor ID
   * @param {number} idEmergencyContact - Emergency Contact ID
   * @param {Object} data - Data to update
   */
  update: async (idSurvivor, idEmergencyContact, data) => {
    return EmergencyContactSurvivorRepository.update(idSurvivor, idEmergencyContact, data);
  },

  /**
   * Remove an emergency contact from a survivor (soft delete)
   */
  delete: async (idSurvivor, idEmergencyContact) => {
    return EmergencyContactSurvivorRepository.delete(idSurvivor, idEmergencyContact);
  }
};

module.exports = { EmergencyContactSurvivorService };
