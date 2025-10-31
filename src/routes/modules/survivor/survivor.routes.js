const { SurvivorController } = require('../../modules/survivor/survivor.controller');
const {
  authenticate,
  authorizeWindow,
} = require("../../../middlewares/auth.middleware");

module.exports = [
  // List all survivors (by status)
  {
    method: "GET",
    path: "/api/survivors",
    handler: authenticate(
      authorizeWindow("Supervivientes", "read")(SurvivorController.getAll)
    ),
  },

  // List active survivors
  {
    method: "GET",
    path: "/api/survivors/active",
    handler: authenticate(
      authorizeWindow("Supervivientes", "read")(SurvivorController.getAllActive)
    ),
  },

  // Get survivor by ID
  {
    method: "GET",
    path: "/api/survivors/:id",
    handler: authenticate(
      authorizeWindow("Supervivientes", "read")(SurvivorController.getById)
    ),
  },

  // Create survivor
  {
    method: "POST",
    path: "/api/survivors",
    handler: authenticate(
      authorizeWindow("Supervivientes", "create")(SurvivorController.create)
    ),
  },

  // Update survivor
  {
    method: "PUT",
    path: "/api/survivors/:id",
    handler: authenticate(
      authorizeWindow(
        "Supervivientes",
        "read",
        "update"
      )(SurvivorController.update)
    ),
  },

  // Deactivate/reactivate survivor
  {
    method: 'PATCH',
    path: '/api/survivors/:id/status',
    handler: authenticate(
      authorizeWindow('Supervivientes', 'read', 'delete')(SurvivorController.delete)
    ),
  },
];
