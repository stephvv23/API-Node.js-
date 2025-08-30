const express = require('express');
const userRoutes = require('./modules/users/users.routes');
const headquarterRoutes = require('./modules/headquarters/headquarter.routes');

// Create a new router instance
const router = express.Router();

// Mount user-related routes under /users
router.use('/users', userRoutes);
router.use('/headquarters', headquarterRoutes);

module.exports = router;
//const headquarterRoutes = require('./modules/headquarters/headquarter.routes');
