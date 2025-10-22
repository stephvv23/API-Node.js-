const { SurvivorRepository } = require('./survivor.repository');

const SurvivorService = {
  // List all active survivors
  listActive: async () => {
    return SurvivorRepository.listActive();
  },

  // List survivors (supports status filter, pagination, etc.)
  list: async ({ status = 'active', take, skip } = {}) => {
    return SurvivorRepository.list({ status, take, skip });
  },

  // Find a survivor by ID
  findById: async (id) => {
    return SurvivorRepository.findById(id);
  },

  // Create a new survivor
  create: async (data) => {
    return SurvivorRepository.create({
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
      medicalRecord: data.medicalRecord,
      dateHomeSINRUBE: data.dateHomeSINRUBE,
      foodBank: data.foodBank,
      socioEconomicStudy: data.socioEconomicStudy,
      notes: data.notes,
      status: data.status || "active"
    });
  },

  // Update an existing survivor
  update: async (id, data) => {
    return SurvivorRepository.update(id, data);
  },

  // Change only the survivor's status (active/inactive)
  updateStatus: async (id, status) => {
    return SurvivorRepository.update(id, { status });
  },

  // Deactivate a survivor
  remove: async (id) => {
    return SurvivorRepository.update(id, { status: "inactive" });
  },

  // Reactivate a survivor
  reactivate: async (id) => {
    return SurvivorRepository.update(id, { status: "active" });
  },
};

module.exports = { SurvivorService };
