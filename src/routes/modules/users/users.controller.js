const jwt = require('jsonwebtoken');
const { UsersService } = require('./users.service');
const { EntityValidators } = require('../../../utils/validator');
const { LoginAccessService  } = require('./loginAccess.service');
const { SecurityLogService } = require('../../../services/securitylog.service');

/**
 * Helper function to format headquarters and roles for logging
 * @param {Object} user - User object with headquarters and roles
 * @returns {string} - Formatted string with headquarters and roles info
 */
const formatUserRelations = (user) => {
  const headquarters = user.headquarterUser?.map(h => `${h.headquarter.name} (ID: ${h.headquarter.idHeadquarter})`).join(', ') || 'No headquarters';
  const roles = user.roles?.map(r => `${r.role.rolName} (ID: ${r.role.idRole})`).join(', ') || 'No roles';
  return `Headquarters: [${headquarters}], Roles: [${roles}]`;
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
    try {
      const users = await UsersService.list();
      const mapped = users.map(u => ({
        email: u.email,
        name: u.name,
        status: u.status,
        roles: u.roles.map(r => ({
          idRole: r.role.idRole,
          rolName: r.role.rolName
        })),
        headquarters: u.headquarterUser.map(h => ({
          idHeadquarter: h.headquarter.idHeadquarter,
          name: h.headquarter.name
        }))
      }));
      return res.success(mapped);
    } catch (error) {
      console.error('[USERS] list error:', error);
      return res.error('Error retrieving users');
    }
  },


  /**
   * Get a user by email.
   * GET /users/:email
   */
  get: async (req, res) => {
    const { email } = req.params;
    try {
      const user = await UsersService.get(email);
      if (!user) return res.notFound('User');
      return res.success({
        email: user.email,
        name: user.name,
        status: user.status,
        headquarters: user.headquarterUser.map(h => ({
          idHeadquarter: h.idHeadquarter,
          name: h.headquarter.name
        })),
        roles: user.roles.map(r => ({
          idRole: r.role.idRole,
          name: r.role.rolName
        }))
      });
    } catch (error) {
      console.error('[USERS] get error:', error);
      return res.error('Error retrieving user');
    }
  },


  /**
   * Create a new user.
   * POST /users
   * Required fields: email, name, password
   */
  create: async (req, res) => {
    const body = req.body || {};
    if (body.__jsonError) {
      return res.validationErrors(['Invalid JSON. Check request body syntax.']);
    }
    const { email, name, password, status, idHeadquarter, idRole } = body;
    // Centralized validation
    const validation = EntityValidators.user({ email, name, password, status }, { partial: false });
    const errors = [...validation.errors];
    if (!idHeadquarter || (Array.isArray(idHeadquarter) && idHeadquarter.length === 0)) {
      errors.push('User must have at least one headquarter assigned');
    }
    if (!idRole || (Array.isArray(idRole) && idRole.length === 0)) {
      errors.push('User must have at least one role assigned');
    }
    if (errors.length > 0) {
      return res.validationErrors(errors);
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
      return res.status(201).success(created, 'User created successfully');
    } catch (e) {
      if (e && e.code === 'P2002')
        return res.validationErrors(['Email already exists']);
      if (typeof e?.message === 'string' && e.message.includes('no existe')) {
        return res.notFound(e.message);
      }
      // handle specific admin protection errors
      if (e && e.errorCode) {
        return res.status(400).json({
          ok: false,
          error: {
            code: e.errorCode,
            message: e.message,
            status: 400
          }
        });
      }
      console.error('[USERS] create error:', e);
      return res.error('Error creating user');
    }
  },


  /**
   * Update user data by email.
   * PUT /users/:email
   */
  update: async (req, res) => {
    const { email } = req.params;
    // Normalize email to lowercase for consistency
    const normalizedEmail = email.toLowerCase();
    const body = req.body || {};
    if (body.__jsonError) {
      return res.validationErrors(['Invalid JSON. Check request body syntax.']);
    }
    // Check existence before update
    const previousUser = await UsersService.get(normalizedEmail);
    if (!previousUser) {
      return res.notFound('User');
    }
    const { name, status, password, sedes, headquarters, roles } = body;
    // Support both 'sedes' (legacy) and 'headquarters' (new) for backward compatibility
    const headquartersData = headquarters !== undefined ? headquarters : sedes;
    
    // Centralized validation (partial)
    const validation = EntityValidators.user({ email, name, password, status }, { partial: true });
    const errors = [...validation.errors];
    
    // Validate that if headquarters or roles are provided, they are not empty
    if (headquartersData !== undefined) {
      if (!Array.isArray(headquartersData) || headquartersData.length === 0) {
        errors.push('El usuario debe tener al menos una sede asignada');
      }
    }
    
    if (roles !== undefined) {
      if (!Array.isArray(roles) || roles.length === 0) {
        errors.push('El usuario debe tener al menos un rol asignado');
      }
    }
    
    if (errors.length > 0) {
      return res.validationErrors(errors);
    }
    try {
      const updated = await UsersService.update(normalizedEmail, { name, status, password, headquarters: headquartersData, roles });
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
      return res.success(updated, 'User updated successfully');
    } catch (e) {
      if (e && e.code === 'P2025') {
        return res.notFound('User');
      }
      if (typeof e?.message === 'string' && e.message.includes('no existe')) {
        return res.notFound(e.message);
      }
      // handle specific admin protection errors
      if (e && e.errorCode) {
        return res.status(400).json({
          ok: false,
          error: {
            code: e.errorCode,
            message: e.message,
            status: 400
          }
        });
      }
      console.error('[USERS] update error:', e);
      return res.error('Error updating user');
    }
  },

  /**
   * Update only the user's status.
   * PATCH /users/:email/status
   */
  updateStatus: async (req, res) => {
    const { email } = req.params;
    const { status } = req.body || {};
    if (!status) return res.validationErrors(['status is required']);
    // Check existence before update
    const previousUser = await UsersService.get(email);
    if (!previousUser) {
      return res.notFound('User');
    }
    try {
      const updatedWithRelations = await UsersService.updateStatus(email, status);
      // Log the status change
      const userEmail = req.user?.sub;
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
      return res.success(updatedWithRelations, 'User status updated successfully');
    } catch (e) {
      if (e && e.code === 'P2025')
        return res.notFound('User');
      // handle specific admin protection errors
      if (e && e.errorCode) {
        return res.status(400).json({
          ok: false,
          error: {
            code: e.errorCode,
            message: e.message,
            status: 400
          }
        });
      }
      console.error('[USERS] updateStatus error:', e);
      return res.error('Error updating user status');
    }
  },

  /**
   * Update only the user's password.
   * PATCH /users/:email/password
   */
  updatePassword: async (req, res) => {
    const { email } = req.params;
    const { password } = req.body || {};
    if (!password) return res.validationErrors(['password is required']);
    // Check existence before update
    const previousUser = await UsersService.get(email);
    if (!previousUser) {
      return res.notFound('User');
    }
    try {
      const updated = await UsersService.updatePassword(email, password);
      return res.success(updated, 'User password updated successfully');
    } catch (e) {
      if (e && e.code === 'P2025')
        return res.notFound('User');
      console.error('[USERS] updatePassword error:', e);
      return res.error('Error updating user password');
    }
  },

  /**
   * Soft delete a user by email (change status to inactive).
   * DELETE /users/:email
   */
  remove: async (req, res) => {
    const { email } = req.params;
    // Check existence before delete
    const userToDelete = await UsersService.get(email);
    if (!userToDelete) {
      return res.notFound('User');
    }
    try {
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
      return res.success({
        message: 'User deactivated successfully',
        user: updatedUser
      });
    } catch (e) {
      if (e && e.code === 'P2025')
        return res.notFound('User');
      // handle specific admin protection errors
      if (e && e.errorCode) {
        return res.status(400).json({
          ok: false,
          error: {
            code: e.errorCode,
            message: e.message,
            status: 400
          }
        });
      }
      console.error('[USERS] remove error:', e);
      return res.error('Error deactivating user');
    }
  },

  /**
   * Login a user into page
   * POST /users/login
   * Required fields: email, password, windowName
   */
  login: async (req, res, next) => {
    try {
      const { email, password, windowName } = req.body || {};
      if (!email || !password || !windowName) 
        return next(ApiError.badRequest('email, password y windowName requeridos'));

      const user = await UsersService.login(email, password, windowName);

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

      const { roles: _, ...userWithoutRoles } = user;
      res.json({ message: 'Login exitoso', token, user: userWithoutRoles });
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

      if (!token) return next(ApiError.unauthorized('Token requerido para cerrar sesión.'));

      const userEmail = req.user?.sub;
      const userName = req.user?.name;

      await SecurityLogService.log({
        email: userEmail || 'unknown',
        action: 'LOGOUT',
        description: `El usuario "${userName || userEmail}" cerró sesión.`,
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
    try {
      const userHeadquarters = await UsersService.getuserHeadquartersByEmail(email);
      if (!userHeadquarters) return res.notFound('User');
      return res.success(userHeadquarters);
    } catch (error) {
      console.error('[USERS] getuserHeadquartersByEmail error:', error);
      return res.error('Error retrieving user headquarters');
    }
  },


};

module.exports = { UsersController };
