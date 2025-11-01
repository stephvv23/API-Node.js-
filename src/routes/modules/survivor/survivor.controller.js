const { SurvivorService } = require("./survivor.service");
const { SecurityLogService } = require("../../../services/securitylog.service");
const { EntityValidators, ValidationRules } = require("../../../utils/validator");
const { HeadquarterService } = require("../headquarters/headquarter.service");
const { CancerService } = require("../cancer/cancer.service");
const { EmergencyContactsService } = require("../emergencyContact/emergencyContact.service");

const SurvivorController = {
  // helper functions removed in favor of centralized ValidationRules
  // List all active survivors
  getAllActive: async (_req, res) => {
    try {
      const survivors = await SurvivorService.listActive();
      return res.success(survivors);
    } catch (error) {
      console.error("[SURVIVORS] getAllActive error:", error);
      return res.error("Error retrieving active survivors");
    }
  },

  // List survivors with status filter
  getAll: async (req, res) => {
    try {
      const status = (req.query.status || "active").toLowerCase();
      const allowed = ["active", "inactive", "all"];
      if (!allowed.includes(status)) {
        return res.validationErrors([
          'Status must be "active", "inactive" or "all"',
        ]);
      }

      const survivors = await SurvivorService.list({ status });
      return res.success(survivors);
    } catch (error) {
      console.error("[SURVIVORS] getAll error:", error);
      return res.error("Error retrieving survivors");
    }
  },

  getById: async (req, res) => {
    const { id } = req.params;
    try {
      const idNum = ValidationRules.parseIdParam(String(id || ''));
      if (!idNum) return res.validationErrors(['El parámetro id debe ser numérico']);
      const survivor = await SurvivorService.findById(Number(idNum));
      if (!survivor) {
        return res.notFound("Superviviente");
      }
      return res.success(survivor);
    } catch (error) {
      console.error("[SURVIVORS] getById error:", error);
      return res.error("Error al obtener el superviviente");
    }
  },

  create: async (req, res) => {
    const data = req.body;

    // Trim top-level string fields
    const normalized = ValidationRules.trimStringFields(data || {});

    // Normalize stages inside cancers if provided
    if (Array.isArray(normalized.cancers)) {
      normalized.cancers = normalized.cancers.map((c) => ({
        ...c,
        stage: typeof c.stage === 'string' ? c.stage.trim().replace(/\s+/g, ' ') : c.stage,
      }));
    }

    const validation = EntityValidators.survivor(normalized, { partial: false });
    if (!validation.isValid) {
      return res.validationErrors(validation.errors);
    }

    try {
      const errors = [];

      // Validate headquarter exists and is active
      if (normalized.idHeadquarter) {
        const headquarter = await HeadquarterService.findById(normalized.idHeadquarter);
        if (!headquarter) {
          errors.push("La sede especificada no existe");
        } else if (headquarter.status !== "active") {
          errors.push("La sede especificada no está activa");
        }
      }

      // Validate cancers array (required, minimum 1)
      if (!normalized.cancers || !Array.isArray(normalized.cancers) || normalized.cancers.length === 0) {
        errors.push("Debe proporcionar al menos un tipo de cáncer");
      } else {
        for (let i = 0; i < normalized.cancers.length; i++) {
          const cancer = normalized.cancers[i];
          if (!cancer.idCancer || typeof cancer.idCancer !== 'number') {
            errors.push(`Cáncer ${i + 1}: idCancer es requerido y debe ser un número`);
          } else {
            // Validate cancer exists and is active
            const cancerExists = await CancerService.get(cancer.idCancer);
            if (!cancerExists) {
              errors.push(`Cáncer ${i + 1}: El tipo de cáncer con ID ${cancer.idCancer} no existe`);
            } else if (cancerExists.status !== "active") {
              errors.push(`Cáncer ${i + 1}: El tipo de cáncer "${cancerExists.cancerName}" no está activo`);
            }
          }
          const stageVal = cancer.stage || '';
          if (typeof stageVal !== 'string' || stageVal.trim() === '') {
            errors.push(`Cáncer ${i + 1}: stage (etapa) es requerido y debe ser texto`);
          } else {
            // normalize stage spacing
            cancer.stage = typeof stageVal === 'string' ? stageVal.trim().replace(/\s+/g, ' ') : stageVal;
          }
        }
      }

      // Validate phone (optional, but must be string or number if provided)
      if (normalized.phone) {
        if (typeof normalized.phone !== 'string' && typeof normalized.phone !== 'number') {
          errors.push("phone debe ser un string o número");
        } else {
          const phoneStr = String(normalized.phone);
          if (!/^\d+$/.test(phoneStr)) {
            errors.push('phone debe contener solo dígitos');
          } else if (phoneStr.length > 12) {
            errors.push('phone no puede tener más de 12 dígitos');
          }
        }
      }

      // Validate emergency contacts (optional, but must be array if provided)
      if (normalized.emergencyContacts && !Array.isArray(normalized.emergencyContacts)) {
        errors.push("emergencyContacts debe ser un array de IDs");
      } else if (data.emergencyContacts && data.emergencyContacts.length > 0) {
        // Validate each emergency contact exists and is active
        for (let i = 0; i < data.emergencyContacts.length; i++) {
          const idContact = data.emergencyContacts[i];
          const contact = await EmergencyContactsService.get(idContact);
          if (!contact) {
            errors.push(`Contacto de emergencia ${i + 1}: El contacto con ID ${idContact} no existe`);
          } else if (contact.status !== "active") {
            errors.push(`Contacto de emergencia ${i + 1}: El contacto "${contact.nameEmergencyContact}" no está activo`);
          }
        }
      }

      // Note: birthday and boolean checks are enforced in EntityValidators.survivor

      if (errors.length > 0) {
        return res.validationErrors(errors);
      }

      // Check for duplicates
      const allSurvivors = await SurvivorService.list({ status: "all" });
      const duplicateErrors = [];
      // Compare normalized values to avoid duplicates with spacing differences
      const normalizeForCompare = (v) => (v ? String(v).trim().replace(/\s+/g, ' ').toLowerCase() : '');
      const newDocNorm = normalizeForCompare(normalized.documentNumber);
      const newEmailNorm = normalizeForCompare(normalized.email);

      if (allSurvivors.some((s) => normalizeForCompare(s.documentNumber) === newDocNorm)) {
        duplicateErrors.push(
          "Ya existe un superviviente con ese número de documento"
        );
      }
      if (normalized.email && allSurvivors.some((s) => normalizeForCompare(s.email) === newEmailNorm)) {
        duplicateErrors.push("Ya existe un superviviente con ese correo electrónico");
      }

      if (duplicateErrors.length > 0) {
        return res.validationErrors(duplicateErrors);
      }

  const newSurvivor = await SurvivorService.create(normalized);
      const userEmail = req.user?.sub;

      await SecurityLogService.log({
        email: userEmail,
        action: "CREATE",
        description:
          `Se creó un nuevo superviviente con los siguientes datos: ` +
          `ID: "${newSurvivor.idSurvivor}", ` +
          `Nombre: "${newSurvivor.survivorName}", ` +
          `Documento: "${newSurvivor.documentNumber}", ` +
          `Correo: "${newSurvivor.email}", ` +
          `Cánceres: ${data.cancers.length}, ` +
          `Estado: "${newSurvivor.status}".`,
        affectedTable: "Survivor",
      });

      return res
        .status(201)
        .success(newSurvivor, "Superviviente creado exitosamente");
    } catch (error) {
      console.error("[SURVIVORS] create error:", error);
      // In development return the error message to help debugging.
      if (process.env.NODE_ENV !== 'production') {
        return res.error(`Error al crear el superviviente: ${error.message}`);
      }
      return res.error("Error al crear el superviviente");
    }
  },

  update: async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const validation = EntityValidators.survivor(updateData, { partial: true });
    if (!validation.isValid) {
      return res.validationErrors(validation.errors);
    }

    try {
      const idNum = ValidationRules.parseIdParam(String(id || ''));
      if (!idNum) return res.validationErrors(['El parámetro id debe ser numérico']);

      const previousSurvivor = await SurvivorService.findById(Number(idNum));
      if (!previousSurvivor) {
        return res.notFound("Superviviente");
      }

      if (previousSurvivor.status !== "active") {
        return res.badRequest("No se puede actualizar un superviviente inactivo");
      }

      // Validate headquarter if being updated
      if (updateData.idHeadquarter !== undefined && updateData.idHeadquarter !== null) {
        // Convert to integer if it's a string
        const headquarterId = parseInt(updateData.idHeadquarter, 10);
        
        if (isNaN(headquarterId) || headquarterId <= 0) {
          return res.validationErrors(["El ID de la sede debe ser un número entero positivo"]);
        }
        
        const headquarter = await HeadquarterService.findById(headquarterId);
        if (!headquarter) {
          return res.validationErrors([`La sede con ID ${headquarterId} no existe`]);
        }
        if (headquarter.status !== "active") {
          return res.validationErrors([`La sede "${headquarter.name}" no está activa`]);
        }
      }

  // Warn if trying to update relations (not supported in UPDATE endpoint)
      const relationFields = ['cancers', 'phone', 'emergencyContacts', 'cancerSurvivor', 'phoneSurvivor', 'emergencyContactSurvivor'];
      const attemptedRelations = relationFields.filter(field => updateData[field] !== undefined);
      
      if (attemptedRelations.length > 0) {
        return res.validationErrors([
          `No se pueden actualizar relaciones en este endpoint: ${attemptedRelations.join(', ')}. ` +
          `Para actualizar cánceres, teléfonos o contactos de emergencia, use los endpoints específicos correspondientes.`
        ]);
      }

  // Clean payload: remove relation fields and nested objects that aren't allowed in update
      const { 
        headquarter, 
        cancerSurvivor, 
        phoneSurvivor, 
        emergencyContactSurvivor,
        activitySurvivor,
        godparent,
        cancers,
        phone,
        emergencyContacts,
        ...cleanData 
      } = updateData;

      // Normalize top-level strings in cleanData
      const trimmed = ValidationRules.trimStringFields(cleanData || {});
      const payload = {
        ...trimmed,
        birthday: trimmed.birthday ? new Date(trimmed.birthday) : undefined,
      };

      // Check uniqueness for documentNumber and email if being updated
      const allSurvivors = await SurvivorService.list({ status: 'all' });
      const normalizeForCompare = (v) => (v ? String(v).trim().replace(/\s+/g, ' ').toLowerCase() : '');
      if (payload.documentNumber) {
        const docNorm = normalizeForCompare(payload.documentNumber);
        const conflict = allSurvivors.find(s => s.idSurvivor !== previousSurvivor.idSurvivor && normalizeForCompare(s.documentNumber) === docNorm);
        if (conflict) return res.validationErrors(['Ya existe otro superviviente con ese número de documento']);
      }
      if (payload.email) {
        const emailNorm = normalizeForCompare(payload.email);
        const conflict = allSurvivors.find(s => s.idSurvivor !== previousSurvivor.idSurvivor && normalizeForCompare(s.email) === emailNorm);
        if (conflict) return res.validationErrors(['Ya existe otro superviviente con ese correo electrónico']);
      }

  const updatedSurvivor = await SurvivorService.update(Number(idNum), payload);

      const onlyStatusChange =
        previousSurvivor.status === "inactive" &&
        updatedSurvivor.status === "active" &&
        previousSurvivor.survivorName === updatedSurvivor.survivorName &&
        previousSurvivor.documentNumber === updatedSurvivor.documentNumber &&
        previousSurvivor.email === updatedSurvivor.email;

      const userEmail = req.user?.sub;

      if (onlyStatusChange) {
        await SecurityLogService.log({
          email: userEmail,
          action: "REACTIVATE",
          description:
            `Se reactivó el superviviente con ID "${id}". Datos: ` +
            `Nombre: "${updatedSurvivor.survivorName}", Documento: "${updatedSurvivor.documentNumber}", ` +
            `Correo: "${updatedSurvivor.email}", Estado: "${updatedSurvivor.status}".`,
          affectedTable: "Survivor",
        });
      } else {
        await SecurityLogService.log({
          email: userEmail,
          action: "UPDATE",
          description:
            `Se actualizó el superviviente con ID "${id}".\n` +
            `Versión previa: ` +
            `Nombre: "${previousSurvivor.survivorName}", Documento: "${previousSurvivor.documentNumber}", ` +
            `PaÃ­s: "${previousSurvivor.country}", Correo: "${previousSurvivor.email}", ` +
            `Residencia: "${previousSurvivor.residence}", Estado: "${previousSurvivor.status}".\n` +
            `Nueva versiÃ³n: ` +
            `Nombre: "${updatedSurvivor.survivorName}", Documento: "${updatedSurvivor.documentNumber}", ` +
            `PaÃ­s: "${updatedSurvivor.country}", Correo: "${updatedSurvivor.email}", ` +
            `Residencia: "${updatedSurvivor.residence}", Estado: "${updatedSurvivor.status}".`,
          affectedTable: "Survivor",
        });
      }

      return res.success(
        updatedSurvivor,
        "Superviviente actualizado exitosamente"
      );
    } catch (error) {
      console.error("[SURVIVORS] update error:", error);
      if (process.env.NODE_ENV !== 'production') {
        return res.error(`Error al actualizar el superviviente: ${error.message}`);
      }
      return res.error("Error al actualizar el superviviente");
    }
  },

  delete: async (req, res) => {
    const { id } = req.params;

    try {
      const idNum = ValidationRules.parseIdParam(String(id || ''));
      if (!idNum) return res.validationErrors(['El parámetro id debe ser numérico']);
      const survivor = await SurvivorService.findById(Number(idNum));
      if (!survivor) {
        return res.notFound("Superviviente");
      }

      const newStatus = survivor.status === "active" ? "inactive" : "active";
      await SurvivorService.update(Number(idNum), {
        status: newStatus,
      });

      const userEmail = req.user?.sub;
      const action = newStatus === "inactive" ? "INACTIVE" : "REACTIVATE";
      const verb = newStatus === "inactive" ? "inactivó" : "reactivó";

      await SecurityLogService.log({
        email: userEmail,
        action,
        description:
          `Se ${verb} el superviviente con ID "${id}". ` +
          `Nombre: "${survivor.survivorName}", ` +
          `Documento: "${survivor.documentNumber}", ` +
          `Correo: "${survivor.email}", ` +
          `Estado anterior: "${survivor.status}", ` +
          `Nuevo estado: "${newStatus}".`,
        affectedTable: "Survivor",
      });

      const message =
        newStatus === "inactive"
          ? "Superviviente inactivado exitosamente"
          : "Superviviente reactivado exitosamente";

      return res.success(null, message);
    } catch (error) {
      console.error("[SURVIVORS] delete/reactivate error:", error);
      if (process.env.NODE_ENV !== 'production') {
        return res.error(`Error al cambiar el estado del superviviente: ${error.message}`);
      }
      return res.error("Error al cambiar el estado del superviviente");
    }
  },

  // Reactivate a survivor
  reactivate: async (req, res) => {
    const { id } = req.params;
    try {
      const idNum = ValidationRules.parseIdParam(String(id || ''));
      if (!idNum) return res.validationErrors(['El parámetro id debe ser numérico']);
      const survivor = await SurvivorService.findById(Number(idNum));
      if (!survivor) {
        return res.notFound("Superviviente");
      }

      const reactivated = await SurvivorService.reactivate(Number(idNum));
      const userEmail = req.user?.sub;

      await SecurityLogService.log({
        email: userEmail,
        action: "REACTIVATE",
        description:
          `Se reactivÃ³ el superviviente con ID "${id}", Nombre: "${reactivated.survivorName}", ` +
          `Documento: "${reactivated.documentNumber}", Estado: "${reactivated.status}".`,
        affectedTable: "Survivor",
      });

      return res.success(reactivated, "Superviviente reactivado exitosamente");
    } catch (error) {
      console.error("[SURVIVORS] reactivate error:", error);
      if (process.env.NODE_ENV !== 'production') {
        return res.error(`Error al reactivar el superviviente: ${error.message}`);
      }
      return res.error("Error al reactivar el superviviente");
    }
  },
};

module.exports = { SurvivorController };
