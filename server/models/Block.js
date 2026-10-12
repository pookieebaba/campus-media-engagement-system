const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Block name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Block name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Block code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [20, 'Block code cannot exceed 20 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Uniqueness is enforced by schema field options; add extra indexes here
blockSchema.index({ isActive: 1 });

module.exports = mongoose.model('Block', blockSchema);
