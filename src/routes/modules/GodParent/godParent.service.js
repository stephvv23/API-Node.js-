const { GodParentRepository } = require('./godParent.repository');
const { ValidationRules } = require('../../../utils/validator');

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
      startDate: data.startDate ? ValidationRules.parseDate(data.startDate) : new Date(),
      finishDate: data.finishDate ? ValidationRules.parseDate(data.finishDate) : null,
      description: data.description,
      status: data.status || "active"
    });
  },

  // Updates godparent data by id
  update: async (id, data) => {
    // Filter out relationship fields that are handled separately
    const { phones, activities, ...updateData } = data;
    
    // Filter to only include valid godparent fields
    const validFields = ['idSurvivor', 'idHeadquarter', 'name', 'email', 'paymentMethod', 'startDate', 'finishDate', 'description', 'status'];
    const filteredUpdateData = {};
    for (const field of validFields) {
      if (updateData[field] !== undefined) {
        filteredUpdateData[field] = updateData[field];
      }
    }
    
    // Convert date strings to Date objects if they exist, using parseDate for timezone adjustment
    if (filteredUpdateData.startDate) {
      filteredUpdateData.startDate = ValidationRules.parseDate(filteredUpdateData.startDate);
    }
    if (filteredUpdateData.finishDate) {
      filteredUpdateData.finishDate = ValidationRules.parseDate(filteredUpdateData.finishDate);
    }
    return GodParentRepository.update(id, filteredUpdateData);
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