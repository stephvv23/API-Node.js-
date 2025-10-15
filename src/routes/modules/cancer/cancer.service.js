const { CancerRepository } = require('./cancer.repository');

const CancerService = {
  list: () => CancerRepository.list(),

  get: (idCancer) => CancerRepository.findById(idCancer),

  create: async (data) => {
    return CancerRepository.create({
      cancerName: data.cancerName,
      description: data.description,
      status: data.status || 'active',
    });
  },

  update: (idCancer, data) => {
    return CancerRepository.update(idCancer, {
      cancerName: data.cancerName,
      description: data.description,
      status: data.status,
    });
  },

  delete: (idCancer) => CancerRepository.remove(idCancer),
};

module.exports = { CancerService };
