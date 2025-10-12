const jwt = require("jsonwebtoken");
const { UsersService } = require("./users.service");
const ApiError = require("../../../utils/apiError");
const { LoginAccessService } = require("./loginAccess.service");

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

    const mapped = users.map((u) => ({
      email: u.email,
      name: u.name,
      status: u.status,
      roles: u.roles.map((r) => ({
        idRole: r.role.idRole,
        rolName: r.role.rolName,
      })),
      sedes: u.headquarterUser.map((h) => ({
        idHeadquarter: h.headquarter.idHeadquarter,
        name: h.headquarter.name,
      })),
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

    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado" });

    res.json({
      email: user.email,
      name: user.name,
      status: user.status,
      sedes: user.headquarterUser.map((h) => ({
        idHeadquarter: h.idHeadquarter,
        name: h.headquarter.name,
      })),
      roles: user.roles.map((r) => ({
        idRole: r.role.idRole,
        name: r.role.rolName,
      })),
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
        .json({
          message: "JSON inválido. Verifique la sintaxis del request body.",
        });
    }

    const { email, name, password, status, idHeadquarter, idRole } = body;

    // validate the required fields (including empty strings)
    if (!email || email.trim() === "") {
      return res.status(400).json({ message: "El email es obligatorio" });
    }

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "El nombre es obligatorio" });
    }

    if (!password || password.trim() === "") {
      return res.status(400).json({ message: "La contraseña es obligatoria" });
    }

    // validate that a headquarter is provided and not empty
    if (
      !idHeadquarter ||
      (Array.isArray(idHeadquarter) && idHeadquarter.length === 0)
    ) {
      return res
        .status(400)
        .json({ message: "El usuario debe tener al menos una sede asignada" });
    }

    // validate that a role is provided and not empty
    if (!idRole || (Array.isArray(idRole) && idRole.length === 0)) {
      return res
        .status(400)
        .json({ message: "El usuario debe tener al menos un rol asignado" });
    }

    try {
      const created = await UsersService.create({
        email,
        name,
        password,
        status,
        idHeadquarter,
        idRole,
      });
      res.status(201).json(created);
    } catch (e) {
      if (e && e.code === "P2002")
        return res.status(409).json({ message: "El email ya existe" });
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
        .json({
          message: "JSON inválido. Verifique la sintaxis del request body.",
        });
    }

    const { name, status, password, sedes, roles } = body;

    try {
      const updated = await UsersService.update(email, {
        name,
        status,
        password,
        sedes,
        roles,
      });
      res.json(updated);
    } catch (e) {
      if (e && e.code === "P2025") {
        return res.status(404).json({ message: "Usuario no encontrado" });
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
    if (!status)
      return res.status(400).json({ message: "status es obligatorio" });
    try {
      const updated = await UsersService.updateStatus(email, status);
      res.json(updated);
    } catch (e) {
      // handle case when user is not found
      if (e && e.code === "P2025")
        return res.status(404).json({ message: "Usuario no encontrado" });
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
    if (!password)
      return res.status(400).json({ message: "password es obligatorio" });
    try {
      const updated = await UsersService.updatePassword(email, password);
      res.json(updated);
    } catch (e) {
      // handle case when user is not found
      if (e && e.code === "P2025")
        return res.status(404).json({ message: "Usuario no encontrado" });
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
      const updatedUser = await UsersService.delete(email);
      res.json({
        message: "Usuario desactivado exitosamente",
        user: updatedUser,
      });
    } catch (e) {
      // Handles case when user is not found
      if (e && e.code === "P2025")
        return res.status(404).json({ message: "Usuario no encontrado" });
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
        return next(
          ApiError.badRequest("email, password y windowName requeridos")
        );

      const user = await UsersService.login(
        email,
        password,
        windowName,
        clientDate
      );

      // obtain the roles of the user
      const roleIds = user.roles.map((r) => r.idRole);

      // Consult the permissions of the roles of the user
      const permissions = await prisma.roleWindow.findMany({
        where: {
          idRole: { in: roleIds },
        },
        select: {
          window: {
            select: { windowName: true },
          },
          create: true,
          read: true,
          update: true,
          delete: true,
        },
      });

      // transform all the permissions to a simple array
      // e.g. [{window:'users', create:true, read:true, update:false, delete:false}, {...}]
      // if the user has multiple roles, permissions can be duplicated for the same window
      const permissionsList = permissions.map((p) => ({
        window: p.window.name,
        create: Boolean(p.create),
        read: Boolean(p.read),
        update: Boolean(p.update),
        delete: Boolean(p.delete),
      }));

      if (!process.env.JWT_SECRET)
        return next(ApiError.internal("Falta JWT_SECRET"));
      // data of token - subject,name,roles. Email its sub because a standard of jwt
      const token = jwt.sign(
        {
          sub: user.email,
          name: user.name,
          roles: user.roles.map((ur) => ur.role.rolName), // save the roles the user ['admin', 'editor']
          permissions: permissionsList   // here go all the details about permissions

        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      // Log the login access
      await LoginAccessService.log({
        email: email,
      });

      res.json({ message: "Login exitoso", token, user });
    } catch (e) {
      next(e);
    }
  },
};

module.exports = { UsersController };
