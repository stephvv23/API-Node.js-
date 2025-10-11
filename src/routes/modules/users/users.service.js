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
 * validate the length of an email field
 * @param {string} email - The email to validate
 * @returns {boolean} - true if the length is valid, false if not
 */
const isValidEmailLength = (email) => {
  // Email must not exceed 254 characters (RFC 5321 standard)
  return email && email.length <= 254;
};

/**
 * validate the format of a password
 * @param {string} password - The password to validate
 * @returns {boolean} - true if the format is valid, false if not
 */
const isValidPassword = (password) => {
  // The password must have at least 6 characters and maximum 200 characters
  return password && password.length >= 6 && password.length <= 200;
};

/**
 * validate the length of a name field
 * @param {string} name - The name to validate
 * @returns {boolean} - true if the length is valid, false if not
 */
const isValidNameLength = (name) => {
  // Name must be between 1 and 150 characters (VarChar(150))
  return name && name.length >= 1 && name.length <= 150;
};

/**
 * validate the length of a status field
 * @param {string} status - The status to validate
 * @returns {boolean} - true if the length is valid, false if not
 */
const isValidStatusLength = (status) => {
  // Status must be between 1 and 25 characters (VarChar(25))
  return status && status.length >= 1 && status.length <= 25;
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
    if (!isValidEmailLength(data.email)) {
      throw ApiError.badRequest('El email no puede exceder 254 caracteres');
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
    if (!isValidNameLength(data.name.trim())) {
      throw ApiError.badRequest('El nombre debe tener entre 1 y 150 caracteres');
    }
    
    // validate the password
    if (!data.password) {
      throw ApiError.badRequest('La contraseña es obligatoria');
    }
    if (!isValidPassword(data.password)) {
      throw ApiError.badRequest('La contraseña debe tener entre 6 y 200 caracteres');
    }

    // validate the status if provided
    if (data.status && !isValidStatusLength(data.status)) {
      throw ApiError.badRequest('El status debe tener entre 1 y 25 caracteres');
    }

    // validate that at least one headquarter is provided
    if (!data.idHeadquarter || (Array.isArray(data.idHeadquarter) && data.idHeadquarter.length === 0)) {
      throw ApiError.badRequest('El usuario debe tener al menos una sede asignada');
    }

    // validate that at least one role is provided
    if (!data.idRole || (Array.isArray(data.idRole) && data.idRole.length === 0)) {
      throw ApiError.badRequest('El usuario debe tener al menos un rol asignado');
    }

    // Normalize data to arrays for consistent handling
    const headquarterIds = Array.isArray(data.idHeadquarter) ? data.idHeadquarter : [data.idHeadquarter];
    const roleIds = Array.isArray(data.idRole) ? data.idRole : [data.idRole];

    // verify that all headquarters exist
    for (const headquarterId of headquarterIds) {
      const headquarterCheck = await UsersRepository.checkHeadquarterExists(headquarterId);
      if (!headquarterCheck) {
        throw ApiError.badRequest(`La sede con ID ${headquarterId} no existe`);
      }
    }

    // verify that all roles exist
    for (const roleId of roleIds) {
      const roleCheck = await UsersRepository.checkRoleExists(roleId);
      if (!roleCheck) {
        throw ApiError.badRequest(`El rol con ID ${roleId} no existe`);
      }
    }

    const hashed = await bcrypt.hash(data.password, 10);

    const user = await UsersRepository.create({ 
      email: data.email,
      name: data.name.trim(),
      password: hashed,
      status: data.status || "active"
    });

    // creation the relation tables
    if (headquarterIds.length > 0) {
      await UsersRepository.assignHeadquarters(
        user.email,
        headquarterIds.map(id => parseInt(id))
      );
    }
    
    if (roleIds.length > 0) {
      await UsersRepository.assignRoles(
        user.email,
        roleIds.map(id => parseInt(id))
      );
    }
    return user;
  },

  // Updates user data by email; hashes password if provided
  update: async (email, data) => {
    const updateData = {};

    // validate email length if provided (though email is primary key, good practice)
    if (data.email) {
      if (!isValidEmailLength(data.email)) {
        throw ApiError.badRequest('El email no puede exceder 254 caracteres');
      }
      if (!isValidEmail(data.email)) {
        throw ApiError.badRequest('El formato del email no es válido. Debe seguir el formato: usuario@dominio.extension');
      }
    }

    // validate name length if provided
    if (data.name) {
      if (!isValidNameLength(data.name.trim())) {
        throw ApiError.badRequest('El nombre debe tener entre 1 y 150 caracteres');
      }
      updateData.name = data.name.trim();
    }

    // validate status length if provided
    if (data.status) {
      if (!isValidStatusLength(data.status)) {
        throw ApiError.badRequest('El status debe tener entre 1 y 25 caracteres');
      }
      updateData.status = data.status;
    }

    if (data.password) {
      if (!isValidPassword(data.password)) {
        throw ApiError.badRequest('La contraseña debe tener entre 6 y 200 caracteres');
      }
      const hashed = await bcrypt.hash(data.password, 10);
      updateData.password = hashed;
    }

    if (Object.keys(updateData).length > 0) {
      await UsersRepository.update(email, updateData);
    }

    // validate the headquarters if they are provided
    if (Array.isArray(data.sedes)) {
      // prevent removing all headquarters
      if (data.sedes.length === 0) {
        throw ApiError.badRequest('El usuario debe tener al menos una sede asignada');
      }
      
      // verify that all the headquarters exist
      for (const sedeId of data.sedes) {
        const headquarterCheck = await UsersRepository.checkHeadquarterExists(sedeId);
        if (!headquarterCheck) {
          throw ApiError.badRequest(`La sede con ID ${sedeId} no existe`);
        }
      }
      
      await UsersRepository.clearHeadquarters(email);
      await UsersRepository.assignHeadquarters(email, data.sedes);
    }

    // validate the roles if they are provided
    if (Array.isArray(data.roles)) {
      // prevent removing all roles
      if (data.roles.length === 0) {
        throw ApiError.badRequest('El usuario debe tener al menos un rol asignado');
      }
      
      // verify that all the roles exist
      for (const roleId of data.roles) {
        const roleCheck = await UsersRepository.checkRoleExists(roleId);
        if (!roleCheck) {
          throw ApiError.badRequest(`El rol con ID ${roleId} no existe`);
        }
      }
      
      await UsersRepository.clearRoles(email);
      await UsersRepository.assignRoles(email, data.roles);
    }

    return UsersRepository.findByEmailWithHeadquarters(email);
  },


  // Updates only the user's status
  updateStatus: (email, status) =>
    UsersRepository.update(email, { status }),

  // Updates only the user's password, hashes before saving
  updatePassword: async (email, password) => {
    if (!isValidPassword(password)) {
      throw ApiError.badRequest('La contraseña debe tener entre 6 y 200 caracteres');
    }
    const hashed = await bcrypt.hash(password, 10);
    return UsersRepository.updatePassword(email, hashed);
  },

  // Soft delete a user by email (change status to inactive)
  delete: async (email) => {
    return UsersRepository.update(email, { status: 'inactive' });
  },

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

    // First, verify if the window exists
    const window = await UsersRepository.checkWindowExists(windowName);
    if (!window) {
      throw ApiError.forbidden('La página no existe');
    }
    
    if (window.status !== 'active') {
      throw ApiError.forbidden('La página está inactiva');
    }

    // Then verify permissions to the window
    let hasAccess = false;
    for (const ur of activeRoles) {
      for (const rw of ur.role.windows) {   
        if (rw.window.windowName === windowName && rw.read === true) {
          hasAccess = true;
          break;
        }
      }
    }
    
    if (!hasAccess) {
      throw ApiError.forbidden('El usuario no tiene permisos de lectura');
    }
    //return data
    const { name, status, roles } = user;
    return { email: user.email, name, status, roles };

  },

  //get headquarters related to user by using email
  getuserHeadquartersByEmail: (email) => UsersRepository.getuserHeadquartersByEmail(email),
  getWithHeadquarters: (email) => UsersRepository.findByEmailWithHeadquarters(email),

};

module.exports = { UsersService };
