const { CancerService } = require('./cancer.service');
const { SecurityLogService } = require('./securitylog.service');

const CancerController = {

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
  const { cancerName, description, status } = req.body || {};

  if (!cancerName) {
    return res.status(400).json({ message: 'cancerName are required' });
  } else if (!description) {
    return res.status(400).json({ message: 'description are required' });
  }

  try {
    // Create the cancer entry
    const created = await CancerService.create({ cancerName, description, status });

    // Create a security log entry
    const userEmail = req.user?.sub; // The user cannot create a cancer without an email address. Otherwise, they wouldn't have a token and would simply go directly to the page, so it would be unnecessary to provide an option in case they don't have an email address.
    await SecurityLogService.log({
      email: userEmail,
      action: 'CREATE',
      description: `Se creó el cáncer "${created.cancerName}"`,
      affectedTable: 'cancer',
    });

    res.status(201).json(created);
  } catch (e) {
    if (e.code === 'P2002') {
      console.warn('[CANCER] create warning: registro duplicado');
      return res.status(400).json({ message: 'Registro duplicado: ya existe un cáncer con ese nombre.' });
    }
    console.error('[CANCER] create error:', e.message);
    return res.status(500).json({ message: 'Error al crear cáncer' });
  }
},

  //update and log the action
  update: async (req, res) => {
    const { idCancer } = req.params;
    const { cancerName, description, status } = req.body || {};
    if (!cancerName) {
      return res
        .status(400)
        .json({ message: 'cancerName are required'});
    }else if (!description){
      return res
        .status(400)
        .json({ message: 'description are required'});
    }else if (!status){
      return res
        .status(400)
        .json({ message: 'status are required'});
    }
    try {
      const updated = await CancerService.update(idCancer, { cancerName, description, status });
      const userEmail = req.user?.sub; 
      await SecurityLogService.log({
        email: userEmail,
        action: 'UPDATE',
        description: `Se actualizó el cáncer "${updated.cancerName}"`,
        affectedTable: 'cancer',
      });

      
      res.json(updated);
      
    }catch (e) {
      if (e.code === 'P2002') {
        console.warn('[CANCER] update warning: registro duplicado');
        return res.status(400).json({ message: 'Registro duplicado: ya existe un cáncer con ese nombre.' });
      }
      console.error('[CANCER] update error:', e.message);
      return res.status(500).json({ message: 'Error al actualizar cáncer' });
    }
  },
  //soft delete and log the action
  remove: async (req, res) => {
    const { idCancer } = req.params;
    try {
      const updated = await CancerService.delete(idCancer);
      
      const userEmail = req.user?.sub; 
      await SecurityLogService.log({
        email: userEmail,
        action: 'INACTIVE',
        description: `Se inactivó el cáncer "${updated.cancerName}"`,
        affectedTable: 'cancer',
      });

      res.json({ message: 'Cancer marked as inactive (soft delete)', data: updated });
    } catch (e) {
      if (e && e.code === 'P2025') {
        return res.status(404).json({ message: 'Cancer not found' });
      }
      throw e;
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
      
      res.json(updated);
    } catch (e) {
      if (e && e.code === 'P2025') {
        return res.status(404).json({ message: 'Cancer not found' });
      }
      throw e;
    }
  },


};

module.exports = { CancerController };
