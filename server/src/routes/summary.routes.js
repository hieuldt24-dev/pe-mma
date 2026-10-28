import { Router } from 'express';
import * as controller from '../controller/summary.controller.js';

const router = Router();
router.get('/', controller.get);

export default router;
