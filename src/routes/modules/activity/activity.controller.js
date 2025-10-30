const { ActivityService } = require('./activity.service');
const { EntityValidators, ValidationRules } = require('../../../utils/validator');
const { SecurityLogService } = require('../../../services/securitylog.service');

// Helper function to format activity data for logging
const formatActivityData = (activity) => {
  return `Título: "${activity.title}", ` +
         `Tipo: "${activity.type}", ` +
         `Modalidad: "${activity.modality}", ` +
         `Capacidad: ${activity.capacity}, ` +
         `Ubicación: "${activity.location}", ` +
         `Fecha: "${activity.date}", ` +
         `Estado: "${activity.status}"`;
};

// ActivityController handles HTTP requests for activity operations
const ActivityController = {
  // List all activities with optional filters
  list: async (req, res) => {
    try {
      const { 
        status = 'active', 
        headquarter, 
        type, 
        modality, 
        startDate, 
        endDate 
      } = req.query;
      
      // Validate status filter
      if (!ValidationRules.isValidStatusFilter(status.toLowerCase())) {
        return res.validationErrors(['El status debe ser "active", "inactive" o "all"']);
      }
      
      // Validate date range if provided
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return res.validationErrors(['Las fechas deben tener formato válido (YYYY-MM-DD)']);
        }
        if (start > end) {
          return res.validationErrors(['La fecha de inicio debe ser anterior a la fecha de fin']);
        }
      }
      
      // Get filtered activities
      const activities = await ActivityService.list({
        status: status.toLowerCase(),
        headquarter: headquarter ? parseInt(headquarter) : undefined,
        type,
        modality,
        startDate,
        endDate
      });
      
      return res.success(activities);
    } catch (error) {
      console.error('[ACTIVITY] list error:', error);
      return res.error('Error retrieving activities');
    }
  },

  // Get an activity by idActivity
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

  // Create a new activity
  create: async (req, res) => {
    // Trim all string fields to prevent leading/trailing spaces and normalize multiple spaces
    const trimmedBody = ValidationRules.trimStringFields(req.body);
    
    const { idHeadquarter, title, description, type, modality, capacity, location, date, status } = trimmedBody;
    
    // Validation for CREATE - all fields required
    const validation = EntityValidators.activity({
      idHeadquarter, title, description, type, modality, capacity, location, date, status
    }, { partial: false });
    
    if (!validation.isValid) {
      return res.validationErrors(validation.errors);
    }

    try {
      // QA bloqueo creación si la sede no existe o no está activa
      const hq = await ActivityService.checkHeadquarterExists(idHeadquarter);
      if (!hq) {
        return res.validationErrors([`La sede con ID ${idHeadquarter} no existe o no está activa`]);
      }

      const newActivity = await ActivityService.create({ 
        idHeadquarter: parseInt(idHeadquarter),
        title: title.trim(),
        description: description.trim(),
        type: type.trim(),
        modality: modality.trim(),
        capacity: parseInt(capacity),
        location: location.trim(),
        date,
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

  // Update activity data by idActivity
  update: async (req, res) => {
    const { idActivity } = req.params;
    
    // Trim all string fields to prevent leading/trailing spaces and normalize multiple spaces
    const updateData = ValidationRules.trimStringFields(req.body);

    // Validation for UPDATE - only validate provided fields
    const validation = EntityValidators.activity(updateData, { partial: true });
    
    if (!validation.isValid) {
      return res.validationErrors(validation.errors);
    }

    try {
      // Check if headquarter exists if provided
      if (updateData.idHeadquarter) {
        const headquarterExists = await ActivityService.checkHeadquarterExists(updateData.idHeadquarter);
        if (!headquarterExists) {
        return res.validationErrors([`La sede con ID ${updateData.idHeadquarter} no existe o no está activa`]);
        }
      }

      // gets the previous activity data
      const previousActivity = await ActivityService.get(idActivity);
      if (!previousActivity) {
        return res.notFound('Activity');
      }

      // Process data before update
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

  // Update only the activity's status
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
      const updatedWithRelations = await ActivityService.update(validId, { status });
      
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

  // Soft delete an activity by idActivity (change status to inactive)
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


  // Get activity with all relations (volunteers, survivors, godparents)
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
  },

  // Get all lookup data needed for activity assignment in a single request
  getLookupData: async (req, res) => {
    try {
      const lookupData = await ActivityService.getLookupData();
      return res.success(lookupData);
    } catch (error) {
      console.error('[ACTIVITY] getLookupData error:', error);
      return res.error('Error al obtener los datos de referencia para actividades');
    }
  },

  // Get volunteers assigned to a specific activity
  getVolunteers: async (req, res) => {
    const { idActivity } = req.params;
    
    const validId = ValidationRules.parseIdParam(idActivity);
    if (!validId) {
      return res.validationErrors(['idActivity debe ser un número entero positivo']);
    }
    
    try {
      // First check if activity exists
      const activity = await ActivityService.get(validId);
      if (!activity) {
        return res.notFound('Activity');
      }
      
      const volunteers = await ActivityService.getVolunteers(validId);
      return res.success(volunteers);
    } catch (error) {
      console.error('[ACTIVITY] getVolunteers error:', error);
      return res.error('Error al obtener los voluntarios de la actividad');
    }
  },

  // Get survivors assigned to a specific activity
  getSurvivors: async (req, res) => {
    const { idActivity } = req.params;
    
    const validId = ValidationRules.parseIdParam(idActivity);
    if (!validId) {
      return res.validationErrors(['idActivity debe ser un número entero positivo']);
    }
    
    try {
      // First check if activity exists
      const activity = await ActivityService.get(validId);
      if (!activity) {
        return res.notFound('Activity');
      }
      
      const survivors = await ActivityService.getSurvivors(validId);
      return res.success(survivors);
    } catch (error) {
      console.error('[ACTIVITY] getSurvivors error:', error);
      return res.error('Error al obtener los supervivientes de la actividad');
    }
  },

  // Get godparents assigned to a specific activity
  getGodparents: async (req, res) => {
    const { idActivity } = req.params;
    
    const validId = ValidationRules.parseIdParam(idActivity);
    if (!validId) {
      return res.validationErrors(['idActivity debe ser un número entero positivo']);
    }
    
    try {
      // First check if activity exists
      const activity = await ActivityService.get(validId);
      if (!activity) {
        return res.notFound('Activity');
      }
      
      const godparents = await ActivityService.getGodparents(validId);
      return res.success(godparents);
    } catch (error) {
      console.error('[ACTIVITY] getGodparents error:', error);
      return res.error('Error al obtener los padrinos de la actividad');
    }
  },

  // Assign volunteers to activity
  assignVolunteers: async (req, res) => {
    const { idActivity } = req.params;
    const { volunteerIds } = req.body;
    
    const validId = ValidationRules.parseIdParam(idActivity);
    if (!validId) {
      return res.validationErrors(['idActivity debe ser un número entero positivo']);
    }
    
    if (!volunteerIds || !Array.isArray(volunteerIds) || volunteerIds.length === 0) {
      return res.validationErrors(['volunteerIds es requerido y debe ser un array no vacío']);
    }
    
    try {
      // QA: check if the activity exists
      const activity = await ActivityService.get(validId);
      if (!activity) return res.notFound('Activity');
      // Get valid volunteers and filter out invalid ones
      const { validIds, invalidIds } = await ActivityService.getValidVolunteers(volunteerIds);
      
      if (validIds.length === 0) {
        const missingIds = invalidIds.join(', ');
        return res.validationErrors([`No se encontraron voluntarios válidos. Los siguientes voluntarios no existen o no están activos: ${missingIds}`]);
      }
      
      const result = await ActivityService.assignVolunteers(validId, validIds);
      const userEmail = req.user?.sub;
      
      let message = `Se asignaron ${result.count} voluntarios a la actividad ID "${idActivity}"`;
      if (invalidIds.length > 0) {
        const rejectedIds = invalidIds.join(', ');
        message += `. Nota: Los siguientes voluntarios no fueron asignados porque no existen o no están activos: ${rejectedIds}`;
      }
      
      await SecurityLogService.log({
        email: userEmail,
        action: 'ASSIGN_VOLUNTEERS',
        description: `Se asignaron ${result.count} voluntarios a la actividad ID "${idActivity}". IDs asignados: ${validIds.join(', ')}${invalidIds.length > 0 ? `. IDs rechazados: ${invalidIds.join(', ')}` : ''}`,
        affectedTable: 'ActivityVolunteer',
      });
      
      return res.success({
        ...result,
        assignedIds: validIds,
        rejectedIds: invalidIds
      }, message);
    } catch (error) {
      console.error('[ACTIVITY] assignVolunteers error:', error);
      return res.error('Error al asignar voluntarios a la actividad');
    }
  },

  // Remove volunteers from activity
  removeVolunteers: async (req, res) => {
    const { idActivity } = req.params;
    const { volunteerIds } = req.body;
    
    const validActivityId = ValidationRules.parseIdParam(idActivity);
    if (!validActivityId) {
      return res.validationErrors(['idActivity debe ser un número entero positivo']);
    }
    
    if (!volunteerIds || !Array.isArray(volunteerIds) || volunteerIds.length === 0) {
      return res.validationErrors(['volunteerIds es requerido y debe ser un array no vacío']);
    }
    
    try {
      // QA: check if the activity exists
      const activity = await ActivityService.get(validActivityId);
      if (!activity) return res.notFound('Activity');

      // Partial deletion: filter valid IDs and proceed
      const parsedIds = Array.isArray(volunteerIds) ? volunteerIds.map(id => parseInt(id)) : [];
      const validIds = parsedIds.filter(n => !isNaN(n) && n > 0);
      const rejectedIds = volunteerIds.filter(id => isNaN(parseInt(id)) || parseInt(id) <= 0);

      if (validIds.length === 0) {
        return res.validationErrors([`No se encontraron IDs válidos para eliminar relaciones de voluntarios. IDs rechazados: ${rejectedIds.join(', ')}`]);
      }

      const result = await ActivityService.removeVolunteers(validActivityId, validIds);
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'REMOVE_VOLUNTEERS',
        description: `Se removieron ${result.count} voluntarios de la actividad ID "${idActivity}". IDs solicitados: ${volunteerIds.join(', ')}. IDs eliminados: ${validIds.join(', ')}${rejectedIds.length>0?`. IDs rechazados: ${rejectedIds.join(', ')}`:''}`,
        affectedTable: 'ActivityVolunteer',
      });
      return res.success({ ...result, removedIds: validIds, rejectedIds }, 'Voluntarios removidos exitosamente');
    } catch (error) {
      console.error('[ACTIVITY] removeVolunteers error:', error);
      return res.error('Error al remover voluntarios de la actividad');
    }
  },

  // Assign survivors to activity
  assignSurvivors: async (req, res) => {
    const { idActivity } = req.params;
    const { survivorIds } = req.body;
    
    const validId = ValidationRules.parseIdParam(idActivity);
    if (!validId) {
      return res.validationErrors(['idActivity debe ser un número entero positivo']);
    }
    
    if (!survivorIds || !Array.isArray(survivorIds) || survivorIds.length === 0) {
      return res.validationErrors(['survivorIds es requerido y debe ser un array no vacío']);
    }
    
    try {
      // Get valid survivors and filter out invalid ones
      const { validIds, invalidIds } = await ActivityService.getValidSurvivors(survivorIds);
      
      if (validIds.length === 0) {
        const missingIds = invalidIds.join(', ');
        return res.validationErrors([`No valid survivors found. The following survivors do not exist or are not active: ${missingIds}`]);
      }
      
      const result = await ActivityService.assignSurvivors(validId, validIds);
      const userEmail = req.user?.sub;
      
      let message = `Successfully assigned ${result.count} survivors to activity ID "${idActivity}"`;
      if (invalidIds.length > 0) {
        const rejectedIds = invalidIds.join(', ');
        message += `. Note: The following survivors were not assigned because they do not exist or are not active: ${rejectedIds}`;
      }
      
      await SecurityLogService.log({
        email: userEmail,
        action: 'ASSIGN_SURVIVORS',
        description: `Se asignaron ${result.count} supervivientes a la actividad ID "${idActivity}". IDs asignados: ${validIds.join(', ')}${invalidIds.length > 0 ? `. IDs rechazados: ${invalidIds.join(', ')}` : ''}`,
        affectedTable: 'ActivitySurvivor',
      });
      
      return res.success({
        ...result,
        assignedIds: validIds,
        rejectedIds: invalidIds
      }, message);
    } catch (error) {
      console.error('[ACTIVITY] assignSurvivors error:', error);
      return res.error('Error al asignar supervivientes a la actividad');
    }
  },

  // Remove survivors from activity
  removeSurvivors: async (req, res) => {
    const { idActivity } = req.params;
    const { survivorIds } = req.body;
    
    const validActivityId = ValidationRules.parseIdParam(idActivity);
    if (!validActivityId) {
      return res.validationErrors(['idActivity debe ser un número entero positivo']);
    }
    
    if (!survivorIds || !Array.isArray(survivorIds) || survivorIds.length === 0) {
      return res.validationErrors(['survivorIds es requerido y debe ser un array no vacío']);
    }
    
    try {
      // QA: check if the activity exists
      const activity = await ActivityService.get(validActivityId);
      if (!activity) return res.notFound('Activity');

      // Partial deletion: filter valid IDs and proceed
      const parsedIds = Array.isArray(survivorIds) ? survivorIds.map(id => parseInt(id)) : [];
      const validIds = parsedIds.filter(n => !isNaN(n) && n > 0);
      const rejectedIds = survivorIds.filter(id => isNaN(parseInt(id)) || parseInt(id) <= 0);

      if (validIds.length === 0) {
        return res.validationErrors([`No se encontraron IDs válidos para eliminar relaciones de sobrevivientes. IDs rechazados: ${rejectedIds.join(', ')}`]);
      }

      const result = await ActivityService.removeSurvivors(validActivityId, validIds);
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'REMOVE_SURVIVORS',
        description: `Se removieron ${result.count} sobrevivientes de la actividad ID "${idActivity}". IDs solicitados: ${survivorIds.join(', ')}. IDs eliminados: ${validIds.join(', ')}${rejectedIds.length>0?`. IDs rechazados: ${rejectedIds.join(', ')}`:''}`,
        affectedTable: 'ActivitySurvivor',
      });
      return res.success({ ...result, removedIds: validIds, rejectedIds }, 'Sobrevivientes removidos exitosamente');
    } catch (error) {
      console.error('[ACTIVITY] removeSurvivors error:', error);
      return res.error('Error al remover supervivientes de la actividad');
    }
  },

  // Assign godparents to activity
  assignGodparents: async (req, res) => {
    const { idActivity } = req.params;
    const { godparentIds } = req.body;
    
    const validId = ValidationRules.parseIdParam(idActivity);
    if (!validId) {
      return res.validationErrors(['idActivity debe ser un número entero positivo']);
    }
    
    if (!godparentIds || !Array.isArray(godparentIds) || godparentIds.length === 0) {
      return res.validationErrors(['godparentIds es requerido y debe ser un array no vacío']);
    }
    
    try {
      // QA: check if the activity exists
      const activity = await ActivityService.get(validId);
      if (!activity) return res.notFound('Activity');

      // Get valid godparents and filter out invalid ones
      const { validIds, invalidIds } = await ActivityService.getValidGodparents(godparentIds);
      
      if (validIds.length === 0) {
        const missingIds = invalidIds.join(', ');
        return res.validationErrors([`No se encontraron padrinos válidos. Los siguientes padrinos no existen o no están activos: ${missingIds}`]);
      }
      
      const result = await ActivityService.assignGodparents(validId, validIds);
      const userEmail = req.user?.sub;
      
      let message = `Se asignaron ${result.count} padrinos a la actividad ID "${idActivity}"`;
      if (invalidIds.length > 0) {
        const rejectedIds = invalidIds.join(', ');
        message += `. Nota: Los siguientes padrinos no fueron asignados porque no existen o no están activos: ${rejectedIds}`;
      }
      
      await SecurityLogService.log({
        email: userEmail,
        action: 'ASSIGN_GODPARENTS',
        description: `Se asignaron ${result.count} padrinos a la actividad ID "${idActivity}". IDs asignados: ${validIds.join(', ')}${invalidIds.length > 0 ? `. IDs rechazados: ${invalidIds.join(', ')}` : ''}`,
        affectedTable: 'ActivityGodparent',
      });
      
      return res.success({
        ...result,
        assignedIds: validIds,
        rejectedIds: invalidIds
      }, message);
    } catch (error) {
      console.error('[ACTIVITY] assignGodparents error:', error);
      return res.error('Error al asignar padrinos a la actividad');
    }
  },

  // Remove godparents from activity
  removeGodparents: async (req, res) => {
    const { idActivity } = req.params;
    const { godparentIds } = req.body;
    
    const validActivityId = ValidationRules.parseIdParam(idActivity);
    if (!validActivityId) {
      return res.validationErrors(['idActivity debe ser un número entero positivo']);
    }
    
    if (!godparentIds || !Array.isArray(godparentIds) || godparentIds.length === 0) {
      return res.validationErrors(['godparentIds es requerido y debe ser un array no vacío']);
    }
    
    try {
      // QA: check if the activity exists
      const activity = await ActivityService.get(validActivityId);
      if (!activity) return res.notFound('Activity');

      // Partial deletion: filter valid IDs and proceed
      const parsedIds = Array.isArray(godparentIds) ? godparentIds.map(id => parseInt(id)) : [];
      const validIds = parsedIds.filter(n => !isNaN(n) && n > 0);
      const rejectedIds = godparentIds.filter(id => isNaN(parseInt(id)) || parseInt(id) <= 0);

      if (validIds.length === 0) {
        return res.validationErrors([`No se encontraron IDs válidos para eliminar relaciones de padrinos. IDs rechazados: ${rejectedIds.join(', ')}`]);
      }

      const result = await ActivityService.removeGodparents(validActivityId, validIds);
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'REMOVE_GODPARENTS',
        description: `Se removieron ${result.count} padrinos de la actividad ID "${idActivity}". IDs solicitados: ${godparentIds.join(', ')}. IDs eliminados: ${validIds.join(', ')}${rejectedIds.length>0?`. IDs rechazados: ${rejectedIds.join(', ')}`:''}`,
        affectedTable: 'ActivityGodparent',
      });
      return res.success({ ...result, removedIds: validIds, rejectedIds }, 'Padrinos removidos exitosamente');
    } catch (error) {
      console.error('[ACTIVITY] removeGodparents error:', error);
      return res.error('Error al remover padrinos de la actividad');
    }
  }
};

module.exports = { ActivityController };
