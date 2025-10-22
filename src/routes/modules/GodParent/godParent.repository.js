let prisma = require('../../../lib/prisma.js');

const baseSelect = {
  idGodparent: true,
  idSurvivor: true,
  idHeadquarter: true,
  name: true,
  email: true,
  paymentMethod: true,
  startDate: true,
  finishDate: true,
  description: true,
  status: true,
  survivor: {
    select: {
      idSurvivor: true,
      survivorName: true,
      email: true
    }
  },
  headquarter: {
    select: {
      idHeadquarter: true,
      name: true,
      email: true
    }
  },
  godParentsPhone: {
    select: {
      phone: {
        select: {
          idPhone: true,
          phone: true
        }
      }
    }
  },
  activityGodparent: {
    select: {
      activity: {
        select: {
          idActivity: true,
          tittle: true,
          status: true
        }
      }
    }
  }
};

const GodParentRepository = {
  // Lists all godparents (active and inactive)
  list: () => {
    return prisma.godparent.findMany({
      select: baseSelect,
      orderBy: {
        name: 'asc'
      },
    });
  },

  // Finds a godparent by id
  findById: (id) =>
    prisma.godparent.findUnique({
      where: { idGodparent: Number(id) },
      select: baseSelect
    }),

  findByName: (name) =>
    prisma.godparent.findFirst({
      where: { name: name },
      select: baseSelect
    }),

  findByEmail: (email) =>
    prisma.godparent.findFirst({
      where: { email: email },
      select: baseSelect
    }),

  // Creates a new godparent
  create: (data) =>
    prisma.godparent.create({
      data,
      select: baseSelect,
    }),

  // Updates an existing godparent
  update: (id, data) =>
    prisma.godparent.update({
      where: { idGodparent: Number(id) },
      data,
      select: baseSelect,
    }),

  // Soft delete: sets status to 'inactive'
  remove: (id) =>
    prisma.godparent.update({
      where: { idGodparent: Number(id) },
      data: { status: 'inactive' },
    }),

  // Assign phones to a godparent
  assignPhones: async (godparentId, phoneIds) => {
    const godparentNum = Number(godparentId);
    // Filter and validate phone IDs
    const validPhoneIds = phoneIds
      .map(id => Number(id))
      .filter(id => !isNaN(id) && id > 0);

    if (validPhoneIds.length === 0) return { count: 0 };

    // Remove duplicates
    const uniquePhoneIds = [...new Set(validPhoneIds)];

    return prisma.godparentPhone.createMany({
      data: uniquePhoneIds.map(phoneId => ({
        idGodparent: godparentNum,
        idPhone: phoneId
      }))
    });
  },

  // Assign activities to a godparent
  assignActivities: async (godparentId, activityIds) => {
    const godparentNum = Number(godparentId);
    // Filter and validate activity IDs
    const validActivityIds = activityIds
      .map(id => Number(id))
      .filter(id => !isNaN(id) && id > 0);

    if (validActivityIds.length === 0) return { count: 0 };

    // Remove duplicates
    const uniqueActivityIds = [...new Set(validActivityIds)];

    return prisma.activityGodparent.createMany({
      data: uniqueActivityIds.map(activityId => ({
        idGodparent: godparentNum,
        idActivity: activityId
      }))
    });
  },

  // Clear all phones for a godparent
  clearPhones: async (godparentId) =>
    prisma.godparentPhone.deleteMany({
      where: { idGodparent: Number(godparentId) }
    }),

  // Clear all activities for a godparent
  clearActivities: async (godparentId) =>
    prisma.activityGodparent.deleteMany({
      where: { idGodparent: Number(godparentId) }
    }),

  // Check if phone exists
  checkPhoneExists: (phoneId) =>
    prisma.phone.findUnique({
      where: { idPhone: Number(phoneId) }
    }),

  // Check if activity exists
  checkActivityExists: (activityId) =>
    prisma.activity.findUnique({
      where: { idActivity: Number(activityId) }
    }),
};

module.exports = { GodParentRepository };