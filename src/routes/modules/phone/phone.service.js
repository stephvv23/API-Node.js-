const { PhoneRepository } = require('./phone.repository');

const PhoneService = {
  /**
   * Get all phones
   */
  list: async () => {
    return PhoneRepository.findAll();
  },

  /**
   * Get a phone by ID
   */
  findById: async (idPhone) => {
    return PhoneRepository.findById(idPhone);
  },

  /**
   * Find or create a phone by phone number
   * This is used internally by PhoneSurvivor module
   */
  findOrCreate: async (phoneNumber) => {
    // Check if phone already exists
    let phone = await PhoneRepository.findByPhoneNumber(phoneNumber);
    
    if (!phone) {
      // Create new phone if doesn't exist
      phone = await PhoneRepository.create(phoneNumber);
    }
    
    return phone;
  }
};

module.exports = { PhoneService };
