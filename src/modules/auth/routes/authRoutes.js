import express from 'express';
import { response } from '../helpers/response.js';

// Import Controllers
import { login, register } from '../controllers/auth/authController.js';
import { uploadImages } from '../middlewares/uploadMiddleware.js';


// Router
var router = express.Router();

router.get('/', (req, res) => {
    try {
        return response(res, req.body, 'Welcome Auth API', 200);
    } catch (error) {
        return response(res, req.body, error.message, 500);
    }
});

router.post(
    '/register',
    uploadImages([{ name: 'profile_photo', maxCount: 1 }]),
    register
  );
router.post('/login', login);

export default router;