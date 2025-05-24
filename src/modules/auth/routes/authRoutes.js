import express from 'express';
import { response } from '../helpers/response.js';
import { toExpress } from '../../../shared/utils/toExpress.js';
import loginPipeline from '../middlewares/loginPipeline.js';
import path from 'path';
import fs from 'fs';

// Router
var router = express.Router();

import fs from 'fs';
import path from 'path';

// move this route later or remove it

router.get('/public-key', (req, res) => {
  const pubKeyPath = path.resolve('src/config/keys/public.pem');
  const pubKey = fs.readFileSync(pubKeyPath, 'utf8');
  res.type('text/plain').send(pubKey);
});

// Below is a test route so remove it later
router.get('/', (req, res) => {
    try {
        return response(res, req.body, 'Welcome Auth API', 200);
    } catch (error) {
        return response(res, req.body, error.message, 500);
    }
});

// same way could be used other pipelines (e.g. forgotPasswordPipeline) that reuses authBasePipeline and then add route-specific middlewares (refer to src/modules/auth/middlewares/routeSpecificPipeline.js) and loginPipeline.js

 // now, this is the correct way to use the pipeline 
router.post('/login', toExpress(loginPipeline, login));

export default router;