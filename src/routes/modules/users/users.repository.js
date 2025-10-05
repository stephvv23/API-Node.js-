// NOTE: This imports Prisma client from lib/prisma.js (not from ../../prisma/client or .ts)
const prisma = require('../../../lib/prisma.js'); 

// Fields to select for user queries (email, name, status)
const baseSelect = { email: true, name: true, status: true };

// UsersRepository provides direct database operations for User entities.
const UsersRepository = {
  
  // Returns all users with selected fields
  list: () => prisma.user.findMany({ select: baseSelect }),
  // Returns all users with their roles and headquarters
  findAll: () => prisma.user.findMany({
  select: {
    email: true,
    name: true,
    status: true,
    roles: {
      select: {role: {select: {idRole: true,rolName: true}}}},
    headquarterUser: {  
      select: {idHeadquarter: true, headquarter: {select: {idHeadquarter: true,name: true}}}}}}),

  create: (data) => prisma.user.create({ data, select: baseSelect }),
  
  // Updates user data by email
  update: (email, data) => prisma.user.update({ where: { email }, data, select: baseSelect }),

  // Updates only the user's password (expects hashed password)
  updatePassword: (email, hashedPassword) => prisma.user.update({ where: { email }, data: { password: hashedPassword }, select: baseSelect }),

  // Deletes a user by email
  remove: (email) => prisma.user.delete({ where: { email }, select: baseSelect }),

  //relational tables with user. (headquarters and roles)

  createHeadquarterRelation: (email, idHeadquarter) => prisma.headquarterUser.create({data: {email,idHeadquarter,},}),

  clearHeadquarters: (email) => prisma.headquarterUser.deleteMany({ where: { email } }),

  assignHeadquarters: (email, ids) => prisma.headquarterUser.createMany({ data: ids.map((id) => ({ email, idHeadquarter: id })), skipDuplicates: true}),

  clearRoles: (email) => prisma.userRole.deleteMany({ where: { email } }),

  assignRoles: (email, ids) => prisma.userRole.createMany({data: ids.map((id) => ({ email, idRole: id })),skipDuplicates: true}),

  // Finds a user by email (primary key)
  findByEmailWithHeadquarters: (email) => prisma.user.findUnique({where: { email },include: {headquarterUser: { select: { idHeadquarter: true, headquarter: true } },roles: { include: { role: true } }}}),
   
  // Login roles and permitions the window
  findAuthWithRoles: (email) =>prisma.user.findUnique({where: { email }, select: {email: true, name: true, status: true, password: true, roles: {include: {role: {select: {idRole: true,rolName: true,status: true,windows: { include: { window: true }}}}}}}}),
  
  // verify that a headquarter exists and is active
  verifyHeadquarterExists: (idHeadquarter) => prisma.headquarter.findFirst({
    where: { 
      idHeadquarter: parseInt(idHeadquarter),
      status: 'active'
    },
    select: { idHeadquarter: true }
  }),

  // verify that a role exists and is active
  verifyRoleExists: (idRole) => prisma.role.findFirst({
    where: { 
      idRole: parseInt(idRole),
      status: 'active'
    },
    select: { idRole: true }
  }),
  
};

module.exports = { UsersRepository };
