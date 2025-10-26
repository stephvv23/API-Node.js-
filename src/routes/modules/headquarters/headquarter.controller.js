const { HeadquarterService } = require('./headquarter.service');
const { SecurityLogService } = require('../../../services/securitylog.service');
const { EntityValidators, ValidationRules } = require('../../../utils/validator');

const HeadquarterController = {
  // Lists all active headquarters
  getAllActive: async (_req, res) => {
    try {
      const headquarters = await HeadquarterService.listActive();
      return res.success(headquarters);
    } catch (error) {
      console.error('[HEADQUARTERS] getAllActive error:', error);
      return res.error('Error al obtener las sedes activas');
    }
  },

  // Lists all headquarters with status filter
  getAll: async (req, res, next) => {
    try {
      const status = (req.query.status || 'active').toLowerCase();
      const allowed = ['active', 'inactive', 'all'];
      if (!allowed.includes(status)) {
        return res.validationErrors(['El estado debe ser "active", "inactive" o "all"']);
      }

      const headquarters = await HeadquarterService.list({ status });
      return res.success(headquarters);
    } catch (error) {
      console.error('[HEADQUARTERS] getAll error:', error);
      return res.error('Error al obtener las sedes');
    }
  },

  // Finds a headquarter by id
  getById: async (req, res) => {
    const { id } = req.params;
    try {
      const headquarter = await HeadquarterService.findById(id);
      if (!headquarter) {
        return res.notFound('Sede');
      }
      return res.success(headquarter);
    } catch (error) {
      console.error('[HEADQUARTERS] getById error:', error);
      return res.error('Error al obtener la sede');
    }
  },

  // Creates a new headquarter
  create: async (req, res) => {
    // Trim all string fields to prevent leading/trailing spaces and normalize multiple spaces
    const trimmedBody = ValidationRules.trimStringFields(req.body);
    const { name, schedule, location, email, description, status } = trimmedBody;
    
    // Validation for CREATE - all fields required
    const validation = EntityValidators.headquarters({
      name, schedule, location, email, description, status
    }, { partial: false });
    
    if (!validation.isValid) {
      return res.validationErrors(validation.errors);
    }

    try {
      // Check duplicates
      const allHeadquarters = await HeadquarterService.list({ status: 'all' });
      const duplicateErrors = [];
      
      if (allHeadquarters.some(h => h.name === name)) {
        duplicateErrors.push('Ya existe una sede con ese nombre');
      }
      if (allHeadquarters.some(h => h.email === email)) {
        duplicateErrors.push('Ya existe una sede con ese email');
      }

      if (duplicateErrors.length > 0) {
        return res.validationErrors(duplicateErrors);
      }

      const newHeadquarter = await HeadquarterService.create({ name, schedule, location, email, description, status });
      
      const userEmail = req.user?.sub; 
      await SecurityLogService.log({
        email: userEmail,
        action: 'CREATE',
        description: 
          `Se creó la sede con los siguientes datos: ` +
          `ID: "${newHeadquarter.idHeadquarter}", ` +
          `Nombre: "${newHeadquarter.name}", ` +
          `Horario: "${newHeadquarter.schedule}", ` +
          `Ubicación: "${newHeadquarter.location}", ` +
          `Correo: "${newHeadquarter.email}", ` +
          `Descripción: "${newHeadquarter.description}", ` +
          `Estado: "${newHeadquarter.status}".`,
        affectedTable: 'Headquarter',
      });

      return res.status(201).success(newHeadquarter, 'Sede creada exitosamente');
    } catch (error) {
      
      return res.error('Error al crear la sede');
    }
  },

  // Updates an existing headquarter
  update: async (req, res) => {
    const { id } = req.params;
    
    // Trim all string fields to prevent leading/trailing spaces and normalize multiple spaces
    const updateData = ValidationRules.trimStringFields(req.body);

    // Validation for UPDATE - only validate provided fields
    const validation = EntityValidators.headquarters(updateData, { partial: true });
    
    if (!validation.isValid) {
      return res.validationErrors(validation.errors);
    }

    try {
      // Check duplicates (excluding current record)
      const duplicateErrors = [];
      
      if (updateData.name) {
        const existsName = await HeadquarterService.findbyname(updateData.name);
        if (existsName && existsName.idHeadquarter != id) {
          duplicateErrors.push('Ya existe una sede con ese nombre');
        }
      }
      if (updateData.email) {
        const existsEmail = await HeadquarterService.findbyemail(updateData.email);
        if (existsEmail && existsEmail.idHeadquarter != id) {
          duplicateErrors.push('Ya existe una sede con ese email');
        }
      }

      if (duplicateErrors.length > 0) {
        return res.validationErrors(duplicateErrors);
      }

      // gets the previous headquarter data
      const previousHeadquarter = await HeadquarterService.findById(id);
      if (!previousHeadquarter) {
        return res.notFound('Sede');
      }

      const updatedHeadquarter = await HeadquarterService.update(id, updateData);

      // Register in the log the changes (previous and new)
      const userEmail = req.user?.sub;

      // verify if only the status changed from inactive to active
      const onlyStatusChange =
        previousHeadquarter.status === 'inactive' &&
        updatedHeadquarter.status === 'active' &&
        previousHeadquarter.name === updatedHeadquarter.name &&
        previousHeadquarter.schedule === updatedHeadquarter.schedule &&
        previousHeadquarter.location === updatedHeadquarter.location &&
        previousHeadquarter.email === updatedHeadquarter.email &&
        previousHeadquarter.description === updatedHeadquarter.description;

      if (onlyStatusChange) {
        await SecurityLogService.log({
          email: userEmail,
          action: 'REACTIVATE',
          description:
        `Se reactivó la sede con ID "${id}". Datos completos:\n` +
        `Nombre: "${updatedHeadquarter.name}", ` +
        `Horario: "${updatedHeadquarter.schedule}", ` +
        `Ubicación: "${updatedHeadquarter.location}", ` +
        `Correo: "${updatedHeadquarter.email}", ` +
        `Descripción: "${updatedHeadquarter.description}", ` +
        `Estado: "${updatedHeadquarter.status}".`,
          affectedTable: 'Headquarter',
        });
      } else {
        await SecurityLogService.log({
          email: userEmail,
          action: 'UPDATE',
          description:
        `Se actualizó la sede con ID "${id}".\n` +
        `Versión previa: ` +
        `Nombre: "${previousHeadquarter.name}", ` +
        `Horario: "${previousHeadquarter.schedule}", ` +
        `Ubicación: "${previousHeadquarter.location}", ` +
        `Correo: "${previousHeadquarter.email}", ` +
        `Descripción: "${previousHeadquarter.description}", ` +
        `Estado: "${previousHeadquarter.status}". \n` +
        `Nueva versión: ` +
        `Nombre: "${updatedHeadquarter.name}", ` +
        `Horario: "${updatedHeadquarter.schedule}", ` +
        `Ubicación: "${updatedHeadquarter.location}", ` +
        `Correo: "${updatedHeadquarter.email}", ` +
        `Descripción: "${updatedHeadquarter.description}", ` +
        `Estado: "${updatedHeadquarter.status}". \n`,
          affectedTable: 'Headquarter',
        });
      }
      return res.success(updatedHeadquarter, 'Sede actualizada exitosamente');
    } catch (error) {
      
      return res.error('Error al actualizar la sede');
    }
  },

  // Removes a headquarter
  delete: async (req, res) => {
    const { id } = req.params;
    
    const exists = await HeadquarterService.findById(id);
    if (!exists) {
      return res.notFound('Sede');
    }
    try {
      const deletedHeadquarter = await HeadquarterService.remove(id);
      const userEmail = req.user?.sub; 
      await SecurityLogService.log({
        email: userEmail,
        action: 'INACTIVE',
        description: `Se inactivó la sede: `+
        `ID "${id}", `+
        `Nombre: "${deletedHeadquarter.name}", ` +
        `Horario: "${deletedHeadquarter.schedule}", ` +
        `Ubicación: "${deletedHeadquarter.location}", ` +
        `Correo: "${deletedHeadquarter.email}", ` +
        `Descripción: "${deletedHeadquarter.description}", ` +
        `Estado: "${deletedHeadquarter.status}".`,
        affectedTable: 'Headquarter',
      });
      return res.success(deletedHeadquarter, 'Sede inactivada exitosamente');
    } catch (error) {
      return res.error('Error al inactivar la sede');
    }
  }
};

module.exports = { HeadquarterController };
