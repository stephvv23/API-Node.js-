const { VolunteerService } = require('./volunteer.service');
const { SecurityLogService } = require('../../../services/securitylog.service');
const { EntityValidators } = require('../../../utils/validator');

// Helper function to parse and validate ID parameter
function parseIdParam(id) {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Helper function to convert date strings to ISO format for Prisma
function parseDate(dateValue) {
  if (!dateValue) return dateValue;
  if (dateValue instanceof Date) return dateValue;
  
  try {
    // If it's already in ISO format, return as is
    if (typeof dateValue === 'string' && dateValue.includes('T')) {
      return new Date(dateValue);
    }
    // If it's a date string like "2025-09-01", convert to ISO
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    return dateValue;
  } catch (error) {
    return dateValue;
  }
}

const VolunteerController = {
  // Lists all active volunteers
  getAllActive: async (_req, res) => {
    try {
      const volunteers = await VolunteerService.listActive();
      return res.success(volunteers);
    } catch (error) {
      console.error('[VOLUNTEERS] getAllActive error:', error);
      return res.error('Error al obtener los voluntarios activos');
    }
  },

  // Lists all volunteers with status filter
  getAll: async (req, res, next) => {
    try {
      const status = (req.query.status || 'active').toLowerCase();
      const allowed = ['active', 'inactive', 'all'];
      if (!allowed.includes(status)) {
        return res.validationErrors(['El estado debe ser "active", "inactive" o "all"']);
      }

      const volunteers = await VolunteerService.list({ status });
      return res.success(volunteers);
    } catch (error) {
      console.error('[VOLUNTEERS] getAll error:', error);
      return res.error('Error al obtener los voluntarios');
    }
  },

  // Finds a volunteer by id
  getById: async (req, res) => {
    const { id } = req.params;
    
    // Validate ID format
    const validId = parseIdParam(id);
    if (!validId) {
      return res.validationErrors(['idVolunteer debe ser un entero positivo']);
    }
    
    try {
      const volunteer = await VolunteerService.findById(validId);
      if (!volunteer) {
        return res.notFound('Voluntario');
      }
      return res.success(volunteer);
    } catch (error) {
      console.error('[VOLUNTEERS] getById error:', error);
      return res.error('Error al obtener el voluntario');
    }
  },

  // Creates a new volunteer
  create: async (req, res) => {
    const { 
      name, identifier, country, birthday, email, residence, 
      modality, institution, availableSchedule, requiredHours, 
      startDate, finishDate, imageAuthorization, notes, status 
    } = req.body;
    
    // Parse dates to proper format
    const parsedBirthday = parseDate(birthday);
    const parsedStartDate = parseDate(startDate);
    const parsedFinishDate = parseDate(finishDate);
    
    // Validation for CREATE - all fields required
    const validation = EntityValidators.volunteer({
      name, identifier, country, birthday: parsedBirthday, email, residence, 
      modality, institution, availableSchedule, requiredHours, 
      startDate: parsedStartDate, finishDate: parsedFinishDate, imageAuthorization, notes, status
    }, { partial: false });
    
    if (!validation.isValid) {
      return res.validationErrors(validation.errors);
    }

    try {
      // Check duplicates
      const allVolunteers = await VolunteerService.list({ status: 'all' });
      const duplicateErrors = [];
      
      if (allVolunteers.some(v => v.identifier === identifier)) {
        duplicateErrors.push('Ya existe un voluntario con ese identificador');
      }
      if (allVolunteers.some(v => v.email === email)) {
        duplicateErrors.push('Ya existe un voluntario con ese email');
      }

      if (duplicateErrors.length > 0) {
        return res.validationErrors(duplicateErrors);
      }

      const newVolunteer = await VolunteerService.create({ 
        name, identifier, country, birthday: parsedBirthday, email, residence, 
        modality, institution, availableSchedule, requiredHours, 
        startDate: parsedStartDate, finishDate: parsedFinishDate, imageAuthorization, notes, status 
      });
      
      const userEmail = req.user?.sub; 
      await SecurityLogService.log({
        email: userEmail,
        action: 'CREATE',
        description: 
          `Se creó el voluntario con los siguientes datos: ` +
          `ID: "${newVolunteer.idVolunteer}", ` +
          `Nombre: "${newVolunteer.name}", ` +
          `Identificador: "${newVolunteer.identifier}", ` +
          `País: "${newVolunteer.country}", ` +
          `Fecha de nacimiento: "${newVolunteer.birthday}", ` +
          `Correo: "${newVolunteer.email}", ` +
          `Residencia: "${newVolunteer.residence}", ` +
          `Modalidad: "${newVolunteer.modality}", ` +
          `Institución: "${newVolunteer.institution}", ` +
          `Horario disponible: "${newVolunteer.availableSchedule}", ` +
          `Horas requeridas: "${newVolunteer.requiredHours}", ` +
          `Fecha de inicio: "${newVolunteer.startDate}", ` +
          `Fecha de finalización: "${newVolunteer.finishDate}", ` +
          `Autorización de imagen: "${newVolunteer.imageAuthorization}", ` +
          `Notas: "${newVolunteer.notes}", ` +
          `Estado: "${newVolunteer.status}".`,
        affectedTable: 'Volunteer',
      });

      return res.status(201).success(newVolunteer, 'Voluntario creado exitosamente');
    } catch (error) {
      console.error('[VOLUNTEERS] create error:', error);
      return res.error('Error al crear el voluntario');
    }
  },

  // Updates an existing volunteer
  update: async (req, res) => {
    const { id } = req.params;
    
    // Validate ID format
    const validId = parseIdParam(id);
    if (!validId) {
      return res.validationErrors(['idVolunteer debe ser un entero positivo']);
    }
    
    const updateData = req.body;

    // Parse dates if present in updateData
    if (updateData.birthday) {
      updateData.birthday = parseDate(updateData.birthday);
    }
    if (updateData.startDate) {
      updateData.startDate = parseDate(updateData.startDate);
    }
    if (updateData.finishDate) {
      updateData.finishDate = parseDate(updateData.finishDate);
    }

    // Validation for UPDATE - only validate provided fields
    const validation = EntityValidators.volunteer(updateData, { partial: true });
    
    if (!validation.isValid) {
      return res.validationErrors(validation.errors);
    }

    try {
      // Check duplicates (excluding current record)
      const duplicateErrors = [];
      
      if (updateData.identifier) {
        const existsIdentifier = await VolunteerService.findByIdentifier(updateData.identifier);
        if (existsIdentifier && existsIdentifier.idVolunteer !== validId) {
          duplicateErrors.push('Ya existe un voluntario con ese identificador');
        }
      }
      if (updateData.email) {
        const existsEmail = await VolunteerService.findByEmail(updateData.email);
        if (existsEmail && existsEmail.idVolunteer !== validId) {
          duplicateErrors.push('Ya existe un voluntario con ese email');
        }
      }

      if (duplicateErrors.length > 0) {
        return res.validationErrors(duplicateErrors);
      }

      // gets the previous volunteer data
      const previousVolunteer = await VolunteerService.findById(validId);
      if (!previousVolunteer) {
        return res.notFound('Voluntario');
      }

      const updatedVolunteer = await VolunteerService.update(validId, updateData);

      // Register in the log the changes (previous and new)
      const userEmail = req.user?.sub;

      // verify if only the status changed from inactive to active
      const onlyStatusChange =
        previousVolunteer.status === 'inactive' &&
        updatedVolunteer.status === 'active' &&
        previousVolunteer.name === updatedVolunteer.name &&
        previousVolunteer.identifier === updatedVolunteer.identifier &&
        previousVolunteer.country === updatedVolunteer.country &&
        previousVolunteer.birthday === updatedVolunteer.birthday &&
        previousVolunteer.email === updatedVolunteer.email &&
        previousVolunteer.residence === updatedVolunteer.residence &&
        previousVolunteer.modality === updatedVolunteer.modality &&
        previousVolunteer.institution === updatedVolunteer.institution &&
        previousVolunteer.availableSchedule === updatedVolunteer.availableSchedule &&
        previousVolunteer.requiredHours === updatedVolunteer.requiredHours &&
        previousVolunteer.startDate === updatedVolunteer.startDate &&
        previousVolunteer.finishDate === updatedVolunteer.finishDate &&
        previousVolunteer.imageAuthorization === updatedVolunteer.imageAuthorization &&
        previousVolunteer.notes === updatedVolunteer.notes;

      if (onlyStatusChange) {
        await SecurityLogService.log({
          email: userEmail,
          action: 'REACTIVATE',
          description:
        `Se reactivó el voluntario con ID "${validId}". Datos completos:\n` +
        `Nombre: "${updatedVolunteer.name}", ` +
        `Identificador: "${updatedVolunteer.identifier}", ` +
        `País: "${updatedVolunteer.country}", ` +
        `Fecha de nacimiento: "${updatedVolunteer.birthday}", ` +
        `Correo: "${updatedVolunteer.email}", ` +
        `Residencia: "${updatedVolunteer.residence}", ` +
        `Modalidad: "${updatedVolunteer.modality}", ` +
        `Institución: "${updatedVolunteer.institution}", ` +
        `Horario disponible: "${updatedVolunteer.availableSchedule}", ` +
        `Horas requeridas: "${updatedVolunteer.requiredHours}", ` +
        `Fecha de inicio: "${updatedVolunteer.startDate}", ` +
        `Fecha de finalización: "${updatedVolunteer.finishDate}", ` +
        `Autorización de imagen: "${updatedVolunteer.imageAuthorization}", ` +
        `Notas: "${updatedVolunteer.notes}", ` +
        `Estado: "${updatedVolunteer.status}".`,
          affectedTable: 'Volunteer',
        });
      } else {
        await SecurityLogService.log({
          email: userEmail,
          action: 'UPDATE',
          description:
        `Se actualizó el voluntario con ID "${validId}".\n` +
        `Versión previa: ` +
        `Nombre: "${previousVolunteer.name}", ` +
        `Identificador: "${previousVolunteer.identifier}", ` +
        `País: "${previousVolunteer.country}", ` +
        `Fecha de nacimiento: "${previousVolunteer.birthday}", ` +
        `Correo: "${previousVolunteer.email}", ` +
        `Residencia: "${previousVolunteer.residence}", ` +
        `Modalidad: "${previousVolunteer.modality}", ` +
        `Institución: "${previousVolunteer.institution}", ` +
        `Horario disponible: "${previousVolunteer.availableSchedule}", ` +
        `Horas requeridas: "${previousVolunteer.requiredHours}", ` +
        `Fecha de inicio: "${previousVolunteer.startDate}", ` +
        `Fecha de finalización: "${previousVolunteer.finishDate}", ` +
        `Autorización de imagen: "${previousVolunteer.imageAuthorization}", ` +
        `Notas: "${previousVolunteer.notes}", ` +
        `Estado: "${previousVolunteer.status}". \n` +
        `Nueva versión: ` +
        `Nombre: "${updatedVolunteer.name}", ` +
        `Identificador: "${updatedVolunteer.identifier}", ` +
        `País: "${updatedVolunteer.country}", ` +
        `Fecha de nacimiento: "${updatedVolunteer.birthday}", ` +
        `Correo: "${updatedVolunteer.email}", ` +
        `Residencia: "${updatedVolunteer.residence}", ` +
        `Modalidad: "${updatedVolunteer.modality}", ` +
        `Institución: "${updatedVolunteer.institution}", ` +
        `Horario disponible: "${updatedVolunteer.availableSchedule}", ` +
        `Horas requeridas: "${updatedVolunteer.requiredHours}", ` +
        `Fecha de inicio: "${updatedVolunteer.startDate}", ` +
        `Fecha de finalización: "${updatedVolunteer.finishDate}", ` +
        `Autorización de imagen: "${updatedVolunteer.imageAuthorization}", ` +
        `Notas: "${updatedVolunteer.notes}", ` +
        `Estado: "${updatedVolunteer.status}". \n`,
          affectedTable: 'Volunteer',
        });
      }
      return res.success(updatedVolunteer, 'Voluntario actualizado exitosamente');
    } catch (error) {
      console.error('[VOLUNTEERS] update error:', error);
      return res.error('Error al actualizar el voluntario');
    }
  },

  // Removes a volunteer
  delete: async (req, res) => {
    const { id } = req.params;
    
    // Validate ID format
    const validId = parseIdParam(id);
    if (!validId) {
      return res.validationErrors(['idVolunteer debe ser un entero positivo']);
    }
    
    const exists = await VolunteerService.findById(validId);
    if (!exists) {
      return res.notFound('Voluntario');
    }
    try {
      const deletedVolunteer = await VolunteerService.remove(validId);
      const userEmail = req.user?.sub; 
      await SecurityLogService.log({
        email: userEmail,
        action: 'INACTIVE',
        description: `Se inactivó el voluntario: `+
        `ID "${validId}", `+
        `Nombre: "${deletedVolunteer.name}", ` +
        `Identificador: "${deletedVolunteer.identifier}", ` +
        `País: "${deletedVolunteer.country}", ` +
        `Fecha de nacimiento: "${deletedVolunteer.birthday}", ` +
        `Correo: "${deletedVolunteer.email}", ` +
        `Residencia: "${deletedVolunteer.residence}", ` +
        `Modalidad: "${deletedVolunteer.modality}", ` +
        `Institución: "${deletedVolunteer.institution}", ` +
        `Horario disponible: "${deletedVolunteer.availableSchedule}", ` +
        `Horas requeridas: "${deletedVolunteer.requiredHours}", ` +
        `Fecha de inicio: "${deletedVolunteer.startDate}", ` +
        `Fecha de finalización: "${deletedVolunteer.finishDate}", ` +
        `Autorización de imagen: "${deletedVolunteer.imageAuthorization}", ` +
        `Notas: "${deletedVolunteer.notes}", ` +
        `Estado: "${deletedVolunteer.status}".`,
        affectedTable: 'Volunteer',
      });
      return res.success(deletedVolunteer, 'Voluntario inactivado exitosamente');
    } catch (error) {
      console.error('[VOLUNTEERS] delete error:', error);
      return res.error('Error al inactivar el voluntario');
    }
  }
};

module.exports = { VolunteerController };
