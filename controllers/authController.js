const BaseController = require('./BaseController');
const User           = require('../models/User');
const Category       = require('../models/Category');
const AuthMiddleware = require('../middleware/authMiddleware');

const createDefaultCategories = (userId) => [
  { user: userId, name: 'Gaji',         icon: '💼', color: '#10b981', type: 'income',  isDefault: true },
  { user: userId, name: 'Freelance',    icon: '💻', color: '#6366f1', type: 'income',  isDefault: true },
  { user: userId, name: 'Makanan',      icon: '🍜', color: '#f59e0b', type: 'expense', isDefault: true },
  { user: userId, name: 'Transportasi', icon: '🚗', color: '#3b82f6', type: 'expense', isDefault: true },
  { user: userId, name: 'Belanja',      icon: '🛍️', color: '#ec4899', type: 'expense', isDefault: true },
  { user: userId, name: 'Kesehatan',    icon: '💊', color: '#ef4444', type: 'expense', isDefault: true },
  { user: userId, name: 'Pendidikan',   icon: '📚', color: '#8b5cf6', type: 'expense', isDefault: true },
  { user: userId, name: 'Hiburan',      icon: '🎮', color: '#06b6d4', type: 'expense', isDefault: true },
  { user: userId, name: 'Tagihan',      icon: '🧾', color: '#64748b', type: 'expense', isDefault: true },
  { user: userId, name: 'Lainnya',      icon: '📦', color: '#9ca3af', type: 'both',    isDefault: true },
];

class AuthController extends BaseController {
  constructor() { super(User); }

  
  async register(req, res) {
    try {
      const { name, email, password } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        
        if (existingUser.authProvider === 'google') {
          return this.sendError(res, 'Email ini sudah terdaftar melalui Google. Silakan login dengan Google.', 409);
        }
        return this.sendError(res, 'Email sudah terdaftar', 409);
      }

      const user = await User.create({ name, email, password, authProvider: 'local' });
      await Category.insertMany(createDefaultCategories(user._id));

      const accessToken  = AuthMiddleware.generateAccessToken(user._id);
      const refreshToken = await AuthMiddleware.generateAndSaveRefreshToken(user._id);

      AuthMiddleware.sendTokenCookie(res, accessToken);
      AuthMiddleware.sendRefreshTokenCookie(res, refreshToken);

      return this.sendSuccess(res, {
        _id:          user._id,
        name:         user.name,
        email:        user.email,
        authProvider: user.authProvider,
        avatar:       user.avatar
      }, 'Registrasi berhasil', 201);

    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return this.sendError(res, 'Email atau password salah', 401);
      }

      
      if (user.authProvider === 'google' && !user.password) {
        return this.sendError(res, 'Akun ini terdaftar melalui Google. Silakan login dengan Google.', 401);
      }

      if (!(await user.matchPassword(password))) {
        return this.sendError(res, 'Email atau password salah', 401);
      }

      const accessToken  = AuthMiddleware.generateAccessToken(user._id);
      const refreshToken = await AuthMiddleware.generateAndSaveRefreshToken(user._id);

      AuthMiddleware.sendTokenCookie(res, accessToken);
      AuthMiddleware.sendRefreshTokenCookie(res, refreshToken);

      return this.sendSuccess(res, {
        _id:          user._id,
        name:         user.name,
        email:        user.email,
        authProvider: user.authProvider,
        avatar:       user.avatar
      }, 'Login berhasil');

    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  
  
  async googleCallback(req, res) {
    try {
      const user = req.user;
      if (!user) {
        return res.redirect('/?error=google_auth_failed');
      }

      const accessToken  = AuthMiddleware.generateAccessToken(user._id);
      const refreshToken = await AuthMiddleware.generateAndSaveRefreshToken(user._id);

      AuthMiddleware.sendTokenCookie(res, accessToken);
      AuthMiddleware.sendRefreshTokenCookie(res, refreshToken);

      
      return res.redirect('/');

    } catch (error) {
      return res.redirect('/?error=server_error');
    }
  }

  
  async refresh(req, res) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!refreshToken) {
        return this.sendError(res, 'Refresh token tidak ditemukan. Silakan login ulang.', 401);
      }

      let result;
      try {
        result = await AuthMiddleware.verifyAndRotateRefreshToken(refreshToken);
      } catch (err) {
        return this.sendError(res, err.message, 401);
      }

      const { newAccessToken, newRefreshToken } = result;
      AuthMiddleware.sendTokenCookie(res, newAccessToken);
      AuthMiddleware.sendRefreshTokenCookie(res, newRefreshToken);

      return this.sendSuccess(res, null, 'Token berhasil diperbarui');

    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  async logout(req, res) {
    if (req.user?._id) {
      await AuthMiddleware.revokeRefreshToken(req.user._id);
    }
    AuthMiddleware.clearAuthCookies(res);
    return this.sendSuccess(res, null, 'Logout berhasil');
  }

  
  async getMe(req, res) {
    try {
      const user = await User.findById(req.user._id);
      return this.sendSuccess(res, user);
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(req.user._id).select('+password');

      
      if (user.authProvider === 'google' && !user.password) {
        return this.sendError(res, 'Akun Google tidak dapat mengubah password dari sini.', 400);
      }

      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return this.sendError(res, 'Password lama tidak sesuai.', 401);
      }

      user.password = newPassword;
      await user.save();

      await AuthMiddleware.revokeRefreshToken(user._id);
      AuthMiddleware.clearAuthCookies(res);

      return this.sendSuccess(res, null, 'Password berhasil diubah. Silakan login ulang.');

    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }
}

const authController = new AuthController();
module.exports = authController;
