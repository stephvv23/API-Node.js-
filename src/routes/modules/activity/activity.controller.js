const { ActivityService } = require('./activity.service');
const { EntityValidators } = require('../../../utils/validator');
const { SecurityLogService } = require('../../../services/securitylog.service');

// Custom error class for validation errors
class ValidationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = statusCode;
  }
}

// Validation functions moved from service to controller
const isValidTitle = (title) => {
  return title && title.length >= 1 && title.length <= 150;
};

const isValidDescription = (description) => {
  return description && description.length >= 1 && description.length <= 750;
};

const isValidType = (type) => {
  return type && type.length >= 1 && type.length <= 50;
};

const isValidModality = (modality) => {
  return modality && modality.length >= 1 && modality.length <= 25;
};

const isValidCapacity = (capacity) => {
  return capacity && Number.isInteger(capacity) && capacity > 0;
};

const isValidLocation = (location) => {
  return location && location.length >= 1 && location.length <= 300;
};

const isValidDate = (date) => {
  if (!date) return false;
  
  // Support multiple date formats: DD/MM/YYYY, DD/MM/YYYY HH:MM, DD/MM/YYYY:HH:MM
  const dateMatch = date.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!dateMatch) return false;
  
  const [, day, month, year] = dateMatch;
  const dayNum = parseInt(day);
  const monthNum = parseInt(month);
  const yearNum = parseInt(year);
  
  // Validate month (1-12)
  if (monthNum < 1 || monthNum > 12) return false;
  
  // Validate day based on month
  if (dayNum < 1) return false;
  
  // Days per month validation
  if (monthNum === 2) {
    // February: max 28 days (not considering leap years for simplicity)
    if (dayNum > 28) return false;
  } else if (monthNum === 12) {
    // December: max 31 days
    if (dayNum > 31) return false;
  } else {
    // All other months: max 30 days
    if (dayNum > 30) return false;
  }
  
  let hasTime = false;
  let timePart = '';
  
  // Check for time in different formats
  if (date.includes(' ')) {
    // Format: "30/10/2025 11:26"
    hasTime = true;
    timePart = date.split(' ')[1] || '';
  } else if (date.includes(':')) {
    // Format: "30/10/2025:11:26" - look for colon after the date part
    const datePart = date.substring(0, 10); // "30/10/2025"
    const timePartCandidate = date.substring(10); // ":11:26"
    
    if (timePartCandidate.startsWith(':') && timePartCandidate.length >= 6) {
      hasTime = true;
      timePart = timePartCandidate.substring(1); // "11:26"
    }
  }
  
  try {
    const testDate = new Date(yearNum, monthNum - 1, dayNum);
    if (isNaN(testDate.getTime())) return false;
    
    if (hasTime && timePart) {
      const [hours, minutes] = timePart.split(':');
      if (isNaN(parseInt(hours)) || isNaN(parseInt(minutes))) return false;
      if (parseInt(hours) < 0 || parseInt(hours) > 23) return false;
      if (parseInt(minutes) < 0 || parseInt(minutes) > 59) return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

const isValidStatus = (status) => {
  return status && status.length >= 1 && status.length <= 25;
};

const parseDateWithTimezoneCompensation = (dateString) => {
  const dateMatch = dateString.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!dateMatch) {
    throw new Error('Invalid date format');
  }
  
  const [, day, month, year] = dateMatch;
  
  let timePart = '00:00';
  if (dateString.includes(' ')) {
    // Format: "30/10/2025 11:26"
    timePart = dateString.split(' ')[1] || '00:00';
  } else if (dateString.includes(':')) {
    // Format: "30/10/2025:11:26"
    const datePart = dateString.substring(0, 10); // "30/10/2025"
    const timePartCandidate = dateString.substring(10); // ":11:26"
    
    if (timePartCandidate.startsWith(':') && timePartCandidate.length >= 6) {
      timePart = timePartCandidate.substring(1); // "11:26"
    }
  }
  
  const [hours, minutes] = timePart.split(':');
  const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), 0);
  return new Date(localDate.getTime() - (6 * 60 * 60 * 1000));
};

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

/**
 * Helper function to format activity data for logging
 * @param {Object} activity - Activity object
 * @returns {string} - Formatted string with activity info
 */
const formatActivityData = (activity) => {
  return `ID: ${activity.idActivity}, Título: "${activity.tittle}", ` +
    `Tipo: "${activity.type}", Modalidad: "${activity.modality}", ` +
    `Capacidad: ${activity.capacity}, Ubicación: "${activity.location}", ` +
    `Fecha: "${activity.date}", Estado: "${activity.status}"`;
};

/**
 * ActivityController handles HTTP requests for activity operations.
 * Each method corresponds to a REST endpoint and delegates logic to ActivityService.
 */
const ActivityController = {
  /**
   * List all activities.
   * GET /activities
   */
  list: async (req, res) => {
    try {
      const status = (req.query.status || 'active').toLowerCase();
      const allowed = ['active', 'inactive', 'all'];
      if (!allowed.includes(status)) {
        return res.validationErrors(['Status must be "active", "inactive" or "all"']);
      }
      
      // Get all activities and filter in controller
      const allActivities = await ActivityService.list();
      let filteredActivities = allActivities;
      
      if (status !== 'all') {
        filteredActivities = allActivities.filter(activity => activity.status === status);
      }
      
      return res.success(filteredActivities);
    } catch (error) {
      console.error('[ACTIVITY] list error:', error);
      return res.error('Error retrieving activities');
    }
  },

  /**
   * Get an activity by idActivity.
   * GET /activities/:idActivity
   */
  get: async (req, res) => {
    const { idActivity } = req.params;
    if (!/^[0-9\s]+$/.test(idActivity)) {
      return res.validationErrors(['idActivity must be a number']);
    }
    try {
      const activity = await ActivityService.get(idActivity);
      if (!activity) {
        return res.notFound('Activity');
      }
      return res.success(activity);
    } catch (error) {
      console.error('[ACTIVITY] get error:', error);
      return res.error('Error retrieving activity');
    }
  },

  /**
   * Create a new activity.
   * POST /activities
   * Required fields: idHeadquarter, title, description, type, modality, capacity, location, date
   */
  create: async (req, res) => {
    const { idHeadquarter, tittle, description, type, modality, capacity, location, date, status } = req.body;
    
    // Custom validation for all fields (bypassing EntityValidators completely)
    const errors = [];
    
    // Manual validation for all fields except date
    if (!idHeadquarter) {
      errors.push('El ID de sede es obligatorio');
    }
    if (!tittle) {
      errors.push('El título es obligatorio');
    }
    if (!description) {
      errors.push('La descripción es obligatoria');
    }
    if (!type) {
      errors.push('El tipo es obligatorio');
    }
    if (!modality) {
      errors.push('La modalidad es obligatoria');
    }
    if (!capacity) {
      errors.push('La capacidad es obligatoria');
    }
    if (!location) {
      errors.push('La ubicación es obligatoria');
    }
    
    // Custom date validation with detailed error messages
    if (!date) {
      errors.push('La fecha es obligatoria');
    } else {
      console.log('[DEBUG] Validating date:', date);
      const isValid = isValidDate(date);
      console.log('[DEBUG] Date validation result:', isValid);
      if (!isValid) {
        errors.push('La fecha debe ser válida. Formato esperado: Día/Mes/Año HH:MM o Día/Mes/Año:HH:MM (ejemplo: 15/01/2024 14:30 o 15/01/2024:14:30). Límites: Días máximo 30 (excepto febrero: 28, diciembre: 31), Meses 1-12');
      }
    }
    
    console.log('[DEBUG] Final errors array:', errors);
    
    // Additional validations for data types and formats
    if (idHeadquarter && !Number.isInteger(parseInt(idHeadquarter))) {
      errors.push('El ID de sede debe ser un número entero');
    }
    
    if (tittle && tittle.trim().length === 0) {
      errors.push('El título no puede estar vacío');
    }
    if (tittle && !isValidTitle(tittle.trim())) {
      errors.push('El título debe tener entre 1 y 150 caracteres');
    }
    
    if (description && description.trim().length === 0) {
      errors.push('La descripción no puede estar vacía');
    }
    if (description && !isValidDescription(description.trim())) {
      errors.push('La descripción debe tener entre 1 y 750 caracteres');
    }
    
    if (type && type.trim().length === 0) {
      errors.push('El tipo no puede estar vacío');
    }
    if (type && !isValidType(type.trim())) {
      errors.push('El tipo debe tener entre 1 y 50 caracteres');
    }
    
    if (modality && modality.trim().length === 0) {
      errors.push('La modalidad no puede estar vacía');
    }
    if (modality && !isValidModality(modality.trim())) {
      errors.push('La modalidad debe tener entre 1 y 25 caracteres');
    }
    
    if (capacity && !isValidCapacity(parseInt(capacity))) {
      errors.push('La capacidad debe ser un número entero positivo');
    }
    
    if (location && location.trim().length === 0) {
      errors.push('La ubicación no puede estar vacía');
    }
    if (location && !isValidLocation(location.trim())) {
      errors.push('La ubicación debe tener entre 1 y 300 caracteres');
    }
    
    
    // Check for past dates
    if (date && isValidDate(date)) {
      let processedDate = date;
      if (typeof date === 'string') {
        processedDate = parseDateWithTimezoneCompensation(date);
      }
      const now = new Date();
      if (new Date(processedDate) < now) {
        errors.push('No se pueden crear actividades en fechas pasadas');
      }
    }
    
    if (status && !isValidStatus(status)) {
      errors.push('El status debe tener entre 1 y 25 caracteres');
    }
    
    // Check for duplicate activity title
    const allActivities = await ActivityService.list();
    if (allActivities.some(a => a.tittle === tittle)) {
      errors.push('An activity with that title already exists');
    }
    
    if (errors.length > 0) {
      return res.validationErrors(errors);
    }
    
    try {
      // Process date with timezone compensation
      let processedDate = date;
      if (typeof date === 'string') {
        processedDate = parseDateWithTimezoneCompensation(date);
      }
      
      const newActivity = await ActivityService.create({ 
        idHeadquarter: parseInt(idHeadquarter),
        tittle: tittle.trim(),
        description: description.trim(),
        type: type.trim(),
        modality: modality.trim(),
        capacity: parseInt(capacity),
        location: location.trim(),
        date: new Date(processedDate),
        status: status || 'active'
      });
      
      // Log the activity creation
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'CREATE',
        description: `Se creó la actividad con ID "${newActivity.idActivity}". ` +
          `Título: "${newActivity.tittle}", ` +
          `Tipo: "${newActivity.type}", Modalidad: "${newActivity.modality}", ` +
          `Capacidad: ${newActivity.capacity}, Ubicación: "${newActivity.location}", ` +
          `Fecha: "${newActivity.date}", Estado: "${newActivity.status}". ` +
          `Sede: "${newActivity.headquarter?.name || 'N/A'}" (ID: ${newActivity.idHeadquarter}).`,
        affectedTable: 'Activity',
      });
      
      return res.status(201).success(newActivity, 'Activity created successfully');
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.validationErrors([error.message]);
      }
      console.error('[ACTIVITY] create error:', error);
      return res.error('Error creating activity');
    }
  },

  /**
   * Update activity data by idActivity.
   * PUT /activities/:idActivity
   */
  update: async (req, res) => {
    const { idActivity } = req.params;
    let { idHeadquarter, tittle, description, type, modality, capacity, location, date, status } = req.body;
    
    // Validate ID
    if (!/^[0-9\s]+$/.test(idActivity)) {
      return res.validationErrors(['idActivity must be a number']);
    }
    
    // Check existence before update
    const exists = await ActivityService.get(idActivity);
    if (!exists) {
      return res.notFound('Activity');
    }
    
    // Validate using centralized validator (partial mode, excluding date for custom validation)
    const validation = EntityValidators.activity({ idHeadquarter, tittle, description, type, modality, capacity, location, status }, { partial: true });
    const errors = [...validation.errors];
    
    // Custom date validation with detailed error messages
    if (date !== undefined && !isValidDate(date)) {
      errors.push('La fecha debe ser válida. Formato esperado: Día/Mes/Año HH:MM o Día/Mes/Año:HH:MM (ejemplo: 15/01/2024 14:30 o 15/01/2024:14:30). Límites: Días máximo 30 (excepto febrero: 28, diciembre: 31), Meses 1-12');
    }
    
    // Check for duplicate activity title if provided
    if (tittle !== undefined && !errors.length) {
      const allActivities = await ActivityService.list();
      const duplicate = allActivities.find(a => a.tittle === tittle);
      if (duplicate && duplicate.idActivity !== parseInt(idActivity)) {
        errors.push('An activity with that title already exists');
      }
    }
    
    // Check for past dates if date is provided
    if (date !== undefined && isValidDate(date)) {
      let processedDate = date;
      if (typeof date === 'string') {
        processedDate = parseDateWithTimezoneCompensation(date);
      }
      const now = new Date();
      if (new Date(processedDate) < now) {
        errors.push('No se pueden actualizar actividades a fechas pasadas');
      }
    }
    
    if (errors.length > 0) {
      return res.validationErrors(errors);
    }
    
    const payload = {};
    if (idHeadquarter !== undefined) payload.idHeadquarter = idHeadquarter;
    if (tittle !== undefined) payload.tittle = String(tittle).trim();
    if (description !== undefined) payload.description = String(description).trim();
    if (type !== undefined) payload.type = String(type).trim();
    if (modality !== undefined) payload.modality = String(modality).trim();
    if (capacity !== undefined) payload.capacity = capacity;
    if (location !== undefined) payload.location = String(location).trim();
    if (date !== undefined) payload.date = date;
    if (status !== undefined) payload.status = String(status).trim();
    
    if (!Object.keys(payload).length) {
      return res.validationErrors(['Nothing to update']);
    }
    
    try {
      // Process date with timezone compensation if date is provided
      if (payload.date && typeof payload.date === 'string') {
        payload.date = new Date(parseDateWithTimezoneCompensation(payload.date));
      }
      
      const updated = await ActivityService.update(idActivity, payload);
      
      // Log the activity update
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'UPDATE',
        description: `Se actualizó la actividad con ID "${idActivity}". ` +
          `Datos actualizados: ${formatActivityData(updated)}. ` +
          `Sede: "${updated.headquarter?.name || 'N/A'}" (ID: ${updated.idHeadquarter}).`,
        affectedTable: 'Activity',
      });
      
      return res.success(updated, 'Activity updated successfully');
    } catch (error) {
      if (error?.code === 'P2025') {
        return res.notFound('Activity');
      }
      console.error('[ACTIVITY] update error:', error);
      return res.error('Error updating activity');
    }
  },

  /**
   * Update only the activity's status.
   * PATCH /activities/:idActivity/status
   */
  updateStatus: async (req, res) => {
    const { idActivity } = req.params;
    
    // Validate ID format
    const validId = parseIdParam(idActivity);
    if (!validId) {
      return res.validationErrors(['idActivity debe ser un entero positivo']);
    }
    
    const { status } = req.body || {};
    if (!status) return res.validationErrors(['status is required']);
    
    // Check existence before update
    const previousActivity = await ActivityService.get(validId);
    if (!previousActivity) {
      return res.notFound('Activity');
    }
    
    try {
      const updatedWithRelations = await ActivityService.updateStatus(validId, status);
      
      // Log the status change
      const userEmail = req.user?.sub;
      if (previousActivity.status === 'inactive' && status === 'active') {
        await SecurityLogService.log({
          email: userEmail,
          action: 'REACTIVATE',
          description: `Se reactivó la actividad con ID "${idActivity}". Datos completos: ${formatActivityData(updatedWithRelations)}. ` +
            `Sede: "${updatedWithRelations.headquarter?.name || 'N/A'}" (ID: ${updatedWithRelations.idHeadquarter}).`,
          affectedTable: 'Activity',
        });
      } else {
        await SecurityLogService.log({
          email: userEmail,
          action: 'UPDATE',
          description: `Se actualizó el estado de la actividad con ID "${idActivity}".\n` +
            `Estado previo: "${previousActivity.status}" - ${formatActivityData(previousActivity)}. ` +
            `Sede: "${previousActivity.headquarter?.name || 'N/A'}" (ID: ${previousActivity.idHeadquarter}).\n` +
            `Nuevo estado: "${updatedWithRelations.status}" - ${formatActivityData(updatedWithRelations)}. ` +
            `Sede: "${updatedWithRelations.headquarter?.name || 'N/A'}" (ID: ${updatedWithRelations.idHeadquarter}).`,
          affectedTable: 'Activity',
        });
      }
      
      return res.success(updatedWithRelations, 'Activity status updated successfully');
    } catch (e) {
      if (e && e.code === 'P2025')
        return res.notFound('Activity');
      console.error('[ACTIVITY] updateStatus error:', e);
      return res.error('Error updating activity status');
    }
  },

  /**
   * Soft delete an activity by idActivity (change status to inactive).
   * DELETE /activities/:idActivity
   */
  remove: async (req, res) => {
    const raw = String(req.params.idActivity ?? '').trim();
    if (!/^\d+$/.test(raw)) {
      return res.validationErrors(['idActivity must be a number']);
    }
    const idActivity = Number.parseInt(raw, 10);
    
    // Check existence before delete
    const exists = await ActivityService.get(idActivity);
    if (!exists) {
      return res.notFound('Activity');
    }
    
    try {
      const deleted = await ActivityService.delete(idActivity);
      
      // Log the activity deletion
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'INACTIVE',
        description: `Se inactivó la actividad con ID "${idActivity}". ` +
          `Datos: ${formatActivityData(deleted)}. ` +
          `Sede: "${deleted.headquarter?.name || 'N/A'}" (ID: ${deleted.idHeadquarter}).`,
        affectedTable: 'Activity',
      });
      
      return res.success(deleted, 'Activity deleted successfully');
    } catch (error) {
      if (error?.code === 'P2025') {
        return res.notFound('Activity');
      }
      console.error('[ACTIVITY] remove error:', error);
      return res.error('Error deleting activity');
    }
  },

  /**
   * Get activities by headquarter.
   * GET /activities/headquarter/:idHeadquarter
   */
  getByHeadquarter: async (req, res) => {
    const { idHeadquarter } = req.params;
    try {
      const activities = await ActivityService.getByHeadquarter(idHeadquarter);
      return res.success(activities);
    } catch (error) {
      console.error('[ACTIVITY] getByHeadquarter error:', error);
      return res.error('Error retrieving activities by headquarter');
    }
  },

  /**
   * Get activities by date range.
   * GET /activities/date-range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   */
  getByDateRange: async (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.validationErrors(['startDate and endDate are required']);
    }
    try {
      const activities = await ActivityService.getByDateRange(startDate, endDate);
      return res.success(activities);
    } catch (error) {
      console.error('[ACTIVITY] getByDateRange error:', error);
      return res.error('Error retrieving activities by date range');
    }
  },

  /**
   * Get activities by type.
   * GET /activities/type/:type
   */
  getByType: async (req, res) => {
    const { type } = req.params;
    try {
      const activities = await ActivityService.getByType(type);
      return res.success(activities);
    } catch (error) {
      console.error('[ACTIVITY] getByType error:', error);
      return res.error('Error retrieving activities by type');
    }
  },

  /**
   * Get activities by modality.
   * GET /activities/modality/:modality
   */
  getByModality: async (req, res) => {
    const { modality } = req.params;
    try {
      const activities = await ActivityService.getByModality(modality);
      return res.success(activities);
    } catch (error) {
      console.error('[ACTIVITY] getByModality error:', error);
      return res.error('Error retrieving activities by modality');
    }
  },

  /**
   * Get activity with all relations (volunteers, survivors, godparents).
   * GET /activities/:idActivity/relations
   */
  getWithRelations: async (req, res) => {
    const { idActivity } = req.params;
    
    // Validate ID format
    const validId = parseIdParam(idActivity);
    if (!validId) {
      return res.validationErrors(['idActivity debe ser un entero positivo']);
    }
    
    try {
      const activity = await ActivityService.getWithRelations(validId);
      if (!activity) return res.notFound('Activity');
      return res.success(activity);
    } catch (error) {
      console.error('[ACTIVITY] getWithRelations error:', error);
      return res.error('Error retrieving activity with relations');
    }
  }
};

module.exports = { ActivityController };
