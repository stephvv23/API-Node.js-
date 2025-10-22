const { GodParentService } = require('./godParent.service');
const { SecurityLogService } = require('../../../services/securitylog.service');
const { EntityValidators } = require('../../../utils/validator');
// Import prisma for foreign key validation
let prisma = require('../../../lib/prisma.js');

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
    const { idSurvivor, idHeadquarter, name, email, paymentMethod, startDate, finishDate, description, status, phones, activities } = req.body;

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
        duplicateErrors.push('Ya existe un padrino con ese email');
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

      // Normalize arrays for phones and activities
      const phoneIds = Array.isArray(phones) ? phones : (phones ? [phones] : []);
      const activityIds = Array.isArray(activities) ? activities : (activities ? [activities] : []);

      // Validate that all phones exist
      for (const phoneId of phoneIds) {
        const phoneExists = await GodParentService.checkPhoneExists(phoneId);
        if (!phoneExists) {
          return res.validationErrors([`El teléfono con ID ${phoneId} no existe`]);
        }
      }

      // Validate that all activities exist
      for (const activityId of activityIds) {
        const activityExists = await GodParentService.checkActivityExists(activityId);
        if (!activityExists) {
          return res.validationErrors([`La actividad con ID ${activityId} no existe`]);
        }
      }

      const newGodparent = await GodParentService.create({ idSurvivor, idHeadquarter, name, email, paymentMethod, startDate, finishDate, description, status });

      // Create relations with phones
      if (phoneIds.length > 0) {
        await GodParentService.assignPhones(newGodparent.idGodparent, phoneIds);
      }

      // Create relations with activities
      if (activityIds.length > 0) {
        await GodParentService.assignActivities(newGodparent.idGodparent, activityIds);
      }

      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'CREATE',
        description:
        `Se creó el padrino con los siguientes datos: ID: "${newGodparent.idGodparent}", Nombre: "${newGodparent.name}", Email: "${newGodparent.email}", Método de pago: "${newGodparent.paymentMethod}", Fecha de inicio: "${newGodparent.startDate}", Fecha de fin: "${newGodparent.finishDate || 'N/A'}", Descripción: "${newGodparent.description}", Estado: "${newGodparent.status}", Teléfonos: [${phoneIds.join(', ') || 'Ninguno'}], Actividades: [${activityIds.join(', ') || 'Ninguna'}].`,
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
          duplicateErrors.push('Ya existe un padrino con ese email');
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

      // Validate phones if they are being updated
      if (Array.isArray(updateData.phones)) {
        for (const phoneId of updateData.phones) {
          const phoneExists = await GodParentService.checkPhoneExists(phoneId);
          if (!phoneExists) {
            return res.validationErrors([`El teléfono con ID ${phoneId} no existe`]);
          }
        }
      }

      // Validate activities if they are being updated
      if (Array.isArray(updateData.activities)) {
        for (const activityId of updateData.activities) {
          const activityExists = await GodParentService.checkActivityExists(activityId);
          if (!activityExists) {
            return res.validationErrors([`La actividad con ID ${activityId} no existe`]);
          }
        }
      }

      // Get the previous godparent data
      const previousGodparent = await GodParentService.findById(id);
      if (!previousGodparent) {
        return res.notFound('Padrino');
      }

      const updatedGodparent = await GodParentService.update(id, updateData);

      // Update phone relations if provided
      if (Array.isArray(updateData.phones)) {
        await GodParentService.clearPhones(id);
        if (updateData.phones.length > 0) {
          await GodParentService.assignPhones(id, updateData.phones);
        }
      }

      // Update activity relations if provided
      if (Array.isArray(updateData.activities)) {
        await GodParentService.clearActivities(id);
        if (updateData.activities.length > 0) {
          await GodParentService.assignActivities(id, updateData.activities);
        }
      }

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
          `Se reactivó el padrino con ID "${id}". Datos completos: Nombre: "${updatedGodparent.name}", Email: "${updatedGodparent.email}", Método de pago: "${updatedGodparent.paymentMethod}", Fecha de inicio: "${updatedGodparent.startDate}", Fecha de fin: "${updatedGodparent.finishDate || 'N/A'}", Descripción: "${updatedGodparent.description}", Estado: "${updatedGodparent.status}", Teléfonos: [${updatedGodparent.phones?.map(p => p.idPhone).join(', ') || 'Ninguno'}], Actividades: [${updatedGodparent.activities?.map(a => a.idActivity).join(', ') || 'Ninguna'}].`,
          affectedTable: 'Godparent',
        });
      } else {
        await SecurityLogService.log({
          email: userEmail,
          action: 'UPDATE',
          description:
          `Se actualizó el padrino con ID "${id}".\n` +
          `Versión previa: Nombre: "${previousGodparent.name}", Email: "${previousGodparent.email}", Método de pago: "${previousGodparent.paymentMethod}", Fecha de inicio: "${previousGodparent.startDate}", Fecha de fin: "${previousGodparent.finishDate || 'N/A'}", Descripción: "${previousGodparent.description}", Estado: "${previousGodparent.status}", Teléfonos: [${previousGodparent.phones?.map(p => p.idPhone).join(', ') || 'Ninguno'}], Actividades: [${previousGodparent.activities?.map(a => a.idActivity).join(', ') || 'Ninguna'}]. \n` +
          `Nueva versión: Nombre: "${updatedGodparent.name}", Email: "${updatedGodparent.email}", Método de pago: "${updatedGodparent.paymentMethod}", Fecha de inicio: "${updatedGodparent.startDate}", Fecha de fin: "${updatedGodparent.finishDate || 'N/A'}", Descripción: "${updatedGodparent.description}", Estado: "${updatedGodparent.status}", Teléfonos: [${updatedGodparent.phones?.map(p => p.idPhone).join(', ') || 'Ninguno'}], Actividades: [${updatedGodparent.activities?.map(a => a.idActivity).join(', ') || 'Ninguna'}].`,
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
        description: `Se inactivó el padrino: ID "${id}", Nombre: "${deletedGodparent.name}", Email: "${deletedGodparent.email}", Método de pago: "${deletedGodparent.paymentMethod}", Fecha de inicio: "${deletedGodparent.startDate}", Fecha de fin: "${deletedGodparent.finishDate || 'N/A'}", Descripción: "${deletedGodparent.description}", Estado: "${deletedGodparent.status}".`,
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
      const [survivors, headquarters, phones, activities] = await Promise.all([
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
        }),
        
        // Get all phones (no status filter as phones don't have status)
        prisma.phone.findMany({
          select: {
            idPhone: true,
            phone: true
          },
          orderBy: { phone: 'asc' }
        }),
        
        // Get all activities (active and inactive)
        prisma.activity.findMany({
          select: {
            idActivity: true,
            tittle: true,
            status: true
          },
          orderBy: { tittle: 'asc' }
        })
      ]);

      const lookupData = {
        survivors,
        headquarters,
        phones,
        activities
      };

      return res.success(lookupData);
    } catch (error) {
      console.error('[GODPARENTS] getLookupData error:', error);
      return res.error('Error al obtener los datos de referencia para padrinos');
    }
  }
};

module.exports = { GodParentController };
