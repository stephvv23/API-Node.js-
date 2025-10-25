const { VolunteerRepository } = require('./volunteer.repository');
const { ValidationRules } = require('../../../utils/validator');

const VolunteerService = {
  // Lists all active volunteers
  listActive: async () => {
    return VolunteerRepository.listActive();
  },
  // Lists volunteers with optional status filter
  list: async ({status = 'active', take, skip} = {}) => {
    return VolunteerRepository.list({status, take, skip});
  },
  // Retrieves a volunteer by id
  findById: async (id) => {
    return VolunteerRepository.findById(id);
  },
  findByIdentifier: async (identifier) => {
    return VolunteerRepository.findByIdentifier(identifier);
  },
  findByEmail: async (email) => {
    return VolunteerRepository.findByEmail(email);
  },
  // Creates a new volunteer
  create: async (data) => {
    return VolunteerRepository.create({
      name: data.name,
      identifier: data.identifier,
      country: data.country,
      birthday: ValidationRules.parseDate(data.birthday),
      email: data.email,
      residence: data.residence,
      modality: data.modality,
      institution: data.institution,
      availableSchedule: data.availableSchedule,
      requiredHours: data.requiredHours,
      startDate: data.startDate ? ValidationRules.parseDate(data.startDate) : new Date(),
      finishDate: data.finishDate ? ValidationRules.parseDate(data.finishDate) : null,
      imageAuthorization: data.imageAuthorization,
      notes: data.notes,
      status: data.status || "active"
    });
  },
  // Updates volunteer data by id
  update: async (id, data) => {
    // Parse dates if they exist
    if (data.birthday) {
      data.birthday = ValidationRules.parseDate(data.birthday);
    }
    if (data.startDate) {
      data.startDate = ValidationRules.parseDate(data.startDate);
    }
    if (data.finishDate) {
      data.finishDate = ValidationRules.parseDate(data.finishDate);
    }
    return VolunteerRepository.update(id, data);
  },
  // Updates only the volunteer status by id
  updateStatus: async (id, status) => {
    return VolunteerRepository.update(id, { status });
  },
  // Deletes a volunteer by id
  remove: async (id, status) => {
    return VolunteerRepository.update(id, { status: "inactive" });
  },
};

module.exports = { VolunteerService };
