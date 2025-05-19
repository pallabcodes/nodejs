import express from 'express';
import { UserController } from '../controllers/UserController.js';
import { createAuthMiddleware } from '../../../shared/middlewares/auth.js';
import { checkPermissions } from '../../../shared/middlewares/permission.js';
import { PERMISSIONS } from '../../../shared/config/permissions.js';

const router = express.Router();
const auth = createAuthMiddleware();

// Public routes
router.post('/', UserController.createUser);

// Protected routes (require authentication)
router.use(auth);

// User profile routes
router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateUser);

// Admin only routes
router.get('/admin', 
  checkPermissions([PERMISSIONS.ADMIN]), 
  UserController.getAdminData
);

// User management routes
router.get('/', UserController.getUsers);
router.delete('/:id', UserController.deleteUser);
router.get('/complex', UserController.getComplexData);

export default router; 