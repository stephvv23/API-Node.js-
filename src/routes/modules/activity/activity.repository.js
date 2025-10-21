// NOTE: This imports Prisma client from lib/prisma.js (not from ../../prisma/client or .ts)
const prisma = require('../../../lib/prisma.js'); 

// Fields to select for activity queries (idActivity, tittle, description, type, modality, capacity, location, date, status)
const baseSelect = { 
  idActivity: true, 
  idHeadquarter: true,
  tittle: true, 
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
  
  // Returns all activities with their headquarter information
  findAll: () => prisma.activity.findMany({
    select: {
      idActivity: true,
      idHeadquarter: true,
      tittle: true,
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
      tittle: true,
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

  // Get activities by headquarter
  findByHeadquarter: (idHeadquarter) => prisma.activity.findMany({
    where: { idHeadquarter: parseInt(idHeadquarter) },
    select: {
      idActivity: true,
      idHeadquarter: true,
      tittle: true,
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

  // Get activities by date range
  findByDateRange: (startDate, endDate) => prisma.activity.findMany({
    where: {
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    },
    select: {
      idActivity: true,
      idHeadquarter: true,
      tittle: true,
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

  // Get activities by type
  findByType: (type) => prisma.activity.findMany({
    where: { type: type },
    select: {
      idActivity: true,
      idHeadquarter: true,
      tittle: true,
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

  // Get activities by modality
  findByModality: (modality) => prisma.activity.findMany({
    where: { modality: modality },
    select: {
      idActivity: true,
      idHeadquarter: true,
      tittle: true,
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
  })
};

module.exports = { ActivityRepository };
