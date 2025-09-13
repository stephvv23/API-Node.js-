const prisma = require('../../../lib/prisma.js');
// create security log entry
const SecurityLogService = {
  log: async ({ email, action, description, affectedTable }) => {
    return prisma.securityLog.create({
      data: {
        email,
        date: new Date(),
        action,
        description,
        affectedTable,
      },
    });
  }
};

module.exports = { SecurityLogService };