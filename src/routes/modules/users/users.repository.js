// NOTE: This imports Prisma client from lib/prisma.js (not from ../../prisma/client or .ts)
const prisma = require('../../../lib/prisma.js'); 
// Fields to select for user queries (email, name, status)
const baseSelect = { email: true, name: true, status: true };

// UsersRepository provides direct database operations for User entities.
const UsersRepository = {
  
  // Returns all users with selected fields
  list: () => prisma.user.findMany({ select: baseSelect }),
  // Returns all users with their roles and headquarters
  // Using separate queries to avoid Prisma bug with nested relations
  findAll: async () => {
    // First, get all users (basic fields only)
    const users = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        status: true
      }
    });

    // Then, get all roles for all users in one query
    const allUserRoles = await prisma.userRole.findMany({
      where: {
        email: {
          in: users.map(u => u.email)
        }
      },
      include: {
        role: {
          select: {
            idRole: true,
            rolName: true
          }
        }
      }
    });

    // Get all headquarters for all users in one query
    const allUserHeadquarters = await prisma.headquarterUser.findMany({
      where: {
        email: {
          in: users.map(u => u.email)
        }
      },
      include: {
        headquarter: {
          select: {
            idHeadquarter: true,
            name: true
          }
        }
      }
    });

    // Group roles and headquarters by user email
    const rolesByEmail = {};
    allUserRoles.forEach(ur => {
      if (!rolesByEmail[ur.email]) {
        rolesByEmail[ur.email] = [];
      }
      rolesByEmail[ur.email].push({
        idRole: ur.role.idRole,
        role: {
          idRole: ur.role.idRole,
          rolName: ur.role.rolName
        }
      });
    });

    const headquartersByEmail = {};
    allUserHeadquarters.forEach(hu => {
      if (!headquartersByEmail[hu.email]) {
        headquartersByEmail[hu.email] = [];
      }
      headquartersByEmail[hu.email].push({
        idHeadquarter: hu.headquarter.idHeadquarter,
        headquarter: {
          idHeadquarter: hu.headquarter.idHeadquarter,
          name: hu.headquarter.name
        }
      });
    });

    // Combine everything and sort
    return users
      .map(user => ({
        email: user.email,
        name: user.name,
        status: user.status,
        roles: rolesByEmail[user.email] || [],
        headquarterUser: headquartersByEmail[user.email] || []
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  create: (data) => prisma.user.create({ data, select: baseSelect }),
  
  // Updates user data by email
  update: (email, data) => prisma.user.update({ where: { email }, data, select: baseSelect }),

  // Updates only the user's password (expects hashed password)
  updatePassword: (email, hashedPassword) => prisma.user.update({ where: { email }, data: { password: hashedPassword }, select: baseSelect }),

  // Deletes a user by email
  remove: (email) => prisma.user.delete({ where: { email }, select: baseSelect }),

  // returns headquarters related to user by using email
  getuserHeadquartersByEmail: (email) => prisma.headquarterUser.findMany({ where: { email }, include: { headquarter: true }, }),

  //relational tables with user. (headquarters and roles)

  createHeadquarterRelation: (email, idHeadquarter) => prisma.headquarterUser.create({data: {email,idHeadquarter,},}),

  clearHeadquarters: (email) => prisma.headquarterUser.deleteMany({ where: { email } }),

  assignHeadquarters: (email, ids) => prisma.headquarterUser.createMany({ data: ids.map((id) => ({ email, idHeadquarter: id })), skipDuplicates: true}),

  clearRoles: (email) => prisma.userRole.deleteMany({ where: { email } }),

  assignRoles: (email, ids) => prisma.userRole.createMany({data: ids.map((id) => ({ email, idRole: id })),skipDuplicates: true}),

  // Finds a user by email (primary key) with relations
  findByEmailWithHeadquarters: (email) => prisma.user.findUnique({ 
    where: { email },
    include: {
      headquarterUser: { 
        include: {
          headquarter: true
        }
      },
      roles: { 
        include: {
          role: true
        }
      }
    }
  }),
  // Login roles and permissions for the window - only includes active roles
  findAuthWithRoles: (email) =>prisma.user.findUnique({
    where: { email }, 
    select: {
      email: true, 
      name: true, 
      status: true, 
      password: true, 
      roles: {
        where: {
          role: {
            status: 'active' // Only include active roles
          }
        },
        include: {
          role: {
            select: {
              idRole: true,
              rolName: true,
              status: true,
              windows: { 
                where: {
                  window: {
                    status: 'active' // Only include active windows
                  }
                },
                include: { 
                  window: true 
                }
              }
            }
          }
        }
      }
    }
  }),
  
  // verify that a headquarter exists and is active
  verifyHeadquarterExists: (idHeadquarter) => prisma.headquarter.findFirst({
    where: { 
      idHeadquarter: parseInt(idHeadquarter),
      status: 'active'
    },
    select: { idHeadquarter: true }
  }),

  // check if headquarter exists (regardless of status)
  checkHeadquarterExists: (idHeadquarter) => prisma.headquarter.findFirst({
    where: { 
      idHeadquarter: parseInt(idHeadquarter)
    },
    select: { idHeadquarter: true, status: true }
  }),

  // verify that a role exists and is active
  verifyRoleExists: (idRole) => prisma.role.findFirst({
    where: { 
      idRole: parseInt(idRole),
      status: 'active'
    },
    select: { idRole: true }
  }),

  // check if role exists (regardless of status)
  checkRoleExists: (idRole) => prisma.role.findFirst({
    where: { 
      idRole: parseInt(idRole)
    },
    select: { idRole: true, status: true }
  }),

  // check if window exists (regardless of status)
  checkWindowExists: (windowName) => prisma.window.findFirst({
    where: { 
      windowName: windowName
    },
    select: { idWindow: true, windowName: true, status: true }
  }),

  invalidateToken: async (token) => {
    return prisma.tokenBlacklist.create({
      data: { token },
    });
  },

  // Count active users with admin role (ID: 1), optionally excluding a specific user
  countActiveAdmins: async (excludeEmail = null) => {
    const where = {
      status: 'active',
      roles: {
        some: {
          idRole: 1 // Admin role ID
        }
      }
    };
    
    if (excludeEmail) {
      where.email = { not: excludeEmail };
    }
    
    return prisma.user.count({ where });
  },

  // Check if a user has the admin role (ID: 1)
  userHasAdminRole: async (email) => {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        roles: {
          where: {
            idRole: 1 // Admin role ID
          },
          select: {
            idRole: true
          }
        }
      }
    });
    
    return user && user.roles && user.roles.length > 0;
  },
  
};

module.exports = { UsersRepository };
