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
    const volunteer = await VolunteerRepository.findById(idVolunteer);
    if (!volunteer) {
      throw new Error('Voluntario no encontrado');
    }

    const headquarterIds = Array.isArray(idHeadquarters) ? idHeadquarters : [idHeadquarters];

    const missing = [];
    const inactive = [];
    const activeIds = [];

    for (const idHq of headquarterIds) {
      const headquarterStatus = await VolunteerRepository.headquarterExists(idHq);
      if (!headquarterStatus.exists) {
        missing.push(idHq);
      } else if (!headquarterStatus.active) {
        inactive.push(idHq);
      } else {
        activeIds.push(idHq);
      }
    }

    if (missing.length > 0) {
      throw new Error(`La sede con ID ${missing.join(', ')} no existe`);
    }

    if (activeIds.length === 0) {
      // Nothing active to add
      throw new Error('Todas las sedes proporcionadas están inactivas');
    }

    let result;
    if (activeIds.length === 1) {
      result = await VolunteerRepository.addHeadquarter(idVolunteer, activeIds[0]);
    } else {
      result = await VolunteerRepository.addHeadquarters(idVolunteer, activeIds);
    }

    return {
      addedCount: Array.isArray(result) ? result.length : (result ? 1 : 0),
      addedIds: activeIds,
      ignoredInactiveIds: inactive,
    };
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
    // Transform to include relationship in the response
    return result.map(item => ({
      ...item.emergencyContact,
      relationship: item.relationship
    }));
  },

  // Add emergency contacts to volunteer (single or multiple) with relationships
  addEmergencyContacts: async (idVolunteer, emergencyContacts) => {
    const volunteer = await VolunteerRepository.findById(idVolunteer);
    if (!volunteer) {
      throw new Error('Voluntario no encontrado');
    }

    // Normalize input: if it's a single object, convert to array
    // Expected format: { idEmergencyContact: number, relationship: string } or array of these
    const contactsArray = Array.isArray(emergencyContacts) ? emergencyContacts : [emergencyContacts];

    // Validate that each contact has both idEmergencyContact and relationship
    for (const contact of contactsArray) {
      if (!contact.idEmergencyContact) {
        throw new Error('Cada contacto debe incluir idEmergencyContact');
      }
      if (!contact.relationship) {
        throw new Error('Cada contacto debe incluir el campo relationship (parentesco)');
      }
    }

    const missing = [];
    const inactive = [];
    const activeContacts = [];

    for (const contact of contactsArray) {
      const contactStatus = await VolunteerRepository.emergencyContactExists(contact.idEmergencyContact);
      if (!contactStatus.exists) {
        missing.push(contact.idEmergencyContact);
      } else if (!contactStatus.active) {
        inactive.push(contact.idEmergencyContact);
      } else {
        activeContacts.push(contact);
      }
    }

    if (missing.length > 0) {
      throw new Error(`El contacto de emergencia con ID ${missing.join(', ')} no existe`);
    }

    if (activeContacts.length === 0) {
      throw new Error('Todos los contactos de emergencia proporcionados están inactivos');
    }

    let result;
    if (activeContacts.length === 1) {
      result = await VolunteerRepository.addEmergencyContact(
        idVolunteer, 
        activeContacts[0].idEmergencyContact,
        activeContacts[0].relationship
      );
    } else {
      result = await VolunteerRepository.addEmergencyContacts(idVolunteer, activeContacts);
    }

    return {
      addedCount: activeContacts.length,
      addedContacts: activeContacts.map(c => ({
        idEmergencyContact: c.idEmergencyContact,
        relationship: c.relationship
      })),
      ignoredInactiveIds: inactive,
    };
  },

  // Update relationship of emergency contact for volunteer
  updateEmergencyContactRelationship: async (idVolunteer, idEmergencyContact, relationship) => {
    if (!relationship) {
      throw new Error('El campo relationship (parentesco) es requerido');
    }

    const volunteer = await VolunteerRepository.findById(idVolunteer);
    if (!volunteer) {
      throw new Error('Voluntario no encontrado');
    }

    const contactStatus = await VolunteerRepository.emergencyContactExists(idEmergencyContact);
    if (!contactStatus.exists) {
      throw new Error('El contacto de emergencia no existe');
    }

    return VolunteerRepository.updateEmergencyContactRelationship(
      idVolunteer, 
      idEmergencyContact, 
      relationship
    );
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
