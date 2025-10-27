const { SurvivorService } = require("./survivor.service");
const { SecurityLogService } = require("../../../services/securitylog.service");
const { EntityValidators } = require("../../../utils/validator");

const SurvivorController = {
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
      const survivor = await SurvivorService.findById(id);
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

    const validation = EntityValidators.survivor(data, { partial: false });
    if (!validation.isValid) {
      return res.validationErrors(validation.errors);
    }

    try {
      const errors = [];

      // Validate cancers array (required, minimum 1)
      if (!data.cancers || !Array.isArray(data.cancers) || data.cancers.length === 0) {
        errors.push("Debe proporcionar al menos un tipo de cáncer");
      } else {
        data.cancers.forEach((cancer, index) => {
          if (!cancer.idCancer || typeof cancer.idCancer !== 'number') {
            errors.push(`Cáncer ${index + 1}: idCancer es requerido y debe ser un número`);
          }
          if (!cancer.stage || typeof cancer.stage !== 'string') {
            errors.push(`Cáncer ${index + 1}: stage (etapa) es requerido y debe ser texto`);
          }
        });
      }

      // Validate phones (optional, but must be array if provided)
      if (data.phones && !Array.isArray(data.phones)) {
        errors.push("phones debe ser un array");
      }

      // Validate emergency contacts (optional, but must be array if provided)
      if (data.emergencyContacts && !Array.isArray(data.emergencyContacts)) {
        errors.push("emergencyContacts debe ser un array de IDs");
      }

      if (errors.length > 0) {
        return res.validationErrors(errors);
      }

      // Check for duplicates
      const allSurvivors = await SurvivorService.list({ status: "all" });
      const duplicateErrors = [];

      if (allSurvivors.some((s) => s.documentNumber === data.documentNumber)) {
        duplicateErrors.push(
          "Ya existe un superviviente con ese número de documento"
        );
      }
      if (data.email && allSurvivors.some((s) => s.email === data.email)) {
        duplicateErrors.push("Ya existe un superviviente con ese correo electrónico");
      }

      if (duplicateErrors.length > 0) {
        return res.validationErrors(duplicateErrors);
      }

      const newSurvivor = await SurvivorService.create(data);
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
      const previousSurvivor = await SurvivorService.findById(id);
      if (!previousSurvivor) {
        return res.notFound("Superviviente");
      }

      if (previousSurvivor.status !== "active") {
        return res.badRequest("No se puede actualizar un superviviente inactivo");
      }

      const payload = {
        ...updateData,
        birthday: updateData.birthday
          ? new Date(updateData.birthday)
          : undefined,
      };

      const updatedSurvivor = await SurvivorService.update(id, payload);

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
            `País: "${previousSurvivor.country}", Correo: "${previousSurvivor.email}", ` +
            `Residencia: "${previousSurvivor.residence}", Estado: "${previousSurvivor.status}".\n` +
            `Nueva versión: ` +
            `Nombre: "${updatedSurvivor.survivorName}", Documento: "${updatedSurvivor.documentNumber}", ` +
            `País: "${updatedSurvivor.country}", Correo: "${updatedSurvivor.email}", ` +
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
      return res.error("Error al actualizar el superviviente");
    }
  },

  delete: async (req, res) => {
    const { id } = req.params;

    try {
      const survivor = await SurvivorService.findById(id);
      if (!survivor) {
        return res.notFound("Superviviente");
      }

      const newStatus = survivor.status === "active" ? "inactive" : "active";
      const updatedSurvivor = await SurvivorService.update(id, {
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

      return res.success(updatedSurvivor, message);
    } catch (error) {
      console.error("[SURVIVORS] delete/reactivate error:", error);
      return res.error("Error al cambiar el estado del superviviente");
    }
  },

  // Reactivate a survivor
  reactivate: async (req, res) => {
    const { id } = req.params;
    try {
      const survivor = await SurvivorService.findById(id);
      if (!survivor) {
        return res.notFound("Superviviente");
      }

      const reactivated = await SurvivorService.reactivate(id);
      const userEmail = req.user?.sub;

      await SecurityLogService.log({
        email: userEmail,
        action: "REACTIVATE",
        description:
          `Se reactivó el superviviente con ID "${id}", Nombre: "${reactivated.survivorName}", ` +
          `Documento: "${reactivated.documentNumber}", Estado: "${reactivated.status}".`,
        affectedTable: "Survivor",
      });

      return res.success(reactivated, "Superviviente reactivado exitosamente");
    } catch (error) {
      console.error("[SURVIVORS] reactivate error:", error);
      return res.error("Error al reactivar el superviviente");
    }
  },
};

module.exports = { SurvivorController };
