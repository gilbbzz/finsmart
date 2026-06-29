const store = new Map(); 

/**
 * createRateLimiter(options) → Express middleware
 *
 * @param {number} windowMs  
 * @param {number} maxRequests 
 * @param {string} message  
 */
function createRateLimiter({
  windowMs    = 15 * 60 * 1000, 
  maxRequests = 10,
  message     = 'Terlalu banyak percobaan. Silakan coba lagi nanti.'
} = {}) {
  return function rateLimiter(req, res, next) {
    
    const ip  = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    const record = store.get(ip);

    
    if (!record || now - record.firstRequestAt > windowMs) {
      store.set(ip, { count: 1, firstRequestAt: now });
      return next();
    }

    
    record.count += 1;

    if (record.count > maxRequests) {
      const retryAfterSec = Math.ceil((record.firstRequestAt + windowMs - now) / 1000);
      res.set('Retry-After', retryAfterSec);
      return res.status(429).json({
        success: false,
        message,
        retryAfter: retryAfterSec
      });
    }

    next();
  };
}



/** Untuk /api/auth/login & /api/auth/register: 10 percobaan / 15 menit */
const authLimiter = createRateLimiter({
  windowMs:    15 * 60 * 1000,
  maxRequests: 10,
  message:     'Terlalu banyak percobaan login/register. Coba lagi dalam 15 menit.'
});

/** Untuk endpoint sensitif lain (misal ganti password): 5 percobaan / 15 menit */
const sensitiveActionLimiter = createRateLimiter({
  windowMs:    15 * 60 * 1000,
  maxRequests: 5,
  message:     'Terlalu banyak permintaan. Coba lagi dalam 15 menit.'
});

module.exports = { authLimiter, sensitiveActionLimiter };
