const express = require('express');
const { UsersController } = require('./users.controller');

const router = express.Router();

router.get('/', UsersController.list);                         // GET    /api/users
router.get('/:email', UsersController.get);                    // GET    /api/users/:email
router.post('/', UsersController.create);                      // POST   /api/users
router.put('/:email', UsersController.update);                 // PUT    /api/users/:email
router.patch('/:email/status', UsersController.updateStatus);  // PATCH  /api/users/:email/status
router.patch('/:email/password', UsersController.updatePassword); // PATCH /api/users/:email/password
router.delete('/:email', UsersController.remove);              // DELETE /api/users/:email

module.exports = router;
