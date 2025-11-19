

// Import required services and utilities
const { EmergencyContactsService } = require('./emergencyContact.service'); 
const { SecurityLogService } = require('../../../services/securitylog.service');
const { EntityValidators, ValidationRules } = require('../../../utils/validator');


// Controller that handles all operations related to emergency contacts
const EmergencyContactController = {

  // List all emergency contacts with optional status filter
  list: async (req, res) => {
    try {
      // Extract and validate status filter from query params
      const filters = {};
      
      // Status filter: ?status=active|inactive|all (default: all)
      const status = (req.query.status || 'all').toLowerCase();
      const allowedStatus = ['active', 'inactive', 'all'];
      if (!allowedStatus.includes(status)) {
        return res.validationErrors([
          'El parámetro status debe ser "active", "inactive" o "all"',
        ]);
      }
      filters.status = status;
      
      const contacts = await EmergencyContactsService.list(filters); // Retrieve contacts with filters
      return res.success(contacts); // Return the list of contacts
    } catch (error) {
      return res.error('Error al obtener los contactos de emergencia');
    }
  },

  // Get emergency contact by its unique ID
  get: async (req, res) => {
    const { idEmergencyContact } = req.params;
    // Validate idEmergencyContact is a positive integer
    const id = Number(idEmergencyContact);
    if (!idEmergencyContact || isNaN(id) || !Number.isInteger(id) || id <= 0) {
      return res.status(400).error('ID de contacto de emergencia inválido. Debe ser un número entero positivo.');
    }
    try {
      const contact = await EmergencyContactsService.get(id); // Retrieve the contact by ID
      if (!contact) {
        return res.notFound('Contacto de emergencia'); // Return 404 not found if contact doesn't exist
      }
      return res.success(contact); // Return the found contact
    } catch (error) {
      
      return res.error('Error al obtener el contacto de emergencia');
    }
  },

  // Create new emergency contact
  create: async (req, res) => {

    // Check for JSON parsing errors
   if (req.body.__jsonError) {
      return res.validationErrors([
        "JSON inválido: revisa la sintaxis" 
      ]);
    }

    // Clean whitespace from request body strings
    const trimmedBody = ValidationRules.trimStringFields(req.body);
    const { nameEmergencyContact, emailEmergencyContact, identifier, status } = trimmedBody;

    // Validate required fields and data structure
    const validation = EntityValidators.emergencyContact(
      { nameEmergencyContact, emailEmergencyContact, identifier, status },
      { partial: false }
    );

    const errors = [...validation.errors];

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
      if (allContacts.some(c => c.identifier === identifier)) {
        duplicateErrors.push('Ya existe un contacto con ese identificador');
      }


      // Return duplicate errors if found
      if (duplicateErrors.length > 0) {
        return res.validationErrors(duplicateErrors);
      }

      // Create new emergency contact
      const newContact = await EmergencyContactsService.create({
        nameEmergencyContact, emailEmergencyContact, identifier, status
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
          `Identificador: "${newContact.identifier}", ` +
          `Estado: "${newContact.status}".`,
        affectedTable: 'EmergencyContact',
      });

      return res.status(201).success(newContact, 'Contacto de emergencia creado exitosamente');
    } catch (error) {
      return res.error('Error al crear el contacto de emergencia');
    }
  },

    // Updates an existing emergency contact
  update: async (req, res) => {
    const idEmergencyContact = parseInt(req.params.idEmergencyContact, 10);

    // Trim all string fields to prevent leading/trailing spaces and normalize multiple spaces
    const updateData = ValidationRules.trimStringFields(req.body);

    // Validation for UPDATE - only validate provided fields
    const validation = EntityValidators.emergencyContact(updateData, { partial: true });

    
    // Check for JSON parsing errors
    if (req.body.__jsonError) {
      return res.validationErrors([req.body.__jsonErrorMessage || 'Formato de JSON inválido']);
    }

    if (!validation.isValid) {
      return res.validationErrors(validation.errors);
    }

    try {
      if (!idEmergencyContact || idEmergencyContact <= 0) {
        return res.validationErrors(['idEmergencyContact debe ser un entero positivo']);
      }

      // Check duplicates (excluding current record)
      const duplicateErrors = [];

      if (updateData.emailEmergencyContact) {
        const existsEmail = await EmergencyContactsService.getByEmail(updateData.emailEmergencyContact);
        if (existsEmail && existsEmail.idEmergencyContact != idEmergencyContact) {
          duplicateErrors.push('Ya existe un contacto de emergencia con ese correo electrónico');
        }
      }

      if (updateData.identifier) {
        const existsIdentifier = await EmergencyContactsService.getByIdentifier(updateData.identifier);
        if (existsIdentifier && existsIdentifier.idEmergencyContact != idEmergencyContact) {
          duplicateErrors.push('Ya existe un contacto de emergencia con ese identificador');
        }
      }

      if (duplicateErrors.length > 0) {
        return res.validationErrors(duplicateErrors);
      }

      // Gets the previous emergency contact data
      const previousContact = await EmergencyContactsService.get(idEmergencyContact);
      if (!previousContact) {
        return res.notFound('Contacto de emergencia');
      }

      // Performs the update
      let updatedContact;
      try {
        updatedContact = await EmergencyContactsService.update(idEmergencyContact, updateData);
      } catch (err) {
        // Prisma error handling for invalid update
        if (err.code === 'P2002') {
          // Unique constraint failed
          return res.validationErrors(['Ya existe un contacto con ese correo electrónico o identificador']);
        }
        if (err.code === 'P2025') {
          // Record not found
          return res.notFound('Contacto de emergencia');
        }
        // Other errors
        return res.error('Error inesperado al actualizar el contacto de emergencia');
      }

      // Register in the log the changes (previous and new)
      const userEmail = req.user?.sub;

      // Verify if only the status changed from inactive to active
      const onlyStatusChange =
        previousContact.status === 'inactive' &&
        updatedContact.status === 'active' &&
        previousContact.nameEmergencyContact === updatedContact.nameEmergencyContact &&
        previousContact.emailEmergencyContact === updatedContact.emailEmergencyContact &&
        previousContact.identifier === updatedContact.identifier;

      if (onlyStatusChange) {
        // Log reactivation action
        await SecurityLogService.log({
          email: userEmail,
          action: 'REACTIVATE',
          description:
            `Se reactivó el contacto de emergencia con ID "${idEmergencyContact}". Datos completos:\n` +
            `Nombre: "${updatedContact.nameEmergencyContact}", ` +
            `Correo: "${updatedContact.emailEmergencyContact}", ` +
            `Identificador: "${updatedContact.identifier}", ` +
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
            `Versión previa: ` +
            `Nombre: "${previousContact.nameEmergencyContact}", ` +
            `Correo: "${previousContact.emailEmergencyContact}", ` +
            `Identificador: "${previousContact.identifier}", ` +
            `Estado: "${previousContact.status}".\n` +
            `Nueva versión: ` +
            `Nombre: "${updatedContact.nameEmergencyContact}", ` +
            `Correo: "${updatedContact.emailEmergencyContact}", ` +
            `Identificador: "${updatedContact.identifier}", ` +
            `Estado: "${updatedContact.status}".\n`,
          affectedTable: 'EmergencyContact',
        });
      }

      return res.success(updatedContact, 'Contacto de emergencia actualizado exitosamente');
    } catch (error) {
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
          `Identificador: "${deleted.identifier}", ` +
          `Estado: "${deleted.status}".`,
        affectedTable: 'EmergencyContact',
      });

      return res.success(deleted, 'Contacto de emergencia inactivado exitosamente');
    } catch (error) {
      return res.error('Error al inactivar el contacto de emergencia');
    }
  }
};

// Export the EmergencyContactController for use in routing
module.exports = { EmergencyContactController };