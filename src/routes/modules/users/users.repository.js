// NOTE: This imports Prisma client from lib/prisma.js (not from ../../prisma/client or .ts)
const prisma = require('../../../lib/prisma.js'); 

// Fields to select for user queries (email, name, status)
const baseSelect = { email: true, name: true, status: true };

// UsersRepository provides direct database operations for User entities.
const UsersRepository = {
  // Returns all users with selected fields
  list: () => prisma.user.findMany({ select: baseSelect }),

  // Finds a user by email (primary key)
  findByEmail: (email) => prisma.user.findUnique({ where: { email }, select: baseSelect }),
  findAuthWithRoles: (email) => prisma.user.findUnique({where: { email },include: {roles: {include: {role: {include: {windows: {include: { window: true }}}}}}}}),
  create: (data) => prisma.user.create({ data, select: baseSelect }),

  // Updates user data by email
  update: (email, data) => prisma.user.update({ where: { email }, data, select: baseSelect }),

  // Updates only the user's password (expects hashed password)
  updatePassword: (email, hashedPassword) =>
    prisma.user.update({ where: { email }, data: { password: hashedPassword }, select: baseSelect }),

  // Deletes a user by email
  remove: (email) => prisma.user.delete({ where: { email }, select: baseSelect }),
  createLoginAccess: (email) =>prisma.loginAccess.create({data: { email },}),

};

module.exports = { UsersRepository };
