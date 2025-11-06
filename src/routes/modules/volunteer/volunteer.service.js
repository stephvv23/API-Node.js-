const { VolunteerRepository } = require('./volunteer.repository');
const { ValidationRules } = require('../../../utils/validator');
const { SecurityLogService } = require('../../../services/securitylog.service');
const prisma = require('../../../lib/prisma');

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
  addEmergencyContacts: async (idVolunteer, emergencyContacts, userEmail = null) => {
    const volunteer = await VolunteerRepository.findById(idVolunteer);
    if (!volunteer) {
      throw new Error('Voluntario no encontrado');
    }

    // Normalize input: if it's a single object, convert to array
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

    const results = {
      added: [],
      alreadyExists: [],
      notFound: [],
      inactive: []
    };

    for (const contact of contactsArray) {
      // Check if emergency contact exists
      const contactStatus = await VolunteerRepository.emergencyContactExists(contact.idEmergencyContact);
      
      if (!contactStatus.exists) {
        results.notFound.push({
          idEmergencyContact: contact.idEmergencyContact,
          relationship: contact.relationship
        });
        continue;
      }

      if (!contactStatus.active) {
        // Get contact name even if inactive
        const inactiveContact = await prisma.emergencyContact.findUnique({
          where: { idEmergencyContact: Number(contact.idEmergencyContact) },
          select: { nameEmergencyContact: true }
        });
        
        results.inactive.push({
          idEmergencyContact: contact.idEmergencyContact,
          nameEmergencyContact: inactiveContact?.nameEmergencyContact || 'Desconocido',
          relationship: contact.relationship
        });
        continue;
      }

      // Check if relationship already exists
      const existingRelation = await prisma.emergencyContactVolunteer.findUnique({
        where: {
          idEmergencyContact_idVolunteer: {
            idVolunteer: Number(idVolunteer),
            idEmergencyContact: Number(contact.idEmergencyContact)
          }
        },
        select: {
          relationship: true,
          emergencyContact: {
            select: {
              nameEmergencyContact: true
            }
          }
        }
      });

      if (existingRelation) {
        results.alreadyExists.push({
          idEmergencyContact: contact.idEmergencyContact,
          nameEmergencyContact: existingRelation.emergencyContact.nameEmergencyContact,
          currentRelationship: existingRelation.relationship,
          attemptedRelationship: contact.relationship
        });
        continue;
      }

      // Add the relationship
      const created = await prisma.emergencyContactVolunteer.create({
        data: {
          idVolunteer: Number(idVolunteer),
          idEmergencyContact: Number(contact.idEmergencyContact),
          relationship: contact.relationship
        },
        include: {
          emergencyContact: {
            select: {
              nameEmergencyContact: true
            }
          }
        }
      });

      results.added.push({
        idEmergencyContact: contact.idEmergencyContact,
        nameEmergencyContact: created.emergencyContact.nameEmergencyContact,
        relationship: contact.relationship
      });

      // Log security event for CREATE
      if (userEmail) {
        try {
          await SecurityLogService.log({
            email: userEmail,
            action: 'CREATE',
            description: `Emergency contact assigned to volunteer: ${volunteer.name} (ID: ${idVolunteer}) - Contact: ${created.emergencyContact.nameEmergencyContact} (ID: ${contact.idEmergencyContact}) with relationship: ${contact.relationship}`,
            affectedTable: 'EmergencyContactVolunteer'
          });
        } catch (logError) {
          console.error('Error logging security event:', logError);
          // Don't fail the operation if logging fails
        }
      }
    }

    return results;
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

    // Check if the relationship between volunteer and emergency contact exists
    const relationshipExists = await VolunteerRepository.checkEmergencyContactRelationship(
      idVolunteer, 
      idEmergencyContact
    );
    
    if (!relationshipExists) {
      throw new Error('El voluntario no tiene asociado este contacto de emergencia');
    }

    return VolunteerRepository.updateEmergencyContactRelationship(
      idVolunteer, 
      idEmergencyContact, 
      relationship
    );
  },

  // Remove emergency contacts from volunteer (single or multiple) with detailed feedback
  removeEmergencyContacts: async (idVolunteer, idEmergencyContacts, userEmail = null) => {
    // Normalize to array
    const contactIds = Array.isArray(idEmergencyContacts) ? idEmergencyContacts : [idEmergencyContacts];
    
    // Get volunteer info for logging
    const volunteer = await VolunteerRepository.findById(idVolunteer);
    
    const results = {
      deleted: [],
      notRelated: [],
      notFound: []
    };

    // Process each contact ID
    for (const contactId of contactIds) {
      // Check if emergency contact exists
      const contactExists = await prisma.emergencyContact.findUnique({
        where: { idEmergencyContact: Number(contactId) },
        select: { 
          idEmergencyContact: true, 
          nameEmergencyContact: true,
          status: true 
        }
      });

      if (!contactExists) {
        results.notFound.push({
          idEmergencyContact: contactId
        });
        continue;
      }

      // Check if relationship exists
      const relationship = await prisma.emergencyContactVolunteer.findUnique({
        where: {
          idEmergencyContact_idVolunteer: {
            idVolunteer: Number(idVolunteer),
            idEmergencyContact: Number(contactId)
          }
        },
        select: {
          idEmergencyContact: true,
          relationship: true,
          emergencyContact: {
            select: {
              nameEmergencyContact: true
            }
          }
        }
      });

      if (!relationship) {
        results.notRelated.push({
          idEmergencyContact: contactId,
          nameEmergencyContact: contactExists.nameEmergencyContact
        });
        continue;
      }

      // Delete the relationship
      await prisma.emergencyContactVolunteer.delete({
        where: {
          idEmergencyContact_idVolunteer: {
            idVolunteer: Number(idVolunteer),
            idEmergencyContact: Number(contactId)
          }
        }
      });

      results.deleted.push({
        idEmergencyContact: contactId,
        nameEmergencyContact: relationship.emergencyContact.nameEmergencyContact,
        relationship: relationship.relationship
      });

      // Log security event for DELETE
      if (userEmail && volunteer) {
        try {
          await SecurityLogService.log({
            email: userEmail,
            action: 'DELETE',
            description: `Emergency contact removed from volunteer: ${volunteer.name} (ID: ${idVolunteer}) - Contact: ${relationship.emergencyContact.nameEmergencyContact} (ID: ${contactId}) with relationship: ${relationship.relationship}`,
            affectedTable: 'EmergencyContactVolunteer'
          });
        } catch (logError) {
          console.error('Error logging security event:', logError);
          // Don't fail the operation if logging fails
        }
      }
    }

    return results;
  },
};

module.exports = { VolunteerService };
