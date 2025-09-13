const { CancerRepository } = require('./cancer.repository');
const prisma = require('../../../lib/prisma.js');
//cancer service functions crud
const CancerService = {
  list: () => CancerRepository.list(),

  get: (idCancer) => CancerRepository.findById(idCancer),
  //create with default status 'active'
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
  //soft delete
  delete: (idCancer) => CancerRepository.remove(idCancer),
  reactivate: (idCancer) => CancerRepository.reactivate(idCancer),
  
};


module.exports = { CancerService };


