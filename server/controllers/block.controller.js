const Block = require('../models/Block');
const { logAudit } = require('../utils/audit');

/**
 * GET /api/blocks
 * Authenticated users can list blocks.
 */
const listBlocks = async (req, res, next) => {
  try {
    const { isActive, search } = req.query;

    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    const blocks = await Block.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({ blocks });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/blocks
 * HEAD only.
 */
const createBlock = async (req, res, next) => {
  try {
    const { name, code, description } = req.body;

    const block = await Block.create({
      name,
      code: code.toUpperCase(),
      description,
      createdBy: req.user._id,
    });

    await logAudit({
      actor: req.user._id,
      action: 'block.create',
      targetType: 'Block',
      targetId: block._id,
      changes: { after: { name: block.name, code: block.code } },
      req,
    });

    return res.status(201).json({ block });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/blocks/:id
 * HEAD only.
 */
const updateBlock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, description } = req.body;

    const block = await Block.findById(id);
    if (!block) {
      return res.status(404).json({ message: 'Block not found.' });
    }

    const before = { name: block.name, code: block.code, description: block.description };

    if (name !== undefined) block.name = name;
    if (code !== undefined) block.code = code.toUpperCase();
    if (description !== undefined) block.description = description;

    await block.save();

    const after = { name: block.name, code: block.code, description: block.description };

    await logAudit({
      actor: req.user._id,
      action: 'block.update',
      targetType: 'Block',
      targetId: block._id,
      changes: { before, after },
      req,
    });

    return res.status(200).json({ block });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/blocks/:id
 * HEAD only. Soft delete (sets isActive=false).
 */
const deleteBlock = async (req, res, next) => {
  try {
    const { id } = req.params;

    const block = await Block.findById(id);
    if (!block) {
      return res.status(404).json({ message: 'Block not found.' });
    }

    block.isActive = false;
    await block.save();

    await logAudit({
      actor: req.user._id,
      action: 'block.deactivate',
      targetType: 'Block',
      targetId: block._id,
      req,
    });

    return res.status(200).json({ message: 'Block deactivated.', block });
  } catch (err) {
    next(err);
  }
};

module.exports = { listBlocks, createBlock, updateBlock, deleteBlock };
