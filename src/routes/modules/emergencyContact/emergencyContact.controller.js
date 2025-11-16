
const { EmergencyContactsService } = require('./emergencyContact.service');
const { ValidationRules } = require('../../../utils/validator');
const { SecurityLogService } = require('../../../services/securitylog.service');
const { PhoneService } = require('../phone/phone.service');
const { EmergencyContactPhoneService } = require('../emergencyContactPhone/emergencyContactPhone.service');

/**
 * EmergencyContactController handles HTTP requests for emergency contacts.
 * All responses use standardized helpers (res.success, res.error, etc.)
 * Validation is performed using EntityValidators.emergencyContact.
 */
const EmergencyContactController = {
  /**
   * List all emergency contacts
   * GET /emergency-contacts
   */
  list: async (_req, res) => {
    try {
      const emergencyContacts = await EmergencyContactsService.list();
      return res.success(emergencyContacts);
    } catch (error) {
      console.error('[EMERGENCY CONTACT] list error:', error);
      return res.error('Error al obtener contactos de emergencia');
    }
  },

  /**
   * Get a single emergency contact by ID
   * GET /emergency-contacts/:idEmergencyContact
   */
  get: async (req, res) => {
    const { idEmergencyContact } = req.params;
    
    try {
      const idNum = ValidationRules.parseIdParam(String(idEmergencyContact || ''));
      if (!idNum) {
        return res.validationErrors(['El parámetro idEmergencyContact debe ser numérico']);
      }

      const contact = await EmergencyContactsService.get(Number(idNum));
      if (!contact) {
        return res.notFound('Contacto de emergencia');
      }
      
      return res.success(contact);
    } catch (error) {
      console.error('[EMERGENCY CONTACT] get error:', error);
      return res.error('Error al obtener el contacto de emergencia');
    }
  },

  /**
   * Create a new emergency contact
   * POST /emergency-contacts
   */
  create: async (req, res) => {
    // Check for JSON parsing errors
    if (req.body.__jsonError) {
      return res.validationErrors([req.body.__jsonErrorMessage || 'Formato de JSON inválido']);
    }

    let { nameEmergencyContact, emailEmergencyContact, status, phone } = req.body;

    // Trim string fields
    if (nameEmergencyContact) nameEmergencyContact = nameEmergencyContact.trim();
    if (emailEmergencyContact) emailEmergencyContact = emailEmergencyContact.trim();

    // Validations
    const errors = [];

    if (!nameEmergencyContact || typeof nameEmergencyContact !== 'string' || nameEmergencyContact.trim() === '') {
      errors.push('nameEmergencyContact es requerido y debe ser un texto no vacío');
    }

    if (!emailEmergencyContact || typeof emailEmergencyContact !== 'string' || emailEmergencyContact.trim() === '') {
      errors.push('emailEmergencyContact es requerido y debe ser un texto no vacío');
    }


    // Validate field lengths
    if (nameEmergencyContact && nameEmergencyContact.length > 150) {
      errors.push('nameEmergencyContact no debe exceder 150 caracteres');
    }

    if (emailEmergencyContact && emailEmergencyContact.length > 150) {
      errors.push('emailEmergencyContact no debe exceder 150 caracteres');
    }


    if (errors.length > 0) {
      return res.validationErrors(errors);
    }

    try {
      // Check for duplicate email
      const allContacts = await EmergencyContactsService.list();
      const duplicateEmail = allContacts.find(c => c.emailEmergencyContact === emailEmergencyContact);
      if (duplicateEmail) {
        return res.validationErrors(['Ya existe un contacto de emergencia con ese correo electrónico']);
      }

      // Validate phone if provided (optional)
      let phoneValidation = null;
      if (phone) {
        phoneValidation = ValidationRules.parsePhoneNumber(phone);
        if (!phoneValidation.valid) {
          return res.validationErrors(phoneValidation.errors);
        }
      }

      // Create the new emergency contact
      const newContact = await EmergencyContactsService.create({ 
        nameEmergencyContact, 
        emailEmergencyContact, 
        status: status || 'active'
      });

      // If phone was provided, create phone relation
      let phoneRecord = null;
      if (phone && phoneValidation) {
        const phoneStr = phoneValidation.value;
        // Find or create phone (immutable phone record)
        phoneRecord = await PhoneService.findOrCreate(phoneStr);
        // Create relation
        await EmergencyContactPhoneService.create(newContact.idEmergencyContact, phoneRecord.idPhone);
      }

      // Security log
      const userEmail = req.user?.sub;
      const phoneDescription = phoneRecord ? ` Teléfono: "${phoneRecord.phone}".` : '';
      await SecurityLogService.log({
        email: userEmail,
        action: 'CREATE',
        description:
          `Se creó un nuevo contacto de emergencia: ` +
          `ID: "${newContact.idEmergencyContact}", ` +
          `Nombre: "${newContact.nameEmergencyContact}", ` +
          `Email: "${newContact.emailEmergencyContact}", ` +
          `Estado: "${newContact.status}".${phoneDescription}`,
        affectedTable: 'EmergencyContact'
      });

      // Return the created contact with a 201 status
      return res.status(201).success(newContact, 'Contacto de emergencia creado exitosamente');
    } catch (error) {
      // Handle Prisma P2000 error (value too long for column)
      if (error.code === 'P2000') {
        const columnName = error.meta?.column_name || 'campo';
        return res.validationErrors([`El valor proporcionado para ${columnName} es demasiado largo`]);
      }
      
      // Log and return a standardized error response
      console.error('[EMERGENCY CONTACT] create error:', error);
      return res.error('Error al crear el contacto de emergencia');
    }
  },

  /**
   * Update an existing emergency contact by ID
   * PUT /emergency-contacts/:idEmergencyContact
   */
  update: async (req, res) => {
    const { idEmergencyContact } = req.params;
    
    // Check for JSON parsing errors
    if (req.body.__jsonError) {
      return res.validationErrors([req.body.__jsonErrorMessage || 'Formato de JSON inválido']);
    }

    try {
      const idNum = ValidationRules.parseIdParam(String(idEmergencyContact || ''));
      if (!idNum) {
        return res.validationErrors(['El parámetro idEmergencyContact debe ser numérico']);
      }

      // Check if the contact exists before updating
      const previousContact = await EmergencyContactsService.get(Number(idNum));
      if (!previousContact) {
        return res.notFound('Contacto de emergencia');
      }

      // Trim string fields in update data
      const trimmed = ValidationRules.trimStringFields(req.body || {});

      // Validate field lengths
      const lengthErrors = ValidationRules.validateFieldLengths(trimmed, {
        nameEmergencyContact: 150,
        emailEmergencyContact: 150
      });

      if (lengthErrors.length > 0) {
        return res.validationErrors(lengthErrors);
      }


      // Check for duplicate email if being updated
      if (trimmed.emailEmergencyContact) {
        const allContacts = await EmergencyContactsService.list();
        const duplicateEmail = allContacts.find(
          c => c.idEmergencyContact !== Number(idNum) && c.emailEmergencyContact === trimmed.emailEmergencyContact
        );
        if (duplicateEmail) {
          return res.validationErrors(['Ya existe otro contacto de emergencia con ese correo electrónico']);
        }
      }

      // Handle phone update if provided
      let phoneUpdateDescription = '';
      let phoneLogType = 'EmergencyContact';
      let previousPhone = null;
      let updatedPhone = null;
      let phoneChanged = false;
      if (req.body.phone !== undefined) {
        if (req.body.phone === null || req.body.phone === '') {
          // Delete phone if exists
          const existingPhone = await EmergencyContactPhoneService.getByEmergencyContact(Number(idNum));
          if (existingPhone) {
            previousPhone = existingPhone.phone ? { ...existingPhone.phone } : null;
            await EmergencyContactPhoneService.deleteAllByEmergencyContact(Number(idNum));
            phoneUpdateDescription = ` Se eliminó el teléfono "${existingPhone.phone.phone}".`;
            phoneChanged = true;
            phoneLogType = 'PhoneEmergencyContact';
          }
        } else {
          // Validate and update/create phone
          const phoneValidation = ValidationRules.parsePhoneNumber(req.body.phone);
          if (!phoneValidation.valid) {
            return res.validationErrors(phoneValidation.errors);
          }
          const phoneStr = phoneValidation.value;
          const existingPhone = await EmergencyContactPhoneService.getByEmergencyContact(Number(idNum));
          const newPhoneRecord = await PhoneService.findOrCreate(phoneStr);
          if (existingPhone) {
            previousPhone = existingPhone.phone ? { ...existingPhone.phone } : null;
            // Update: delete old and create new
            if (existingPhone.idPhone !== newPhoneRecord.idPhone) {
              await EmergencyContactPhoneService.deleteAllByEmergencyContact(Number(idNum));
              await EmergencyContactPhoneService.create(Number(idNum), newPhoneRecord.idPhone);
              phoneUpdateDescription = ` Teléfono cambiado de "${existingPhone.phone.phone}" a "${phoneStr}".`;
              phoneChanged = true;
              phoneLogType = 'PhoneEmergencyContact';
              updatedPhone = { ...newPhoneRecord };
            } else {
              updatedPhone = { ...newPhoneRecord };
            }
          } else {
            // Create new phone relation
            await EmergencyContactPhoneService.create(Number(idNum), newPhoneRecord.idPhone);
            phoneUpdateDescription = ` Se agregó el teléfono "${phoneStr}".`;
            phoneChanged = true;
            phoneLogType = 'PhoneEmergencyContact';
            updatedPhone = { ...newPhoneRecord };
          }
        }
      }

      // Remove phone from trimmed data (it's not a field in EmergencyContact table)
      const { phone: _, ...contactData } = trimmed;

      // Update the emergency contact
      const updatedContact = await EmergencyContactsService.update(Number(idNum), contactData);

      // Security log
      const userEmail = req.user?.sub;
      
      // Verify if only the status changed from inactive to active (REACTIVATION)
      const onlyStatusChange =
        previousContact.status === 'inactive' &&
        updatedContact.status === 'active' &&
        previousContact.nameEmergencyContact === updatedContact.nameEmergencyContact &&
        previousContact.emailEmergencyContact === updatedContact.emailEmergencyContact;

      if (onlyStatusChange) {
        // Log as REACTIVATE
        await SecurityLogService.log({
          email: userEmail,
          action: 'REACTIVATE',
          description:
            `Se reactivó el contacto de emergencia con ID "${idEmergencyContact}". ` +
            `Datos completos: Nombre: "${updatedContact.nameEmergencyContact}", ` +
            `Email: "${updatedContact.emailEmergencyContact}", ` +
            `Estado: "${updatedContact.status}".`,
          affectedTable: 'EmergencyContact'
        });
      } else {
        // Log as UPDATE
        if (phoneChanged) {
          // Log full previous and current state if phone changed
          await SecurityLogService.log({
            email: userEmail,
            action: 'UPDATE',
            description:
              `Actualización de teléfono para contacto de emergencia (ID: ${idEmergencyContact}):\n` +
              `Estado previo: \n` +
              `Teléfono: ${previousPhone ? JSON.stringify(previousPhone) : 'Sin teléfono'}\n` +
              `Estado actual: \n` +
              `Teléfono: ${updatedPhone ? JSON.stringify(updatedPhone) : (req.body.phone ? req.body.phone : 'Sin teléfono')}\n`,
            affectedTable: phoneLogType
          });
        } else {
          // Log solo cambios de contacto
          const changes = [];
          if (previousContact.nameEmergencyContact !== updatedContact.nameEmergencyContact) {
            changes.push(`Nombre: "${previousContact.nameEmergencyContact}" → "${updatedContact.nameEmergencyContact}"`);
          }
          if (previousContact.emailEmergencyContact !== updatedContact.emailEmergencyContact) {
            changes.push(`Email: "${previousContact.emailEmergencyContact}" → "${updatedContact.emailEmergencyContact}"`);
          }
          if (previousContact.status !== updatedContact.status) {
            changes.push(`Estado: "${previousContact.status}" → "${updatedContact.status}"`);
          }
          const changeDescription = changes.length > 0 
            ? `Cambios: ${changes.join(', ')}` 
            : 'Sin cambios detectados';
          await SecurityLogService.log({
            email: userEmail,
            action: 'UPDATE',
            description:
              `Se actualizó el contacto de emergencia "${updatedContact.nameEmergencyContact}" (ID: ${idEmergencyContact}). ` +
              changeDescription + phoneUpdateDescription,
            affectedTable: 'EmergencyContact'
          });
        }
      }

      return res.success(updatedContact, 'Contacto de emergencia actualizado exitosamente');
    } catch (error) {
      if (error.code === 'P2025') {
        return res.notFound('Contacto de emergencia');
      }
      
      // Handle Prisma P2000 error (value too long for column)
      if (error.code === 'P2000') {
        const columnName = error.meta?.column_name || 'campo';
        return res.validationErrors([`El valor proporcionado para ${columnName} es demasiado largo`]);
      }

      console.error('[EMERGENCY CONTACT] update error:', error);
      return res.error('Error al actualizar el contacto de emergencia');
    }
  },

  /**
   * Soft delete an emergency contact by ID
   * DELETE /emergency-contacts/:idEmergencyContact
   */
  delete: async (req, res) => {
    const { idEmergencyContact } = req.params;
    
    try {
      const idNum = ValidationRules.parseIdParam(String(idEmergencyContact || ''));
      if (!idNum) {
        return res.validationErrors(['El parámetro idEmergencyContact debe ser numérico']);
      }

      // Check if the contact exists before deleting
      const contact = await EmergencyContactsService.get(Number(idNum));
      if (!contact) {
        return res.notFound('Contacto de emergencia');
      }

      // Perform soft delete
      await EmergencyContactsService.softDelete(Number(idNum));

      // Security log
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'DELETE',
        description:
          `Se eliminó (inactivó) el contacto de emergencia con ID "${idEmergencyContact}". ` +
          `Nombre: "${contact.nameEmergencyContact}", ` +
          `Email: "${contact.emailEmergencyContact}".`,
        affectedTable: 'EmergencyContact'
      });

      return res.success(null, 'Contacto de emergencia eliminado exitosamente');
    } catch (error) {
      if (error.code === 'P2025') {
        return res.notFound('Contacto de emergencia');
      }

      console.error('[EMERGENCY CONTACT] delete error:', error);
      return res.error('Error al eliminar el contacto de emergencia');
    }
  },
};

// Export the controller for use in routes
module.exports = { EmergencyContactController };
