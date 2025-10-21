const { ActivityRepository } = require('./activity.repository');
const ApiError = require('../../../utils/apiResponse').ApiError;

/**
 * validate the format of a title
 * @param {string} title - The title to validate
 * @returns {boolean} - true if the format is valid, false if not
 */
const isValidTitle = (tittle) => {
  // Title must be between 1 and 150 characters (VarChar(150))
  return tittle && tittle.length >= 1 && tittle.length <= 150;
};

/**
 * validate the format of a description
 * @param {string} description - The description to validate
 * @returns {boolean} - true if the format is valid, false if not
 */
const isValidDescription = (description) => {
  // Description must be between 1 and 750 characters (VarChar(750))
  return description && description.length >= 1 && description.length <= 750;
};

/**
 * validate the format of a type
 * @param {string} type - The type to validate
 * @returns {boolean} - true if the format is valid, false if not
 */
const isValidType = (type) => {
  // Type must be between 1 and 50 characters (VarChar(50))
  return type && type.length >= 1 && type.length <= 50;
};

/**
 * validate the format of a modality
 * @param {string} modality - The modality to validate
 * @returns {boolean} - true if the format is valid, false if not
 */
const isValidModality = (modality) => {
  // Modality must be between 1 and 25 characters (VarChar(25))
  return modality && modality.length >= 1 && modality.length <= 25;
};

/**
 * validate the format of a capacity
 * @param {number} capacity - The capacity to validate
 * @returns {boolean} - true if the format is valid, false if not
 */
const isValidCapacity = (capacity) => {
  // Capacity must be a positive integer
  return capacity && Number.isInteger(capacity) && capacity > 0;
};

/**
 * validate the format of a location
 * @param {string} location - The location to validate
 * @returns {boolean} - true if the format is valid, false if not
 */
const isValidLocation = (location) => {
  // Location must be between 1 and 300 characters (VarChar(300))
  return location && location.length >= 1 && location.length <= 300;
};

/**
 * validate the format of a date
 * @param {string|Date} date - The date to validate
 * @returns {boolean} - true if the format is valid, false if not
 */
const isValidDate = (date) => {
  if (!date) return false;
  
  // Check if it's a valid date string with DD/MM/YYYY format
  const dateMatch = date.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!dateMatch) return false;
  
  // Extract date parts
  const [, day, month, year] = dateMatch;
  
  // Check if it has time component
  let hasTime = false;
  if (date.includes(' ') || date.includes(':')) {
    hasTime = true;
  }
  
  // Try to create a date object
  try {
    const testDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (isNaN(testDate.getTime())) return false;
    
    // If it has time, validate the time format
    if (hasTime) {
      let timePart = '';
      if (date.includes(' ')) {
        timePart = date.split(' ')[1] || '';
      } else if (date.includes(':')) {
        const parts = date.split(':');
        if (parts.length >= 3) {
          timePart = `${parts[parts.length - 2]}:${parts[parts.length - 1]}`;
        }
      }
      
      if (timePart) {
        const [hours, minutes] = timePart.split(':');
        if (isNaN(parseInt(hours)) || isNaN(parseInt(minutes))) return false;
        if (parseInt(hours) < 0 || parseInt(hours) > 23) return false;
        if (parseInt(minutes) < 0 || parseInt(minutes) > 59) return false;
      }
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * validate the format of a status
 * @param {string} status - The status to validate
 * @returns {boolean} - true if the format is valid, false if not
 */
const isValidStatus = (status) => {
  // Status must be between 1 and 25 characters (VarChar(25))
  return status && status.length >= 1 && status.length <= 25;
};

// ActivityService contains business logic for activity operations.
// It interacts with ActivityRepository for database actions and handles validations.
const ActivityService = {
  // Returns a list of all activities
  list: () => ActivityRepository.findAll(),

  // Retrieves an activity by idActivity
  get: async (idActivity) => {
    return ActivityRepository.findById(idActivity);
  },

  // Creates a new activity
  create: async (data) => {
    // validate the fields
    
    // validate the headquarter
    if (!data.idHeadquarter) {
      throw ApiError.badRequest('El ID de sede es obligatorio');
    }
    if (!Number.isInteger(parseInt(data.idHeadquarter))) {
      throw ApiError.badRequest('El ID de sede debe ser un número entero');
    }
    
    // validate the title
    if (!data.tittle) {
      throw ApiError.badRequest('El título es obligatorio');
    }
    if (data.tittle.trim().length === 0) {
      throw ApiError.badRequest('El título no puede estar vacío');
    }
    if (!isValidTitle(data.tittle.trim())) {
      throw ApiError.badRequest('El título debe tener entre 1 y 150 caracteres');
    }
    
    // validate the description
    if (!data.description) {
      throw ApiError.badRequest('La descripción es obligatoria');
    }
    if (data.description.trim().length === 0) {
      throw ApiError.badRequest('La descripción no puede estar vacía');
    }
    if (!isValidDescription(data.description.trim())) {
      throw ApiError.badRequest('La descripción debe tener entre 1 y 750 caracteres');
    }

    // validate the type
    if (!data.type) {
      throw ApiError.badRequest('El tipo es obligatorio');
    }
    if (data.type.trim().length === 0) {
      throw ApiError.badRequest('El tipo no puede estar vacío');
    }
    if (!isValidType(data.type.trim())) {
      throw ApiError.badRequest('El tipo debe tener entre 1 y 50 caracteres');
    }

    // validate the modality
    if (!data.modality) {
      throw ApiError.badRequest('La modalidad es obligatoria');
    }
    if (data.modality.trim().length === 0) {
      throw ApiError.badRequest('La modalidad no puede estar vacía');
    }
    if (!isValidModality(data.modality.trim())) {
      throw ApiError.badRequest('La modalidad debe tener entre 1 y 25 caracteres');
    }

    // validate the capacity
    if (!data.capacity) {
      throw ApiError.badRequest('La capacidad es obligatoria');
    }
    if (!isValidCapacity(parseInt(data.capacity))) {
      throw ApiError.badRequest('La capacidad debe ser un número entero positivo');
    }

    // validate the location
    if (!data.location) {
      throw ApiError.badRequest('La ubicación es obligatoria');
    }
    if (data.location.trim().length === 0) {
      throw ApiError.badRequest('La ubicación no puede estar vacía');
    }
    if (!isValidLocation(data.location.trim())) {
      throw ApiError.badRequest('La ubicación debe tener entre 1 y 300 caracteres');
    }

    // validate the date
    if (!data.date) {
      throw ApiError.badRequest('La fecha es obligatoria');
    }
    if (!isValidDate(data.date)) {
      throw ApiError.badRequest('La fecha debe ser válida. Formato esperado: Mes/Día/Año HH:MM o Año-Mes-Día HH:MM (ejemplo: 15/01/2024 14:30 o 2024-01-15 14:30)');
    }
    
    // Check if the date is not in the past
    let dateToCheck = data.date;
    if (typeof data.date === 'string') {
      const dateMatch = data.date.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        let timePart = '00:00';
        if (data.date.includes(' ')) {
          timePart = data.date.split(' ')[1] || '00:00';
        } else if (data.date.includes(':')) {
          const parts = data.date.split(':');
          if (parts.length >= 3) {
            timePart = `${parts[parts.length - 2]}:${parts[parts.length - 1]}`;
          }
        }
        const [hours, minutes] = timePart.split(':');
        dateToCheck = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), 0);
      }
    }
    
    const now = new Date();
    if (dateToCheck < now) {
      throw ApiError.badRequest('No se pueden crear actividades en fechas que ya pasaron. La fecha debe ser igual o posterior al día actual.');
    }

    // validate the status if provided
    if (data.status && !isValidStatus(data.status)) {
      throw ApiError.badRequest('El status debe tener entre 1 y 25 caracteres');
    }

    // verify that the headquarter exists
    const headquarterCheck = await ActivityRepository.checkHeadquarterExists(data.idHeadquarter);
    if (!headquarterCheck) {
      throw ApiError.notFound(`La sede con ID ${data.idHeadquarter} no existe`);
    }

    // Convert date to proper format for database
    let dateToSave = data.date;
    if (typeof data.date === 'string') {
      // Try to convert DD/MM/YYYY format to YYYY-MM-DD for better parsing
      const dateMatch = data.date.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        // Support both formats: "DD/MM/YYYY HH:MM" and "DD/MM/YYYY:HH:MM"
        let timePart = '00:00';
        if (data.date.includes(' ')) {
          timePart = data.date.split(' ')[1] || '00:00';
        } else if (data.date.includes(':')) {
          const parts = data.date.split(':');
          if (parts.length >= 3) {
            timePart = `${parts[parts.length - 2]}:${parts[parts.length - 1]}`;
          }
        }
        // Create date and subtract 6 hours to compensate for timezone difference
        const [hours, minutes] = timePart.split(':');
        const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), 0);
        // Subtract 6 hours (6 * 60 * 60 * 1000 milliseconds)
        dateToSave = new Date(localDate.getTime() - (6 * 60 * 60 * 1000));
      }
    }

    const activity = await ActivityRepository.create({ 
      idHeadquarter: parseInt(data.idHeadquarter),
      tittle: data.tittle.trim(),
      description: data.description.trim(),
      type: data.type.trim(),
      modality: data.modality.trim(),
      capacity: parseInt(data.capacity),
      location: data.location.trim(),
      date: new Date(dateToSave),
      status: data.status || "active"
    });
    
    // Return the complete activity data with headquarter
    return ActivityRepository.findById(activity.idActivity);
  },

  // Updates activity data by idActivity
  update: async (idActivity, data) => {
    const updateData = {};

    // validate headquarter if provided
    if (data.idHeadquarter) {
      if (!Number.isInteger(parseInt(data.idHeadquarter))) {
        throw ApiError.badRequest('El ID de sede debe ser un número entero');
      }
      // verify that the headquarter exists
      const headquarterCheck = await ActivityRepository.checkHeadquarterExists(data.idHeadquarter);
      if (!headquarterCheck) {
        throw ApiError.notFound(`La sede con ID ${data.idHeadquarter} no existe`);
      }
      updateData.idHeadquarter = parseInt(data.idHeadquarter);
    }

    // validate title if provided
    if (data.tittle) {
      if (data.tittle.trim().length === 0) {
        throw ApiError.badRequest('El título no puede estar vacío');
      }
      if (!isValidTitle(data.tittle.trim())) {
        throw ApiError.badRequest('El título debe tener entre 1 y 150 caracteres');
      }
      updateData.tittle = data.tittle.trim();
    }

    // validate description if provided
    if (data.description) {
      if (data.description.trim().length === 0) {
        throw ApiError.badRequest('La descripción no puede estar vacía');
      }
      if (!isValidDescription(data.description.trim())) {
        throw ApiError.badRequest('La descripción debe tener entre 1 y 750 caracteres');
      }
      updateData.description = data.description.trim();
    }

    // validate type if provided
    if (data.type) {
      if (data.type.trim().length === 0) {
        throw ApiError.badRequest('El tipo no puede estar vacío');
      }
      if (!isValidType(data.type.trim())) {
        throw ApiError.badRequest('El tipo debe tener entre 1 y 50 caracteres');
      }
      updateData.type = data.type.trim();
    }

    // validate modality if provided
    if (data.modality) {
      if (data.modality.trim().length === 0) {
        throw ApiError.badRequest('La modalidad no puede estar vacía');
      }
      if (!isValidModality(data.modality.trim())) {
        throw ApiError.badRequest('La modalidad debe tener entre 1 y 25 caracteres');
      }
      updateData.modality = data.modality.trim();
    }

    // validate capacity if provided
    if (data.capacity) {
      if (!isValidCapacity(parseInt(data.capacity))) {
        throw ApiError.badRequest('La capacidad debe ser un número entero positivo');
      }
      updateData.capacity = parseInt(data.capacity);
    }

    // validate location if provided
    if (data.location) {
      if (data.location.trim().length === 0) {
        throw ApiError.badRequest('La ubicación no puede estar vacía');
      }
      if (!isValidLocation(data.location.trim())) {
        throw ApiError.badRequest('La ubicación debe tener entre 1 y 300 caracteres');
      }
      updateData.location = data.location.trim();
    }

    // validate date if provided
    if (data.date) {
      if (!isValidDate(data.date)) {
        throw ApiError.badRequest('La fecha debe ser válida. Formato esperado: Mes/Día/Año HH:MM o Año-Mes-Día HH:MM (ejemplo: 15/01/2024 14:30 o 2024-01-15 14:30)');
      }
      
      // Check if the date is not in the past
      let dateToCheck = data.date;
      if (typeof data.date === 'string') {
        const dateMatch = data.date.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (dateMatch) {
          const [, day, month, year] = dateMatch;
          let timePart = '00:00';
          if (data.date.includes(' ')) {
            timePart = data.date.split(' ')[1] || '00:00';
          } else if (data.date.includes(':')) {
            const parts = data.date.split(':');
            if (parts.length >= 3) {
              timePart = `${parts[parts.length - 2]}:${parts[parts.length - 1]}`;
            }
          }
          const [hours, minutes] = timePart.split(':');
          dateToCheck = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), 0);
        }
      }
      
      const now = new Date();
      if (dateToCheck < now) {
        throw ApiError.badRequest('No se pueden actualizar actividades a fechas que ya pasaron. La fecha debe ser igual o posterior al día actual.');
      }
      
      // Convert date to proper format for database
      let dateToSave = data.date;
      if (typeof data.date === 'string') {
        // Try to convert DD/MM/YYYY format to YYYY-MM-DD for better parsing
        const dateMatch = data.date.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (dateMatch) {
          const [, day, month, year] = dateMatch;
          // Support both formats: "DD/MM/YYYY HH:MM" and "DD/MM/YYYY:HH:MM"
          let timePart = '00:00';
          if (data.date.includes(' ')) {
            timePart = data.date.split(' ')[1] || '00:00';
          } else if (data.date.includes(':')) {
            const parts = data.date.split(':');
            if (parts.length >= 3) {
              timePart = `${parts[parts.length - 2]}:${parts[parts.length - 1]}`;
            }
          }
          // Create date and subtract 6 hours to compensate for timezone difference
          const [hours, minutes] = timePart.split(':');
          const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), 0);
          // Subtract 6 hours (6 * 60 * 60 * 1000 milliseconds)
          dateToSave = new Date(localDate.getTime() - (6 * 60 * 60 * 1000));
        }
      }
      
      updateData.date = new Date(dateToSave);
    }

    // validate status if provided
    if (data.status) {
      if (!isValidStatus(data.status)) {
        throw ApiError.badRequest('El status debe tener entre 1 y 25 caracteres');
      }
      updateData.status = data.status;
    }

    if (Object.keys(updateData).length > 0) {
      await ActivityRepository.update(idActivity, updateData);
    }

    return ActivityRepository.findById(idActivity);
  },

  // Updates only the activity's status
  updateStatus: async (idActivity, status) => {
    if (!isValidStatus(status)) {
      throw ApiError.badRequest('El status debe tener entre 1 y 25 caracteres');
    }
    await ActivityRepository.updateStatus(idActivity, status);
    // Return the updated activity with headquarter
    return ActivityRepository.findById(idActivity);
  },

  // Soft delete an activity by idActivity (change status to inactive)
  delete: async (idActivity) => {
    return ActivityRepository.remove(idActivity);
  },

  // Get activities by headquarter
  getByHeadquarter: async (idHeadquarter) => {
    if (!Number.isInteger(parseInt(idHeadquarter))) {
      throw ApiError.badRequest('El ID de sede debe ser un número entero');
    }
    return ActivityRepository.findByHeadquarter(idHeadquarter);
  },

  // Get activities by date range
  getByDateRange: async (startDate, endDate) => {
    if (!isValidDate(startDate)) {
      throw ApiError.badRequest('La fecha de inicio debe ser válida. Formato esperado: Mes/Día/Año HH:MM o Año-Mes-Día HH:MM (ejemplo: 15/01/2024 14:30 o 2024-01-15 14:30)');
    }
    if (!isValidDate(endDate)) {
      throw ApiError.badRequest('La fecha de fin debe ser válida. Formato esperado: Mes/Día/Año HH:MM o Año-Mes-Día HH:MM (ejemplo: 15/01/2024 14:30 o 2024-01-15 14:30)');
    }
    return ActivityRepository.findByDateRange(startDate, endDate);
  },

  // Get activities by type
  getByType: async (type) => {
    if (!type || type.trim().length === 0) {
      throw ApiError.badRequest('El tipo es obligatorio');
    }
    return ActivityRepository.findByType(type.trim());
  },

  // Get activities by modality
  getByModality: async (modality) => {
    if (!modality || modality.trim().length === 0) {
      throw ApiError.badRequest('La modalidad es obligatoria');
    }
    return ActivityRepository.findByModality(modality.trim());
  },

  // Get activity with all relations
  getWithRelations: async (idActivity) => {
    return ActivityRepository.findByIdWithRelations(idActivity);
  }
};

module.exports = { ActivityService };
