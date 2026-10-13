const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { logAudit } = require('../utils/audit');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * POST /api/auth/login
 * Validates credentials, signs JWT, sets httpOnly cookie.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user + select password (excluded by default)
    const user = await User.findOne({ email: email.toLowerCase(), isActive: true }).select(
      '+password'
    );

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Sign JWT — only embed _id and role (never trusts client-supplied values)
    const token = jwt.sign(
      { _id: user._id.toString(), role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Update lastLoginAt
    user.lastLoginAt = new Date();
    await user.save({ validateModifiedOnly: true });

    res.cookie('token', token, COOKIE_OPTIONS);

    return res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 * Clears the httpOnly cookie.
 */
const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  return res.status(200).json({ message: 'Logged out successfully.' });
};

/**
 * GET /api/auth/me
 * Returns the currently authenticated user (populated from DB).
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -passwordResetToken -passwordResetExpires')
      .populate('block', 'name code')
      .populate('supervisor', 'name email');

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive.' });
    }

    return res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/forgot-password
 * Generates a reset token, stores hash in DB, sends email.
 * Always returns 200 to prevent user enumeration.
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // Generate random token
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      user.passwordResetToken = hashedToken;
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save({ validateModifiedOnly: true });

      const resetURL = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${rawToken}`;

      // Send email (falls back to console log in dev if SMTP not configured)
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587', 10),
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: process.env.SMTP_USER || 'noreply@cmes.edu',
          to: user.email,
          subject: 'CMES — Password Reset Request',
          html: `<p>You requested a password reset. Click the link below to reset your password:</p>
                 <p><a href="${resetURL}">${resetURL}</a></p>
                 <p>This link expires in 1 hour.</p>
                 <p>If you did not request this, please ignore this email.</p>`,
        });
      } catch (emailErr) {
        // In development, log the reset URL to console
        if (process.env.NODE_ENV !== 'production') {
          console.log('[dev] Password reset URL:', resetURL);
        }
      }
    }

    // Always respond 200 — don't reveal whether email exists
    return res.status(200).json({
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/reset-password/:token
 * Validates the reset token and sets the new password.
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
    }

    // Pre-save hook will hash the new password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    await logAudit({
      actor: user._id,
      action: 'auth.password_reset',
      targetType: 'User',
      targetId: user._id,
      req,
    });

    return res.status(200).json({ message: 'Password reset successfully. Please log in.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, logout, getMe, forgotPassword, resetPassword };
