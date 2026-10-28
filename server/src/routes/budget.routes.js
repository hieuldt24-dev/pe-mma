import { Router } from 'express';
import * as controller from '../controller/budget.controller.js';

const router = Router();
router.route('/:month').get(controller.get).put(controller.update);

export default router;
