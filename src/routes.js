const express = require('express');
const userRoutes = require('./modules/users/users.routes');
const headquarterRoutes = require('./modules/headquarters/headquarter.routes');

const router = express.Router();
router.use('/users', userRoutes);
router.use('/headquarters', headquarterRoutes);

module.exports = router;
//const headquarterRoutes = require('./modules/headquarters/headquarter.routes');
