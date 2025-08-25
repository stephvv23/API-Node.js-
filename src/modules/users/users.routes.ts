import { Router } from 'express';
import { UsersController } from './users.controller';

const router = Router();

router.get('/', UsersController.list);                         // GET    /api/users
router.get('/:email', UsersController.get);                    // GET    /api/users/:email
router.post('/', UsersController.create);                      // POST   /api/users
router.put('/:email', UsersController.update);                 // PUT    /api/users/:email (name/status/password)
router.patch('/:email/status', UsersController.updateStatus);  // PATCH  /api/users/:email/status
router.patch('/:email/password', UsersController.updatePassword); // PATCH /api/users/:email/password
router.delete('/:email', UsersController.remove);              // DELETE /api/users/:email

export default router;
