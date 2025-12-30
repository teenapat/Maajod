import { Router } from 'express';
import { storeController } from '../controllers/store.controller';

const router = Router();

// Store CRUD
router.post('/', (req, res) => storeController.create(req, res));
router.get('/', (req, res) => storeController.getMyStores(req, res));
router.get('/:id', (req, res) => storeController.getStore(req, res));
router.put('/:id', (req, res) => storeController.updateStore(req, res));

// Store users management
router.post('/:id/users', (req, res) => storeController.addUser(req, res));
router.delete('/:id/users/:userId', (req, res) => storeController.removeUser(req, res));
router.get('/:id/users', (req, res) => storeController.getUsers(req, res));

// Set default store
router.put('/:id/default', (req, res) => storeController.setDefault(req, res));

export default router;

