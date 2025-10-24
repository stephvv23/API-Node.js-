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

  // ===== HEADQUARTERS RELATIONSHIPS =====
  
  // Get all headquarters for a volunteer
  getHeadquarters: async (idVolunteer) => {
    const result = await VolunteerRepository.getHeadquarters(idVolunteer);
    // Transform to return only the headquarter data
    return result.map(item => item.headquarter);
  },

  // Add headquarter to volunteer
  addHeadquarter: async (idVolunteer, idHeadquarter) => {
    // Validate that volunteer exists
    const volunteer = await VolunteerRepository.findById(idVolunteer);
    if (!volunteer) {
      throw new Error('Voluntario no encontrado');
    }
    
    // Validate that headquarter exists and is active
    const headquarterStatus = await VolunteerRepository.headquarterExists(idHeadquarter);
    if (!headquarterStatus.exists) {
      throw new Error('La sede no existe');
    }
    if (!headquarterStatus.active) {
      throw new Error('La sede está inactiva');
    }
    
    return VolunteerRepository.addHeadquarter(idVolunteer, idHeadquarter);
  },

  // Remove headquarter from volunteer
  removeHeadquarter: async (idVolunteer, idHeadquarter) => {
    return VolunteerRepository.removeHeadquarter(idVolunteer, idHeadquarter);
  },

  // ===== EMERGENCY CONTACT RELATIONSHIPS =====
  
  // Get all emergency contacts for a volunteer
  getEmergencyContacts: async (idVolunteer) => {
    const result = await VolunteerRepository.getEmergencyContacts(idVolunteer);
    // Transform to return only the emergency contact data
    return result.map(item => item.emergencyContact);
  },

  // Add emergency contact to volunteer
  addEmergencyContact: async (idVolunteer, idEmergencyContact) => {
    // Validate that volunteer exists
    const volunteer = await VolunteerRepository.findById(idVolunteer);
    if (!volunteer) {
      throw new Error('Voluntario no encontrado');
    }
    
    // Validate that emergency contact exists and is active
    const contactStatus = await VolunteerRepository.emergencyContactExists(idEmergencyContact);
    if (!contactStatus.exists) {
      throw new Error('El contacto de emergencia no existe');
    }
    if (!contactStatus.active) {
      throw new Error('El contacto de emergencia está inactivo');
    }
    
    return VolunteerRepository.addEmergencyContact(idVolunteer, idEmergencyContact);
  },

  // Remove emergency contact from volunteer
  removeEmergencyContact: async (idVolunteer, idEmergencyContact) => {
    return VolunteerRepository.removeEmergencyContact(idVolunteer, idEmergencyContact);
  },
};

module.exports = { VolunteerService };
