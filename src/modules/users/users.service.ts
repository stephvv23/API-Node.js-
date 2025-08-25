import bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';

export const UsersService = {
  list: () => UsersRepository.list(),

  get: (email: string) => UsersRepository.findByEmail(email),

  create: async (data: { email: string; name: string; password: string; status?: string }) => {
    const hashed = await bcrypt.hash(data.password, 10);
    return UsersRepository.create({ ...data, password: hashed });
  },

  update: async (email: string, data: Partial<{ name: string; status: string; password: string }>) => {
    if (data.password) {
      const hashed = await bcrypt.hash(data.password, 10);
      return UsersRepository.updatePassword(email, hashed);
    }
    return UsersRepository.update(email, data);
  },

  updateStatus: (email: string, status: string) =>
    UsersRepository.update(email, { status }),

  updatePassword: async (email: string, password: string) => {
    const hashed = await bcrypt.hash(password, 10);
    return UsersRepository.updatePassword(email, hashed);
  },

  delete: (email: string) => UsersRepository.remove(email),
};
