const { StatsService } = require('./stats.service');

const StatsController = {
  // Obtiene logs de seguridad para estadísticas de acciones e incidencias
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

  // Obtiene estadísticas de usuarios
  getUsersStats: async (req, res) => {
    try {
      const userStats = await StatsService.getUserStats();
      return res.success(userStats);
    } catch (error) {
      console.error('[STATS] getUsersStats error:', error);
      return res.error('Error al obtener las estadísticas de usuarios');
    }
  },

  // Obtiene estadísticas generales del sistema
  getGeneralStats: async (req, res) => {
    try {
      const generalStats = await StatsService.getGeneralStats();
      return res.success(generalStats);
    } catch (error) {
      console.error('[STATS] getGeneralStats error:', error);
      return res.error('Error al obtener las estadísticas generales');
    }
  },

  // Obtiene usuarios activos por rol y sede para gráfico combinado
  getUsersByRoleSede: async (req, res) => {
    try {
      const chartData = await StatsService.getUsersByRoleSede();
      return res.success(chartData);
    } catch (error) {
      console.error('[STATS] getUsersByRoleSede error:', error);
      return res.error('Error al obtener usuarios por rol y sede');
    }
  },

  // Obtiene nuevos usuarios por mes (últimos 12 meses)
  getNewUsersMonthly: async (req, res) => {
    try {
      const chartData = await StatsService.getNewUsersMonthly();
      return res.success(chartData);
    } catch (error) {
      console.error('[STATS] getNewUsersMonthly error:', error);
      return res.error('Error al obtener nuevos usuarios mensuales');
    }
  },

  // Obtiene las acciones más registradas en SecurityLog
  getTopActions: async (req, res) => {
    try {
      const chartData = await StatsService.getTopActions();
      return res.success(chartData);
    } catch (error) {
      console.error('[STATS] getTopActions error:', error);
      return res.error('Error al obtener las acciones más comunes');
    }
  },

  // Obtiene incidencias por tabla afectada
  getIncidentsByTable: async (req, res) => {
    try {
      const chartData = await StatsService.getIncidentsByTable();
      return res.success(chartData);
    } catch (error) {
      console.error('[STATS] getIncidentsByTable error:', error);
      return res.error('Error al obtener incidencias por tabla');
    }
  },

  // Endpoint de prueba para verificar la conexión a la base de datos
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
