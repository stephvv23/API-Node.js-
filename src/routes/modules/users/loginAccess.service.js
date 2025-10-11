const prisma = require('../../../lib/prisma.js');
// Service to log user login access events because the user can login but not have access to any window
const LoginAccessService  = {
  log: async ({ email}) => {
    return prisma.loginAccess.create({
      data: {
        email,
        date: new Date()
      },
    });
  },
};

module.exports = { LoginAccessService  }; //important this is a variable that travels, if change name the variable, change the name in the line 3 and users.controller.js in the line 4 and 183
