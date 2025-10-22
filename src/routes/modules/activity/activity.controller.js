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
      if (!ValidationRules.isValidStatusFilter(status)) {
        return res.validationErrors(['El status debe ser "active", "inactive" o "all"']);
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
    const validId = ValidationRules.parseIdParam(idActivity);
    if (!validId) {
      return res.validationErrors(['idActivity debe ser un número entero positivo']);
    }
    try {
      const activity = await ActivityService.get(validId);
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
    const { idHeadquarter, title, description, type, modality, capacity, location, date, status } = req.body;
    
    // Validation for CREATE - all fields required
    const validation = EntityValidators.activity({
      idHeadquarter, title, description, type, modality, capacity, location, date, status
    }, { partial: false });
    
    if (!validation.isValid) {
      return res.validationErrors(validation.errors);
    }

    try {
      // Check duplicates
      const allActivities = await ActivityService.list();
      const duplicateErrors = [];
      
      if (allActivities.some(a => a.title === title)) {
        duplicateErrors.push('Ya existe una actividad con ese título');
      }

      if (duplicateErrors.length > 0) {
        return res.validationErrors(duplicateErrors);
      }

      const newActivity = await ActivityService.create({ 
        idHeadquarter: parseInt(idHeadquarter),
        title: title.trim(),
        description: description.trim(),
        type: type.trim(),
        modality: modality.trim(),
        capacity: parseInt(capacity),
        location: location.trim(),
        date: new Date(date),
        status: status || 'active'
      });
      
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'CREATE',
        description: 
          `Se creó la actividad con los siguientes datos: ` +
          `ID: "${newActivity.idActivity}", ` +
          `Título: "${newActivity.title}", ` +
          `Tipo: "${newActivity.type}", ` +
          `Modalidad: "${newActivity.modality}", ` +
          `Capacidad: ${newActivity.capacity}, ` +
          `Ubicación: "${newActivity.location}", ` +
          `Fecha: "${newActivity.date}", ` +
          `Estado: "${newActivity.status}". ` +
          `Sede: "${newActivity.headquarter?.name || 'N/A'}" (ID: ${newActivity.idHeadquarter}).`,
        affectedTable: 'Activity',
      });

      return res.status(201).success(newActivity, 'Actividad creada exitosamente');
    } catch (error) {
      console.error('[ACTIVITY] create error:', error);
      return res.error('Error al crear la actividad');
    }
  },

  /**
   * Update activity data by idActivity.
   * PUT /activities/:idActivity
   */
  update: async (req, res) => {
    const { idActivity } = req.params;
    const updateData = req.body;

    // Validation for UPDATE - only validate provided fields
    const validation = EntityValidators.activity(updateData, { partial: true });
    
    if (!validation.isValid) {
      return res.validationErrors(validation.errors);
    }

    try {
      // Check duplicates (excluding current record)
      const duplicateErrors = [];
      
      if (updateData.title) {
        const existsTitle = await ActivityService.findByTitle(updateData.title);
        if (existsTitle && existsTitle.idActivity != idActivity) {
          duplicateErrors.push('Ya existe una actividad con ese título');
        }
      }

      // Check if headquarter exists if provided
      if (updateData.idHeadquarter) {
        const headquarterExists = await ActivityService.checkHeadquarterExists(updateData.idHeadquarter);
        if (!headquarterExists) {
          duplicateErrors.push(`La sede con ID ${updateData.idHeadquarter} no existe`);
        }
      }

      if (duplicateErrors.length > 0) {
        return res.validationErrors(duplicateErrors);
      }

      // gets the previous activity data
      const previousActivity = await ActivityService.get(idActivity);
      if (!previousActivity) {
        return res.notFound('Activity');
      }

      // Process data before update
      if (updateData.date) {
        updateData.date = new Date(updateData.date);
      }
      if (updateData.capacity) {
        updateData.capacity = parseInt(updateData.capacity);
      }
      if (updateData.idHeadquarter) {
        updateData.idHeadquarter = parseInt(updateData.idHeadquarter);
      }
      if (updateData.title) {
        updateData.title = updateData.title.trim();
      }
      if (updateData.description) {
        updateData.description = updateData.description.trim();
      }
      if (updateData.type) {
        updateData.type = updateData.type.trim();
      }
      if (updateData.modality) {
        updateData.modality = updateData.modality.trim();
      }
      if (updateData.location) {
        updateData.location = updateData.location.trim();
      }
      if (updateData.status) {
        updateData.status = updateData.status.trim();
      }

      const updatedActivity = await ActivityService.update(idActivity, updateData);

      // Register in the log the changes (previous and new)
      const userEmail = req.user?.sub;

      // verify if only the status changed from inactive to active
      const onlyStatusChange =
        previousActivity.status === 'inactive' &&
        updatedActivity.status === 'active' &&
        previousActivity.title === updatedActivity.title &&
        previousActivity.description === updatedActivity.description &&
        previousActivity.type === updatedActivity.type &&
        previousActivity.modality === updatedActivity.modality &&
        previousActivity.capacity === updatedActivity.capacity &&
        previousActivity.location === updatedActivity.location;

      if (onlyStatusChange) {
        await SecurityLogService.log({
          email: userEmail,
          action: 'REACTIVATE',
          description:
        `Se reactivó la actividad con ID "${idActivity}". Datos completos:\n` +
        `Título: "${updatedActivity.title}", ` +
        `Tipo: "${updatedActivity.type}", ` +
        `Modalidad: "${updatedActivity.modality}", ` +
        `Capacidad: ${updatedActivity.capacity}, ` +
        `Ubicación: "${updatedActivity.location}", ` +
        `Fecha: "${updatedActivity.date}", ` +
        `Estado: "${updatedActivity.status}". ` +
        `Sede: "${updatedActivity.headquarter?.name || 'N/A'}" (ID: ${updatedActivity.idHeadquarter}).`,
          affectedTable: 'Activity',
        });
      } else {
        await SecurityLogService.log({
          email: userEmail,
          action: 'UPDATE',
          description:
        `Se actualizó la actividad con ID "${idActivity}".\n` +
        `Versión previa: ` +
        `Título: "${previousActivity.title}", ` +
        `Tipo: "${previousActivity.type}", ` +
        `Modalidad: "${previousActivity.modality}", ` +
        `Capacidad: ${previousActivity.capacity}, ` +
        `Ubicación: "${previousActivity.location}", ` +
        `Fecha: "${previousActivity.date}", ` +
        `Estado: "${previousActivity.status}". ` +
        `Sede: "${previousActivity.headquarter?.name || 'N/A'}" (ID: ${previousActivity.idHeadquarter}).\n` +
        `Nueva versión: ` +
        `Título: "${updatedActivity.title}", ` +
        `Tipo: "${updatedActivity.type}", ` +
        `Modalidad: "${updatedActivity.modality}", ` +
        `Capacidad: ${updatedActivity.capacity}, ` +
        `Ubicación: "${updatedActivity.location}", ` +
        `Fecha: "${updatedActivity.date}", ` +
        `Estado: "${updatedActivity.status}". ` +
        `Sede: "${updatedActivity.headquarter?.name || 'N/A'}" (ID: ${updatedActivity.idHeadquarter}).`,
          affectedTable: 'Activity',
        });
      }
      return res.success(updatedActivity, 'Actividad actualizada exitosamente');
    } catch (error) {
      console.error('[ACTIVITY] update error:', error);
      return res.error('Error al actualizar la actividad');
    }
  },

  /**
   * Update only the activity's status.
   * PATCH /activities/:idActivity/status
   */
  updateStatus: async (req, res) => {
    const { idActivity } = req.params;
    
    // Validate ID format using ValidationRules
    const validId = ValidationRules.parseIdParam(idActivity);
    if (!validId) {
      return res.validationErrors(['idActivity debe ser un número entero positivo']);
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
    const { idActivity } = req.params;
    
    const exists = await ActivityService.get(idActivity);
    if (!exists) {
      return res.notFound('Activity');
    }
    try {
      const deletedActivity = await ActivityService.delete(idActivity);
      const userEmail = req.user?.sub; 
      await SecurityLogService.log({
        email: userEmail,
        action: 'INACTIVE',
        description: `Se inactivó la actividad: `+
        `ID "${idActivity}", `+
        `Título: "${deletedActivity.title}", ` +
        `Tipo: "${deletedActivity.type}", ` +
        `Modalidad: "${deletedActivity.modality}", ` +
        `Capacidad: ${deletedActivity.capacity}, ` +
        `Ubicación: "${deletedActivity.location}", ` +
        `Fecha: "${deletedActivity.date}", ` +
        `Estado: "${deletedActivity.status}". ` +
        `Sede: "${deletedActivity.headquarter?.name || 'N/A'}" (ID: ${deletedActivity.idHeadquarter}).`,
        affectedTable: 'Activity',
      });
      return res.success(deletedActivity, 'Actividad inactivada exitosamente');
    } catch (error) {
      console.error('[ACTIVITY] remove error:', error);
      return res.error('Error al inactivar la actividad');
    }
  },

  /**
   * Get activities by headquarter.
   * GET /activities/headquarter/:idHeadquarter
   */
  getByHeadquarter: async (req, res) => {
    const { idHeadquarter } = req.params;
    const validId = ValidationRules.parseIdParam(idHeadquarter);
    if (!validId) {
      return res.validationErrors(['idHeadquarter debe ser un número entero positivo']);
    }
    try {
      const activities = await ActivityService.getByHeadquarter(validId);
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
    
    // Validate ID format using ValidationRules
    const validId = ValidationRules.parseIdParam(idActivity);
    if (!validId) {
      return res.validationErrors(['idActivity debe ser un número entero positivo']);
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
