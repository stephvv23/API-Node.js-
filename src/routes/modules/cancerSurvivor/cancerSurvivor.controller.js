const { CancerSurvivorService } = require('./cancerSurvivor.service');
const { SurvivorService } = require('../survivor/survivor.service');
const { CancerService } = require('../cancer/cancer.service');
const { SecurityLogService } = require('../../../services/securitylog.service');
const { ValidationRules } = require('../../../utils/validator');

const CancerSurvivorController = {
  /**
   * GET /api/survivors/:id/cancers
   * List all cancers for a specific survivor
   */
  list: async (req, res) => {
    const { id } = req.params;

    try {
      const idNum = ValidationRules.parseIdParam(String(id || ''));
      if (!idNum) return res.validationErrors(['El parámetro id debe ser numérico']);

      // Validate survivor exists
      const survivor = await SurvivorService.findById(Number(idNum));
      if (!survivor) {
        return res.notFound('Superviviente');
      }

      const cancers = await CancerSurvivorService.getBySurvivor(Number(idNum));
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
   * Body: { "idCancer": 1, "stage": "II" }
   */
  create: async (req, res) => {
    const { id } = req.params;
    const { idCancer, stage } = req.body;

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

      // Check if relation already exists
      const existing = await CancerSurvivorService.findOne(Number(idNum), Number(idCancerNum));
      
      if (existing) {
        return res.validationErrors([
          `El superviviente ya tiene registrado el cáncer "${cancer.cancerName}". ` +
          `Use PUT para actualizar la etapa o DELETE para eliminarlo primero.`
        ]);
      }

      // Create new relation
      const newCancerSurvivor = await CancerSurvivorService.create(Number(idNum), idCancerNum, normalizedStage);

      // Security log
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'CREATE',
        description:
          `Se agregó el cáncer "${cancer.cancerName}" (ID: ${idCancer}) al superviviente "${survivor.survivorName}" (ID: ${id}). ` +
          `Etapa: "${normalizedStage}".`,
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
   * Update cancer stage
   * Body: { "stage": "III" } or { "stage": "Remisión" } or { "stage": "Curado" }
   */
  update: async (req, res) => {
    const { id, idCancer } = req.params;
    const { stage } = req.body;

    // Validate stage is provided
    if (!stage) {
      return res.validationErrors(['El campo stage es requerido']);
    }

    const errors = [];
    const idNum = ValidationRules.parseIdParam(String(id || ''));
    const idCancerNum = ValidationRules.parseIdParam(String(idCancer || ''));
    
    if (!idNum || !idCancerNum) {
      errors.push('Los parámetros id y idCancer deben ser numéricos');
    }

    if (typeof stage !== 'string' || stage.trim() === '') {
      errors.push('stage debe ser un texto válido');
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

      // Update stage
      const normalizedStage = stage.trim().replace(/\s+/g, ' ');
      const updated = await CancerSurvivorService.update(Number(idNum), Number(idCancerNum), { stage: normalizedStage });

      // Security log
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'UPDATE',
        description:
          `Se actualizó el cáncer "${cancerSurvivor.cancer.cancerName}" (ID: ${idCancer}) del superviviente "${survivor.survivorName}" (ID: ${id}). ` +
          `Etapa anterior: "${cancerSurvivor.stage}", Nueva etapa: "${normalizedStage}".`,
        affectedTable: 'CancerSurvivor'
      });

      return res.success(updated, 'Etapa del cáncer actualizada exitosamente');
    } catch (error) {
      console.error('[CANCER-SURVIVOR] update error:', error);
      return res.error('Error al actualizar el cáncer del superviviente');
    }
  },

  /**
   * DELETE /api/survivors/:id/cancers/:idCancer
   * Hard delete: Permanently remove a cancer from a survivor
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

      // Check if it's the last cancer
      const allCancers = await CancerSurvivorService.getBySurvivor(Number(idNum));
      
      if (allCancers.length === 1) {
        return res.badRequest(
          'No se puede eliminar el último cáncer. Un superviviente debe tener al menos un tipo de cáncer registrado.'
        );
      }

      // Delete permanently
      await CancerSurvivorService.delete(Number(idNum), Number(idCancerNum));

      // Security log
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'DELETE',
        description:
          `Se eliminó el cáncer "${cancerSurvivor.cancer.cancerName}" (ID: ${idCancer}) del superviviente "${survivor.survivorName}" (ID: ${id}). ` +
          `Etapa: "${cancerSurvivor.stage}".`,
        affectedTable: 'CancerSurvivor'
      });

      return res.success(null, 'Cáncer eliminado exitosamente');
    } catch (error) {
      console.error('[CANCER-SURVIVOR] delete error:', error);
      return res.error('Error al eliminar el cáncer del superviviente');
    }
  }
};

module.exports = { CancerSurvivorController };
