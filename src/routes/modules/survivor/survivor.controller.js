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

  // Get survivor by ID
  getById: async (req, res) => {
    const { id } = req.params;
    try {
      const survivor = await SurvivorService.findById(id);
      if (!survivor) {
        return res.notFound("Survivor");
      }
      return res.success(survivor);
    } catch (error) {
      console.error("[SURVIVORS] getById error:", error);
      return res.error("Error al obtener el sobreviviente");
    }
  },

  // Create a new survivor
  create: async (req, res) => {
    const data = req.body;

    // CREATE validation (full)
    const validation = EntityValidators.survivor(data, { partial: false });
    if (!validation.isValid) {
      return res.validationErrors(validation.errors);
    }

    try {
      // Verify duplicates
      const allSurvivors = await SurvivorService.list({ status: "all" });
      const duplicateErrors = [];

      if (allSurvivors.some((s) => s.documentNumber === data.documentNumber)) {
        duplicateErrors.push(
          "Ya existe un sobreviviente con ese número de documento"
        );
      }
      if (data.email && allSurvivors.some((s) => s.email === data.email)) {
        duplicateErrors.push("Ya existe un sobreviviente con ese correo");
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
          `A new survivor was created with the following data: ` +
          `ID: "${newSurvivor.idSurvivor}", ` +
          `Name: "${newSurvivor.survivorName}", ` +
          `Document: "${newSurvivor.documentNumber}", ` +
          `Email: "${newSurvivor.email}", ` +
          `Status: "${newSurvivor.status}".`,
        affectedTable: "Survivor",
      });

      return res
        .status(201)
        .success(newSurvivor, "Survivor created successfully");
    } catch (error) {
      console.error("[SURVIVORS] create error:", error);
      return res.error("Error creating survivor");
    }
  },

  // Update an existing survivor
  update: async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    // 1) Partially validate fields
    const validation = EntityValidators.survivor(updateData, { partial: true });
    if (!validation.isValid) {
      return res.validationErrors(validation.errors);
    }

    try {
      // 2) Find previous survivor
      const previousSurvivor = await SurvivorService.findById(id);
      if (!previousSurvivor) {
        return res.notFound("Superviviente");
      }

      // 3) Convert date fields if present
      const payload = {
        ...updateData,
        birthday: updateData.birthday
          ? new Date(updateData.birthday)
          : undefined,
      };

      // 4) Update survivor
      const updatedSurvivor = await SurvivorService.update(id, payload);

      // 5) Detect if this was only a reactivation
      const onlyStatusChange =
        previousSurvivor.status === "inactive" &&
        updatedSurvivor.status === "active" &&
        previousSurvivor.survivorName === updatedSurvivor.survivorName &&
        previousSurvivor.documentNumber === updatedSurvivor.documentNumber &&
        previousSurvivor.email === updatedSurvivor.email;

      const userEmail = req.user?.sub;

      // 6) Log the change to the security log
      if (onlyStatusChange) {
        await SecurityLogService.log({
          email: userEmail,
          action: "REACTIVATE",
          description:
            `Se reactivó el superviviente con ID "${id}". Datos:\n` +
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
            `Versión previa:\n` +
            `Nombre: "${previousSurvivor.survivorName}", Documento: "${previousSurvivor.documentNumber}", ` +
            `País: "${previousSurvivor.country}", Email: "${previousSurvivor.email}", ` +
            `Residencia: "${previousSurvivor.residence}", Estado: "${previousSurvivor.status}".\n` +
            `Nueva versión:\n` +
            `Nombre: "${updatedSurvivor.survivorName}", Documento: "${updatedSurvivor.documentNumber}", ` +
            `País: "${updatedSurvivor.country}", Email: "${updatedSurvivor.email}", ` +
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

  // Deactivate a survivor
  delete: async (req, res) => {
    const { id } = req.params;

    try {
      // 1) Check if survivor exists
      const survivor = await SurvivorService.findById(id);
      if (!survivor) {
        return res.notFound("Superviviente");
      }

      // 2) Determine the new status
      const newStatus = survivor.status === "active" ? "inactive" : "active";
      const updatedSurvivor = await SurvivorService.update(id, {
        status: newStatus,
      });

      // 3) Log to the security log
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

      // 4) Prepare response
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
        return res.notFound("Survivor");
      }

      const reactivated = await SurvivorService.reactivate(id);
      const userEmail = req.user?.sub;

      await SecurityLogService.log({
        email: userEmail,
        action: "REACTIVATE",
        description:
          `Survivor with ID "${id}" was reactivated, Name: "${reactivated.survivorName}", ` +
          `Document: "${reactivated.documentNumber}", Status: "${reactivated.status}".`,
        affectedTable: "Survivor",
      });

      return res.success(reactivated, "Survivor reactivated successfully");
    } catch (error) {
      console.error("[SURVIVORS] reactivate error:", error);
      return res.error("Error reactivating survivor");
    }
  },
};

module.exports = { SurvivorController };
