const prisma = require('../../../lib/prisma.js');

const StatsRepository = {
  // Obtiene logs de seguridad
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

  // Obtiene estadísticas de usuarios
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

  // Obtiene usuarios por rol
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

  // Obtiene usuarios por sede
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

  // Obtiene nuevos usuarios este mes
  getNewUsersThisMonth: async () => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    return prisma.user.count({
      where: {
        loginAccess: {
          some: {
            date: { gte: startOfMonth }
          }
        }
      }
    });
  },

  // Obtiene top usuarios por accesos
  getTopUsersByAccess: async () => {
    const topUsersByAccessRaw = await prisma.loginAccess.groupBy({
      by: ['email'],
      _count: { loginIdAccess: true },
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
        accessCount: item._count.loginIdAccess
      };
    });
  },

  // Obtiene último acceso por usuario
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

  // Obtiene estadísticas generales del sistema
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

  // Obtiene estadísticas de seguridad
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

  // Obtiene estadísticas de actividad (últimos 30 días)
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

  // Obtiene usuarios por rol y sede para gráfico combinado
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

  // Obtiene nuevos usuarios por mes (últimos 12 meses)
  getNewUsersMonthly: async () => {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyUsers = await prisma.loginAccess.groupBy({
      by: ['date'],
      _count: { email: true },
      where: {
        date: {
          gte: twelveMonthsAgo
        }
      },
      orderBy: { date: 'asc' }
    });

    const monthlyData = {};
    monthlyUsers.forEach(item => {
      const monthKey = item.date.toISOString().substring(0, 7); // YYYY-MM
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + item._count.email;
    });

    return Object.entries(monthlyData).map(([month, count]) => ({
      month: month,
      count: count
    }));
  },

  // Obtiene las acciones más registradas en SecurityLog
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

  // Obtiene incidencias por tabla afectada
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

  // Endpoint de prueba para verificar la conexión a la base de datos
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
