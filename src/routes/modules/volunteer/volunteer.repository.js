let prisma = require('../../../lib/prisma.js');

const baseSelect = {
  idVolunteer: true,
  name: true,
  identifier: true,
  country: true,
  birthday: true,
  email: true,
  residence: true,
  modality: true,
  institution: true,
  availableSchedule: true,
  requiredHours: true,
  startDate: true,
  finishDate: true,
  imageAuthorization: true,
  notes: true,
  status: true
};

const VolunteerRepository = {
  // Lists volunteers with optional status, pagination, and ordering
  list: ({ status = 'active', take = 100, skip = 0 } = {}) => {
    const where = status === 'all' ? {} : { status };
    return prisma.volunteer.findMany({
      where,
      select: baseSelect,
      orderBy: {
        name: 'asc'
      },
      take,
      skip,
    });
  },

  // Lists all active volunteers
  listActive: () =>
    prisma.volunteer.findMany({
      where: { status: 'active' },
      select: baseSelect
    }),

  // Finds a volunteer by id
  findById: (id) =>
    prisma.volunteer.findUnique({
      where: { idVolunteer: Number(id) },
      select: baseSelect
    }),

  // Finds a volunteer by identifier
  findByIdentifier: (identifier) =>
    prisma.volunteer.findFirst({
      where: { identifier: identifier },
      select: baseSelect
    }),

  // Finds a volunteer by email
  findByEmail: (email) =>
    prisma.volunteer.findFirst({ 
      where: { email: email },
      select: baseSelect
    }),

  // Creates a new volunteer
  create: (data) =>
    prisma.volunteer.create({
      data,
      select: baseSelect,
    }),

  // Updates an existing volunteer
  update: (id, data) =>
    prisma.volunteer.update({
      where: { idVolunteer: Number(id) },
      data,
      select: baseSelect,
    }),

  // Soft delete: sets status to 'inactive'
  remove: (id) =>
    prisma.volunteer.update({
      where: { idVolunteer: Number(id) },
      data: { status: 'inactive' },
    }),
};

module.exports = { VolunteerRepository };
