const bcrypt = require('bcrypt');
const { UsersRepository } = require('./users.repository');
const jwt  = require('jsonwebtoken');


// UsersService contains business logic for user operations.
// It interacts with UsersRepository for database actions and handles password hashing.
const UsersService = {
  // Returns a list of all users
  list: () => UsersRepository.list(),

  // Retrieves a user by email
  get: (email) => UsersRepository.findByEmail(email),

  // Creates a new user, hashes the password before saving
  create: async (data) => {
    const hashed = await bcrypt.hash(data.password, 10);
    return UsersRepository.create({ ...data, password: hashed });
  },

  // Updates user data by email; hashes password if provided
  update: async (email, data) => {
    if (data.password) {
      const hashed = await bcrypt.hash(data.password, 10);
      return UsersRepository.updatePassword(email, hashed);
    }
    return UsersRepository.update(email, data);
  },

  // Updates only the user's status
  updateStatus: (email, status) =>
    UsersRepository.update(email, { status }),

  // Updates only the user's password, hashes before saving
  updatePassword: async (email, password) => {
    const hashed = await bcrypt.hash(password, 10);
    return UsersRepository.updatePassword(email, hashed);
  },

  // Deletes a user by email
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
