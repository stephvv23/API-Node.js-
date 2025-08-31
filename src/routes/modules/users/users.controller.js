const jwt = require('jsonwebtoken');
const { UsersService } = require('./users.service');
const ApiError = require('../../../utils/apiError'); 


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
    res.json(users);
  },

  /**
   * Get a user by email.
   * GET /users/:email
   */
  get: async (req, res) => {
    const { email } = req.params;
    const user = await UsersService.get(email);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user);
  },

  /**
   * Create a new user.
   * POST /users
   * Required fields: email, name, password
   */
  create: async (req, res) => {
    const { email, name, password, status } = req.body || {};
    if (!email || !name || !password) {
      return res
        .status(400)
        .json({ message: 'email, name y password son obligatorios' });
    }
    try {
      const created = await UsersService.create({ email, name, password, status });
      res.status(201).json(created);
    } catch (e) {
      // Handles Prisma unique constraint violation (email already exists)
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
    const { name, status, password } = req.body || {};
    try {
      const updated = await UsersService.update(email, { name, status, password });
      res.json(updated);
    } catch (e) {
      // Handles case when user is not found
      if (e && e.code === 'P2025')
        return res.status(404).json({ message: 'Usuario no encontrado' });
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
      const updated = await UsersService.updateStatus(email, status);
      res.json(updated);
    } catch (e) {
      // Handles case when user is not found
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
      // Handles case when user is not found
      if (e && e.code === 'P2025')
        return res.status(404).json({ message: 'Usuario no encontrado' });
      throw e;
    }
  },

  /**
   * Delete a user by email.
   * DELETE /users/:email
   */
  remove: async (req, res) => {
    const { email } = req.params;
    try {
      await UsersService.delete(email);
      res.status(204).send();
    } catch (e) {
      // Handles case when user is not found
      if (e && e.code === 'P2025')
        return res.status(404).json({ message: 'Usuario no encontrado' });
      throw e;
    }
  },

  login: async (req, res, next) => {
  try {
    const { email, password, windowName } = req.body || {};
    if (!email || !password || !windowName) 
      return next(ApiError.badRequest('email, password y windowName requeridos'));

    const user = await UsersService.login(email, password, windowName);

    if (!process.env.JWT_SECRET) return next(ApiError.internal('Falta JWT_SECRET'));

    const token = jwt.sign(
      { sub: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ message: 'Login exitoso', token, user });
  } catch (e) {
    next(e);
  }
},



};

module.exports = { UsersController };
