const { HeadquarterRepository } = require('./headquarter.repository');

const HeadquarterService = {
  listActive: async () => {
    return HeadquarterRepository.listActive();
  }
};

module.exports = { HeadquarterService };
