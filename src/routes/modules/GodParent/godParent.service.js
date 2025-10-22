const { GodParentRepository } = require('./godParent.repository');

const GodParentService = {
  // Lists all godparents (active and inactive)
  list: async () => {
    return GodParentRepository.list();
  },

  // Retrieves a godparent by id
  findById: async (id) => {
    return GodParentRepository.findById(id);
  },

  findByName: async (name) => {
    return GodParentRepository.findByName(name);
  },

  findByEmail: async (email) => {
    return GodParentRepository.findByEmail(email);
  },

  // Creates a new godparent
  create: async (data) => {
    return GodParentRepository.create({
      idSurvivor: data.idSurvivor,
      idHeadquarter: data.idHeadquarter,
      name: data.name,
      email: data.email,
      paymentMethod: data.paymentMethod,
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      finishDate: data.finishDate ? new Date(data.finishDate) : null,
      description: data.description,
      status: data.status || "active"
    });
  },

  // Updates godparent data by id
  update: async (id, data) => {
    // Filter out relationship fields that are handled separately
    const { phones, activities, ...updateData } = data;
    
    // Convert date strings to Date objects if they exist
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.finishDate) {
      updateData.finishDate = new Date(updateData.finishDate);
    }
    return GodParentRepository.update(id, updateData);
  },

  // Updates only the godparent status by id
  updateStatus: async (id, status) => {
    return GodParentRepository.update(id, { status });
  },

  // Deletes a godparent by id
  remove: async (id, status) => {
    return GodParentRepository.update(id, { status: "inactive" });
  },

  // Assign phones to godparent
  assignPhones: async (godparentId, phoneIds) => {
    return GodParentRepository.assignPhones(godparentId, phoneIds);
  },

  // Assign activities to godparent
  assignActivities: async (godparentId, activityIds) => {
    return GodParentRepository.assignActivities(godparentId, activityIds);
  },

  // Clear phones for godparent
  clearPhones: async (godparentId) => {
    return GodParentRepository.clearPhones(godparentId);
  },

  // Clear activities for godparent
  clearActivities: async (godparentId) => {
    return GodParentRepository.clearActivities(godparentId);
  },

  // Check if phone exists
  checkPhoneExists: (phoneId) => {
    return GodParentRepository.checkPhoneExists(phoneId);
  },

  // Check if activity exists
  checkActivityExists: (activityId) => {
    return GodParentRepository.checkActivityExists(activityId);
  },
};

module.exports = { GodParentService };