const express = require('express');
const { HeadquarterController } = require('./headquarter.controller');

const router = express.Router();

router.get('/active', HeadquarterController.getAllActive);

module.exports = router;
