
const { CancerService } = require('./cancer.service');
const { SecurityLogService } = require('../../../services/securitylog.service');
const { EntityValidators } = require('../../../utils/validator');

const CancerController = {
  update: async (req, res) => {
    const { idCancer } = req.params;
    const exists = await CancerService.get(idCancer);
    if (!exists) {
      return res.notFound('Cáncer');
    }
    const validation = EntityValidators.cancer(req.body, { partial: true });
    if (!validation.isValid) {
      return res.validationErrors(validation.errors);
    }
    try {
      const updated = await CancerService.update(idCancer, req.body);
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'UPDATE',
        description: `Se actualizó el cáncer "${updated.cancerName}"`,
        affectedTable: 'cancer',
      });
      return res.success(updated, 'Cáncer actualizado exitosamente');
    } catch (e) {
      if (e.code === 'P2002') {
        return res.validationErrors(['Registro duplicado: ya existe un cáncer con ese nombre.']);
      }
      return res.error('Error al actualizar cáncer');
    }
  },

  list: async (_req, res) => {
    const cancers = await CancerService.list();
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
        description: `Se creó el cáncer "${created.cancerName}"`,
        affectedTable: 'cancer',
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
        description: `Se inactivó el cáncer "${updated.cancerName}"`,
        affectedTable: 'cancer',
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
        description: `Se reactivó el cáncer "${updated.cancerName}"`,
        affectedTable: 'cancer',
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
