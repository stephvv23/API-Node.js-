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
      const userWithRelations = await UsersService.get(created.email);
      await SecurityLogService.log({
        email: userEmail,
        action: 'CREATE',
        description: 
          `Se creó el usuario con los siguientes datos: ` +
          `Email: "${created.email}", ` +
          `Nombre: "${created.name}", ` +
          `Estado: "${created.status}". ` +
          `${formatUserRelations(userWithRelations)}.`,
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
        previousUser.name === updated.name;

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
            `${formatUserRelations(previousUser)}. \n` +
            `Nueva versión: ` +
            `Email: "${updated.email}", ` +
            `Nombre: "${updated.name}", ` +
            `Estado: "${updated.status}". ` +
            `${formatUserRelations(updated)}. \n`,
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

      const updated = await UsersService.updateStatus(email, status);
      
      // Log the status change
      const userEmail = req.user?.sub;
      
      // Check if user was reactivated (from inactive to active)
      if (previousUser.status === 'inactive' && status === 'active') {
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
            `Se actualizó el estado del usuario con email "${email}".\n` +
            `Estado previo: "${previousUser.status}" ` +
            `${formatUserRelations(previousUser)}.\n` +
            `Nuevo estado: "${updated.status}" ` +
            `${formatUserRelations(updated)}.`,
          affectedTable: 'User',
        });
      }

      res.json(updated);
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

  //get headquarters related to user by using email
  getuserHeadquartersByEmail: async (req, res) => {
    const { email } = req.params;
    const userHeadquarters = await UsersService.getuserHeadquartersByEmail(email);
    if (!userHeadquarters) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(userHeadquarters);
  },


};

module.exports = { UsersController };
