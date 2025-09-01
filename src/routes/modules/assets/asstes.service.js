const { AssetsRepository } = require('./assets.repository');

const AssetsService = {
  list: () => AssetsRepository.list(),
  get: (idAsset) => AssetsRepository.findById(idAsset),
  create: async (data) => {
    return AssetsRepository.create(data);
  },
  update: async (idAsset, data) => {
    return AssetsRepository.update(idAsset, data);
  },
  delete: (idAsset) => AssetsRepository.remove(idAsset),
};

module.exports = { AssetsService };