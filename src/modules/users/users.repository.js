// OJO: apunta a lib/prisma.js (no a ../../prisma/client, ni a .ts)
const prisma = require('../../lib/prisma.js'); 

const baseSelect = { email: true, name: true, status: true };

const UsersRepository = {
  list: () => prisma.user.findMany({ select: baseSelect }),
  findByEmail: (email) => prisma.user.findUnique({ where: { email }, select: baseSelect }),
  findAuthByEmail: (email) =>prisma.user.findUnique({where: { email },select: { email: true, name: true, status: true, password: true },}),
  create: (data) => prisma.user.create({ data, select: baseSelect }),
  update: (email, data) => prisma.user.update({ where: { email }, data, select: baseSelect }),
  updatePassword: (email, hashedPassword) =>
    prisma.user.update({ where: { email }, data: { password: hashedPassword }, select: baseSelect }),
  remove: (email) => prisma.user.delete({ where: { email }, select: baseSelect }),
};

module.exports = { UsersRepository };
