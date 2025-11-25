const prisma = require('../lib/prisma.js');

const SecurityLogService = {
  log: async ({ email, action, description, affectedTable }) => {
    // Adjust timezone: subtract 6 hours to convert from UTC to UTC-6 (Costa Rica timezone)
    const now = new Date();
    const adjustedDate = new Date(now.getTime() - (6 * 60 * 60 * 1000));
    
    return prisma.securityLog.create({
      data: {
        email,
        date: adjustedDate, 
        action,
        description,
        affectedTable,
      },
    });
  },
};

module.exports = { SecurityLogService };
