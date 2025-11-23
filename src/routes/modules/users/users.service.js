const bcrypt = require('bcrypt');
const { UsersRepository } = require('./users.repository');
const jwt  = require('jsonwebtoken');
const ApiError = require('../../../utils/apiResponse').ApiError;

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

    // validate that at least one admin role is provided
    const hasAdminRole = roleIds.some(roleId => {
      const id = typeof roleId === 'number' ? roleId : parseInt(roleId);
      return id === 1;
    });
    if (!hasAdminRole) {
      const activeAdminsCount = await UsersRepository.countActiveAdmins();
      if (activeAdminsCount === 0) {
        const error = ApiError.badRequest('No se puede crear un usuario sin rol de administrador. Actualmente no existe ningún usuario activo con rol de administrador en el sistema. Debe asignar el rol de administrador a este usuario o reactivar un administrador existente.');
        error.errorCode = 'MUST_HAVE_ADMIN';
        throw error;
      }
    }

    // verify that all headquarters exist (regardless of status)
    for (const headquarterId of headquarterIds) {
      const headquarterCheck = await UsersRepository.checkHeadquarterExists(headquarterId);
      if (!headquarterCheck) {
        throw ApiError.notFound(`La sede con ID ${headquarterId} no existe`);
      }
    }

    // verify that all roles exist (regardless of status)
    for (const roleId of roleIds) {
      const roleCheck = await UsersRepository.checkRoleExists(roleId);
      if (!roleCheck) {
        throw ApiError.notFound(`El rol con ID ${roleId} no existe`);
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
    
    // Return the complete user data with relations
    return UsersRepository.findByEmailWithHeadquarters(user.email);
  },

  // Updates user data by email; hashes password if provided
  update: async (email, data) => {
    // Normalize email to lowercase for consistency
    const normalizedEmail = email.toLowerCase();
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

    // Get current user once to verify existing relations and admin role
    const currentUser = await UsersRepository.findByEmailWithHeadquarters(normalizedEmail);
    if (!currentUser) {
      throw ApiError.notFound('Usuario');
    }

    // Validate admin role protection if roles are being updated
    if (Array.isArray(data.roles)) {
      const currentRoles = (currentUser.roles || []).map(r => {
        const roleId = r.role?.idRole || r.idRole || r.id;
        return typeof roleId === 'number' ? roleId : parseInt(roleId);
      });
      const hasAdminRole = currentRoles.includes(1); // Verificar si tiene rol admin (ID: 1)
      const willHaveAdminRole = data.roles.some(roleId => {
        const id = typeof roleId === 'number' ? roleId : parseInt(roleId);
        return id === 1;
      }); // verify if the user will have admin role after the update

      // if the user has admin role and is being removed
      if (hasAdminRole && !willHaveAdminRole) {
        // verify if it is the last active admin
        const activeAdminsCount = await UsersRepository.countActiveAdmins(normalizedEmail);
        if (activeAdminsCount === 0) {
          const error = ApiError.badRequest('No se puede quitar el rol de administrador a este usuario porque es el último usuario activo con este rol. Debe haber al menos un usuario con rol de administrador activo en el sistema.');
          error.errorCode = 'CANNOT_REMOVE_LAST_ADMIN';
          throw error;
        }
      }
    }

    // Update user basic fields if needed
    if (Object.keys(updateData).length > 0) {
      await UsersRepository.update(normalizedEmail, updateData);
    }

    // Validate and update headquarters if provided
    if (Array.isArray(data.headquarters)) {
      // prevent removing all headquarters
      if (data.headquarters.length === 0) {
        throw ApiError.badRequest('El usuario debe tener al menos una sede asignada');
      }
      // verify that all the headquarters exist (regardless of status)
      for (const headquarterId of data.headquarters) {
        const headquarterCheck = await UsersRepository.checkHeadquarterExists(headquarterId);
        if (!headquarterCheck) {
          throw ApiError.notFound(`La sede con ID ${headquarterId} no existe`);
        }
      }
      // Normalize headquarter IDs to integers and filter out invalid values
      const normalizedHeadquarters = data.headquarters
        .map(id => typeof id === 'number' ? id : parseInt(id))
        .filter(id => !isNaN(id) && id > 0);
      
      if (normalizedHeadquarters.length === 0) {
        throw ApiError.badRequest('El usuario debe tener al menos una sede asignada válida');
      }
      
      // Clear and assign headquarters
      await UsersRepository.clearHeadquarters(normalizedEmail);
      await UsersRepository.assignHeadquarters(normalizedEmail, normalizedHeadquarters);
    } else {
      // If headquarters not provided, verify user still has at least one
      const currentHeadquarters = currentUser.headquarterUser || [];
      if (currentHeadquarters.length === 0) {
        throw ApiError.badRequest('El usuario debe tener al menos una sede asignada');
      }
    }

    // Validate and update roles if provided
    if (Array.isArray(data.roles)) {
      // prevent removing all roles
      if (data.roles.length === 0) {
        throw ApiError.badRequest('El usuario debe tener al menos un rol asignado');
      }
      // verify that all the roles exist (regardless of status)
      for (const roleId of data.roles) {
        const roleCheck = await UsersRepository.checkRoleExists(roleId);
        if (!roleCheck) {
          throw ApiError.notFound(`El rol con ID ${roleId} no existe`);
        }
      }
      // Normalize role IDs to integers and filter out invalid values
      const normalizedRoles = data.roles
        .map(id => typeof id === 'number' ? id : parseInt(id))
        .filter(id => !isNaN(id) && id > 0);
      
      if (normalizedRoles.length === 0) {
        throw ApiError.badRequest('El usuario debe tener al menos un rol asignado válido');
      }
      
      // Clear and assign roles
      await UsersRepository.clearRoles(normalizedEmail);
      await UsersRepository.assignRoles(normalizedEmail, normalizedRoles);
    } else {
      // If roles not provided, verify user still has at least one
      const currentRoles = currentUser.roles || [];
      if (currentRoles.length === 0) {
        throw ApiError.badRequest('El usuario debe tener al menos un rol asignado');
      }
    }

    // Return the updated user with all relations
    // Using a fresh query to ensure relations are loaded correctly
    const updatedUser = await UsersRepository.findByEmailWithHeadquarters(normalizedEmail);
    return updatedUser;
  },


  // Updates only the user's status
  updateStatus: async (email, status) => {
    // validate that at least one admin role is provided
    if (status && status.toLowerCase() === 'inactive') {
      const user = await UsersRepository.findByEmailWithHeadquarters(email);
      if (!user) {
        throw ApiError.notFound('Usuario');
      }

      // verify if the user has admin role and is active
      const hasAdminRole = await UsersRepository.userHasAdminRole(email);
      const isActive = user.status?.toLowerCase() === 'active';

      if (hasAdminRole && isActive) {
        // verify if it is the last active admin
        const activeAdminsCount = await UsersRepository.countActiveAdmins(email);
        if (activeAdminsCount === 0) {
          const error = ApiError.badRequest('No se puede desactivar este usuario porque es el último usuario activo con rol de administrador. Debe haber al menos un usuario con rol de administrador activo en el sistema.');
          error.errorCode = 'CANNOT_DEACTIVATE_LAST_ADMIN';
          throw error;
        }
      }
    }

    await UsersRepository.update(email, { status });
    // Return the updated user with relations
    return UsersRepository.findByEmailWithHeadquarters(email);
  },

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
    // validate that at least one admin role is provided
    const user = await UsersRepository.findByEmailWithHeadquarters(email);
    if (!user) {
      throw ApiError.notFound('Usuario');
    }

    // verify if the user has admin role and is active
    const hasAdminRole = await UsersRepository.userHasAdminRole(email);
    const isActive = user.status?.toLowerCase() === 'active';

    if (hasAdminRole && isActive) {
      // verify if it is the last active admin
      const activeAdminsCount = await UsersRepository.countActiveAdmins(email);
      if (activeAdminsCount === 0) {
        const error = new ApiError(400, 'No se puede desactivar este usuario porque es el último usuario activo con rol de administrador. Debe haber al menos un usuario con rol de administrador activo en el sistema.');
        error.code = 'CANNOT_DEACTIVATE_LAST_ADMIN';
        throw error;
      }
    }

    return UsersRepository.update(email, { status: 'inactive' });
  },

  login: async (email, password, windowName) => {
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

    // verify rol (roles are already filtered to active in findAuthWithRoles)
    if (!user.roles || user.roles.length === 0) {
      throw ApiError.forbidden('El usuario no tiene roles activos asignados');
    }

    // First, verify if the window exists
    const window = await UsersRepository.checkWindowExists(windowName);
    if (!window) {
      throw ApiError.forbidden('La página no existe');
    }
    
    if (window.status !== 'active') {
      throw ApiError.forbidden('La página está inactiva');
    }

    // Then verify permissions to the window (using roles already filtered to active)
    let hasAccess = false;
    for (const ur of user.roles) {
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
   const { name, status, roles } = user;
    return { email: user.email, name, status, roles };
  },

  invalidateToken: async (token) => {
    return prisma.tokenBlacklist.create({
      data: { token },
    });
  },

  tokenExists: async (token) => {
    return prisma.tokenBlacklist.findFirst({
      where: { token },
    });
  },


  //get headquarters related to user by using email
  getuserHeadquartersByEmail: (email) => UsersRepository.getuserHeadquartersByEmail(email),
  getWithHeadquarters: (email) => UsersRepository.findByEmailWithHeadquarters(email),

};

module.exports = { UsersService };
