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
  headquarter: {
    select: {
      idHeadquarter: true,
      name: true,
      email: true,
      location: true
    }
  }
};

const SurvivorRepository = {
  // List survivors (by status or all)
    list: ({ status = 'active', take = 100, skip = 0 } = {}) => {
    const where = status === 'all' ? {} : { status };
    return prisma.survivor.findMany({
      where,
      select: baseSelect,
      orderBy: { survivorName: 'asc' },
      take,
      skip,
    });
  },

  // List only active survivors
  listActive: () =>
    prisma.survivor.findMany({
      where: { status: 'active' },
      select: baseSelect
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
          data: relationalData.emergencyContacts.map(idEmergencyContact => ({
            idEmergencyContact,
            idSurvivor: survivor.idSurvivor
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
      data,
      select: baseSelect
    }),

  // Deactivate a survivor
  remove: (id) =>
    prisma.survivor.update({
      where: { idSurvivor: Number(id) },
      data: { status: 'inactive' },
      select: baseSelect
    }),

  // Reactivate a survivor
  reactivate: (id) =>
    prisma.survivor.update({
      where: { idSurvivor: Number(id) },
      data: { status: 'active' },
      select: baseSelect
    }),
};

module.exports = { SurvivorRepository };
