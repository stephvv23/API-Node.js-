const jwt = require('jsonwebtoken');
const { UsersService } = require('./users.service');
const ApiError = require('../../../utils/apiError'); 
const { LoginAccessService  } = require('./loginAccess.service');
const { SecurityLogService } = require('../../../services/securitylog.service');

/**
 * Helper function to format headquarters and roles for logging
 * @param {Object} user - User object with headquarters and roles
 * @returns {string} - Formatted string with headquarters and roles info
 */
const formatUserRelations = (user) => {
  const sedes = user.headquarterUser?.map(h => `${h.headquarter.name} (ID: ${h.headquarter.idHeadquarter})`).join(', ') || 'Sin sedes';
  const roles = user.roles?.map(r => `${r.role.rolName} (ID: ${r.role.idRole})`).join(', ') || 'Sin roles';
  return `Sedes: [${sedes}], Roles: [${roles}]`;
};

/**
 * Helper function to compare arrays of objects by a key
 * @param {Array} arr1 - First array to compare
 * @param {Array} arr2 - Second array to compare
 * @param {string} idKey - Key to use for comparison
 * @returns {boolean} - True if arrays contain the same items by ID
 */
const arraysEqualById = (arr1, arr2, idKey) => {
  if (!Array.isArray(arr1)) arr1 = [];
  if (!Array.isArray(arr2)) arr2 = [];
  const ids1 = arr1.map(item => item[idKey]).sort();
  const ids2 = arr2.map(item => item[idKey]).sort();
  if (ids1.length !== ids2.length) return false;
  for (let i = 0; i < ids1.length; i++) {
    if (ids1[i] !== ids2[i]) return false;
  }
  return true;
};

/**
 * UsersController handles HTTP requests for user operations.
 * Each method corresponds to a REST endpoint and delegates logic to UsersService.
 */
const UsersController = {
  /**
   * List all users.
   * GET /users
   */
  list: async (_req, res) => {
    const users = await UsersService.list();

    const mapped = users.map(u => ({
      email: u.email,
      name: u.name,
      status: u.status,
      roles: u.roles.map(r => ({
        idRole: r.role.idRole,
        rolName: r.role.rolName
      })),
      sedes: u.headquarterUser.map(h => ({
        idHeadquarter: h.headquarter.idHeadquarter,
        name: h.headquarter.name
      }))
    }));

  res.json(mapped);
  },


  /**
   * Get a user by email.
   * GET /users/:email
   */
  get: async (req, res) => {
    const { email } = req.params;
    const user = await UsersService.get(email);

    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    res.json({
      email: user.email,
      name: user.name,
      status: user.status,
      sedes: user.headquarterUser.map(h => ({
        idHeadquarter: h.idHeadquarter,
        name: h.headquarter.name
      })),
      roles: user.roles.map(r => ({
        idRole: r.role.idRole,
        name: r.role.rolName
      }))
    });
  },


  /**
   * Create a new user.
   * POST /users
   * Required fields: email, name, password
   */
  create: async (req, res) => {
    const body = req.body || {};
    
    // verify that the body is a valid JSON
    if (body.__jsonError) {
      return res
        .status(400)
        .json({ message: 'JSON inválido. Verifique la sintaxis del request body.' });
    }
    
    const { email, name, password, status, idHeadquarter, idRole} = body;
    
    // validate the required fields (including empty strings)
    if (!email || email.trim() === '') {
      return res
        .status(400)
        .json({ message: 'El email es obligatorio' });
    }
    
    if (!name || name.trim() === '') {
      return res
        .status(400)
        .json({ message: 'El nombre es obligatorio' });
    }
    
    if (!password || password.trim() === '') {
      return res
        .status(400)
        .json({ message: 'La contraseña es obligatoria' });
    }

    // validate that a headquarter is provided and not empty
    if (!idHeadquarter || (Array.isArray(idHeadquarter) && idHeadquarter.length === 0)) {
      return res
        .status(400)
        .json({ message: 'El usuario debe tener al menos una sede asignada' });
    }

    // validate that a role is provided and not empty
    if (!idRole || (Array.isArray(idRole) && idRole.length === 0)) {
      return res
        .status(400)
        .json({ message: 'El usuario debe tener al menos un rol asignado' });
    }
    
    try {
      const created = await UsersService.create({ email, name, password, status, idHeadquarter, idRole });
      
      // Log the user creation
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'CREATE',
        description: 
          `Se creó el usuario con los siguientes datos: ` +
          `Email: "${created.email}", ` +
          `Nombre: "${created.name}", ` +
          `Estado: "${created.status}". ` +
          `${formatUserRelations(created)}.`,
        affectedTable: 'User',
      });

      res.status(201).json(created);
    } catch (e) {
      if (e && e.code === 'P2002')
        return res.status(409).json({ message: 'El email ya existe' });
      throw e;
    }
  },


  /**
   * Update user data by email.
   * PUT /users/:email
   */
  update: async (req, res) => {
    const { email } = req.params;
    const body = req.body || {};
    
    // verify that the body is a valid JSON
    if (body.__jsonError) {
      return res
        .status(400)
        .json({ message: 'JSON inválido. Verifique la sintaxis del request body.' });
    }
    
    const { name, status, password, sedes, roles } = body;

    try {
      // Get the previous user data for comparison
      const previousUser = await UsersService.get(email);
      if (!previousUser) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      const updated = await UsersService.update(email, { name, status, password, sedes, roles });
      
      // Log the user update
      const userEmail = req.user?.sub;
      
      // Check if only status changed from inactive to active (reactivation)
      const onlyStatusChange = 
        previousUser.status === 'inactive' &&
        updated.status === 'active' &&
        previousUser.name === updated.name &&
        previousUser.password === updated.password &&
        arraysEqualById(previousUser.headquarterUser, updated.headquarterUser, 'idHeadquarter') &&
        arraysEqualById(previousUser.roles, updated.roles, 'idRole');

      if (onlyStatusChange) {
        await SecurityLogService.log({
          email: userEmail,
          action: 'REACTIVATE',
          description:
            `Se reactivó el usuario con email "${email}". Datos completos:\n` +
            `Email: "${updated.email}", ` +
            `Nombre: "${updated.name}", ` +
            `Estado: "${updated.status}". ` +
            `${formatUserRelations(updated)}.`,
          affectedTable: 'User',
        });
      } else {
        await SecurityLogService.log({
          email: userEmail,
          action: 'UPDATE',
          description:
            `Se actualizó el usuario con email "${email}".\n` +
            `Versión previa: ` +
            `Email: "${previousUser.email}", ` +
            `Nombre: "${previousUser.name}", ` +
            `Estado: "${previousUser.status}". ` +
            `${formatUserRelations(previousUser)}.\n` +
            `Nueva versión: ` +
            `Email: "${updated.email}", ` +
            `Nombre: "${updated.name}", ` +
            `Estado: "${updated.status}". ` +
            `${formatUserRelations(updated)}.\n`,
          affectedTable: 'User',
        });
      }

      res.json(updated);
    } catch (e) {
      if (e && e.code === 'P2025') {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      throw e;
    }
  },

  /**
   * Update only the user's status.
   * PATCH /users/:email/status
   */
  updateStatus: async (req, res) => {
    const { email } = req.params;
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ message: 'status es obligatorio' });
    try {
      // Get the previous user data for comparison
      const previousUser = await UsersService.get(email);
      if (!previousUser) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      const updatedWithRelations = await UsersService.updateStatus(email, status);
      
      // Log the status change
      const userEmail = req.user?.sub;
      
      // Check if user was reactivated (from inactive to active)
      if (previousUser.status === 'inactive' && status === 'active') {
        await SecurityLogService.log({
          email: userEmail,
          action: 'REACTIVATE',
          description:
            `Se reactivó el usuario con email "${email}". Datos completos:\n` +
            `Email: "${updatedWithRelations.email}", ` +
            `Nombre: "${updatedWithRelations.name}", ` +
            `Estado: "${updatedWithRelations.status}". ` +
            `${formatUserRelations(updatedWithRelations)}.`,
          affectedTable: 'User',
        });
      } else {
        await SecurityLogService.log({
          email: userEmail,
          action: 'UPDATE',
          description:
            `Se actualizó el estado del usuario con email "${email}".\n` +
            `Estado previo: "${previousUser.status}" ` +
            `${formatUserRelations(previousUser)}.\n` +
            `Nuevo estado: "${updatedWithRelations.status}" ` +
            `${formatUserRelations(updatedWithRelations)}.`,
          affectedTable: 'User',
        });
      }

      res.json(updatedWithRelations);
    } catch (e) {
      // handle case when user is not found
      if (e && e.code === 'P2025')
        return res.status(404).json({ message: 'Usuario no encontrado' });
      throw e;
    }
  },

  /**
   * Update only the user's password.
   * PATCH /users/:email/password
   */
  updatePassword: async (req, res) => {
    const { email } = req.params;
    const { password } = req.body || {};
    if (!password) return res.status(400).json({ message: 'password es obligatorio' });
    try {
      const updated = await UsersService.updatePassword(email, password);
      res.json(updated);
    } catch (e) {
      // handle case when user is not found
      if (e && e.code === 'P2025')
        return res.status(404).json({ message: 'Usuario no encontrado' });
      throw e;
    }
  },

  /**
   * Soft delete a user by email (change status to inactive).
   * DELETE /users/:email
   */
  remove: async (req, res) => {
    const { email } = req.params;
    try {
      // Get the user data before deletion for logging
      const userToDelete = await UsersService.get(email);
      if (!userToDelete) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      const updatedUser = await UsersService.delete(email);
      
      // Log the user deactivation
      const userEmail = req.user?.sub;
      await SecurityLogService.log({
        email: userEmail,
        action: 'INACTIVE',
        description: `Se inactivó el usuario: ` +
          `Email: "${email}", ` +
          `Nombre: "${userToDelete.name}", ` +
          `Estado: "${updatedUser.status}". ` +
          `${formatUserRelations(userToDelete)}.`,
        affectedTable: 'User',
      });

      res.json({ 
        message: 'Usuario desactivado exitosamente',
        user: updatedUser 
      });
    } catch (e) {
      // Handles case when user is not found
      if (e && e.code === 'P2025')
        return res.status(404).json({ message: 'Usuario no encontrado' });
      throw e;
    }
  },

  /**
   * Login a user into page
   * POST /users/login
   * Required fields: email, name, windowName
   */
  login: async (req, res, next) => {
    try {
      const { email, password, windowName, clientDate } = req.body || {};
      if (!email || !password || !windowName) 
        return next(ApiError.badRequest('email, password y windowName requeridos'));

      const user = await UsersService.login(email, password, windowName, clientDate);

      if (!process.env.JWT_SECRET) return next(ApiError.internal('Falta JWT_SECRET'));
    // data of token - subject,name,roles. Email its sub because a standard of jwt
      const token = jwt.sign(
      {
        sub: user.email,
        name: user.name,
        roles: user.roles.map(ur => ur.role.rolName), // save the roles the user ['admin', 'editor']
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' });
      // Log the login access
        await LoginAccessService.log({
          email: email,
        });

      res.json({ message: 'Login exitoso', token, user });
    } catch (e) {
      next(e);
    }
  },


  /**
 * Logout a user (invalidate token client-side and server-side)
 * POST /users/logout
 * Requires: Authorization header with Bearer token
 */
  logout: async (req, res, next) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      const { clientDate } = req.body || {};

      if (!token) return next(ApiError.unauthorized('Token requerido para cerrar sesión.'));

      const userEmail = req.user?.sub;
      const userName = req.user?.name;

      await SecurityLogService.log({
        email: userEmail || 'unknown',
        action: 'LOGOUT',
        description: `El usuario "${userName || userEmail}" cerró sesión.`,
        clientDate: clientDate || new Date().toISOString(),
        affectedTable: 'User',
      });

      await UsersService.invalidateToken(token);

      return res.status(200).json({ message: 'Logout exitoso (token invalidado)' });
    } catch (e) {
      console.error(' Error en logout:', e);
      next(e);
    }
  },





  //get headquarters related to user by using email
  getuserHeadquartersByEmail: async (req, res) => {
    const { email } = req.params;
    const userHeadquarters = await UsersService.getuserHeadquartersByEmail(email);
    if (!userHeadquarters) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(userHeadquarters);
  },


};

module.exports = { UsersController };
