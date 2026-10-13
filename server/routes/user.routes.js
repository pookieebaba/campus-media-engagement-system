const { Router } = require('express');
const {
  listUsers,
  createUser,
  getUser,
  updateUser,
  deactivateUser,
  activateUser,
  bulkImport,
} = require('../controllers/user.controller');
const { verifyToken } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { createUserSchema, updateUserSchema } = require('../schemas/user.schemas');

const router = Router();

// All user routes require authentication
router.use(verifyToken);

// GET /api/users — HEAD only
router.get('/', authorize('head'), listUsers);

// POST /api/users — HEAD only
router.post('/', authorize('head'), validate(createUserSchema), createUser);

// POST /api/users/bulk-import — HEAD only (multer handles the file, no JSON validate middleware)
router.post('/bulk-import', authorize('head'), bulkImport);

// GET /api/users/:id — HEAD or self (enforced in controller)
router.get('/:id', getUser);

// PUT /api/users/:id — HEAD only
router.put('/:id', authorize('head'), validate(updateUserSchema), updateUser);

// PATCH /api/users/:id/deactivate — HEAD only
router.patch('/:id/deactivate', authorize('head'), deactivateUser);

// PATCH /api/users/:id/activate — HEAD only
router.patch('/:id/activate', authorize('head'), activateUser);

module.exports = router;
