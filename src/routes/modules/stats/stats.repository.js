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

  // Obtain users by campus
  getUsersBySede: async () => {
    const usersBySedeRaw = await prisma.headquarterUser.groupBy({
      by: ['idHeadquarter'],
      _count: { email: true }
    });
    
    const headquarterIds = usersBySedeRaw.map(item => item.idHeadquarter);
    const headquarters = await prisma.headquarter.findMany({
      where: { idHeadquarter: { in: headquarterIds } },
      select: { idHeadquarter: true, name: true }
    });
    
    return usersBySedeRaw.map(item => {
      const headquarter = headquarters.find(h => h.idHeadquarter === item.idHeadquarter);
      return {
        sede: headquarter ? headquarter.name : 'Unknown',
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

  // Obtain users by role and campus for combined chart
  getUsersByRoleSede: async () => {
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
