import prisma from '../../prisma/client';

const baseSelect = {
  email: true,
  name: true,
  status: true,
  // si luego quieres relaciones, agrega aquí: roles: true, 
};

export const UsersRepository = {
  list: () =>
    prisma.user.findMany({ select: baseSelect }),

  findByEmail: (email: string) =>
    prisma.user.findUnique({ where: { email }, select: baseSelect }),

  create: (data: { email: string; name: string; password: string; status?: string }) =>
    prisma.user.create({ data, select: baseSelect }),

  update: (email: string, data: Partial<{ name: string; status: string; password: string }>) =>
    prisma.user.update({ where: { email }, data, select: baseSelect }),

  // para cambios sensibles (password) si prefieres no usar baseSelect:
  updatePassword: (email: string, hashedPassword: string) =>
    prisma.user.update({ where: { email }, data: { password: hashedPassword }, select: baseSelect }),

  remove: (email: string) =>
    prisma.user.delete({ where: { email }, select: baseSelect }),
};
