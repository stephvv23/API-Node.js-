const { CancerSurvivorService } = require('./cancerSurvivor.service');
const { SurvivorService } = require('../survivor/survivor.service');
const { CancerService } = require('../cancer/cancer.service');
const { SecurityLogService } = require('../../../services/securitylog.service');
const { ValidationRules } = require('../../../utils/validator');

const CancerSurvivorController = {
  // Use ValidationRules.parseIdParam for numeric id parsing
  /**
   * GET /api/survivors/:id/cancers
   * List all cancers for a specific survivor
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
      const idNum = ValidationRules.parseIdParam(String(id || ''));
      if (!idNum) return res.validationErrors(['El parámetro id debe ser numérico']);

      // Validate survivor exists
  const survivor = await SurvivorService.findById(Number(idNum));
      if (!survivor) {
        return res.notFound('Superviviente');
      }

  const cancers = await CancerSurvivorService.getBySurvivor(Number(idNum), status);
      return res.success(cancers);
    } catch (error) {
      console.error('[CANCER-SURVIVOR] list error:', error);
      return res.error('Error al obtener los cánceres del superviviente');
    }
  },

  /**
   * GET /api/survivors/:id/cancers/:idCancer
   * Get a specific cancer of a survivor
   */
  getOne: async (req, res) => {
    const { id, idCancer } = req.params;

    try {
      const idNum = ValidationRules.parseIdParam(String(id || ''));
      const idCancerNum = ValidationRules.parseIdParam(String(idCancer || ''));
      if (!idNum || !idCancerNum) return res.validationErrors(['Los parámetros id y idCancer deben ser numéricos']);

      // Validate survivor exists
      const survivor = await SurvivorService.findById(Number(idNum));
      if (!survivor) {
        return res.notFound('Superviviente');
      }
      const cancerSurvivor = await CancerSurvivorService.findOne(Number(idNum), Number(idCancerNum));
      if (!cancerSurvivor) {
        return res.notFound('Relación cáncer-superviviente');
      }

      return res.success(cancerSurvivor);
    } catch (error) {
      console.error('[CANCER-SURVIVOR] getOne error:', error);
      return res.error('Error al obtener el cáncer del superviviente');
    }
  },

  /**
   * POST /api/survivors/:id/cancers
   * Add a cancer to a survivor
   */
  create: async (req, res) => {
    const { id } = req.params;
    const { idCancer, stage, status = 'active' } = req.body;

    // Validations
    const errors = [];

    const idNum = ValidationRules.parseIdParam(String(id || ''));
    const idCancerNum = ValidationRules.parseIdParam(String(idCancer || ''));

    if (!idNum) errors.push('El parámetro id debe ser numérico');
    if (!idCancerNum) errors.push('idCancer es requerido y debe ser numérico');

    const trimmedBody = ValidationRules.trimStringFields(req.body || {});
    const normalizedStage = typeof trimmedBody.stage === 'string' ? trimmedBody.stage.trim().replace(/\s+/g, ' ') : trimmedBody.stage;

    if (!normalizedStage || typeof normalizedStage !== 'string') {
      errors.push('stage es requerido y debe ser un texto válido');
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
        return res.badRequest('No se pueden agregar cánceres a un superviviente inactivo');
      }

      // Validate cancer exists and is active
      const cancer = await CancerService.get(idCancerNum);
      if (!cancer) {
        return res.validationErrors([`El tipo de cáncer con ID ${idCancer} no existe`]);
      }

      if (cancer.status !== 'active') {
        return res.validationErrors([`El tipo de cáncer "${cancer.cancerName}" no está activo`]);
      }

      // Check if relation already exists (active or inactive)
  const existing = await CancerSurvivorService.findOne(Number(idNum), Number(idCancerNum));
      
      if (existing) {
        // If it exists and is active, return error
        if (existing.status === 'active') {
          return res.validationErrors([
            `El superviviente ya tiene registrado el cáncer "${cancer.cancerName}" de forma activa. ` +
            `Use PUT para actualizar la etapa.`
          ]);
        }
        
        // If it exists but is inactive, reactivate it
        if (existing.status === 'inactive') {
          const reactivated = await CancerSurvivorService.update(Number(idNum), idCancerNum, {
            status: 'active',
            stage: normalizedStage // Update stage with normalized value
          });

          // Security log for reactivation
          const userEmail = req.user?.sub;
          await SecurityLogService.log({
            email: userEmail,
            action: 'REACTIVATE',
            description:
              `Se reactivó el cáncer "${cancer.cancerName}" (ID: ${idCancer}) del superviviente "${survivor.survivorName}" (ID: ${id}). ` +
              `Etapa anterior: "${existing.stage}", Nueva etapa: "${normalizedStage}". Estado anterior: "inactive", Nuevo estado: "active".`,
            affectedTable: 'CancerSurvivor'
          });

          return res.success(reactivated, 'Cáncer reactivado exitosamente');
        }
      }

      // Create new relation if it doesn't exist
  const newCancerSurvivor = await CancerSurvivorService.create(Number(idNum), idCancerNum, normalizedStage, status);

      // Security log
  const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'CREATE',
        description:
          `Se agregó el cáncer "${cancer.cancerName}" (ID: ${idCancer}) al superviviente "${survivor.survivorName}" (ID: ${id}). ` +
          `Etapa: "${normalizedStage}", Estado: "${status}".`,
        affectedTable: 'CancerSurvivor'
      });

      return res.status(201).success(newCancerSurvivor, 'Cáncer agregado exitosamente');
    } catch (error) {
      console.error('[CANCER-SURVIVOR] create error:', error);
      return res.error('Error al agregar el cáncer al superviviente');
    }
  },

  /**
   * PUT /api/survivors/:id/cancers/:idCancer
   * Update cancer stage or status
   */
  update: async (req, res) => {
    const { id, idCancer } = req.params;
    const { stage, status } = req.body;

    // Validate at least one field to update
    if (!stage && !status) {
      return res.validationErrors(['Debe proporcionar al menos un campo para actualizar: stage o status']);
    }


    const errors = [];
    const idNum = ValidationRules.parseIdParam(String(id || ''));
    const idCancerNum = ValidationRules.parseIdParam(String(idCancer || ''));
    if (!idNum || !idCancerNum) {
      errors.push('Los parámetros id y idCancer deben ser numéricos');
    }

    if (stage !== undefined && (typeof stage !== 'string' || stage.trim() === '')) {
      errors.push('stage debe ser un texto válido');
    }

    if (status !== undefined && !['active', 'inactive'].includes(status)) {
      errors.push('status debe ser "active" o "inactive"');
    }

    if (errors.length > 0) {
      return res.validationErrors(errors);
    }

    try {
      // Validate survivor exists
      const survivor = await SurvivorService.findById(Number(idNum));
      if (!survivor) {
        return res.notFound('Superviviente');
      }

      // Validate cancer-survivor relation exists
      const cancerSurvivor = await CancerSurvivorService.findOne(Number(idNum), Number(idCancerNum));
      if (!cancerSurvivor) {
        return res.notFound('El superviviente no tiene registrado este tipo de cáncer');
      }

      // Build update payload
  const updateData = {};
  if (stage) updateData.stage = stage.trim().replace(/\s+/g, ' ');
  if (status) updateData.status = status;

  const updated = await CancerSurvivorService.update(Number(idNum), Number(idCancerNum), updateData);

      // Security log
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'UPDATE',
        description:
          `Se actualizó el cáncer "${cancerSurvivor.cancer.cancerName}" (ID: ${idCancer}) del superviviente "${survivor.survivorName}" (ID: ${id}). ` +
          `Etapa anterior: "${cancerSurvivor.stage}", Nueva etapa: "${updated.stage}". ` +
          `Estado anterior: "${cancerSurvivor.status}", Nuevo estado: "${updated.status}".`,
        affectedTable: 'CancerSurvivor'
      });

      return res.success(updated, 'Cáncer actualizado exitosamente');
    } catch (error) {
      console.error('[CANCER-SURVIVOR] update error:', error);
      return res.error('Error al actualizar el cáncer del superviviente');
    }
  },

  /**
   * DELETE /api/survivors/:id/cancers/:idCancer
   * Soft delete: Inactivate a cancer from a survivor
   */
  delete: async (req, res) => {
    const { id, idCancer } = req.params;

    try {
      // Parse and validate numeric route ids
      const idNum = ValidationRules.parseIdParam(String(id || ''));
      const idCancerNum = ValidationRules.parseIdParam(String(idCancer || ''));
      if (!idNum || !idCancerNum) return res.validationErrors(['Los parámetros id y idCancer deben ser numéricos']);

      // Validate survivor exists
      const survivor = await SurvivorService.findById(Number(idNum));
      if (!survivor) {
        return res.notFound('Superviviente');
      }

      // Validate cancer-survivor relation exists
      const cancerSurvivor = await CancerSurvivorService.findOne(Number(idNum), Number(idCancerNum));
      if (!cancerSurvivor) {
        return res.notFound('El superviviente no tiene registrado este tipo de cáncer');
      }

      // Check if it's already inactive
      if (cancerSurvivor.status === 'inactive') {
        return res.badRequest('Este cáncer ya está inactivo');
      }

    // Check if it's the last active cancer
    const allCancers = await CancerSurvivorService.getBySurvivor(Number(idNum), 'all');
      const activeCancers = allCancers.filter(c => c.status === 'active');
      
      if (activeCancers.length === 1) {
        return res.badRequest(
          'No se puede inactivar el último cáncer activo. Un superviviente debe tener al menos un tipo de cáncer activo.'
        );
      }

    const inactivated = await CancerSurvivorService.delete(Number(idNum), Number(idCancerNum));

      // Security log
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'INACTIVE',
        description:
          `Se inactivó el cáncer "${cancerSurvivor.cancer.cancerName}" (ID: ${idCancer}) del superviviente "${survivor.survivorName}" (ID: ${id}). ` +
          `Etapa: "${cancerSurvivor.stage}". Estado anterior: "${cancerSurvivor.status}", Nuevo estado: "inactive".`,
        affectedTable: 'CancerSurvivor'
      });

      return res.success(inactivated, 'Cáncer inactivado exitosamente');
    } catch (error) {
      console.error('[CANCER-SURVIVOR] delete error:', error);
      return res.error('Error al inactivar el cáncer del superviviente');
    }
  }
};

module.exports = { CancerSurvivorController };
