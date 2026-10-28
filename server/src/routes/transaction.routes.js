import { Router } from 'express';
import * as controller from '../controller/transaction.controller.js';
import { validateTransactionId } from '../middleware/validation.middleware.js';

const router = Router();
router.param('id', validateTransactionId);
router.route('/').get(controller.list).post(controller.create);
router.route('/:id').get(controller.get).put(controller.update).delete(controller.remove);

export default router;
