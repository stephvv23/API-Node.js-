const { PhoneGodparentRepository } = require('./phoneGodparent.repository');

const PhoneGodparentService = {
  /**
   * Get the phone for a godparent (only one allowed)
   * @param {number} idGodparent - Godparent ID
   * @returns {Promise<Object|null>} Phone-godparent relation or null
   */
  getByGodparent: async (idGodparent) => {
    return PhoneGodparentRepository.getByGodparent(idGodparent);
  },

  /**
   * Add a phone to a godparent
   * @param {number} idGodparent - Godparent ID
   * @param {number} idPhone - Phone ID
   */
  create: async (idGodparent, idPhone) => {
    return PhoneGodparentRepository.create(idGodparent, idPhone);
  },

  /**
   * Delete all phone relations for a godparent
   */
  deleteAllByGodparent: async (idGodparent) => {
    return PhoneGodparentRepository.deleteAllByGodparent(idGodparent);
  }
};

module.exports = { PhoneGodparentService };
