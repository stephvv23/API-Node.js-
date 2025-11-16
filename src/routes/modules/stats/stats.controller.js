const { StatsService } = require('./stats.service');

const StatsController = {
  // Obtain security logs
  getSecurityLogs: async (req, res) => {
    try {
      const { limit, offset, startDate, endDate, action, affectedTable } = req.query;
      const filters = { limit, offset, startDate, endDate, action, affectedTable };
      
      const securityLogs = await StatsService.getSecurityLogs(filters);
      return res.success(securityLogs);
    } catch (error) {
      console.error('[STATS] getSecurityLogs error:', error);
      return res.error('Error al obtener los logs de seguridad');
    }
  },

  // Obtain user statistics
  getUsersStats: async (req, res) => {
    try {
      const userStats = await StatsService.getUserStats();
      return res.success(userStats);
    } catch (error) {
      console.error('[STATS] getUsersStats error:', error);
      return res.error('Error al obtener las estadísticas de usuarios');
    }
  },

  // Obtain general system statistics
  getGeneralStats: async (req, res) => {
    try {
      const generalStats = await StatsService.getGeneralStats();
      return res.success(generalStats);
    } catch (error) {
      console.error('[STATS] getGeneralStats error:', error);
      return res.error('Error al obtener las estadísticas generales');
    }
  },

  // Obtain active users by role and headquarter for combined chart
  getUsersByRoleHeadquarter: async (req, res) => {
    try {
      const chartData = await StatsService.getUsersByRoleHeadquarter();
      return res.success(chartData);
    } catch (error) {
      console.error('[STATS] getUsersByRoleHeadquarter error:', error);
      return res.error('Error al obtener usuarios por rol y sede');
    }
  },

  // Obtain new users by month (last 12 months)
  getNewUsersMonthly: async (req, res) => {
    try {
      const chartData = await StatsService.getNewUsersMonthly();
      return res.success(chartData);
    } catch (error) {
      console.error('[STATS] getNewUsersMonthly error:', error);
      return res.error('Error al obtener nuevos usuarios mensuales');
    }
  },

  // Obtain the most registered actions in SecurityLog
  getTopActions: async (req, res) => {
    try {
      const chartData = await StatsService.getTopActions();
      return res.success(chartData);
    } catch (error) {
      console.error('[STATS] getTopActions error:', error);
      return res.error('Error al obtener las acciones más comunes');
    }
  },

  // Obtain incidents by affected table
  getIncidentsByTable: async (req, res) => {
    try {
      const chartData = await StatsService.getIncidentsByTable();
      return res.success(chartData);
    } catch (error) {
      console.error('[STATS] getIncidentsByTable error:', error);
      return res.error('Error al obtener incidencias por tabla');
    }
  },

  // Obtain active volunteers with recent participation (last 30 days)
  getActiveVolunteers: async (req, res) => {
    try {
      const count = await StatsService.getActiveVolunteers();
      return res.success({ activeVolunteers: count });
    } catch (error) {
      console.error('[STATS] getActiveVolunteers error:', error);
      return res.error('Error al obtener voluntarios activos');
    }
  },

  // Obtain volunteers by headquarter for the "Voluntariado por Sede" chart
  getVolunteersByHeadquarter: async (req, res) => {
    try {
      const chartData = await StatsService.getVolunteersByHeadquarter();
      return res.success(chartData);
    } catch (error) {
      console.error('[STATS] getVolunteersByHeadquarter error:', error);
      return res.error('Error al obtener voluntarios por sede');
    }
  },

  // Test endpoint to verify the database connection
  testConnection: async (req, res) => {
    try {
      const result = await StatsService.testConnection();
      return res.success(result);
    } catch (error) {
      console.error('[STATS] testConnection error:', error);
      return res.error('Error de conexión a la base de datos');
    }
  }
};

module.exports = { StatsController };
