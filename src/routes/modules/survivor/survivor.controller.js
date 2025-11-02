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

    // Check for JSON parsing errors
    if (data.__jsonError) {
      return res.validationErrors([data.__jsonErrorMessage || 'Formato de JSON inválido']);
    }

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

      // Validate string field lengths
      const lengthErrors = ValidationRules.validateFieldLengths(normalized, {
        survivorName: 200,
        documentNumber: 30,
        country: 75,
        email: 150,
        residence: 300,
        genre: 25,
        workingCondition: 50,
        physicalFileStatus: 50,
        notes: 250
      });
      errors.push(...lengthErrors);

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
            errors.push(`Cáncer en posición ${i + 1}: idCancer es requerido y debe ser un número`);
          } else {
            // Validate cancer exists and is active
            const cancerExists = await CancerService.get(cancer.idCancer);
            if (!cancerExists) {
              errors.push(`Cáncer con ID ${cancer.idCancer}: El tipo de cáncer no existe`);
            } else if (cancerExists.status !== "active") {
              errors.push(`Cáncer con ID ${cancer.idCancer} ("${cancerExists.cancerName}"): El tipo de cáncer no está activo`);
            }
          }
          const stageVal = cancer.stage || '';
          if (typeof stageVal !== 'string' || stageVal.trim() === '') {
            const cancerId = cancer.idCancer ? `ID ${cancer.idCancer}` : `posición ${i + 1}`;
            errors.push(`Cáncer ${cancerId}: stage (etapa) es requerido y debe ser texto`);
          } else {
            // normalize stage spacing
            cancer.stage = typeof stageVal === 'string' ? stageVal.trim().replace(/\s+/g, ' ') : stageVal;
            
            // Validate stage length
            const stageLengthErrors = ValidationRules.validateFieldLengths(
              { stage: cancer.stage },
              { stage: 255 }
            );
            if (stageLengthErrors.length > 0) {
              const cancerId = cancer.idCancer ? `ID ${cancer.idCancer}` : `posición ${i + 1}`;
              errors.push(`Cáncer ${cancerId}: ${stageLengthErrors[0]}`);
            }
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
        errors.push("emergencyContacts debe ser un array de objetos con idEmergencyContact y relationshipType");
      } else if (data.emergencyContacts && data.emergencyContacts.length > 0) {
        // Validate each emergency contact exists, is active, and has required fields
        for (let i = 0; i < data.emergencyContacts.length; i++) {
          const contactData = data.emergencyContacts[i];
          
          // Check if it's a number (old format) or object (new format)
          let idContact, relationshipType;
          
          if (typeof contactData === 'number') {
            errors.push(`Contacto de emergencia ${i + 1}: Debe proporcionar un objeto con idEmergencyContact y relationshipType`);
            continue;
          } else if (typeof contactData === 'object' && contactData !== null) {
            idContact = contactData.idEmergencyContact;
            relationshipType = contactData.relationshipType;
            
            if (!idContact || typeof idContact !== 'number') {
              errors.push(`Contacto de emergencia ${i + 1}: idEmergencyContact es requerido y debe ser un número`);
              continue;
            }
            
            if (!relationshipType || typeof relationshipType !== 'string' || relationshipType.trim() === '') {
              errors.push(`Contacto de emergencia ${i + 1}: relationshipType es requerido y debe ser un texto no vacío`);
              continue;
            }
            
            // Trim and validate length
            relationshipType = relationshipType.trim();
            if (relationshipType.length > 50) {
              errors.push(`Contacto de emergencia ${i + 1}: relationshipType no debe exceder 50 caracteres`);
              continue;
            }
            
            // Update the normalized data with trimmed relationshipType
            data.emergencyContacts[i].relationshipType = relationshipType;
          } else {
            errors.push(`Contacto de emergencia ${i + 1}: Formato inválido, debe ser un objeto con idEmergencyContact y relationshipType`);
            continue;
          }
          
          const contact = await EmergencyContactsService.get(idContact);
          if (!contact) {
            errors.push(`Contacto de emergencia ${i + 1}: El contacto con ID ${idContact} no existe`);
          } else if (contact.status !== "active") {
            errors.push(`Contacto de emergencia ${i + 1}: El contacto "${contact.nameEmergencyContact}" no está activo`);
          }
        }
      }

      // Validate that minors have at least one emergency contact
      if (normalized.birthday) {
        const birthDate = new Date(normalized.birthday);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const dayDiff = today.getDate() - birthDate.getDate();
        
        // Adjust age if birthday hasn't occurred this year
        const actualAge = (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) ? age - 1 : age;
        
        if (actualAge < 18) {
          if (!normalized.emergencyContacts || normalized.emergencyContacts.length === 0) {
            errors.push("Los supervivientes menores de edad deben tener al menos un contacto de emergencia");
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
          `Se creó un nuevo superviviente: ` +
          `ID: "${newSurvivor.idSurvivor}", ` +
          `Nombre: "${newSurvivor.survivorName}", ` +
          `Documento: "${newSurvivor.documentNumber}", ` +
          `Correo: "${newSurvivor.email}", ` +
          `País: "${newSurvivor.country}", ` +
          `Género: "${newSurvivor.genre}", ` +
          `Condición laboral: "${newSurvivor.workingCondition}", ` +
          `CONAPDIS: ${newSurvivor.CONAPDIS}, ` +
          `IMAS: ${newSurvivor.IMAS}, ` +
          `Expediente físico: "${newSurvivor.physicalFileStatus}", ` +
          `Expediente médico: ${newSurvivor.medicalRecord}, ` +
          `Fecha hogar SINRUBE: ${newSurvivor.dateHomeSINRUBE}, ` +
          `Banco de alimentos: ${newSurvivor.foodBank}, ` +
          `Estudio socioeconómico: ${newSurvivor.socioEconomicStudy}, ` +
          `Cánceres: ${data.cancers.length}, ` +
          `Contactos emergencia: ${data.emergencyContacts?.length || 0}, ` +
          `Estado: "${newSurvivor.status}".`,
        affectedTable: "Survivor",
      });

      return res
        .status(201)
        .success(newSurvivor, "Superviviente creado exitosamente");
    } catch (error) {
      console.error("[SURVIVORS] create error:", error);
      
      // Handle Prisma P2000 error (value too long for column)
      if (error.code === 'P2000') {
        const columnName = error.meta?.column_name || 'campo';
        return res.validationErrors([`El valor proporcionado para ${columnName} es demasiado largo`]);
      }
      
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

    // Check for JSON parsing errors
    if (updateData.__jsonError) {
      return res.validationErrors([updateData.__jsonErrorMessage || 'Formato de JSON inválido']);
    }

    // Define allowed fields for update
    const allowedFields = [
      'idHeadquarter', 'survivorName', 'documentNumber', 'country', 'birthday',
      'email', 'residence', 'genre', 'workingCondition', 'CONAPDIS', 'IMAS',
      'physicalFileStatus', 'medicalRecord', 'dateHomeSINRUBE', 'foodBank',
      'socioEconomicStudy', 'notes', 'status'
    ];

    // Check for unknown fields
    const receivedFields = Object.keys(updateData);
    const unknownFields = receivedFields.filter(field => !allowedFields.includes(field));
    
    if (unknownFields.length > 0) {
      return res.validationErrors([
        `Los siguientes campos no son válidos o no pueden ser actualizados: ${unknownFields.join(', ')}. ` +
        `Para actualizar relaciones (cánceres, teléfonos, contactos de emergencia), use los endpoints específicos correspondientes.`
      ]);
    }

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

      // Validate string field lengths
      const lengthErrors = ValidationRules.validateFieldLengths(trimmed, {
        survivorName: 200,
        documentNumber: 30,
        country: 75,
        email: 150,
        residence: 300,
        genre: 25,
        workingCondition: 50,
        physicalFileStatus: 50,
        notes: 250
      });

      if (lengthErrors.length > 0) {
        return res.validationErrors(lengthErrors);
      }
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
            `Se reactivó el superviviente con ID "${id}". ` +
            `Nombre: "${updatedSurvivor.survivorName}", ` +
            `Documento: "${updatedSurvivor.documentNumber}", ` +
            `Correo: "${updatedSurvivor.email}".`,
          affectedTable: "Survivor",
        });
      } else {
        // Build a list of changes (only fields that were modified)
        const changes = [];
        
        const fieldsToCheck = {
          survivorName: 'Nombre',
          documentNumber: 'Documento',
          country: 'País',
          birthday: 'Fecha de nacimiento',
          email: 'Correo',
          residence: 'Residencia',
          genre: 'Género',
          workingCondition: 'Condición laboral',
          CONAPDIS: 'CONAPDIS',
          IMAS: 'IMAS',
          physicalFileStatus: 'Estado expediente físico',
          medicalRecord: 'Expediente médico',
          dateHomeSINRUBE: 'Fecha hogar SINRUBE',
          foodBank: 'Banco de alimentos',
          socioEconomicStudy: 'Estudio socioeconómico',
          notes: 'Notas',
          status: 'Estado',
          idHeadquarter: 'ID Sede'
        };

        for (const [field, label] of Object.entries(fieldsToCheck)) {
          const oldValue = previousSurvivor[field];
          const newValue = updatedSurvivor[field];
          
          // Handle date comparison
          if (field === 'birthday') {
            const oldDate = oldValue ? new Date(oldValue).toISOString().split('T')[0] : null;
            const newDate = newValue ? new Date(newValue).toISOString().split('T')[0] : null;
            if (oldDate !== newDate) {
              changes.push(`${label}: "${oldDate}" → "${newDate}"`);
            }
          } else if (oldValue !== newValue) {
            changes.push(`${label}: "${oldValue}" → "${newValue}"`);
          }
        }

        const changeDescription = changes.length > 0 
          ? `Cambios: ${changes.join(', ')}`
          : 'Sin cambios detectados';

        await SecurityLogService.log({
          email: userEmail,
          action: "UPDATE",
          description:
            `Se actualizó el superviviente "${updatedSurvivor.survivorName}" (ID: ${id}). ` +
            changeDescription,
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
