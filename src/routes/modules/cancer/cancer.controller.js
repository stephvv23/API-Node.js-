
const { CancerService } = require('./cancer.service');
const { SecurityLogService } = require('../../../services/securitylog.service');
const { EntityValidators } = require('../../../utils/validator');

const CancerController = {
  update: async (req, res) => {
    const { idCancer } = req.params;
    const previous = await CancerService.get(idCancer);
    if (!previous) {
      return res.notFound('Cáncer');
    }
    const validation = EntityValidators.cancer(req.body, { partial: true });
    if (!validation.isValid) {
      return res.validationErrors(validation.errors);
    }
    try {
      const updated = await CancerService.update(idCancer, req.body);
      const userEmail = req.user?.sub;
      
      // Check if only status changed from inactive to active (reactivation)
      const onlyStatusChange =
        previous.status === 'inactive' &&
        updated.status === 'active' &&
        previous.cancerName === updated.cancerName &&
        previous.description === updated.description;
      
      if (onlyStatusChange) {
        await SecurityLogService.log({
          email: userEmail,
          action: 'REACTIVATE',
          description: `Se reactivó el cáncer "${updated.cancerName}" (ID: ${updated.idCancer}). ` +
            `Descripción: "${updated.description}", Estado: "${updated.status}".`,
          affectedTable: 'Cancer',
        });
      } else {
        await SecurityLogService.log({
          email: userEmail,
          action: 'UPDATE',
          description: `Se actualizó el cáncer de "${previous.cancerName}" a "${updated.cancerName}". ` +
            `Descripción previa: "${previous.description}" → Nueva descripción: "${updated.description}".`,
          affectedTable: 'Cancer',
        });
      }
      return res.success(updated, 'Cáncer actualizado exitosamente');
    } catch (e) {
      if (e.code === 'P2002') {
        return res.validationErrors(['Registro duplicado: ya existe un cáncer con ese nombre.']);
      }
      return res.error('Error al actualizar cáncer');
    }
  },

  list: async (req, res) => {
    const filters = {};
    
    // Status filter from query parameter
    if (req.query.status !== undefined) {
      const status = String(req.query.status).toLowerCase();
      if (status === 'active' || status === 'inactive' || status === 'all') {
        filters.status = status;
      } else {
        return res.validationErrors(['El parámetro status debe ser "active", "inactive" o "all"']);
      }
    }
    
    const cancers = await CancerService.list(filters);
    res.json(cancers);
  },
  // get by id
  get: async (req, res) => {
    const { idCancer } = req.params;
    const cancer = await CancerService.get(idCancer);
    if (!cancer) return res.status(404).json({ message: 'Cáncer not found'});
    res.json(cancer);
  },

  //create with status active by default and log the action
  create: async (req, res) => {
    const validation = EntityValidators.cancer(req.body, { partial: false });
    if (!validation.isValid) {
      return res.validationErrors(validation.errors);
    }
    try {
      const created = await CancerService.create(req.body);
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'CREATE',
        description: `Se creó el cáncer "${created.cancerName}" con ID "${created.idCancer}" y descripción "${created.description}".`,
        affectedTable: 'Cancer',
      });
      return res.status(201).success(created, 'Cáncer creado exitosamente');
    } catch (e) {
      if (e.code === 'P2002') {
        return res.validationErrors(['Registro duplicado: ya existe un cáncer con ese nombre.']);
      }
      return res.error('Error al crear cáncer');
    }
  },
  //soft delete and log the action
  remove: async (req, res) => {
    const { idCancer } = req.params;
    const exists = await CancerService.get(idCancer);
    if (!exists) {
      return res.notFound('Cáncer');
    }
    try {
      const updated = await CancerService.delete(idCancer);
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'INACTIVE',
        description: `Se inactivó el cáncer "${updated.cancerName}" (ID: ${updated.idCancer}). ` +
          `Descripción: "${updated.description}".`,
        affectedTable: 'Cancer',
      });
      return res.success(updated, 'Cáncer inactivado exitosamente');
    } catch (e) {
      if (e && e.code === 'P2025') {
        return res.notFound('Cáncer');
      }
      return res.error('Error al inactivar cáncer');
    }
  },

  // reactive and log the action
  reactivate: async (req, res) => {
    const { idCancer } = req.params;
    try {
      const updated = await CancerService.reactivate(idCancer);
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'REACTIVATE',
        description: `Se reactivó el cáncer "${updated.cancerName}" (ID: ${updated.idCancer}). ` +
          `Descripción: "${updated.description}", Estado: "${updated.status}".`,
        affectedTable: 'Cancer',
      });
      return res.success(updated, 'Cáncer reactivado exitosamente');
    } catch (e) {
      if (e && e.code === 'P2025') {
        return res.notFound('Cáncer');
      }
      return res.error('Error al reactivar cáncer');
    }
  },


};

module.exports = { CancerController };
