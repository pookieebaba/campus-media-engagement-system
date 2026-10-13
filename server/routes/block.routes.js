const { Router } = require('express');
const { listBlocks, createBlock, updateBlock, deleteBlock } = require('../controllers/block.controller');
const { verifyToken } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { createBlockSchema, updateBlockSchema } = require('../schemas/block.schemas');

const router = Router();

// GET /api/blocks — any authenticated user
router.get('/', verifyToken, listBlocks);

// POST /api/blocks — HEAD only
router.post('/', verifyToken, authorize('head'), validate(createBlockSchema), createBlock);

// PUT /api/blocks/:id — HEAD only
router.put('/:id', verifyToken, authorize('head'), validate(updateBlockSchema), updateBlock);

// DELETE /api/blocks/:id — HEAD only (soft delete)
router.delete('/:id', verifyToken, authorize('head'), deleteBlock);

module.exports = router;
