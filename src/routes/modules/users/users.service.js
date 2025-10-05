const bcrypt = require('bcrypt');
const { UsersRepository } = require('./users.repository');
const jwt  = require('jsonwebtoken');
const ApiError = require('../../../utils/apiError');

/**
 * validate the format of an email
 * @param {string} email - The email to validate
 * @returns {boolean} - true if the format is valid, false if not
 */
const isValidEmail = (email) => {
  // Regex to validate email format: usuario@dominio.extension
  // Allows any extension after the dot (com, org, lo, etc.)
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * validate the format of a password
 * @param {string} password - The password to validate
 * @returns {boolean} - true if the format is valid, false if not
 */
const isValidPassword = (password) => {
  // The password must have at least 6 characters
  return password && password.length >= 6;
};

// UsersService contains business logic for user operations.
// It interacts with UsersRepository for database actions and handles password hashing.
const UsersService = {
  // Returns a list of all users
  list: () => UsersRepository.findAll(),

  // Retrieves a user by email
  get: async (email) => {
    return UsersRepository.findByEmailWithHeadquarters(email);
  },

  // Creates a new user, hashes the password before saving and the relation with roles and headquarts
  create: async (data) => {
    // validate the fields
    
    // validate the email
    if (!data.email) {
      throw ApiError.badRequest('El email es obligatorio');
    }
    if (!isValidEmail(data.email)) {
      throw ApiError.badRequest('El formato del email no es válido. Debe seguir el formato: usuario@dominio.extension');
    }
    
    // validate the name
    if (!data.name) {
      throw ApiError.badRequest('El nombre es obligatorio');
    }
    if (data.name.trim().length === 0) {
      throw ApiError.badRequest('El nombre no puede estar vacío');
    }
    
    // validate the password
    if (!data.password) {
      throw ApiError.badRequest('La contraseña es obligatoria');
    }
    if (!isValidPassword(data.password)) {
      throw ApiError.badRequest('La contraseña debe tener al menos 6 caracteres');
    }

    // validate that at least one headquarter is provided
    if (!data.idHeadquarter) {
      throw ApiError.badRequest('El usuario debe tener al menos una sede asignada');
    }

    // validate that at least one role is provided
    if (!data.idRole) {
      throw ApiError.badRequest('El usuario debe tener al menos un rol asignado');
    }

    // verify that the headquarter exists and is active
    const headquarterExists = await UsersRepository.verifyHeadquarterExists(data.idHeadquarter);
    if (!headquarterExists) {
      throw ApiError.badRequest(`La sede con ID ${data.idHeadquarter} no existe o está inactiva`);
    }

    // verify that the role exists and is active
    const roleExists = await UsersRepository.verifyRoleExists(data.idRole);
    if (!roleExists) {
      throw ApiError.badRequest(`El rol con ID ${data.idRole} no existe o está inactivo`);
    }

    const hashed = await bcrypt.hash(data.password, 10);

    const user = await UsersRepository.create({ 
      email: data.email,
      name: data.name.trim(),
      password: hashed,
      status: data.status || "active"
    });

    // creation the relation tables
    if (data.idHeadquarter) {
      await UsersRepository.createHeadquarterRelation(
        user.email,
        parseInt(data.idHeadquarter)
      );
    }
    // the method assign await a array. beacause the []
    if (data.idRole) {
      await UsersRepository.assignRoles(
      user.email,
        [parseInt(data.idRole)]   
      );
    }
    return user;
  },

  // Updates user data by email; hashes password if provided
  update: async (email, data) => {
    const updateData = {};

    if (data.password) {
      const hashed = await bcrypt.hash(data.password, 10);
      updateData.password = hashed;
    }

    if (data.name) updateData.name = data.name;
    if (data.status) updateData.status = data.status;

    if (Object.keys(updateData).length > 0) {
      await UsersRepository.update(email, updateData);
    }

    // validate the headquarters if they are provided
    if (Array.isArray(data.sedes)) {
      // verify that all the headquarters exist and are active
      for (const sedeId of data.sedes) {
        const headquarterExists = await UsersRepository.verifyHeadquarterExists(sedeId);
        if (!headquarterExists) {
          throw ApiError.badRequest(`La sede con ID ${sedeId} no existe o está inactiva`);
        }
      }
      
      await UsersRepository.clearHeadquarters(email);
      if (data.sedes.length > 0) {
        await UsersRepository.assignHeadquarters(email, data.sedes);
      }
    }

    // validate the roles if they are provided
    if (Array.isArray(data.roles)) {
      // verify that all the roles exist and are active
      for (const roleId of data.roles) {
        const roleExists = await UsersRepository.verifyRoleExists(roleId);
        if (!roleExists) {
          throw ApiError.badRequest(`El rol con ID ${roleId} no existe o está inactivo`);
        }
      }
      
      await UsersRepository.clearRoles(email);
      if (data.roles.length > 0) {
        await UsersRepository.assignRoles(email, data.roles);
      }
    }

    return UsersRepository.findByEmailWithHeadquarters(email);
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

  login: async (email, password, windowName, clientDate) => {
    if (!email || !password) throw ApiError.badRequest('email y password requeridos');
    // Find user by email
    const user = await UsersRepository.findAuthWithRoles(email);
    if (!user) throw ApiError.unauthorized('Credenciales inválidas');

    if (user.status !== 'active') {
      throw ApiError.forbidden('El usuario está inactivo, contacte al administrador');
    }

    // verify password
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw ApiError.unauthorized('Credenciales inválidas');

    // verify rol
    if (!user.roles || user.roles.length === 0) {
      throw ApiError.forbidden('El usuario no tiene roles asignados');
    }

    // filters the roles actives
    const activeRoles = user.roles.filter(ur => ur.role.status === 'active');
    if (activeRoles.length === 0) {
      throw ApiError.forbidden('El rol del usuario está inactivo');
    }

    // verify permissions to the window
    let hasAccess = false;
    for (const ur of activeRoles) {
      for (const rw of ur.role.windows) {   
        if (
          rw.window.windowName === windowName &&
          rw.window.status === 'active' &&
          rw.read === true   
        ) {
          hasAccess = true;
          break;
        }
      }
    }

    if (!hasAccess) {
      throw ApiError.forbidden('El usuario no tiene permisos de lectura o la página está inactiva');
    }
    //return data
    const { name, status, roles } = user;
    return { email: user.email, name, status, roles };

  },

  getWithHeadquarters: (email) => UsersRepository.findByEmailWithHeadquarters(email),

};

module.exports = { UsersService };
