const bcrypt = require('bcrypt');
const { UsersRepository } = require('./users.repository');

const UsersService = {
  list: () => UsersRepository.list(),

  get: (email) => UsersRepository.findByEmail(email),

  create: async (data) => {
    const hashed = await bcrypt.hash(data.password, 10);
    return UsersRepository.create({ ...data, password: hashed });
  },

  update: async (email, data) => {
    if (data.password) {
      const hashed = await bcrypt.hash(data.password, 10);
      return UsersRepository.updatePassword(email, hashed);
    }
    return UsersRepository.update(email, data);
  },

  updateStatus: (email, status) =>
    UsersRepository.update(email, { status }),

  updatePassword: async (email, password) => {
    const hashed = await bcrypt.hash(password, 10);
    return UsersRepository.updatePassword(email, hashed);
  },

  delete: (email) => UsersRepository.remove(email),
};

module.exports = { UsersService };
