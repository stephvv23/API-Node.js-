// NOTE: This imports Prisma client from lib/prisma.js (not from ../../prisma/client or .ts)
const prisma = require('../../../lib/prisma.js'); 

// Fields to select for user queries (email, name, status)
const baseSelect = { email: true, name: true, status: true };

// UsersRepository provides direct database operations for User entities.
const UsersRepository = {
  // Returns all users with selected fields
  list: () => prisma.user.findMany({ select: baseSelect }),

  // Finds a user by email (primary key)
  findByEmailWithHeadquarters: (email) =>
  prisma.user.findUnique({
    where: { email },
    include: {
      headquarterUser: {
        include: {
          headquarter: true
        }
      }
    }
  }),
  findAuthWithRoles: (email) => prisma.user.findUnique({where: { email },select: {email: true,name: true,status: true,password: true,roles: {  include: {role: {select: {idRole: true,rolName: true,status: true,windows: { include: { window: true },},},},},},},}),


  create: (data) => prisma.user.create({ data, select: baseSelect }),
  createHeadquarterRelation: (email, idHeadquarter) => prisma.headquarterUser.create({data: {email,idHeadquarter,},}),
  clearHeadquarters: (email) =>prisma.headquarterUser.deleteMany({ where: { email } }),
  
  createLoginAccess: (email, clientDate) => prisma.loginAccess.create({data: {email,date: clientDate ? new Date(clientDate) : new Date() },}),

  // Updates user data by email
  update: (email, data) => prisma.user.update({ where: { email }, data, select: baseSelect }),

  assignHeadquarters: (email, ids) => prisma.headquarterUser.createMany({data: ids.map((id) => ({ email, idHeadquarter: id })),skipDuplicates: true}),

  update: (email, data) =>
  prisma.user.update({ where: { email }, data, select: baseSelect }),

  // Updates only the user's password (expects hashed password)
  updatePassword: (email, hashedPassword) =>
    prisma.user.update({ where: { email }, data: { password: hashedPassword }, select: baseSelect }),

  // Deletes a user by email
  remove: (email) => prisma.user.delete({ where: { email }, select: baseSelect }),

};

module.exports = { UsersRepository };
