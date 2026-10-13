const multer = require('multer');
const User = require('../models/User');
const Block = require('../models/Block');
const { logAudit } = require('../utils/audit');
const { parseCSV, validateStudentRow } = require('../utils/csv');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

/**
 * GET /api/users
 * HEAD only. Paginated list with filters.
 */
const listUsers = async (req, res, next) => {
  try {
    const { role, block, isActive, search, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (block) filter.block = block;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -passwordResetToken -passwordResetExpires')
        .populate('block', 'name code')
        .populate('supervisor', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      users,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/users
 * HEAD only. Creates a single user.
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, studentId, blockId, supervisorId } = req.body;

    // Prevent privilege escalation — only head can create head users
    if (role === 'head' && req.user.role !== 'head') {
      return res.status(403).json({ message: 'Cannot create head accounts.' });
    }

    const userData = { name, email, password, role };
    if (studentId) userData.studentId = studentId.toUpperCase();
    if (blockId) userData.block = blockId;
    if (supervisorId) userData.supervisor = supervisorId;

    const user = await User.create(userData);

    await logAudit({
      actor: req.user._id,
      action: 'user.create',
      targetType: 'User',
      targetId: user._id,
      changes: { after: { name: user.name, email: user.email, role: user.role } },
      req,
    });

    const result = user.toJSON();
    return res.status(201).json({ user: result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/:id
 * HEAD or self.
 */
const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Only head can view other users; students/faculty can only view themselves
    if (req.user.role !== 'head' && req.user._id.toString() !== id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const user = await User.findById(id)
      .select('-password -passwordResetToken -passwordResetExpires')
      .populate('block', 'name code')
      .populate('supervisor', 'name email');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/users/:id
 * HEAD only. Partial update.
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, blockId, supervisorId, isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const before = { name: user.name, email: user.email, block: user.block, isActive: user.isActive };

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (blockId !== undefined) user.block = blockId || null;
    if (supervisorId !== undefined) user.supervisor = supervisorId || null;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save({ validateModifiedOnly: true });

    const after = { name: user.name, email: user.email, block: user.block, isActive: user.isActive };

    await logAudit({
      actor: req.user._id,
      action: 'user.update',
      targetType: 'User',
      targetId: user._id,
      changes: { before, after },
      req,
    });

    const result = await User.findById(id)
      .select('-password -passwordResetToken -passwordResetExpires')
      .populate('block', 'name code')
      .populate('supervisor', 'name email');

    return res.status(200).json({ user: result });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/:id/deactivate
 * HEAD only.
 */
const deactivateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user._id.toString() === id) {
      return res.status(400).json({ message: 'You cannot deactivate your own account.' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true, select: '-password -passwordResetToken -passwordResetExpires' }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await logAudit({
      actor: req.user._id,
      action: 'user.deactivate',
      targetType: 'User',
      targetId: user._id,
      req,
    });

    return res.status(200).json({ message: 'User deactivated.', user });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/:id/activate
 * HEAD only.
 */
const activateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true, select: '-password -passwordResetToken -passwordResetExpires' }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await logAudit({
      actor: req.user._id,
      action: 'user.activate',
      targetType: 'User',
      targetId: user._id,
      req,
    });

    return res.status(200).json({ message: 'User activated.', user });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/users/bulk-import
 * HEAD only. Parses multipart CSV, creates users in bulk.
 */
const bulkImport = [
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No CSV file uploaded.' });
      }

      let rows;
      try {
        rows = parseCSV(req.file.buffer);
      } catch (parseErr) {
        return res.status(400).json({ message: 'Failed to parse CSV file.', error: parseErr.message });
      }

      if (rows.length === 0) {
        return res.status(400).json({ message: 'CSV file is empty or has no data rows.' });
      }

      if (rows.length > 500) {
        return res.status(400).json({ message: 'CSV file cannot exceed 500 rows per import.' });
      }

      const results = { created: 0, failed: 0, errors: [] };

      const promises = rows.map(async (row, index) => {
        const rowNum = index + 2; // 1-based + header row

        // Validate row
        const { valid, errors: rowErrors } = validateStudentRow(row);
        if (!valid) {
          return { success: false, rowNum, reason: rowErrors.join('; ') };
        }

        // Look up block by code
        const block = await Block.findOne({ code: row.blockCode.toUpperCase(), isActive: true });
        if (!block) {
          return { success: false, rowNum, reason: `Block with code '${row.blockCode}' not found.` };
        }

        // Look up supervisor if provided
        let supervisorId;
        if (row.supervisorEmail) {
          const supervisor = await User.findOne({
            email: row.supervisorEmail.toLowerCase(),
            role: 'faculty',
            isActive: true,
          });
          if (!supervisor) {
            return {
              success: false,
              rowNum,
              reason: `Supervisor with email '${row.supervisorEmail}' not found.`,
            };
          }
          supervisorId = supervisor._id;
        }

        // Generate default password from studentId
        const defaultPassword = `${row.studentId}@CMES!`;

        try {
          await User.create({
            name: row.name,
            email: row.email.toLowerCase(),
            password: defaultPassword,
            role: 'student',
            studentId: row.studentId.toUpperCase(),
            block: block._id,
            supervisor: supervisorId,
          });
          return { success: true };
        } catch (createErr) {
          if (createErr.code === 11000) {
            return {
              success: false,
              rowNum,
              reason: `Duplicate email or studentId: ${row.email} / ${row.studentId}`,
            };
          }
          return { success: false, rowNum, reason: createErr.message };
        }
      });

      const settled = await Promise.allSettled(promises);

      settled.forEach((result) => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            results.created++;
          } else {
            results.failed++;
            results.errors.push({ row: result.value.rowNum, reason: result.value.reason });
          }
        } else {
          results.failed++;
          results.errors.push({ row: '?', reason: result.reason?.message || 'Unknown error' });
        }
      });

      await logAudit({
        actor: req.user._id,
        action: 'user.bulk_import',
        targetType: 'User',
        changes: { after: { created: results.created, failed: results.failed } },
        req,
      });

      return res.status(200).json(results);
    } catch (err) {
      next(err);
    }
  },
];

module.exports = { listUsers, createUser, getUser, updateUser, deactivateUser, activateUser, bulkImport };
