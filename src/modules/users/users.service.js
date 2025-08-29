const bcrypt = require('bcrypt');
const { UsersRepository } = require('./users.repository');
const jwt  = require('jsonwebtoken');
const ApiError = require('../../utils/ApiError');


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

  login: async (email, password, windowName) => {
  if (!email || !password) throw ApiError.badRequest('email y password requeridos');

  const user = await UsersRepository.findAuthWithRoles(email);
  if (!user) throw ApiError.unauthorized('Credenciales inválidas');

  // Verificar contraseña
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw ApiError.unauthorized('Credenciales inválidas');

  // 1. Validar que tenga rol
  if (!user.roles || user.roles.length === 0) {
    throw ApiError.forbidden('El usuario no tiene roles asignados');
  }

  // 2. Filtrar roles activos
  const activeRoles = user.roles.filter(ur => ur.role.status === 'active');
  if (activeRoles.length === 0) {
    throw ApiError.forbidden('El rol del usuario está inactivo');
  }

  // 3. Verificar acceso a la ventana
  let hasAccess = false;
  for (const ur of activeRoles) {
    for (const rw of ur.role.windows) {
      if (
        rw.window.windowName === windowName &&
        rw.window.status === 'active' &&
        rw.read === 1
      ) {
        hasAccess = true;
        break;
      }
    }
  }

  if (!hasAccess) {
    throw ApiError.forbidden('El usuario no tiene permisos de lectura o la página está inactiva');
  }

  // devolver sin hash
  const { name, status } = user;
  return { email: user.email, name, status };
},



};

module.exports = { UsersService };
