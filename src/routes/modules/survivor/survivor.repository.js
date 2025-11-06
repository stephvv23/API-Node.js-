let prisma = require('../../../lib/prisma.js');

const baseSelect = {
  idSurvivor: true,
  idHeadquarter: true,
  survivorName: true,
  documentNumber: true,
  country: true,
  birthday: true,
  email: true,
  residence: true,
  genre: true,
  workingCondition: true,
  CONAPDIS: true,
  IMAS: true,
  physicalFileStatus: true,
  medicalRecord: true,
  dateHomeSINRUBE: true,
  foodBank: true,
  socioEconomicStudy: true,
  notes: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  headquarter: {
    select: {
      idHeadquarter: true,
      name: true,
      email: true,
      location: true
    }
  },
  cancerSurvivor: {
    where: {
      status: 'active' // Only include active cancer relations
    },
    select: {
      stage: true,
      status: true,
      cancer: {
        select: {
          idCancer: true,
          cancerName: true,
          description: true,
          status: true
        }
      }
    }
  },
  phoneSurvivor: {
    select: {
      phone: {
        select: {
          idPhone: true,
          phone: true
        }
      }
    }
  },
  emergencyContactSurvivor: {
    select: {
      relationshipType: true,
      emergencyContact: {
        select: {
          idEmergencyContact: true,
          nameEmergencyContact: true,
          emailEmergencyContact: true,
          relationship: true,
          status: true
        }
      }
    }
  }
};

const SurvivorRepository = {
  // List survivors with multiple filters
  list: ({ 
    status = 'active', 
    search, 
    cancerId, 
    gender, 
    headquarterId,
    ageMin,
    ageMax,
    country,
    physicalFileStatus,
    workingCondition,
    CONAPDIS,
    IMAS,
    foodBank,
    socioEconomicStudy,
    medicalRecord,
    emergencyContactId,
    take = 100, 
    skip = 0 
  } = {}) => {
    // Build where clause dynamically
    const where = {};

    // Status filter
    if (status !== 'all') {
      where.status = status;
    }

    // Search filter (name, document, or email)
    if (search) {
      where.OR = [
        { survivorName: { contains: search, mode: 'insensitive' } },
        { documentNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Cancer filter
    if (cancerId) {
      where.cancerSurvivor = {
        some: {
          idCancer: Number(cancerId),
          status: 'active' // Only active cancer relations
        }
      };
    }

    // Gender filter
    if (gender) {
      where.genre = gender;
    }

    // Headquarter filter
    if (headquarterId) {
      where.idHeadquarter = Number(headquarterId);
    }

    // Country filter
    if (country) {
      where.country = { contains: country, mode: 'insensitive' };
    }

    // Physical file status filter
    if (physicalFileStatus) {
      where.physicalFileStatus = physicalFileStatus;
    }

    // Working condition filter
    if (workingCondition) {
      where.workingCondition = workingCondition;
    }

    // CONAPDIS filter (boolean)
    if (CONAPDIS !== undefined) {
      where.CONAPDIS = CONAPDIS === 'true' || CONAPDIS === true;
    }

    // IMAS filter (boolean)
    if (IMAS !== undefined) {
      where.IMAS = IMAS === 'true' || IMAS === true;
    }

    // Food bank filter (boolean)
    if (foodBank !== undefined) {
      where.foodBank = foodBank === 'true' || foodBank === true;
    }

    // Socioeconomic study filter (boolean)
    if (socioEconomicStudy !== undefined) {
      where.socioEconomicStudy = socioEconomicStudy === 'true' || socioEconomicStudy === true;
    }

    // Medical record filter (boolean)
    if (medicalRecord !== undefined) {
      where.medicalRecord = medicalRecord === 'true' || medicalRecord === true;
    }

    // Emergency contact filter
    if (emergencyContactId) {
      where.emergencyContactSurvivor = {
        some: {
          idEmergencyContact: Number(emergencyContactId)
        }
      };
    }

    // Age filter (calculated from birthday)
    if (ageMin !== undefined || ageMax !== undefined) {
      const today = new Date();
      
      // If ageMax is provided, calculate the minimum birthday (oldest person we want)
      if (ageMax !== undefined) {
        const minBirthday = new Date(
          today.getFullYear() - ageMax - 1,
          today.getMonth(),
          today.getDate()
        );
        where.birthday = { ...where.birthday, gte: minBirthday };
      }
      
      // If ageMin is provided, calculate the maximum birthday (youngest person we want)
      if (ageMin !== undefined) {
        const maxBirthday = new Date(
          today.getFullYear() - ageMin,
          today.getMonth(),
          today.getDate()
        );
        where.birthday = { ...where.birthday, lte: maxBirthday };
      }
    }

    return prisma.survivor.findMany({
      where,
      select: baseSelect,
      orderBy: { idSurvivor: 'asc' },
      take: Number(take),
      skip: Number(skip),
    });
  },

  // List only active survivors
  listActive: () =>
    prisma.survivor.findMany({
      where: { status: 'active' },
      select: baseSelect,
      orderBy: { idSurvivor: 'asc' } // Order by ID ascending
    }),

  // Find by ID
  findById: (id) =>
    prisma.survivor.findUnique({
      where: { idSurvivor: Number(id) },
      select: baseSelect
    }),

  // Find by name
  findByName: (name) =>
    prisma.survivor.findFirst({
      where: { survivorName: { equals: name, mode: 'insensitive' } },
      select: baseSelect
    }),

  // Find by email
  findByEmail: (email) =>
    prisma.survivor.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: baseSelect
    }),

  create: async (survivorData, relationalData) => {
    return prisma.$transaction(async (tx) => {
      const survivor = await tx.survivor.create({
        data: survivorData,
        select: baseSelect
      });

      // Create cancer relations (required, minimum 1)
      if (relationalData.cancers && relationalData.cancers.length > 0) {
        // Do not send `status` when creating CancerSurvivor rows — the model
        // should provide a default (e.g. 'active'). This avoids overriding
        // defaults and keeps creation simpler.
        await tx.cancerSurvivor.createMany({
          data: relationalData.cancers.map(cancer => ({
            idSurvivor: survivor.idSurvivor,
            idCancer: cancer.idCancer,
            stage: cancer.stage
          }))
        });
      }

      // Create/link phone (optional, only one allowed)
      if (relationalData.phone) {
        // Normalize phone to digits only to avoid duplicates like '123-456' vs '123456'
        const phoneStrRaw = String(relationalData.phone || '').trim();
        const phoneStr = phoneStrRaw.replace(/\D/g, '');

        if (phoneStr.length > 0) {
          // Use findUnique because `phone` has a unique constraint in the schema
          let phone = await tx.phone.findUnique({ where: { phone: phoneStr } }).catch(() => null);

          if (!phone) {
            phone = await tx.phone.create({ data: { phone: phoneStr } });
          }

          // Sanity check: if phone or survivor id missing, throw to rollback transaction
          if (!phone || !phone.idPhone || !survivor || !survivor.idSurvivor) {
            throw new Error('Failed to create/link phone for survivor');
          }

          await tx.phoneSurvivor.create({
            data: {
              idPhone: phone.idPhone,
              idSurvivor: survivor.idSurvivor
            }
          });
        }
      }

      // Link emergency contacts (optional)
      if (relationalData.emergencyContacts && relationalData.emergencyContacts.length > 0) {
        await tx.emergencyContactSurvivor.createMany({
          data: relationalData.emergencyContacts.map(contact => ({
            idEmergencyContact: contact.idEmergencyContact,
            idSurvivor: survivor.idSurvivor,
            relationshipType: contact.relationshipType
          }))
        });
      }

      // Return complete survivor with all relations
      return tx.survivor.findUnique({
        where: { idSurvivor: survivor.idSurvivor },
        select: {
          ...baseSelect,
          cancerSurvivor: {
            select: {
              status: true,
              stage: true,
              cancer: {
                select: {
                  idCancer: true,
                  cancerName: true,
                  description: true
                }
              }
            }
          },
          phoneSurvivor: {
            select: {
              phone: {
                select: {
                  idPhone: true,
                  phone: true
                }
              }
            }
          },
          emergencyContactSurvivor: {
            select: {
              relationshipType: true,
              emergencyContact: {
                select: {
                  idEmergencyContact: true,
                  nameEmergencyContact: true,
                  emailEmergencyContact: true,
                  relationship: true
                }
              }
            }
          }
        }
      });
    });
  },

  // Update survivor data
  // NOTE: do NOT include non-unique fields (like `status`) in the `where` for `update`.
  // Controller already validates that only active survivors may be updated where required.
  update: (id, data) =>
    prisma.survivor.update({
      where: { idSurvivor: Number(id) },
      data: {
        ...data,
        updatedAt: new Date() // Actualizar timestamp automáticamente
      },
      select: baseSelect
    }),

  // Deactivate a survivor
  remove: (id) =>
    prisma.survivor.update({
      where: { idSurvivor: Number(id) },
      data: { 
        status: 'inactive',
        updatedAt: new Date() // Actualizar timestamp
      },
      select: baseSelect
    }),

  // Reactivate a survivor
  reactivate: (id) =>
    prisma.survivor.update({
      where: { idSurvivor: Number(id) },
      data: { 
        status: 'active',
        updatedAt: new Date() // Actualizar timestamp
      },
      select: baseSelect
    }),
};

module.exports = { SurvivorRepository };
