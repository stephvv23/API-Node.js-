const { SurvivorRepository } = require('./survivor.repository');

const SurvivorService = {
  listActive: async () => {
    return SurvivorRepository.listActive();
  },

  list: async ({ status = 'active', take, skip } = {}) => {
    return SurvivorRepository.list({ status, take, skip });
  },

  findById: async (id) => {
    return SurvivorRepository.findById(id);
  },

  create: async (data) => {
    const survivorData = {
      idHeadquarter: data.idHeadquarter,
      survivorName: data.survivorName,
      documentNumber: data.documentNumber,
      country: data.country,
      birthday: data.birthday ? new Date(data.birthday) : null,
      email: data.email,
      residence: data.residence,
      genre: data.genre,
      workingCondition: data.workingCondition,
      CONAPDIS: data.CONAPDIS,
      IMAS: data.IMAS,
      physicalFileStatus: data.physicalFileStatus,
      medicalRecord: data.medicalRecord || false,
      dateHomeSINRUBE: data.dateHomeSINRUBE || false,
      foodBank: data.foodBank || false,
      socioEconomicStudy: data.socioEconomicStudy || false,
      notes: data.notes,
      status: data.status || "active"
    };

    const relationalData = {
      cancers: data.cancers || [],
      phones: data.phones || [],
      emergencyContacts: data.emergencyContacts || []
    };

    return SurvivorRepository.create(survivorData, relationalData);
  },

  update: async (id, data) => {
    return SurvivorRepository.update(id, data);
  },

  updateStatus: async (id, status) => {
    return SurvivorRepository.update(id, { status });
  },

  remove: async (id) => {
    return SurvivorRepository.update(id, { status: "inactive" });
  },

  reactivate: async (id) => {
    return SurvivorRepository.update(id, { status: "active" });
  },
};

module.exports = { SurvivorService };
