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

  // ===== HEADQUARTERS RELATIONSHIPS =====
  
  // Get all headquarters for a volunteer
  getHeadquarters: (idVolunteer) =>
    prisma.headquarterVolunteer.findMany({
      where: { idVolunteer: Number(idVolunteer) },
      include: {
        headquarter: {
          select: {
            idHeadquarter: true,
            name: true,
          }
        }
      }
    }),

  // Add headquarter to volunteer
  addHeadquarter: (idVolunteer, idHeadquarter) =>
    prisma.headquarterVolunteer.create({
      data: {
        idVolunteer: Number(idVolunteer),
        idHeadquarter: Number(idHeadquarter),
      }
    }),

  // Remove headquarter from volunteer
  removeHeadquarter: (idVolunteer, idHeadquarter) =>
    prisma.headquarterVolunteer.delete({
      where: {
        idHeadquarter_idVolunteer: {
          idVolunteer: Number(idVolunteer),
          idHeadquarter: Number(idHeadquarter),
        }
      }
    }),

  // ===== EMERGENCY CONTACT RELATIONSHIPS =====
  
  // Get all emergency contacts for a volunteer
  getEmergencyContacts: (idVolunteer) =>
    prisma.emergencyContactVolunteer.findMany({
      where: { idVolunteer: Number(idVolunteer) },
      include: {
        emergencyContact: {
          select: {
            idEmergencyContact: true,
            nameEmergencyContact: true,
            relationship: true,
          }
        }
      }
    }),

  // Add emergency contact to volunteer
  addEmergencyContact: (idVolunteer, idEmergencyContact) =>
    prisma.emergencyContactVolunteer.create({
      data: {
        idVolunteer: Number(idVolunteer),
        idEmergencyContact: Number(idEmergencyContact),
      }
    }),

  // Remove emergency contact from volunteer
  removeEmergencyContact: (idVolunteer, idEmergencyContact) =>
    prisma.emergencyContactVolunteer.delete({
      where: {
        idEmergencyContact_idVolunteer: {
          idVolunteer: Number(idVolunteer),
          idEmergencyContact: Number(idEmergencyContact),
        }
      }
    }),

  // ===== VALIDATION HELPERS =====
  
  // Check if headquarter exists and is active
  headquarterExists: async (idHeadquarter) => {
    const headquarter = await prisma.headquarter.findUnique({
      where: { idHeadquarter: Number(idHeadquarter) },
      select: { idHeadquarter: true, status: true }
    });
    
    if (!headquarter) {
      return { exists: false, active: false };
    }
    
    return { 
      exists: true, 
      active: headquarter.status === 'active' 
    };
  },

  // Check if emergency contact exists and is active
  emergencyContactExists: async (idEmergencyContact) => {
    const contact = await prisma.emergencyContact.findUnique({
      where: { idEmergencyContact: Number(idEmergencyContact) },
      select: { idEmergencyContact: true, status: true }
    });
    
    if (!contact) {
      return { exists: false, active: false };
    }
    
    return { 
      exists: true, 
      active: contact.status === 'active' 
    };
  },
};

module.exports = { VolunteerRepository };
