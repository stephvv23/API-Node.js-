const { HeadquarterService } = require('./headquarter.service');
const { SecurityLogService } = require('../../../services/securitylog.service');

const HeadquarterController = {
  // Lists all active headquarters
  getAllActive: async (_req, res) => {
    try {
      const headquarters = await HeadquarterService.listActive();
      res.json({ ok: true, data: headquarters });
    } catch (error) {
      console.error('[HEADQUARTERS] getAllActive error:', error);
      res.status(500).json({ ok: false, message: 'Error al obtener las sedes activas' });
    }
  },

  // Lists all headquarters with status filter
  getAll: async (req, res, next) => {
    try {
      const status = (req.query.status || 'active').toLowerCase();
      const allowed = ['active', 'inactive', 'all'];
      if (!allowed.includes(status)) {
        return next(ApiError.badRequest('El estado debe ser "active", "inactive" o "all"'));
      }

      const headquarters = await HeadquarterService.list({ status });
      return res.status(200).json({ ok: true, data: headquarters });
    } catch (error) {
      return next(error);
    }
  },

  // Finds a headquarter by id
  getById: async (req, res) => {
    const { id } = req.params;
    try {
      const headquarter = await HeadquarterService.findById(id);
      if (!headquarter) {
        return res.status(404).json({ ok: false, message: 'Sede no encontrada' });
      }
      res.json({ ok: true, data: headquarter });
    } catch (error) {
      console.error('[HEADQUARTERS] getById error:', error);
      res.status(500).json({ ok: false, message: 'Error al obtener la sede' });
    }
  },

  // Creates a new headquarter
  create: async (req, res) => {
    const { name, schedule, location, email, description, status } = req.body;
    const errores = [];

    if (!name) errores.push('El campo "nombre" es obligatorio.');
    else if (name.length > 150) errores.push('El campo "nombre" no puede tener más de 150 caracteres.');

    if (!schedule) errores.push('El campo "horario" es obligatorio.');
    else if (schedule.length > 300) errores.push('El campo "horario" no puede tener más de 300 caracteres.');

    if (!location) errores.push('El campo "ubicación" es obligatorio.');
    else if (location.length > 300) errores.push('El campo "ubicación" no puede tener más de 300 caracteres.');

    if (!email) errores.push('El campo "email" es obligatorio.');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errores.push('El campo "email" no es válido.');
    else if (email.length > 150) errores.push('El campo "email" no puede tener más de 150 caracteres.');

    if (!description) errores.push('El campo "descripción" es obligatorio.');
    else if (description.length > 750) errores.push('El campo "descripción" no puede tener más de 750 caracteres.');

    if (status && status.length > 25) errores.push('El campo "estado" no puede tener más de 25 caracteres.');

    const allHeadquarters = await HeadquarterService.list({ status: 'all' });
    if (allHeadquarters.some(h => h.name === name)) {
      errores.push('Ya existe una sede con ese nombre.');
    }
    if (allHeadquarters.some(h => h.email === email)) {
      errores.push('Ya existe una sede con ese email.');
    }

    if (errores.length > 0) {
      return res.status(400).json({ ok: false, errores });
    }

    try {
      const newHeadquarter = await HeadquarterService.create({ name, schedule, location, email, description, status });
      const userEmail = req.user?.sub; 
      await SecurityLogService.log({
        email: userEmail,
        action: 'CREATE',
        description: 
          `Se creó la sede con los siguientes datos: ` +
          `ID: "${newHeadquarter.idHeadquarter}", ` +
          `Nombre: "${newHeadquarter.name}", ` +
          `Horario: "${newHeadquarter.schedule}", ` +
          `Ubicación: "${newHeadquarter.location}", ` +
          `Correo: "${newHeadquarter.email}", ` +
          `Descripción: "${newHeadquarter.description}", ` +
          `Estado: "${newHeadquarter.status}".`,
        affectedTable: 'Headquarter',
      });

      res.status(201).json({ ok: true, data: newHeadquarter });
    } catch (error) {
      console.error('[HEADQUARTERS] create error:', error);
      res.status(500).json({ ok: false, message: 'Error al crear la sede' });
    }
  },

  // Updates an existing headquarter
  update: async (req, res) => {
    const { id } = req.params;
    const { name, schedule, location, email, description, status } = req.body;
    const errores = [];

    if (!name) errores.push('El campo "nombre" es obligatorio.');
    else if (!/^[a-zA-Z0-9\s]+$/.test(name)) errores.push('El campo "nombre" contiene caracteres inválidos.');
    else if (name.length > 150) errores.push('El campo "nombre" no puede tener más de 150 caracteres.');

    if (!schedule) errores.push('El campo "horario" es obligatorio.');
    else if (schedule.length > 300) errores.push('El campo "horario" no puede tener más de 300 caracteres.');

    if (!location) errores.push('El campo "ubicación" es obligatorio.');
    else if (location.length > 300) errores.push('El campo "ubicación" no puede tener más de 300 caracteres.');

    if (!email) errores.push('El campo "email" es obligatorio.');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errores.push('El campo "email" no es válido.');
    else if (email.length > 150) errores.push('El campo "email" no puede tener más de 150 caracteres.');

    if (!description) errores.push('El campo "descripción" es obligatorio.');
    else if (description.length > 750) errores.push('El campo "descripción" no puede tener más de 750 caracteres.');

    if (!status) errores.push('El campo "estado" es obligatorio.');
    else if (!['active', 'inactive'].includes(status)) errores.push('El campo "estado" debe ser "active" o "inactive".');
    else if (status.length > 25) errores.push('El campo "estado" no puede tener más de 25 caracteres.');

    if (name) {
      const existsName = await HeadquarterService.findbyname(name);
      if (existsName && existsName.idHeadquarter != id) errores.push('Ya existe una sede con ese nombre.');
    }
    if (email) {
      const existsEmail = await HeadquarterService.findbyemail(email);
      if (existsEmail && existsEmail.idHeadquarter != id) errores.push('Ya existe una sede con ese email.');
    }

    if (errores.length > 0) {
      return res.status(400).json({ ok: false, errores });
    }

    try {
      // gets the previous headquarter data
      const previousHeadquarter = await HeadquarterService.findById(id);

      const updatedHeadquarter = await HeadquarterService.update(id, { name, schedule, location, email, description, status });
      if (!updatedHeadquarter) {
        return res.status(404).json({ ok: false, message: `No se encontró la sede con el ID ${id}` });
      }

      // Register in the log the changes (previous and new)
      const userEmail = req.user?.sub;

      // verify if only the status changed from inactive to active
      const onlyStatusChange =
        previousHeadquarter.status === 'inactive' &&
        updatedHeadquarter.status === 'active' &&
        previousHeadquarter.name === updatedHeadquarter.name &&
        previousHeadquarter.schedule === updatedHeadquarter.schedule &&
        previousHeadquarter.location === updatedHeadquarter.location &&
        previousHeadquarter.email === updatedHeadquarter.email &&
        previousHeadquarter.description === updatedHeadquarter.description;

      if (onlyStatusChange) {
        await SecurityLogService.log({
          email: userEmail,
          action: 'REACTIVATE',
          description:
        `Se reactivó la sede con ID "${id}". Datos completos:\n` +
        `Nombre: "${updatedHeadquarter.name}", ` +
        `Horario: "${updatedHeadquarter.schedule}", ` +
        `Ubicación: "${updatedHeadquarter.location}", ` +
        `Correo: "${updatedHeadquarter.email}", ` +
        `Descripción: "${updatedHeadquarter.description}", ` +
        `Estado: "${updatedHeadquarter.status}".`,
          affectedTable: 'Headquarter',
        });
      } else {
        await SecurityLogService.log({
          email: userEmail,
          action: 'UPDATE',
          description:
        `Se actualizó la sede con ID "${id}".\n` +
        `Versión previa: ` +
        `Nombre: "${previousHeadquarter.name}", ` +
        `Horario: "${previousHeadquarter.schedule}", ` +
        `Ubicación: "${previousHeadquarter.location}", ` +
        `Correo: "${previousHeadquarter.email}", ` +
        `Descripción: "${previousHeadquarter.description}", ` +
        `Estado: "${previousHeadquarter.status}". \n` +
        `Nueva versión: ` +
        `Nombre: "${updatedHeadquarter.name}", ` +
        `Horario: "${updatedHeadquarter.schedule}", ` +
        `Ubicación: "${updatedHeadquarter.location}", ` +
        `Correo: "${updatedHeadquarter.email}", ` +
        `Descripción: "${updatedHeadquarter.description}", ` +
        `Estado: "${updatedHeadquarter.status}". \n`,
          affectedTable: 'Headquarter',
        });
      }
      res.json({ ok: true, data: updatedHeadquarter });
    } catch (error) {
      console.error('[HEADQUARTERS] update error:', error);
      const message = error.message || 'Error al actualizar la sede';
      res.status(500).json({ ok: false, message: `No se pudo actualizar la sede: ${message}` });
    }
  },

  // Removes a headquarter
  delete: async (req, res) => {
    const { id } = req.params;
    try {
      const deletedHeadquarter = await HeadquarterService.remove(id);
      if (!deletedHeadquarter) {
        return res.status(404).json({ ok: false, message: 'Sede no encontrada' });
      }
      const userEmail = req.user?.sub; 
      await SecurityLogService.log({
        email: userEmail,
        action: 'INACTIVE',
        description: `Se inactivó la sede: `+
        `ID "${id}", `+
        `Nombre: "${deletedHeadquarter.name}", ` +
        `Horario: "${deletedHeadquarter.schedule}", ` +
        `Ubicación: "${deletedHeadquarter.location}", ` +
        `Correo: "${deletedHeadquarter.email}", ` +
        `Descripción: "${deletedHeadquarter.description}", ` +
        `Estado: "${deletedHeadquarter.status}".`,
        affectedTable: 'Headquarter',
      });
      res.json({ ok: true, data: deletedHeadquarter });
    } catch (error) {
      res.status(500).json({ ok: false, message: 'Error al eliminar la sede' });
    }
  }
};

module.exports = { HeadquarterController };
