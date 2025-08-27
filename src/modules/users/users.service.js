const bcrypt = require('bcrypt');
const { UsersRepository } = require('./users.repository');
const { jwt } = require('jsonwebtoken');


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

  login: async (email, password) => {
    if (!email || !password) throw ApiError.badRequest('email y password requeridos');

    const user = await UsersRepository.findAuthByEmail(email);
    if (!user) throw ApiError.unauthorized('Credenciales inválidas');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw ApiError.unauthorized('Credenciales inválidas');

    // devolver sin hash
    const { name, status } = user;
    return { email: user.email, name, status };
  },



};

module.exports = { UsersService };
