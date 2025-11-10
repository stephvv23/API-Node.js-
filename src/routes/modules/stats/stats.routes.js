const { StatsController } = require('./stats.controller');
const { authenticate, authorizeWindow } = require('../../../middlewares/auth.middleware');

module.exports = [
  { method: 'GET', path: '/api/security-logs', handler: authenticate(authorizeWindow('Reportes','read')(StatsController.getSecurityLogs)) },
  { method: 'GET', path: '/api/users/stats', handler: authenticate(authorizeWindow('Reportes','read')(StatsController.getUsersStats)) },
  { method: 'GET', path: '/api/stats/general', handler: authenticate(authorizeWindow('Reportes','read')(StatsController.getGeneralStats)) },
  { method: 'GET', path: '/api/stats/users-by-role-headquarter', handler: authenticate(authorizeWindow('Reportes','read')(StatsController.getUsersByRoleHeadquarter)) },
  { method: 'GET', path: '/api/stats/new-users-monthly', handler: authenticate(authorizeWindow('Reportes','read')(StatsController.getNewUsersMonthly)) },
  { method: 'GET', path: '/api/stats/top-actions', handler: authenticate(authorizeWindow('Reportes','read')(StatsController.getTopActions)) },
  { method: 'GET', path: '/api/stats/incidents-by-table', handler: authenticate(authorizeWindow('Reportes','read')(StatsController.getIncidentsByTable)) },
  { method: 'GET', path: '/api/stats/active-volunteers', handler: authenticate(authorizeWindow('Reportes','read')(StatsController.getActiveVolunteers)) },
  { method: 'GET', path: '/api/stats/volunteers-by-headquarter', handler: authenticate(authorizeWindow('Reportes','read')(StatsController.getVolunteersByHeadquarter)) },
  { method: 'GET', path: '/api/stats/test', handler: authenticate(authorizeWindow('Reportes','read')(StatsController.testConnection)) }
];
