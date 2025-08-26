const express = require('express');
const userRoutes = require('./modules/users/users.routes');

// Create a new router instance
const router = express.Router();

// Mount user-related routes under /users
router.use('/users', userRoutes);

module.exports = router;
