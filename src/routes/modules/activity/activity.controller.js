const { ActivityService } = require('./activity.service');
const { EntityValidators } = require('../../../utils/validator');
const { SecurityLogService } = require('../../../services/securitylog.service');

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
  list: async (_req, res) => {
    try {
      const activities = await ActivityService.list();
      const mapped = activities.map(a => ({
        idActivity: a.idActivity,
        idHeadquarter: a.idHeadquarter,
        tittle: a.tittle,
        description: a.description,
        type: a.type,
        modality: a.modality,
        capacity: a.capacity,
        location: a.location,
        date: a.date,
        status: a.status,
        headquarter: a.headquarter ? {
          idHeadquarter: a.headquarter.idHeadquarter,
          name: a.headquarter.name,
          status: a.headquarter.status
        } : null
      }));
      return res.success(mapped);
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
    try {
      const activity = await ActivityService.get(idActivity);
      if (!activity) return res.notFound('Activity');
      return res.success({
        idActivity: activity.idActivity,
        idHeadquarter: activity.idHeadquarter,
        tittle: activity.tittle,
        description: activity.description,
        type: activity.type,
        modality: activity.modality,
        capacity: activity.capacity,
        location: activity.location,
        date: activity.date,
        status: activity.status,
        headquarter: activity.headquarter ? {
          idHeadquarter: activity.headquarter.idHeadquarter,
          name: activity.headquarter.name,
          status: activity.headquarter.status
        } : null
      });
    } catch (error) {
      console.error('[ACTIVITY] get error:', error);
      return res.error('Error retrieving activity');
    }
  },

  /**
   * Create a new activity.
   * POST /activities
   * Required fields: idHeadquarter, tittle, description, type, modality, capacity, location, date
   */
  create: async (req, res) => {
    const body = req.body || {};
    if (body.__jsonError) {
      return res.validationErrors(['Invalid JSON. Check request body syntax.']);
    }
    
    const { idHeadquarter, tittle, description, type, modality, capacity, location, date, status } = body;
    
    try {
      const created = await ActivityService.create({ 
        idHeadquarter, tittle, description, type, modality, capacity, location, date, status 
      });
      
      // Log the activity creation
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'CREATE',
        description: `Se creó la actividad con los siguientes datos: ${formatActivityData(created)}. ` +
          `Sede: "${created.headquarter?.name || 'N/A'}" (ID: ${created.idHeadquarter}).`,
        affectedTable: 'Activity',
      });
      
      return res.status(201).success(created, 'Activity created successfully');
    } catch (e) {
      if (typeof e?.message === 'string' && e.message.includes('no existe')) {
        return res.status(404).json({
          ok: false,
          message: e.message,
          statusCode: 404
        });
      }
      if (e && e.statusCode === 400) {
        return res.status(400).json({
          ok: false,
          message: e.message
        });
      }
      console.error('[ACTIVITY] create error:', e);
      return res.error('Error creating activity');
    }
  },

  /**
   * Update activity data by idActivity.
   * PUT /activities/:idActivity
   */
  update: async (req, res) => {
    const { idActivity } = req.params;
    const body = req.body || {};
    if (body.__jsonError) {
      return res.validationErrors(['Invalid JSON. Check request body syntax.']);
    }
    
    // Check existence before update
    const previousActivity = await ActivityService.get(idActivity);
    if (!previousActivity) {
      return res.notFound('Activity');
    }
    
    const { idHeadquarter, tittle, description, type, modality, capacity, location, date, status } = body;
    
    try {
      const updated = await ActivityService.update(idActivity, { 
        idHeadquarter, tittle, description, type, modality, capacity, location, date, status 
      });
      
      // Log the activity update
      const userEmail = req.user?.sub;
      
      // Check if only status changed from inactive to active (reactivation)
      const onlyStatusChange =
        previousActivity.status === 'inactive' &&
        updated.status === 'active' &&
        previousActivity.tittle === updated.tittle &&
        previousActivity.description === updated.description &&
        previousActivity.type === updated.type &&
        previousActivity.modality === updated.modality &&
        previousActivity.capacity === updated.capacity &&
        previousActivity.location === updated.location &&
        previousActivity.idHeadquarter === updated.idHeadquarter;
        
      if (onlyStatusChange) {
        await SecurityLogService.log({
          email: userEmail,
          action: 'REACTIVATE',
          description: `Se reactivó la actividad con ID "${idActivity}". Datos completos: ${formatActivityData(updated)}. ` +
            `Sede: "${updated.headquarter?.name || 'N/A'}" (ID: ${updated.idHeadquarter}).`,
          affectedTable: 'Activity',
        });
      } else {
        await SecurityLogService.log({
          email: userEmail,
          action: 'UPDATE',
          description: `Se actualizó la actividad con ID "${idActivity}".\n` +
            `Versión previa: ${formatActivityData(previousActivity)}. ` +
            `Sede: "${previousActivity.headquarter?.name || 'N/A'}" (ID: ${previousActivity.idHeadquarter}).\n` +
            `Nueva versión: ${formatActivityData(updated)}. ` +
            `Sede: "${updated.headquarter?.name || 'N/A'}" (ID: ${updated.idHeadquarter}).`,
          affectedTable: 'Activity',
        });
      }
      
      return res.success(updated, 'Activity updated successfully');
    } catch (e) {
      if (e && e.code === 'P2025') {
        return res.notFound('Activity');
      }
      if (typeof e?.message === 'string' && e.message.includes('no existe')) {
        return res.status(404).json({
          ok: false,
          message: e.message,
          statusCode: 404
        });
      }
      if (e && e.statusCode === 400) {
        return res.status(400).json({
          ok: false,
          message: e.message
        });
      }
      console.error('[ACTIVITY] update error:', e);
      return res.error('Error updating activity');
    }
  },

  /**
   * Update only the activity's status.
   * PATCH /activities/:idActivity/status
   */
  updateStatus: async (req, res) => {
    const { idActivity } = req.params;
    const { status } = req.body || {};
    if (!status) return res.validationErrors(['status is required']);
    
    // Check existence before update
    const previousActivity = await ActivityService.get(idActivity);
    if (!previousActivity) {
      return res.notFound('Activity');
    }
    
    try {
      const updatedWithRelations = await ActivityService.updateStatus(idActivity, status);
      
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
    
    // Check existence before delete
    const activityToDelete = await ActivityService.get(idActivity);
    if (!activityToDelete) {
      return res.notFound('Activity');
    }
    
    try {
      const updatedActivity = await ActivityService.delete(idActivity);
      
      // Log the activity deactivation
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'INACTIVE',
        description: `Se inactivó la actividad: ${formatActivityData(activityToDelete)}. ` +
          `Sede: "${activityToDelete.headquarter?.name || 'N/A'}" (ID: ${activityToDelete.idHeadquarter}).`,
        affectedTable: 'Activity',
      });
      
      return res.success({
        message: 'Activity deactivated successfully',
        activity: updatedActivity
      });
    } catch (e) {
      if (e && e.code === 'P2025')
        return res.notFound('Activity');
      console.error('[ACTIVITY] remove error:', e);
      return res.error('Error deactivating activity');
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
    try {
      const activity = await ActivityService.getWithRelations(idActivity);
      if (!activity) return res.notFound('Activity');
      return res.success(activity);
    } catch (error) {
      console.error('[ACTIVITY] getWithRelations error:', error);
      return res.error('Error retrieving activity with relations');
    }
  }
};

module.exports = { ActivityController };
