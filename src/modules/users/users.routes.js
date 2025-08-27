const express = require('express');
const { UsersController } = require('./users.controller');

const router = express.Router();

// Route to list all users
router.get('/', UsersController.list);                         // GET    /api/users

// Route to get a user by email
router.get('/:email', UsersController.get);                    // GET    /api/users/:email

// Route to create a new user
router.post('/', UsersController.create);                      // POST   /api/users

// Route to update user data by email
router.put('/:email', UsersController.update);                 // PUT    /api/users/:email

// Route to update only the user's status
router.patch('/:email/status', UsersController.updateStatus);  // PATCH  /api/users/:email/status

// Route to update only the user's password
router.patch('/:email/password', UsersController.updatePassword); // PATCH /api/users/:email/password

// Route to delete a user by email
router.delete('/:email', UsersController.remove);              // DELETE /api/users/:email
router.post('/login', UsersController.login);

module.exports = router;


