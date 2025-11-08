const prisma = require('../../../lib/prisma.js');

const StatsRepository = {
  // obtain security logs
  getSecurityLogs: async ({ limit = 1000, offset = 0, startDate, endDate, action, affectedTable } = {}) => {
    const whereClause = {};
    if (startDate) whereClause.date = { gte: new Date(startDate) };
    if (endDate) whereClause.date = { ...whereClause.date, lte: new Date(endDate) };
    if (action) whereClause.action = action;
    if (affectedTable) whereClause.affectedTable = affectedTable;
    
    return prisma.securityLog.findMany({
      where: whereClause,
      take: parseInt(limit),
      skip: parseInt(offset),
      orderBy: { date: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });
  },

  // Obtain user statistics
  getUserStats: async () => {
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: { status: 'active' }
    });
    
    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers
    };
  },

  // Obtain users by role
  getUsersByRole: async () => {
    const usersByRoleRaw = await prisma.userRole.groupBy({
      by: ['idRole'],
      _count: { email: true }
    });
    
    const roleIds = usersByRoleRaw.map(item => item.idRole);
    const roles = await prisma.role.findMany({
      where: { idRole: { in: roleIds } },
      select: { idRole: true, rolName: true }
    });
    
    return usersByRoleRaw.map(item => {
      const role = roles.find(r => r.idRole === item.idRole);
      return {
        role: role ? role.rolName : 'Unknown',
        count: item._count.email
      };
    });
  },

  // Obtain users by headquarter
  getUsersByHeadquarter: async () => {
    const usersByHeadquarterRaw = await prisma.headquarterUser.groupBy({
      by: ['idHeadquarter'],
      _count: { email: true }
    });
    
    const headquarterIds = usersByHeadquarterRaw.map(item => item.idHeadquarter);
    const headquarters = await prisma.headquarter.findMany({
      where: { idHeadquarter: { in: headquarterIds } },
      select: { idHeadquarter: true, name: true }
    });
    
    return usersByHeadquarterRaw.map(item => {
      const headquarter = headquarters.find(h => h.idHeadquarter === item.idHeadquarter);
      return {
        headquarter: headquarter ? headquarter.name : 'Unknown',
        count: item._count.email
      };
    });
  },

  // Obtain new users this month (based on SecurityLog CREATE action, not login)
  getNewUsersThisMonth: async () => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    return prisma.securityLog.count({
      where: {
        action: 'CREATE',
        affectedTable: 'User',
        date: { gte: startOfMonth }
      }
    });
  },

  // Obtain top users by access
  getTopUsersByAccess: async () => {
    const topUsersByAccessRaw = await prisma.loginAccess.groupBy({
      by: ['email'],
      _count: { loginIdAccess: true },
      _max: { date: true }, // ✅ AGREGAR: obtener la fecha máxima
      orderBy: { _count: { loginIdAccess: 'desc' } },
      take: 10
    });
    
    const userEmails = topUsersByAccessRaw.map(item => item.email);
    const users = await prisma.user.findMany({
      where: { email: { in: userEmails } },
      select: { email: true, name: true }
    });
    
    return topUsersByAccessRaw.map(item => {
      const user = users.find(u => u.email === item.email);
      return {
        email: item.email,
        name: user ? user.name : 'Unknown',
        accessCount: item._count.loginIdAccess,
        lastAccess: item._max.date // ✅ AGREGAR: incluir último acceso
      };
    });
  },

  // Obtain last access by user
  getLastAccessByUser: async () => {
    const lastAccessByUserRaw = await prisma.loginAccess.groupBy({
      by: ['email'],
      _max: { date: true }
    });
    
    const userEmails = lastAccessByUserRaw.map(item => item.email);
    const users = await prisma.user.findMany({
      where: { email: { in: userEmails } },
      select: { email: true, name: true }
    });
    
    return lastAccessByUserRaw.map(item => {
      const user = users.find(u => u.email === item.email);
      return {
        email: item.email,
        name: user ? user.name : 'Unknown',
        lastAccess: item._max.date
      };
    });
  },

  // Obtain general system statistics
  getSystemStats: async () => {
    return {
      totalUsers: await prisma.user.count(),
      totalRoles: await prisma.role.count(),
      totalHeadquarters: await prisma.headquarter.count(),
      totalVolunteers: await prisma.volunteer.count(),
      totalSurvivors: await prisma.survivor.count(),
      totalActivities: await prisma.activity.count(),
      totalAssets: await prisma.asset.count(),
      totalSuppliers: await prisma.supplier.count()
    };
  },

  // Obtain security statistics
  getSecurityStats: async () => {
    return {
      totalLogins: await prisma.loginAccess.count(),
      totalSecurityLogs: await prisma.securityLog.count(),
      incidentsByTable: await prisma.securityLog.groupBy({
        by: ['affectedTable'],
        _count: { securityIdLog: true }
      }),
      mostCommonActions: await prisma.securityLog.groupBy({
        by: ['action'],
        _count: { securityIdLog: true },
        orderBy: { _count: { securityIdLog: 'desc' } },
        take: 5
      })
    };
  },

  // Obtain activity statistics (last 30 days)
  getActivityStats: async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return {
      last30Days: {
        activeUsers: await prisma.user.count({
          where: {
            loginAccess: {
              some: {
                date: { gte: thirtyDaysAgo }
              }
            }
          }
        }),
        totalLogins: await prisma.loginAccess.count({
          where: { date: { gte: thirtyDaysAgo } }
        }),
        totalSecurityLogs: await prisma.securityLog.count({
          where: { date: { gte: thirtyDaysAgo } }
        })
      }
    };
  },

  // Obtain active volunteers with recent participation (current month)
  // This includes volunteers assigned to activities in the current month
  getActiveVolunteers: async () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1-12 (1 = January, 12 = December)
    
    // First day of current month at 00:00:00
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1, 0, 0, 0, 0);
    
    // First day of next month at 00:00:00 (exclusive, so it's the end of current month)
    const firstDayOfNextMonth = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
    
    // Get all activities in the current month with active status
    const activitiesThisMonth = await prisma.activity.findMany({
      where: {
        status: 'active',
        date: {
          gte: firstDayOfMonth,
          lt: firstDayOfNextMonth
        },
        activityVolunteer: {
          some: {
            volunteer: {
              status: 'active'
            }
          }
        }
      },
      select: {
        activityVolunteer: {
          where: {
            volunteer: {
              status: 'active'
            }
          },
          select: {
            idVolunteer: true
          }
        }
      }
    });
    
    // Extract all unique volunteer IDs from activities this month
    const volunteerIdsSet = new Set();
    activitiesThisMonth.forEach(activity => {
      activity.activityVolunteer.forEach(av => {
        volunteerIdsSet.add(av.idVolunteer);
      });
    });
    
    return volunteerIdsSet.size;
  },

  // Obtain volunteers by headquarter for the "Voluntariado por Sede" chart
  // Returns active volunteers count and estimated volunteer hours per headquarter
  // Only includes activities from the current month
  getVolunteersByHeadquarter: async () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1-12 (1 = January, 12 = December)
    
    // First day of current month at 00:00:00
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1, 0, 0, 0, 0);
    
    // First day of next month at 00:00:00 (exclusive, so it's the end of current month)
    const firstDayOfNextMonth = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
    
    // Get all headquarters
    const headquarters = await prisma.headquarter.findMany({
      where: { status: 'active' },
      select: {
        idHeadquarter: true,
        name: true
      }
    });
    
    // Get activities with volunteers in the current month, grouped by headquarter
    // Only include activities with active status and active volunteers
    const activitiesWithVolunteers = await prisma.activity.findMany({
      where: {
        status: 'active',
        date: {
          gte: firstDayOfMonth,
          lt: firstDayOfNextMonth
        },
        activityVolunteer: {
          some: {
            volunteer: {
              status: 'active'
            }
          }
        }
      },
      select: {
        idHeadquarter: true,
        activityVolunteer: {
          where: {
            volunteer: {
              status: 'active'
            }
          },
          select: {
            volunteer: {
              select: {
                idVolunteer: true,
                requiredHours: true,
                status: true
              }
            }
          }
        },
        headquarter: {
          select: {
            name: true
          }
        }
      }
    });
    
    // Group by headquarter
    const headquarterStats = {};
    
    // Initialize all headquarters with 0
    headquarters.forEach(hq => {
      headquarterStats[hq.idHeadquarter] = {
        headquarter: hq.name,
        activeVolunteers: new Set(),
        estimatedHours: 0
      };
    });
    
    // Process activities and count volunteers per headquarter
    activitiesWithVolunteers.forEach(activity => {
      const hqId = activity.idHeadquarter;
      if (!headquarterStats[hqId]) {
        headquarterStats[hqId] = {
          headquarter: activity.headquarter.name,
          activeVolunteers: new Set(),
          estimatedHours: 0
        };
      }
      
      activity.activityVolunteer.forEach(av => {
        const volunteer = av.volunteer;
        if (volunteer.status === 'active') {
          headquarterStats[hqId].activeVolunteers.add(volunteer.idVolunteer);
          // Add estimated hours (use requiredHours if available, otherwise default to 0)
          headquarterStats[hqId].estimatedHours += volunteer.requiredHours || 0;
        }
      });
    });
    
    // Convert to array format
    return Object.values(headquarterStats).map(stat => ({
      headquarter: stat.headquarter,
      activeVolunteers: stat.activeVolunteers.size,
      estimatedHours: stat.estimatedHours
    }));
  },

  // Obtain users by role and headquarter for combined chart
  getUsersByRoleHeadquarter: async () => {
    const users = await prisma.user.findMany({
      include: {
        roles: {
          include: { role: true }
        },
        headquarterUser: {
          include: { headquarter: true }
        }
      }
    });

    const combinations = {};
    users.forEach(user => {
      user.roles.forEach(userRole => {
        user.headquarterUser.forEach(headquarterUser => {
          const key = `${userRole.role.rolName} - ${headquarterUser.headquarter.name}`;
          combinations[key] = (combinations[key] || 0) + 1;
        });
      });
    });

    return Object.entries(combinations).map(([key, count]) => ({
      combination: key,
      count: count
    }));
  },

  // Obtain new users by month (last 12 months) - based on SecurityLog CREATE action, not login
  getNewUsersMonthly: async () => {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    // Get all SecurityLogs where users were created (action=CREATE, affectedTable=User)
    const creationLogs = await prisma.securityLog.findMany({
      where: {
        action: 'CREATE',
        affectedTable: 'User',
        date: {
          gte: twelveMonthsAgo
        }
      },
      select: {
        date: true
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Group by month (YYYY-MM format)
    const monthlyData = {};
    creationLogs.forEach(log => {
      const monthKey = log.date.toISOString().substring(0, 7); // YYYY-MM
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    });

    // Generate all months in the last 12 months with 0 count if no users
    const result = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = monthDate.toISOString().substring(0, 7);
      result.push({
        month: monthKey,
        count: monthlyData[monthKey] || 0
      });
    }

    return result;
  },

  // Obtain the most registered actions in SecurityLog
  getTopActions: async () => {
    const topActions = await prisma.securityLog.groupBy({
      by: ['action'],
      _count: { securityIdLog: true },
      orderBy: { _count: { securityIdLog: 'desc' } },
      take: 5
    });

    return topActions.map(item => ({
      action: item.action,
      count: item._count.securityIdLog
    }));
  },

  // Obtain incidents by affected table
  getIncidentsByTable: async () => {
    const incidentsByTable = await prisma.securityLog.groupBy({
      by: ['affectedTable'],
      _count: { securityIdLog: true },
      orderBy: { _count: { securityIdLog: 'desc' } }
    });

    return incidentsByTable.map(item => ({
      table: item.affectedTable,
      count: item._count.securityIdLog
    }));
  },

  // Test endpoint to verify the database connection
  testConnection: async () => {
    const userCount = await prisma.user.count();
    const roleCount = await prisma.role.count();
    
    return {
      message: 'Conexión a base de datos exitosa',
      userCount,
      roleCount,
      timestamp: new Date().toISOString()
    };
  }
};

module.exports = { StatsRepository };
