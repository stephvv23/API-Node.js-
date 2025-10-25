const { GodParentService } = require('./godParent.service');
const { SecurityLogService } = require('../../../services/securitylog.service');
const { EntityValidators } = require('../../../utils/validator');
// Import prisma for foreign key validation
let prisma = require('../../../lib/prisma.js');

// Helper function to format dates for logging
const formatDateForLog = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('es-ES'); // Format as DD/MM/YYYY
};

const GodParentController = {
  // Lists all godparents (active and inactive)
  getAll: async (req, res, next) => {
    try {
      const godparents = await GodParentService.list();
      return res.success(godparents);
    } catch (error) {
      console.error('[GODPARENTS] getAll error:', error);
      return res.error('Error al obtener los padrinos');
    }
  },

  // Finds a godparent by id
  getById: async (req, res) => {
    const { id } = req.params;
    try {
      const godparent = await GodParentService.findById(id);
      if (!godparent) {
        return res.notFound('Padrino');
      }
      return res.success(godparent);
    } catch (error) {
      console.error('[GODPARENTS] getById error:', error);
      return res.error('Error al obtener el padrino');
    }
  },

  // Creates a new godparent
  create: async (req, res) => {
    const { idSurvivor, idHeadquarter, name, email, paymentMethod, startDate, finishDate, description, status } = req.body;

    // Validation for CREATE - all required fields must be present
    const validation = EntityValidators.godparent({
      idSurvivor, idHeadquarter, name, email, paymentMethod, startDate, finishDate, description, status
    }, { partial: false });

    if (!validation.isValid) {
      return res.validationErrors(validation.errors);
    }

    try {
      // Check duplicates
      const allGodparents = await GodParentService.list();
      const duplicateErrors = [];

      if (allGodparents.some(g => g.name === name)) {
        duplicateErrors.push('Ya existe un padrino con ese nombre');
      }
      if (allGodparents.some(g => g.email === email)) {
        duplicateErrors.push('Ya existe un padrino con ese correo');
      }

      if (duplicateErrors.length > 0) {
        return res.validationErrors(duplicateErrors);
      }

      // Validate foreign keys
      const headquarterExists = await prisma.headquarter.findUnique({
        where: { idHeadquarter: idHeadquarter }
      });
      if (!headquarterExists) {
        return res.validationErrors(['La sede especificada no existe']);
      }

      if (idSurvivor) {
        const survivorExists = await prisma.survivor.findUnique({
          where: { idSurvivor: idSurvivor }
        });
        if (!survivorExists) {
          return res.validationErrors(['El sobreviviente especificado no existe']);
        }
      }

      const newGodparent = await GodParentService.create({ idSurvivor, idHeadquarter, name, email, paymentMethod, startDate, finishDate, description, status });

      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'CREATE',
        description:
        `Se creó el padrino con los siguientes datos: ID: "${newGodparent.idGodparent}", Nombre: "${newGodparent.name}", Email: "${newGodparent.email}", Método de pago: "${newGodparent.paymentMethod}", Fecha de inicio: "${formatDateForLog(newGodparent.startDate)}", Fecha de fin: "${formatDateForLog(newGodparent.finishDate)}", Descripción: "${newGodparent.description}", Estado: "${newGodparent.status}".`,
        affectedTable: 'Godparent',
      });

      return res.status(201).success(newGodparent, 'Padrino creado exitosamente');
    } catch (error) {
      console.error('[GODPARENTS] create error:', error);
      return res.error('Error al crear el padrino');
    }
  },

  // Updates an existing godparent
  update: async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    // Validation for UPDATE - validate provided fields as required if they are present
    const validation = EntityValidators.godparent(updateData, { partial: true });

    if (!validation.isValid) {
      return res.validationErrors(validation.errors);
    }

    try {
      // Check duplicates (excluding current record)
      const duplicateErrors = [];

      if (updateData.name) {
        const existsName = await GodParentService.findByName(updateData.name);
        if (existsName && existsName.idGodparent != id) {
          duplicateErrors.push('Ya existe un padrino con ese nombre');
        }
      }
      if (updateData.email) {
        const existsEmail = await GodParentService.findByEmail(updateData.email);
        if (existsEmail && existsEmail.idGodparent != id) {
          duplicateErrors.push('Ya existe un padrino con ese correo');
        }
      }

      if (duplicateErrors.length > 0) {
        return res.validationErrors(duplicateErrors);
      }

      // Validate foreign keys if they are being updated
      if (updateData.idHeadquarter) {
        const headquarterExists = await prisma.headquarter.findUnique({
          where: { idHeadquarter: updateData.idHeadquarter }
        });
        if (!headquarterExists) {
          return res.validationErrors(['La sede especificada no existe']);
        }
      }

      if (updateData.idSurvivor) {
        const survivorExists = await prisma.survivor.findUnique({
          where: { idSurvivor: updateData.idSurvivor }
        });
        if (!survivorExists) {
          return res.validationErrors(['El sobreviviente especificado no existe']);
        }
      }

      // Get the previous godparent data
      const previousGodparent = await GodParentService.findById(id);
      if (!previousGodparent) {
        return res.notFound('Padrino');
      }

      const updatedGodparent = await GodParentService.update(id, updateData);

      // Register in the log the changes (previous and new)
      const userEmail = req.user?.sub;

      // Verify if only the status changed from inactive to active
      const onlyStatusChange =
        previousGodparent.status === 'inactive' &&
        updatedGodparent.status === 'active' &&
        previousGodparent.name === updatedGodparent.name &&
        previousGodparent.email === updatedGodparent.email &&
        previousGodparent.paymentMethod === updatedGodparent.paymentMethod &&
        previousGodparent.startDate.getTime() === updatedGodparent.startDate.getTime() &&
        (previousGodparent.finishDate?.getTime() || null) === (updatedGodparent.finishDate?.getTime() || null) &&
        previousGodparent.description === updatedGodparent.description;

      if (onlyStatusChange) {
        await SecurityLogService.log({
          email: userEmail,
          action: 'REACTIVATE',
          description:
          `Se reactivó el padrino con ID "${id}". Datos completos: Nombre: "${updatedGodparent.name}", Email: "${updatedGodparent.email}", Método de pago: "${updatedGodparent.paymentMethod}", Fecha de inicio: "${formatDateForLog(updatedGodparent.startDate)}", Fecha de fin: "${formatDateForLog(updatedGodparent.finishDate)}", Descripción: "${updatedGodparent.description}", Estado: "${updatedGodparent.status}".`,
          affectedTable: 'Godparent',
        });
      } else {
        await SecurityLogService.log({
          email: userEmail,
          action: 'UPDATE',
          description:
          `Se actualizó el padrino con ID "${id}".\n` +
          `Versión previa: Nombre: "${previousGodparent.name}", Email: "${previousGodparent.email}", Método de pago: "${previousGodparent.paymentMethod}", Fecha de inicio: "${formatDateForLog(previousGodparent.startDate)}", Fecha de fin: "${formatDateForLog(previousGodparent.finishDate)}", Descripción: "${previousGodparent.description}", Estado: "${previousGodparent.status}". \n` +
          `Nueva versión: Nombre: "${updatedGodparent.name}", Email: "${updatedGodparent.email}", Método de pago: "${updatedGodparent.paymentMethod}", Fecha de inicio: "${formatDateForLog(updatedGodparent.startDate)}", Fecha de fin: "${formatDateForLog(updatedGodparent.finishDate)}", Descripción: "${updatedGodparent.description}", Estado: "${updatedGodparent.status}".`,
          affectedTable: 'Godparent',
        });
      }
      return res.success(updatedGodparent, 'Padrino actualizado exitosamente');
    } catch (error) {
      console.error('[GODPARENTS] update error:', error);
      return res.error('Error al actualizar el padrino');
    }
  },

  // Removes a godparent
  delete: async (req, res) => {
    const { id } = req.params;

    const exists = await GodParentService.findById(id);
    if (!exists) {
      return res.notFound('Padrino');
    }
    try {
      const deletedGodparent = await GodParentService.remove(id);
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'INACTIVE',
        description: `Se inactivó el padrino: ID "${id}", Nombre: "${deletedGodparent.name}", Email: "${deletedGodparent.email}", Método de pago: "${deletedGodparent.paymentMethod}", Fecha de inicio: "${formatDateForLog(deletedGodparent.startDate)}", Fecha de fin: "${formatDateForLog(deletedGodparent.finishDate)}", Descripción: "${deletedGodparent.description}", Estado: "${deletedGodparent.status}".`,
        affectedTable: 'Godparent',
      });
      return res.success(deletedGodparent, 'Padrino inactivado exitosamente');
    } catch (error) {
      console.error('[GODPARENTS] delete error:', error);
      return res.error('Error al inactivar el padrino');
    }
  },

  // Get all lookup data needed for godparent assignment in a single request (includes active and inactive)
  getLookupData: async (req, res) => {
    try {
      const [survivors, headquarters] = await Promise.all([
        // Get all survivors (active and inactive)
        prisma.survivor.findMany({
          select: {
            idSurvivor: true,
            survivorName: true,
            status: true
          },
          orderBy: { survivorName: 'asc' }
        }),
        
        // Get all headquarters (active and inactive)
        prisma.headquarter.findMany({
          select: {
            idHeadquarter: true,
            name: true,
            status: true
          },
          orderBy: { name: 'asc' }
        })
      ]);

      const lookupData = {
        survivors,
        headquarters
      };

      return res.success(lookupData);
    } catch (error) {
      console.error('[GODPARENTS] getLookupData error:', error);
      return res.error('Error al obtener los datos de referencia para padrinos');
    }
  }
};

module.exports = { GodParentController };
