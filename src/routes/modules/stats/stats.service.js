const { StatsRepository } = require('./stats.repository');

const StatsService = {
  // Obtiene logs de seguridad
  getSecurityLogs: async (filters = {}) => {
    return StatsRepository.getSecurityLogs(filters);
  },

  // Obtiene estadísticas de usuarios
  getUserStats: async () => {
    const [basicStats, usersByRole, usersBySede, newUsersThisMonth, topUsersByAccess, lastAccessByUser] = await Promise.all([
      StatsRepository.getUserStats(),
      StatsRepository.getUsersByRole(),
      StatsRepository.getUsersBySede(),
      StatsRepository.getNewUsersThisMonth(),
      StatsRepository.getTopUsersByAccess(),
      StatsRepository.getLastAccessByUser()
    ]);

    return {
      ...basicStats,
      newUsersThisMonth,
      usersByRole,
      usersBySede,
      topUsersByAccess,
      lastAccessByUser
    };
  },

  // Obtiene estadísticas generales del sistema
  getGeneralStats: async () => {
    const [systemStats, securityStats, activityStats] = await Promise.all([
      StatsRepository.getSystemStats(),
      StatsRepository.getSecurityStats(),
      StatsRepository.getActivityStats()
    ]);

    return {
      systemStats,
      securityStats,
      activityStats
    };
  },

  // Obtiene usuarios por rol y sede para gráfico combinado
  getUsersByRoleSede: async () => {
    return StatsRepository.getUsersByRoleSede();
  },

  // Obtiene nuevos usuarios por mes (últimos 12 meses)
  getNewUsersMonthly: async () => {
    return StatsRepository.getNewUsersMonthly();
  },

  // Obtiene las acciones más registradas en SecurityLog
  getTopActions: async () => {
    return StatsRepository.getTopActions();
  },

  // Obtiene incidencias por tabla afectada
  getIncidentsByTable: async () => {
    return StatsRepository.getIncidentsByTable();
  },

  // Endpoint de prueba para verificar la conexión a la base de datos
  testConnection: async () => {
    return StatsRepository.testConnection();
  }
};

module.exports = { StatsService };
