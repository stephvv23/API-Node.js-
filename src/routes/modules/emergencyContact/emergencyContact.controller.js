
// Import required services and utilities
const { EmergencyContactsService } = require('./emergencyContact.service'); 
const { SecurityLogService } = require('../../../services/securitylog.service');
const { EntityValidators, ValidationRules } = require('../../../utils/validator');


// Define the list of valid relationship types for emergency contacts
const VALID_RELATIONSHIPS = [
  'Cónyuge / pareja',
  'Hijo / hija',
  'Padre / madre',
  'Hermano / hermana',
  'Nieto / nieta',
  'Tío / tía',
  'Primo / prima',
  'Amigo cercano',
  'Conocido',
  'Cuidadores profesionales',
  'Voluntario / apoyo comunitario',
  'Tutor legal / representante',
  'Otro'
];

// Controller that handles all operations related to emergency contacts
const EmergencyContactController = {

  // List all emergency contacts
  list: async (_req, res) => {
    try {
      const contacts = await EmergencyContactsService.list(); // Retrieve all contacts from the service
      return res.success(contacts); // Return the list of contacts
    } catch (error) {
      console.error('[EMERGENCY CONTACTS] list error:', error);
      return res.error('Error al obtener los contactos de emergencia');
    }
  },

  // Get emergency contact by its unique ID
  get: async (req, res) => {
    const { idEmergencyContact } = req.params;
    try {
      const contact = await EmergencyContactsService.get(idEmergencyContact); // Retrieve the contact by ID
      if (!contact) {
        return res.notFound('Contacto de emergencia'); // Return 404 not found if contact doesn't exist
      }
      return res.success(contact); // Return the found contact
    } catch (error) {
      console.error('[EMERGENCY CONTACTS] get error:', error);
      return res.error('Error al obtener el contacto de emergencia');
    }
  },

  // Create new emergency contact
  create: async (req, res) => {

     // Clean whitespace from request body strings
    const trimmedBody = ValidationRules.trimStringFields(req.body);
    const { nameEmergencyContact, emailEmergencyContact, relationship, status } = trimmedBody;

    // Validate required fields and data structure
    const validation = EntityValidators.emergencyContact(
      { nameEmergencyContact, emailEmergencyContact, relationship, status },
      { partial: false }
    );

    const errors = [...validation.errors];

     // Validate that relationship is among predefined valid ones
    if (relationship && !VALID_RELATIONSHIPS.includes(relationship)) {
      errors.push(`La relación debe ser una de: ${VALID_RELATIONSHIPS.join(', ')}`);
    }

     // Return validation errors if found
    if (errors.length > 0) {
      return res.validationErrors(errors);
    }

    try {
      const allContacts = await EmergencyContactsService.list(); // Retrieve all existing contacts for duplication check
      const duplicateErrors = [];

      // Check for duplicate name or email
      if (allContacts.some(c => c.nameEmergencyContact === nameEmergencyContact)) {
        duplicateErrors.push('Ya existe un contacto con ese nombre');
      }
      if (allContacts.some(c => c.emailEmergencyContact === emailEmergencyContact)) {
        duplicateErrors.push('Ya existe un contacto con ese correo electrónico');
      }

      // Return duplicate errors if found
      if (duplicateErrors.length > 0) {
        return res.validationErrors(duplicateErrors);
      }

      // Create new emergency contact
      const newContact = await EmergencyContactsService.create({
        nameEmergencyContact, emailEmergencyContact, relationship, status
      });

      // Log creation action in the security log
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'CREATE',
        description:
          `Se creó el contacto de emergencia con los siguientes datos: ` +
          `ID: "${newContact.idEmergencyContact}", ` +
          `Nombre: "${newContact.nameEmergencyContact}", ` +
          `Correo: "${newContact.emailEmergencyContact}", ` +
          `Relación: "${newContact.relationship}", ` +
          `Estado: "${newContact.status}".`,
        affectedTable: 'EmergencyContact',
      });

      return res.status(201).success(newContact, 'Contacto de emergencia creado exitosamente');
    } catch (error) {
      console.error('[EMERGENCY CONTACTS] create error:', error);
      return res.error('Error al crear el contacto de emergencia');
    }
  },

  // Update existing emergency contact
  update: async (req, res) => {
    const { idEmergencyContact } = req.params;
    const updateData = ValidationRules.trimStringFields(req.body); // Clean input data

    // Validate partial update fields
    const validation = EntityValidators.emergencyContact(updateData, { partial: true });
    const errors = [...validation.errors];
    if (updateData.relationship && !VALID_RELATIONSHIPS.includes(updateData.relationship)) {
      errors.push(`La relación debe ser una de: ${VALID_RELATIONSHIPS.join(', ')}`);
    }

     // Check for valid relationship type
    if (errors.length > 0) {
      return res.validationErrors(errors);
    }

    try {

      // Retrieve the existing contact before updating
      const previousContact = await EmergencyContactsService.get(idEmergencyContact);
      if (!previousContact) {
        return res.notFound('Contacto de emergencia');
      }

      // Check duplicates (excluding current)
      const allContacts = await EmergencyContactsService.list();
      const duplicateErrors = [];
      if (updateData.nameEmergencyContact && allContacts.some(c =>
        c.nameEmergencyContact === updateData.nameEmergencyContact &&
        c.idEmergencyContact != idEmergencyContact)) {
        duplicateErrors.push('Ya existe un contacto con ese nombre');
      }
      if (updateData.emailEmergencyContact && allContacts.some(c =>
        c.emailEmergencyContact === updateData.emailEmergencyContact &&
        c.idEmergencyContact != idEmergencyContact)) {
        duplicateErrors.push('Ya existe un contacto con ese correo electrónico');
      }

      // Return duplicate errors if found
      if (duplicateErrors.length > 0) {
        return res.validationErrors(duplicateErrors);
      }

      // Perform the update
      const updatedContact = await EmergencyContactsService.update(idEmergencyContact, updateData);
      const userEmail = req.user?.sub;

       // Check if only the status changed from inactive to active (reactivation)
      const onlyStatusChange =
        previousContact.status === 'inactive' &&
        updatedContact.status === 'active' &&
        previousContact.nameEmergencyContact === updatedContact.nameEmergencyContact &&
        previousContact.emailEmergencyContact === updatedContact.emailEmergencyContact &&
        previousContact.relationship === updatedContact.relationship;

       // Log different actions depending on the update type
      if (onlyStatusChange) {

        // Log reactivation action
        await SecurityLogService.log({
          email: userEmail,
          action: 'REACTIVATE',
          description:
            `Se reactivó el contacto de emergencia con ID "${idEmergencyContact}". ` +
            `Datos: Nombre: "${updatedContact.nameEmergencyContact}", ` +
            `Correo: "${updatedContact.emailEmergencyContact}", ` +
            `Relación: "${updatedContact.relationship}", ` +
            `Estado: "${updatedContact.status}".`,
          affectedTable: 'EmergencyContact',
        });
      } else {

        // Log general update action with previous and new values
        await SecurityLogService.log({
          email: userEmail,
          action: 'UPDATE',
          description:
            `Se actualizó el contacto de emergencia con ID "${idEmergencyContact}".\n` +
            `Versión previa: Nombre: "${previousContact.nameEmergencyContact}", ` +
            `Correo: "${previousContact.emailEmergencyContact}", ` +
            `Relación: "${previousContact.relationship}", ` +
            `Estado: "${previousContact.status}".\n` +
            `Nueva versión: Nombre: "${updatedContact.nameEmergencyContact}", ` +
            `Correo: "${updatedContact.emailEmergencyContact}", ` +
            `Relación: "${updatedContact.relationship}", ` +
            `Estado: "${updatedContact.status}".`,
          affectedTable: 'EmergencyContact',
        });
      }

      return res.success(updatedContact, 'Contacto de emergencia actualizado exitosamente');
    } catch (error) {
      console.error('[EMERGENCY CONTACTS] update error:', error);
      return res.error('Error al actualizar el contacto de emergencia');
    }
  },

  // Soft delete emergency contact
  delete: async (req, res) => {
    const { idEmergencyContact } = req.params;

    try {

      // Check if the contact exists
      const exists = await EmergencyContactsService.get(idEmergencyContact);
      if (!exists) {
        return res.notFound('Contacto de emergencia');
      }

      // Perform soft delete
      const deleted = await EmergencyContactsService.softDelete(idEmergencyContact);
      const userEmail = req.user?.sub;

      // Log inactivation action
      await SecurityLogService.log({
        email: userEmail,
        action: 'INACTIVE',
        description:
          `Se inactivó el contacto de emergencia: ` +
          `ID "${idEmergencyContact}", ` +
          `Nombre: "${deleted.nameEmergencyContact}", ` +
          `Correo: "${deleted.emailEmergencyContact}", ` +
          `Relación: "${deleted.relationship}", ` +
          `Estado: "${deleted.status}".`,
        affectedTable: 'EmergencyContact',
      });

      return res.success(deleted, 'Contacto de emergencia inactivado exitosamente');
    } catch (error) {
      console.error('[EMERGENCY CONTACTS] delete error:', error);
      return res.error('Error al inactivar el contacto de emergencia');
    }
  }
};

// Export the EmergencyContactController for use in routing
module.exports = { EmergencyContactController };
