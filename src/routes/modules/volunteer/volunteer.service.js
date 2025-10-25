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

  // Add headquarters to volunteer (single or multiple)
  addHeadquarters: async (idVolunteer, idHeadquarters) => {
    // Validate that volunteer exists
    const volunteer = await VolunteerRepository.findById(idVolunteer);
    if (!volunteer) {
      throw new Error('Voluntario no encontrado');
    }
    
    // Normalize to array
    const headquarterIds = Array.isArray(idHeadquarters) ? idHeadquarters : [idHeadquarters];
    
    // Validate each headquarter exists and is active
    const validationErrors = [];
    for (const idHq of headquarterIds) {
      const headquarterStatus = await VolunteerRepository.headquarterExists(idHq);
      if (!headquarterStatus.exists) {
        validationErrors.push(`La sede con ID ${idHq} no existe`);
      } else if (!headquarterStatus.active) {
        validationErrors.push(`La sede con ID ${idHq} está inactiva`);
      }
    }
    
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join(', '));
    }
    
    // Use batch insert for multiple, single insert for one
    if (headquarterIds.length === 1) {
      return VolunteerRepository.addHeadquarter(idVolunteer, headquarterIds[0]);
    } else {
      return VolunteerRepository.addHeadquarters(idVolunteer, headquarterIds);
    }
  },

  // Remove headquarters from volunteer (single or multiple)
  removeHeadquarters: async (idVolunteer, idHeadquarters) => {
    // Normalize to array
    const headquarterIds = Array.isArray(idHeadquarters) ? idHeadquarters : [idHeadquarters];
    
    // Use batch delete for multiple, single delete for one
    if (headquarterIds.length === 1) {
      return VolunteerRepository.removeHeadquarter(idVolunteer, headquarterIds[0]);
    } else {
      return VolunteerRepository.removeHeadquarters(idVolunteer, headquarterIds);
    }
  },

  // ===== EMERGENCY CONTACT RELATIONSHIPS =====
  
  // Get all emergency contacts for a volunteer
  getEmergencyContacts: async (idVolunteer) => {
    const result = await VolunteerRepository.getEmergencyContacts(idVolunteer);
    // Transform to return only the emergency contact data
    return result.map(item => item.emergencyContact);
  },

  // Add emergency contacts to volunteer (single or multiple)
  addEmergencyContacts: async (idVolunteer, idEmergencyContacts) => {
    // Validate that volunteer exists
    const volunteer = await VolunteerRepository.findById(idVolunteer);
    if (!volunteer) {
      throw new Error('Voluntario no encontrado');
    }
    
    // Normalize to array
    const contactIds = Array.isArray(idEmergencyContacts) ? idEmergencyContacts : [idEmergencyContacts];
    
    // Validate each emergency contact exists and is active
    const validationErrors = [];
    for (const idContact of contactIds) {
      const contactStatus = await VolunteerRepository.emergencyContactExists(idContact);
      if (!contactStatus.exists) {
        validationErrors.push(`El contacto de emergencia con ID ${idContact} no existe`);
      } else if (!contactStatus.active) {
        validationErrors.push(`El contacto de emergencia con ID ${idContact} está inactivo`);
      }
    }
    
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join(', '));
    }
    
    // Use batch insert for multiple, single insert for one
    if (contactIds.length === 1) {
      return VolunteerRepository.addEmergencyContact(idVolunteer, contactIds[0]);
    } else {
      return VolunteerRepository.addEmergencyContacts(idVolunteer, contactIds);
    }
  },

  // Remove emergency contacts from volunteer (single or multiple)
  removeEmergencyContacts: async (idVolunteer, idEmergencyContacts) => {
    // Normalize to array
    const contactIds = Array.isArray(idEmergencyContacts) ? idEmergencyContacts : [idEmergencyContacts];
    
    // Use batch delete for multiple, single delete for one
    if (contactIds.length === 1) {
      return VolunteerRepository.removeEmergencyContact(idVolunteer, contactIds[0]);
    } else {
      return VolunteerRepository.removeEmergencyContacts(idVolunteer, contactIds);
    }
  },
};

module.exports = { VolunteerService };
