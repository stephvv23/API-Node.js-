const { CancerSurvivorService } = require('./cancerSurvivor.service');
const { SurvivorService } = require('../survivor/survivor.service');
const { CancerService } = require('../cancer/cancer.service');
const { SecurityLogService } = require('../../../services/securitylog.service');
const { ValidationRules } = require('../../../utils/validator');

const CancerSurvivorController = {
  /**
   * GET /api/survivors/:id/cancers?take=10&skip=0&status=active
   * List all cancers for a specific survivor with pagination
   * Query params:
   * - status: 'active' (default), 'inactive', 'all'
   * - take: number of records (default 10)
   * - skip: number of records to skip (default 0)
   */
  list: async (req, res) => {
    const { id } = req.params;
    const take = parseInt(req.query?.take) || 10;
    const skip = parseInt(req.query?.skip) || 0;
    const status = (req.query.status || 'active').toLowerCase();

    try {
      // Validate status parameter
      const allowedStatus = ['active', 'inactive', 'all'];
      if (!allowedStatus.includes(status)) {
        return res.validationErrors([
          'El parámetro status debe ser "active", "inactive" o "all"'
        ]);
      }

      const idNum = ValidationRules.parseIdParam(String(id || ''));
      if (!idNum) return res.validationErrors(['El parámetro id debe ser numérico']);

      // Validate survivor exists (don't return all survivor data)
      const survivor = await SurvivorService.findById(Number(idNum));
      if (!survivor) {
        return res.notFound('Superviviente');
      }

      const cancers = await CancerSurvivorService.getBySurvivor(Number(idNum), { take, skip, status });
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

      // Validate survivor exists (don't return all survivor data)
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
    
    // Check for JSON parsing errors
    if (req.body.__jsonError) {
      return res.validationErrors([req.body.__jsonErrorMessage || 'Formato de JSON inválido']);
    }

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

    // Validate field lengths
    const lengthErrors = ValidationRules.validateFieldLengths(
      { stage: normalizedStage },
      { stage: 255 }
    );
    errors.push(...lengthErrors);

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
        return res.validationErrors([`El tipo de cáncer "${cancer.cancerName}" no está activo y no puede ser referenciado`]);
      }

      // Check if relation already exists (any status)
      const existing = await CancerSurvivorService.findOneAnyStatus(Number(idNum), Number(idCancerNum));
      
      if (existing) {
        if (existing.status === 'inactive') {
          return res.validationErrors([
            `El superviviente tenía registrado el cáncer "${cancer.cancerName}" pero está inactivo. ` +
            `Contacte al administrador para reactivarlo.`
          ]);
        }
        return res.validationErrors([
          `El superviviente ya tiene registrado el cáncer "${cancer.cancerName}". ` +
          `Use PUT para actualizar la etapa o DELETE para desactivarlo.`
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
      
      // Handle Prisma P2000 error (value too long for column)
      if (error.code === 'P2000') {
        const columnName = error.meta?.column_name || 'campo';
        return res.validationErrors([`El valor proporcionado para ${columnName} es demasiado largo`]);
      }
      
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
    
    // Check for JSON parsing errors
    if (req.body.__jsonError) {
      return res.validationErrors([req.body.__jsonErrorMessage || 'Formato de JSON inválido']);
    }

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

    const normalizedStage = stage.trim().replace(/\s+/g, ' ');
    
    // Validate field lengths
    const lengthErrors = ValidationRules.validateFieldLengths(
      { stage: normalizedStage },
      { stage: 255 }
    );
    errors.push(...lengthErrors);

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
        return res.badRequest('No se pueden actualizar cánceres de un superviviente inactivo');
      }

      // Validate cancer-survivor relation exists and is active
      const cancerSurvivor = await CancerSurvivorService.findOne(Number(idNum), Number(idCancerNum));
      if (!cancerSurvivor) {
        // Check if it exists but is inactive
        const inactiveRelation = await CancerSurvivorService.findOneAnyStatus(Number(idNum), Number(idCancerNum));
        if (inactiveRelation && inactiveRelation.status === 'inactive') {
          return res.badRequest('No se puede actualizar un cáncer inactivo. Contacte al administrador para reactivarlo.');
        }
        return res.notFound('El superviviente no tiene registrado este tipo de cáncer');
      }

      // Validate cancer is still active
      if (cancerSurvivor.cancer.status !== 'active') {
        return res.badRequest(`El tipo de cáncer "${cancerSurvivor.cancer.cancerName}" está inactivo y no puede ser modificado`);
      }

      // Update stage
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
      
      // Handle Prisma P2000 error (value too long for column)
      if (error.code === 'P2000') {
        const columnName = error.meta?.column_name || 'campo';
        return res.validationErrors([`El valor proporcionado para ${columnName} es demasiado largo`]);
      }
      
      return res.error('Error al actualizar el cáncer del superviviente');
    }
  },

  /**
   * PATCH /api/survivors/:id/cancers/:idCancer/status
   * Toggle status: activate or deactivate cancer-survivor relation
   */
  toggleStatus: async (req, res) => {
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

      // Check relation exists (any status)
      const cancerSurvivor = await CancerSurvivorService.findOneAnyStatus(Number(idNum), Number(idCancerNum));
      if (!cancerSurvivor) {
        return res.notFound('El superviviente no tiene registrado este tipo de cáncer');
      }

      const currentStatus = cancerSurvivor.status;
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

      // If trying to deactivate, check if it's the last active cancer
      if (newStatus === 'inactive') {
        const allActiveCancers = await CancerSurvivorService.getBySurvivor(Number(idNum));
        
        if (allActiveCancers.length === 1) {
          return res.badRequest(
            'No se puede desactivar el último cáncer activo. Un superviviente debe tener al menos un tipo de cáncer registrado y activo.'
          );
        }
      }

      // Toggle status
      if (newStatus === 'active') {
        await CancerSurvivorService.reactivate(Number(idNum), Number(idCancerNum));
      } else {
        await CancerSurvivorService.softDelete(Number(idNum), Number(idCancerNum));
      }

      // Security log
      const userEmail = req.user?.sub;
      const action = newStatus === 'active' ? 'REACTIVATE' : 'DELETE';
      const actionText = newStatus === 'active' ? 'reactivó' : 'desactivó';
      
      await SecurityLogService.log({
        email: userEmail,
        action: action,
        description:
          `Se ${actionText} el cáncer "${cancerSurvivor.cancer.cancerName}" (ID: ${idCancer}) del superviviente "${survivor.survivorName}" (ID: ${id}). ` +
          `Etapa: "${cancerSurvivor.stage}". Estado anterior: "${currentStatus}", Estado nuevo: "${newStatus}".`,
        affectedTable: 'CancerSurvivor'
      });

      const message = newStatus === 'active' 
        ? 'Cáncer reactivado exitosamente' 
        : 'Cáncer desactivado exitosamente';

      return res.success({ status: newStatus }, message);
    } catch (error) {
      console.error('[CANCER-SURVIVOR] toggleStatus error:', error);
      return res.error('Error al cambiar el estado del cáncer del superviviente');
    }
  }
};

module.exports = { CancerSurvivorController };
