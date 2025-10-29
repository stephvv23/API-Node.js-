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

  // check if headquarter exists and is active
  checkHeadquarterExists: (idHeadquarter) => prisma.headquarter.findFirst({
    where: { 
      idHeadquarter: parseInt(idHeadquarter),
      status: 'active' // only headquarters with status active
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
      // Get only active headquarters
      prisma.headquarter.findMany({
        where: {
          status: 'active'
        },
        select: {
          idHeadquarter: true,
          name: true,
          status: true
        },
        orderBy: { name: 'asc' }
      }),
      
      // Get only active volunteers
      prisma.volunteer.findMany({
        where: {
          status: 'active'
        },
        select: {
          idVolunteer: true,
          name: true,
          email: true,
          status: true
        },
        orderBy: { name: 'asc' }
  }),

      // Get only active survivors
      prisma.survivor.findMany({
        where: {
          status: 'active'
        },
    select: {
          idSurvivor: true,
          survivorName: true,
          email: true,
          status: true
        },
        orderBy: { survivorName: 'asc' }
      }),
      
      // Get only active godparents
      prisma.godparent.findMany({
        where: {
          status: 'active'
        },
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
  },

  // Get volunteers assigned to a specific activity
  getVolunteers: (idActivity) => {
    return prisma.activityVolunteer.findMany({
      where: {
        idActivity: parseInt(idActivity)
      },
      select: {
        volunteer: {
          select: {
            idVolunteer: true,
            name: true,
            email: true,
            status: true
          }
        }
      },
      orderBy: {
        volunteer: {
          name: 'asc'
        }
      }
    });
  },

  // Get survivors assigned to a specific activity
  getSurvivors: (idActivity) => {
    return prisma.activitySurvivor.findMany({
      where: {
        idActivity: parseInt(idActivity)
      },
      select: {
        survivor: {
          select: {
            idSurvivor: true,
            survivorName: true,
            email: true,
            status: true
          }
        }
      },
      orderBy: {
        survivor: {
          survivorName: 'asc'
        }
      }
    });
  },

  // Get godparents assigned to a specific activity
  getGodparents: (idActivity) => {
    return prisma.activityGodparent.findMany({
      where: {
        idActivity: parseInt(idActivity)
      },
      select: {
        godparent: {
          select: {
            idGodparent: true,
            name: true,
            email: true,
            status: true
          }
        }
      },
      orderBy: {
        godparent: {
          name: 'asc'
        }
      }
    });
  },

  // Assign volunteers to activity
  assignVolunteers: async (idActivity, volunteerIds) => {
    const activityNum = parseInt(idActivity);
    // Filter and validate volunteer IDs - convert to integers
    const validVolunteerIds = volunteerIds
      .map(id => parseInt(id))
      .filter(id => !isNaN(id) && id > 0);

    if (validVolunteerIds.length === 0) return { count: 0 };

    // Remove duplicates
    const uniqueVolunteerIds = [...new Set(validVolunteerIds)];

    // Check which relationships already exist
    const existingRelations = await prisma.activityVolunteer.findMany({
      where: {
        idActivity: activityNum,
        idVolunteer: { in: uniqueVolunteerIds }
      },
      select: { idVolunteer: true }
    });

    const existingVolunteerIds = existingRelations.map(rel => rel.idVolunteer);
    const newVolunteerIds = uniqueVolunteerIds.filter(id => !existingVolunteerIds.includes(id));

    if (newVolunteerIds.length === 0) {
      return { count: 0, message: 'Todos los voluntarios ya están asignados a esta actividad' };
    }

    return prisma.activityVolunteer.createMany({
      data: newVolunteerIds.map(volunteerId => ({
        idActivity: activityNum,
        idVolunteer: volunteerId
      }))
    });
  },

  // Remove volunteers from activity
  removeVolunteers: async (idActivity, volunteerIds) => {
    const activityNum = parseInt(idActivity);
    // Filter and validate volunteer IDs - convert to integers
    const validVolunteerIds = volunteerIds
      .map(id => parseInt(id))
      .filter(id => !isNaN(id) && id > 0);

    if (validVolunteerIds.length === 0) return { count: 0 };

    // Remove duplicates
    const uniqueVolunteerIds = [...new Set(validVolunteerIds)];

    return prisma.activityVolunteer.deleteMany({
      where: {
        idActivity: activityNum,
        idVolunteer: { in: uniqueVolunteerIds }
      }
    });
  },

  // Assign survivors to activity
  assignSurvivors: async (idActivity, survivorIds) => {
    const activityNum = parseInt(idActivity);
    // Filter and validate survivor IDs - convert to integers
    const validSurvivorIds = survivorIds
      .map(id => parseInt(id))
      .filter(id => !isNaN(id) && id > 0);

    if (validSurvivorIds.length === 0) return { count: 0 };

    // Remove duplicates
    const uniqueSurvivorIds = [...new Set(validSurvivorIds)];

    // Check which relationships already exist
    const existingRelations = await prisma.activitySurvivor.findMany({
      where: {
        idActivity: activityNum,
        idSurvivor: { in: uniqueSurvivorIds }
      },
      select: { idSurvivor: true }
    });

    const existingSurvivorIds = existingRelations.map(rel => rel.idSurvivor);
    const newSurvivorIds = uniqueSurvivorIds.filter(id => !existingSurvivorIds.includes(id));

    if (newSurvivorIds.length === 0) {
      return { count: 0, message: 'Todos los sobrevivientes ya están asignados a esta actividad' };
    }

    return prisma.activitySurvivor.createMany({
      data: newSurvivorIds.map(survivorId => ({
        idActivity: activityNum,
        idSurvivor: survivorId
      }))
    });
  },

  // Remove survivors from activity
  removeSurvivors: async (idActivity, survivorIds) => {
    const activityNum = parseInt(idActivity);
    // Filter and validate survivor IDs - convert to integers
    const validSurvivorIds = survivorIds
      .map(id => parseInt(id))
      .filter(id => !isNaN(id) && id > 0);

    if (validSurvivorIds.length === 0) return { count: 0 };

    // Remove duplicates
    const uniqueSurvivorIds = [...new Set(validSurvivorIds)];

    return prisma.activitySurvivor.deleteMany({
      where: {
        idActivity: activityNum,
        idSurvivor: { in: uniqueSurvivorIds }
      }
    });
  },

  // Assign godparents to activity
  assignGodparents: async (idActivity, godparentIds) => {
    const activityNum = parseInt(idActivity);
    // Filter and validate godparent IDs - convert to integers
    const validGodparentIds = godparentIds
      .map(id => parseInt(id))
      .filter(id => !isNaN(id) && id > 0);

    if (validGodparentIds.length === 0) return { count: 0 };

    // Remove duplicates
    const uniqueGodparentIds = [...new Set(validGodparentIds)];

    // Check which relationships already exist
    const existingRelations = await prisma.activityGodparent.findMany({
      where: {
        idActivity: activityNum,
        idGodparent: { in: uniqueGodparentIds }
      },
      select: { idGodparent: true }
    });

    const existingGodparentIds = existingRelations.map(rel => rel.idGodparent);
    const newGodparentIds = uniqueGodparentIds.filter(id => !existingGodparentIds.includes(id));

    if (newGodparentIds.length === 0) {
      return { count: 0, message: 'Todos los padrinos ya están asignados a esta actividad' };
    }

    return prisma.activityGodparent.createMany({
      data: newGodparentIds.map(godparentId => ({
        idActivity: activityNum,
        idGodparent: godparentId
      }))
    });
  },

  // Remove godparents from activity
  removeGodparents: async (idActivity, godparentIds) => {
    const activityNum = parseInt(idActivity);
    // Filter and validate godparent IDs - convert to integers
    const validGodparentIds = godparentIds
      .map(id => parseInt(id))
      .filter(id => !isNaN(id) && id > 0);

    if (validGodparentIds.length === 0) return { count: 0 };

    // Remove duplicates
    const uniqueGodparentIds = [...new Set(validGodparentIds)];

    return prisma.activityGodparent.deleteMany({
      where: {
        idActivity: activityNum,
        idGodparent: { in: uniqueGodparentIds }
      }
    });
  },

  // Validation methods
  validateVolunteersExist: async (volunteerIds) => {
    // Convert all IDs to integers
    const integerIds = volunteerIds.map(id => parseInt(id));
    
    const existingVolunteers = await prisma.volunteer.findMany({
      where: {
        idVolunteer: { in: integerIds },
        status: 'active' // Solo voluntarios activos
      },
      select: { idVolunteer: true, status: true }
    });
    
    const existingIds = existingVolunteers.map(v => v.idVolunteer);
    const missingIds = integerIds.filter(id => !existingIds.includes(id));
    
    return {
      allExist: missingIds.length === 0,
      missingIds
    };
  },

  // Get valid volunteers and filter out invalid ones
  getValidVolunteers: async (volunteerIds) => {
    // Convert all IDs to integers and filter out NaN values
    const integerIds = volunteerIds
      .map(id => parseInt(id))
      .filter(id => !isNaN(id) && id > 0);
    
    // If no valid integer IDs, return empty arrays
    if (integerIds.length === 0) {
      return {
        validIds: [],
        invalidIds: volunteerIds
      };
    }
    
    const existingVolunteers = await prisma.volunteer.findMany({
      where: {
        idVolunteer: { in: integerIds },
        status: 'active' // Solo voluntarios activos
      },
      select: { idVolunteer: true, status: true }
    });
    
    const validIds = existingVolunteers.map(v => v.idVolunteer);
    const invalidIds = volunteerIds.filter(id => {
      const parsedId = parseInt(id);
      return isNaN(parsedId) || parsedId <= 0 || !validIds.includes(parsedId);
    });
    
    return {
      validIds,
      invalidIds
    };
  },

  validateSurvivorsExist: async (survivorIds) => {
    // Convert all IDs to integers
    const integerIds = survivorIds.map(id => parseInt(id));
    
    const existingSurvivors = await prisma.survivor.findMany({
      where: {
        idSurvivor: { in: integerIds },
        status: 'active' // Solo supervivientes activos
      },
      select: { idSurvivor: true, status: true }
    });
    
    const existingIds = existingSurvivors.map(s => s.idSurvivor);
    const missingIds = integerIds.filter(id => !existingIds.includes(id));
    
    return {
      allExist: missingIds.length === 0,
      missingIds
    };
  },

  // Get valid survivors and filter out invalid ones
  getValidSurvivors: async (survivorIds) => {
    // Convert all IDs to integers and filter out NaN values
    const integerIds = survivorIds
      .map(id => parseInt(id))
      .filter(id => !isNaN(id) && id > 0);
    
    // If no valid integer IDs, return empty arrays
    if (integerIds.length === 0) {
      return {
        validIds: [],
        invalidIds: survivorIds
      };
    }
    
    const existingSurvivors = await prisma.survivor.findMany({
      where: {
        idSurvivor: { in: integerIds },
        status: 'active' // Solo supervivientes activos
      },
      select: { idSurvivor: true, status: true }
    });
    
    const validIds = existingSurvivors.map(s => s.idSurvivor);
    const invalidIds = survivorIds.filter(id => {
      const parsedId = parseInt(id);
      return isNaN(parsedId) || parsedId <= 0 || !validIds.includes(parsedId);
    });
    
    return {
      validIds,
      invalidIds
    };
  },

  validateGodparentsExist: async (godparentIds) => {
    // Convert all IDs to integers
    const integerIds = godparentIds.map(id => parseInt(id));
    
    const existingGodparents = await prisma.godparent.findMany({
      where: {
        idGodparent: { in: integerIds },
        status: 'active' // Solo padrinos activos
      },
      select: { idGodparent: true, status: true }
    });
    
    const existingIds = existingGodparents.map(g => g.idGodparent);
    const missingIds = integerIds.filter(id => !existingIds.includes(id));
    
    return {
      allExist: missingIds.length === 0,
      missingIds
    };
  },

  // Get valid godparents and filter out invalid ones
  getValidGodparents: async (godparentIds) => {
    // Convert all IDs to integers and filter out NaN values
    const integerIds = godparentIds
      .map(id => parseInt(id))
      .filter(id => !isNaN(id) && id > 0);
    
    // If no valid integer IDs, return empty arrays
    if (integerIds.length === 0) {
      return {
        validIds: [],
        invalidIds: godparentIds
      };
    }
    
    const existingGodparents = await prisma.godparent.findMany({
      where: {
        idGodparent: { in: integerIds },
        status: 'active' // Solo padrinos activos
      },
      select: { idGodparent: true, status: true }
    });
    
    const validIds = existingGodparents.map(g => g.idGodparent);
    const invalidIds = godparentIds.filter(id => {
      const parsedId = parseInt(id);
      return isNaN(parsedId) || parsedId <= 0 || !validIds.includes(parsedId);
    });
    
    return {
      validIds,
      invalidIds
    };
  }
};

module.exports = { ActivityRepository };
