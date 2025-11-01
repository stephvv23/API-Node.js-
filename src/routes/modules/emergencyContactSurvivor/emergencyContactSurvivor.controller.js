const { EmergencyContactSurvivorService } = require('./emergencyContactSurvivor.service');
const { SurvivorService } = require('../survivor/survivor.service');
const { EmergencyContactsService } = require('../emergencyContact/emergencyContact.service');
const { SecurityLogService } = require('../../../services/securitylog.service');
const { ValidationRules } = require('../../../utils/validator');

const EmergencyContactSurvivorController = {
  /**
   * GET /api/survivors/:id/emergency-contacts
   * List all emergency contacts for a specific survivor
   * Query params: ?status=active|inactive|all (default: active)
   */
  list: async (req, res) => {
    const { id } = req.params;
    const status = (req.query?.status || 'active').toLowerCase();

    // Validate status parameter
    const validStatuses = ['active', 'inactive', 'all'];
    if (!validStatuses.includes(status)) {
      return res.validationErrors([
        `El parámetro status debe ser: ${validStatuses.join(', ')}`
      ]);
    }

    try {
      // Validate numeric id
      const idNum = ValidationRules.parseIdParam(String(id || ''));
      if (!idNum) return res.validationErrors(['El parámetro id debe ser numérico']);

      // Validate survivor exists
      const survivor = await SurvivorService.findById(Number(idNum));
      if (!survivor) {
        return res.notFound('Superviviente');
      }

      const contacts = await EmergencyContactSurvivorService.getBySurvivor(Number(idNum), status);
      return res.success(contacts);
    } catch (error) {
      console.error('[EMERGENCY-CONTACT-SURVIVOR] list error:', error);
      return res.error('Error al obtener los contactos de emergencia del superviviente');
    }
  },

  /**
   * GET /api/survivors/:id/emergency-contacts/:idEmergencyContact
   * Get a specific emergency contact of a survivor
   */
  getOne: async (req, res) => {
    const { id, idEmergencyContact } = req.params;

    try {
      // Validate numeric ids
      const idNum = ValidationRules.parseIdParam(String(id || ''));
      const idContactNum = ValidationRules.parseIdParam(String(idEmergencyContact || ''));
      if (!idNum || !idContactNum) return res.validationErrors(['Los parámetros id y idEmergencyContact deben ser numéricos']);

      // Validate survivor exists
      const survivor = await SurvivorService.findById(Number(idNum));
      if (!survivor) {
        return res.notFound('Superviviente');
      }

      const contactSurvivor = await EmergencyContactSurvivorService.findOne(Number(idNum), Number(idContactNum));
      if (!contactSurvivor) {
        return res.notFound('Relación contacto de emergencia-superviviente');
      }

      return res.success(contactSurvivor);
    } catch (error) {
      console.error('[EMERGENCY-CONTACT-SURVIVOR] getOne error:', error);
      return res.error('Error al obtener el contacto de emergencia del superviviente');
    }
  },

  /**
   * POST /api/survivors/:id/emergency-contacts
   * Add an emergency contact to a survivor or reactivate if previously removed
   */
  create: async (req, res) => {
    const { id } = req.params;
    
    // Check for JSON parsing errors
    if (req.body.__jsonError) {
      return res.validationErrors([req.body.__jsonErrorMessage || 'Formato de JSON inválido']);
    }

    const { idEmergencyContact } = req.body;

    // Validations
    const errors = [];

    const idNum = ValidationRules.parseIdParam(String(id || ''));
    if (!idNum) errors.push('El parámetro id debe ser numérico');

    if (!idEmergencyContact || typeof idEmergencyContact !== 'number') {
      errors.push('idEmergencyContact es requerido y debe ser un número');
    }

    if (errors.length > 0) {
      return res.validationErrors(errors);
    }

    try {
      // Validate survivor exists and is active
      const survivor = await SurvivorService.findById(Number(idNum));
      if (!survivor) {
        return res.notFound('Superviviente');
      }

      if (survivor.status !== 'active') {
        return res.badRequest('No se pueden agregar contactos de emergencia a un superviviente inactivo');
      }

      // Validate emergency contact exists and is active
      const contact = await EmergencyContactsService.get(idEmergencyContact);
      if (!contact) {
        return res.validationErrors([`El contacto de emergencia con ID ${idEmergencyContact} no existe`]);
      }

      if (contact.status !== 'active') {
        return res.validationErrors([`El contacto de emergencia "${contact.nameEmergencyContact}" no está activo`]);
      }

      // Check if relation already exists
      const existing = await EmergencyContactSurvivorService.findOne(Number(idNum), idEmergencyContact);
      
      if (existing) {
        // If relation exists and is active, return error
        if (existing.status === 'active') {
          return res.validationErrors([
            `El superviviente ya tiene registrado el contacto de emergencia "${contact.nameEmergencyContact}".`
          ]);
        }

        // If relation exists but is inactive, reactivate it
        if (existing.status === 'inactive') {
          const reactivated = await EmergencyContactSurvivorService.update(Number(idNum), idEmergencyContact, {
            status: 'active'
          });

          // Security log for reactivation
          const userEmail = req.user?.sub;
          await SecurityLogService.log({
            email: userEmail,
            action: 'REACTIVATE',
            description:
              `Se reactivó el contacto de emergencia "${contact.nameEmergencyContact}" (ID: ${idEmergencyContact}) para el superviviente "${survivor.survivorName}" (ID: ${id}). ` +
              `Relación: "${contact.relationship}", Email: "${contact.emailEmergencyContact}".`,
            affectedTable: 'EmergencyContactSurvivor'
          });

          return res.success(reactivated, 'Contacto de emergencia reactivado exitosamente');
        }
      }

      // Create new relation
      const newContactSurvivor = await EmergencyContactSurvivorService.create(Number(idNum), idEmergencyContact, 'active');

      // Security log
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'CREATE',
        description:
          `Se agregó el contacto de emergencia "${contact.nameEmergencyContact}" (ID: ${idEmergencyContact}) al superviviente "${survivor.survivorName}" (ID: ${id}). ` +
          `Relación: "${contact.relationship}", Email: "${contact.emailEmergencyContact}".`,
        affectedTable: 'EmergencyContactSurvivor'
      });

      return res.status(201).success(newContactSurvivor, 'Contacto de emergencia agregado exitosamente');
    } catch (error) {
      console.error('[EMERGENCY-CONTACT-SURVIVOR] create error:', error);
      
      // Handle Prisma P2000 error (value too long for column)
      if (error.code === 'P2000') {
        const columnName = error.meta?.column_name || 'campo';
        return res.validationErrors([`El valor proporcionado para ${columnName} es demasiado largo`]);
      }
      
      return res.error('Error al agregar el contacto de emergencia al superviviente');
    }
  },

  /**
   * DELETE /api/survivors/:id/emergency-contacts/:idEmergencyContact
   * Remove an emergency contact from a survivor (soft delete)
   */
  delete: async (req, res) => {
    const { id, idEmergencyContact } = req.params;

    try {
      // Validate numeric ids
      const idNum = ValidationRules.parseIdParam(String(id || ''));
      const idContactNum = ValidationRules.parseIdParam(String(idEmergencyContact || ''));
      if (!idNum || !idContactNum) return res.validationErrors(['Los parámetros id y idEmergencyContact deben ser numéricos']);

      // Validate survivor exists
      const survivor = await SurvivorService.findById(Number(idNum));
      if (!survivor) {
        return res.notFound('Superviviente');
      }

      // Validate emergency contact-survivor relation exists
      const contactSurvivor = await EmergencyContactSurvivorService.findOne(Number(idNum), Number(idContactNum));
      if (!contactSurvivor) {
        return res.notFound('El superviviente no tiene registrado este contacto de emergencia');
      }

      // Check if already inactive
      if (contactSurvivor.status === 'inactive') {
        return res.badRequest(
          `El contacto de emergencia "${contactSurvivor.emergencyContact.nameEmergencyContact}" ya ha sido eliminado (inactivo) para este superviviente`
        );
      }

      // Count active emergency contacts before deleting
      const activeContacts = await EmergencyContactSurvivorService.getBySurvivor(Number(idNum), 'active');
      
      // Don't allow inactivation if it's the last active emergency contact
      if (activeContacts.length <= 1) {
        return res.badRequest('No se puede eliminar el único contacto de emergencia activo del superviviente');
      }

      // Soft delete (set status to inactive)
      await EmergencyContactSurvivorService.delete(Number(idNum), Number(idContactNum));

      // Security log
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'INACTIVE',
        description:
          `Se desactivó el contacto de emergencia "${contactSurvivor.emergencyContact.nameEmergencyContact}" (ID: ${idEmergencyContact}) del superviviente "${survivor.survivorName}" (ID: ${id}). ` +
          `Relación: "${contactSurvivor.emergencyContact.relationship}".`,
        affectedTable: 'EmergencyContactSurvivor'
      });

      return res.success(null, 'Contacto de emergencia eliminado exitosamente');
    } catch (error) {
      console.error('[EMERGENCY-CONTACT-SURVIVOR] delete error:', error);
      return res.error('Error al eliminar el contacto de emergencia del superviviente');
    }
  }
};

module.exports = { EmergencyContactSurvivorController };
