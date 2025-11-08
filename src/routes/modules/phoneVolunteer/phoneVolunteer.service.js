const { PhoneVolunteerRepository } = require('./phoneVolunteer.repository');

const PhoneVolunteerService = {
  /**
   * Get the phone for a volunteer (only one allowed)
   * @param {number} idVolunteer - Volunteer ID
   * @returns {Promise<Object|null>} Phone-volunteer relation or null
   */
  getByVolunteer: async (idVolunteer) => {
    return PhoneVolunteerRepository.getByVolunteer(idVolunteer);
  },

  /**
   * Add a phone to a volunteer
   * @param {number} idVolunteer - Volunteer ID
   * @param {number} idPhone - Phone ID
   */
  create: async (idVolunteer, idPhone) => {
    return PhoneVolunteerRepository.create(idVolunteer, idPhone);
  },

  /**
   * Delete all phone relations for a volunteer
   */
  deleteAllByVolunteer: async (idVolunteer) => {
    return PhoneVolunteerRepository.deleteAllByVolunteer(idVolunteer);
  }
};

module.exports = { PhoneVolunteerService };
