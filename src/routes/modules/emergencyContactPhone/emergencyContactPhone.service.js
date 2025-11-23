const { EmergencyContactPhoneRepository } = require('./emergencyContactPhone.repository');

const EmergencyContactPhoneService = {
  /**
   * Get the phone for an emergency contact (only one allowed)
   * @param {number} idEmergencyContact - Emergency Contact ID
   * @returns {Promise<Object|null>} Phone-emergency contact relation or null
   */
  getByEmergencyContact: async (idEmergencyContact) => {
    return EmergencyContactPhoneRepository.getByEmergencyContact(idEmergencyContact);
  },

  /**
   * Add a phone to an emergency contact
   * @param {number} idEmergencyContact - Emergency Contact ID
   * @param {number} idPhone - Phone ID
   */
  create: async (idEmergencyContact, idPhone) => {
    return EmergencyContactPhoneRepository.create(idEmergencyContact, idPhone);
  },

  /**
   * Delete all phone relations for an emergency contact
   */
  deleteAllByEmergencyContact: async (idEmergencyContact) => {
    return EmergencyContactPhoneRepository.deleteAllByEmergencyContact(idEmergencyContact);
  }
};

module.exports = { EmergencyContactPhoneService };
