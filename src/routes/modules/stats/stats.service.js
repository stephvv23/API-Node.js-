const { StatsRepository } = require('./stats.repository');

const StatsService = {
  // Obtain security logs
  getSecurityLogs: async (filters = {}) => {
    return StatsRepository.getSecurityLogs(filters);
  },

  // Obtain user statistics
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

  // Obtain general system statistics
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

  // Obtain users by role and campus for combined chart
  getUsersByRoleSede: async () => {
    return StatsRepository.getUsersByRoleSede();
  },

  // Obtain new users by month (last 12 months)
  getNewUsersMonthly: async () => {
    return StatsRepository.getNewUsersMonthly();
  },

  // Obtain the most registered actions in SecurityLog
  getTopActions: async () => {
    return StatsRepository.getTopActions();
  },

  // Obtain incidents by affected table
  getIncidentsByTable: async () => {
    return StatsRepository.getIncidentsByTable();
  },

  // Test endpoint to verify the database connection
  testConnection: async () => {
    return StatsRepository.testConnection();
  }
};

module.exports = { StatsService };
