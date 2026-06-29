const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const User   = require('../models/User');



function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

class AuthMiddleware {
  
  static async protect(req, res, next) {
    let token;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Silakan login terlebih dahulu.'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password -refreshTokenHash');

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User tidak ditemukan.' });
      }

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token sudah kadaluarsa. Silakan refresh token atau login ulang.',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(401).json({ success: false, message: 'Token tidak valid.' });
    }
  }

  
  static generateAccessToken(id) {
    return jwt.sign({ id, type: 'access' }, process.env.JWT_SECRET, { expiresIn: '15m' });
  }

  
  static async generateAndSaveRefreshToken(userId) {
    const refreshToken = jwt.sign(
      { id: userId, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    
    const tokenHash = hashToken(refreshToken);
    await User.findByIdAndUpdate(userId, { refreshTokenHash: tokenHash });

    return refreshToken;
  }

  
  static async verifyAndRotateRefreshToken(refreshToken) {
    
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      throw new Error('Refresh token tidak valid atau sudah kadaluarsa.');
    }

    if (decoded.type !== 'refresh') {
      throw new Error('Token tidak sesuai tipe.');
    }

    
    const user = await User.findById(decoded.id).select('+refreshTokenHash');
    if (!user) throw new Error('User tidak ditemukan.');

    const incomingHash = hashToken(refreshToken);
    if (!user.refreshTokenHash || user.refreshTokenHash !== incomingHash) {
      
      
      await User.findByIdAndUpdate(decoded.id, { refreshTokenHash: null });
      throw new Error('Refresh token sudah tidak valid. Silakan login ulang.');
    }

    
    const newRefreshToken = await AuthMiddleware.generateAndSaveRefreshToken(decoded.id);
    const newAccessToken  = AuthMiddleware.generateAccessToken(decoded.id);

    return { user, newAccessToken, newRefreshToken };
  }

  
  static async revokeRefreshToken(userId) {
    await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
  }

  
  static generateToken(id) {
    return AuthMiddleware.generateAccessToken(id);
  }

  
  static sendTokenCookie(res, token) {
    res.cookie('token', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',    
      maxAge:   15 * 60 * 1000
    });
  }

  static sendRefreshTokenCookie(res, refreshToken) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict', 
      maxAge:   7 * 24 * 60 * 60 * 1000,
      path:     '/api/auth/refresh'
    });
  }

  static clearAuthCookies(res) {
    res.cookie('token',        '', { expires: new Date(0), httpOnly: true });
    res.cookie('refreshToken', '', { expires: new Date(0), httpOnly: true, path: '/api/auth/refresh' });
  }
}

module.exports = AuthMiddleware;
