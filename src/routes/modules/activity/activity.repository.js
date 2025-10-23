// NOTE: This imports Prisma client from lib/prisma.js (not from ../../prisma/client or .ts)
const prisma = require('../../../lib/prisma.js'); 

// Fields to select for activity queries (idActivity, title, description, type, modality, capacity, location, date, status)
const baseSelect = { 
  idActivity: true, 
  idHeadquarter: true,
  title: true, 
  description: true, 
  type: true, 
  modality: true, 
  capacity: true, 
  location: true, 
  date: true, 
  status: true 
};

// ActivityRepository provides direct database operations for Activity entities.
const ActivityRepository = {
  
  // Returns all activities with selected fields
  list: () => prisma.activity.findMany({ select: baseSelect }),
  
  // Returns all activities with their headquarter information and optional filters
  findAll: (filters = {}) => {
    const where = {};
    
    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      where.status = filters.status;
    }
    
    // Apply headquarter filter
    if (filters.headquarter) {
      where.idHeadquarter = filters.headquarter;
    }
    
    // Apply type filter
    if (filters.type) {
      where.type = filters.type;
    }
    
    // Apply modality filter
    if (filters.modality) {
      where.modality = filters.modality;
    }
    
    // Apply date range filter
    if (filters.startDate && filters.endDate) {
      where.date = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate)
      };
    }
    
    return prisma.activity.findMany({
      where,
      select: {
        idActivity: true,
        idHeadquarter: true,
        title: true,
        description: true,
        type: true,
        modality: true,
        capacity: true,
        location: true,
        date: true,
        status: true,
        headquarter: {
          select: {
            idHeadquarter: true,
            name: true,
            status: true
          }
        }
      }
    });
  },

  create: (data) => prisma.activity.create({ data, select: baseSelect }),
  
  // Updates activity data by idActivity
  update: (idActivity, data) => prisma.activity.update({ 
    where: { idActivity: parseInt(idActivity) }, 
    data, 
    select: baseSelect 
  }),

  // Updates only the activity's status
  updateStatus: (idActivity, status) => prisma.activity.update({ 
    where: { idActivity: parseInt(idActivity) }, 
    data: { status }, 
    select: baseSelect 
  }),

  // Soft delete an activity by idActivity (change status to inactive)
  remove: (idActivity) => prisma.activity.update({ 
    where: { idActivity: parseInt(idActivity) }, 
    data: { status: 'inactive' }, 
    select: baseSelect 
  }),

  // Finds an activity by idActivity (primary key)
  findById: (idActivity) => prisma.activity.findUnique({ 
    where: { idActivity: parseInt(idActivity) }, 
    select: {
      idActivity: true,
      idHeadquarter: true,
      title: true,
      description: true,
      type: true,
      modality: true,
      capacity: true,
      location: true,
      date: true,
      status: true,
      headquarter: {
        select: {
          idHeadquarter: true,
          name: true,
          status: true
        }
      }
    }
  }),

  // Finds an activity by idActivity with all relations
  findByIdWithRelations: (idActivity) => prisma.activity.findUnique({
    where: { idActivity: parseInt(idActivity) },
    include: {
      headquarter: {
        select: {
          idHeadquarter: true,
          name: true,
          status: true
        }
      },
      activityVolunteer: {
        select: {
          volunteer: {
            select: {
              idVolunteer: true,
              name: true,
              status: true
            }
          }
        }
      },
      activitySurvivor: {
        select: {
          survivor: {
            select: {
              idSurvivor: true,
              survivorName: true,
              status: true
            }
          }
        }
      },
      activityGodparent: {
        select: {
          godparent: {
            select: {
              idGodparent: true,
              name: true,
              status: true
            }
          }
        }
      }
    }
  }),

  // verify that a headquarter exists and is active
  verifyHeadquarterExists: (idHeadquarter) => prisma.headquarter.findFirst({
    where: { 
      idHeadquarter: parseInt(idHeadquarter),
      status: 'active'
    },
    select: { idHeadquarter: true }
  }),

  // check if headquarter exists (regardless of status)
  checkHeadquarterExists: (idHeadquarter) => prisma.headquarter.findFirst({
    where: { 
      idHeadquarter: parseInt(idHeadquarter)
    },
    select: { idHeadquarter: true, status: true }
  }),


  // Find an activity by title
  findByTitle: (title) => prisma.activity.findFirst({
    where: { title },
    select: {
      idActivity: true,
      idHeadquarter: true,
      title: true,
      description: true,
      type: true,
      modality: true,
      capacity: true,
      location: true,
      date: true,
      status: true,
      headquarter: {
        select: {
          idHeadquarter: true,
          name: true,
          status: true
        }
      }
    }
  }),

  // Get all lookup data needed for activity assignment
  getLookupData: async () => {
    const [headquarters, volunteers, survivors, godparents] = await Promise.all([
      // Get all headquarters (active and inactive)
      prisma.headquarter.findMany({
        select: {
          idHeadquarter: true,
          name: true,
          status: true
        },
        orderBy: { name: 'asc' }
      }),
      
      // Get all volunteers (active and inactive)
      prisma.volunteer.findMany({
        select: {
          idVolunteer: true,
          name: true,
          email: true,
          status: true
        },
        orderBy: { name: 'asc' }
      }),
      
      // Get all survivors (active and inactive)
      prisma.survivor.findMany({
        select: {
          idSurvivor: true,
          survivorName: true,
          email: true,
          status: true
        },
        orderBy: { survivorName: 'asc' }
      }),
      
      // Get all godparents (active and inactive)
      prisma.godparent.findMany({
        select: {
          idGodparent: true,
          name: true,
          email: true,
          status: true
        },
        orderBy: { name: 'asc' }
      })
    ]);

    return {
      headquarters,
      volunteers,
      survivors,
      godparents
    };
  }
};

module.exports = { ActivityRepository };
