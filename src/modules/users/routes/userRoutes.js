// const express = require('express');
// const router = express.Router();
// const UserController = require('../controllers/UserController');
// const authMiddleware = require('../../shared/middlewares/authMiddleware');
// const permissionMiddleware = require('../../shared/middlewares/permissionMiddleware');
// const PERMISSIONS = require('../../shared/config/permissions');
//
// router.post(
//     '/',
//     authMiddleware,
//     permissionMiddleware([PERMISSIONS.CREATE_USER]),
//     UserController.createUser.bind(UserController)
// );
//
// router.put(
//     '/:id',
//     authMiddleware,
//     permissionMiddleware([PERMISSIONS.UPDATE_USER]),
//     UserController.updateUser.bind(UserController)
// );

// with middleware pipeline

// const express = require('express');
// const router = express.Router();
//
// const AuthMiddleware = require('./middlewares/AuthMiddleware');
// const PermissionMiddleware = require('./middlewares/PermissionMiddleware');
// const UserController = require('./controllers/UserController');
// const PERMISSIONS = require('./config/permissions').PERMISSIONS;
//
// router.post('/users', async (req, res) => {
//     // this is odd though, I get that middleware pipeline being used, since surely middleware could be a function or array of functions so then why within body or not directly , more flexibility, readability or debuggable or what?
//     // solution: use a wrapper function
//     const middlewares = [
//         new AuthMiddleware(),
//         new PermissionMiddleware([PERMISSIONS.CREATE_USER]),
//     ];
//
//     const ctx = { req, res };
//     try {
//         await runMiddlewarePipeline(ctx, middlewares);
//         if (!res.headersSent) {
//             await UserController.createUser(req, res);
//         }
//     } catch (err) {
//         console.error('Unexpected error:', err);
//         res.status(500).json({ message: 'Internal Server Error' });
//     }
// });

// now, with _composeMiddleware and errorHandler from utils

// const express = require('express');
// const router = express.Router();
//
// const AuthMiddleware = require('./middlewares/AuthMiddleware');
// const PermissionMiddleware = require('./middlewares/PermissionMiddleware');
// const UserController = require('./controllers/UserController');
// const PERMISSIONS = require('./config/permissions').PERMISSIONS;
//
// const _composeMiddleware = require('./shared/utils/_composeMiddleware');
// const wrapRouteHandler = require('./shared/utils/wrapRouteHandler');
//
// const auth = new AuthMiddleware();
// const canCreateUser = new PermissionMiddleware([PERMISSIONS.CREATE_USER]);
//
// router.post(
//     '/users',
//     _composeMiddleware([auth, canCreateUser]),
//     wrapRouteHandler(UserController.createUser.bind(UserController))
// );
//
// module.exports = router;

// now, with createRoute.js from utils

// router.post(
//     '/users',
//     ...createRoute([auth, canCreateUser], UserController.createUser.bind(UserController))
// );

// after implementing the `withMiddleware.js`

// const express = require('express');
// const router = express.Router();

// const authMiddleware = require('../../../shared/middlewares/authMiddleware');
// const permissionMiddleware = require('../../../shared/middlewares/permissionMiddleware');
// const withMiddlewares = require('../../../shared/utils/withMiddlewares');
// const { PERMISSIONS } = require('../../../shared/config/permissions');
// const UserController = require('../controllers/userController');

// router.post(
//     '/',
//     withMiddlewares(
//         authMiddleware,
//         permissionMiddleware([PERMISSIONS.CREATE_USER]),
//         UserController.createUser
//     )
// );

// module.exports = router;

// with the userPipeline.js

// src/modules/users/routes.js
const express = require('express');
const router = express.Router();
const toExpress = require('../../utils/toExpress');
const userPipeline = require('../../pipelines/userPipeline');
const adminPipeline = require('../../pipelines/adminPipeline');
const { createUser, getUsers, deleteUser } = require('./controllers');

router.post('/', toExpress(userPipeline, createUser));
router.get('/', getUsers); // open endpoint
router.delete('/:id', toExpress(adminPipeline, deleteUser));

module.exports = router;
