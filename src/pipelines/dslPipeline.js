// src/pipelines/dslPipeline.js

const { createPipeline } = require('../middlewares/dsl');
const createAuthMiddleware = require('../middlewares/auth');
const { PERMISSIONS } = require('../config/permissions');
const { checkPermissions } = require('../middlewares/permission');
const requestContext = require('../middlewares/requestContext');

const auth = createAuthMiddleware(require('jsonwebtoken'), process.env.JWT_SECRET);

const pipeline = createPipeline()
  .use(requestContext)
  .use(auth)
  .if(ctx => ctx.user?.roles.includes('admin'), (branch) => {
    branch.use(checkPermissions([PERMISSIONS.CREATE_USER, PERMISSIONS.DELETE_USER]));
  })
  .use(checkPermissions([PERMISSIONS.VIEW_USER]));

module.exports = pipeline.build();
