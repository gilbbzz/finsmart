const express        = require('express');
const router         = express.Router();
const passport       = require('passport');
const auth           = require('../controllers/authController');
const AuthMiddleware = require('../middleware/authMiddleware');
const { authLimiter, sensitiveActionLimiter } = require('../middleware/rateLimiter');
const { validateRegister, validateLogin, validateChangePassword } = require('../middleware/inputValidator');


router.post('/register',
  authLimiter,
  validateRegister,
  (req, res, next) => auth.register(req, res).catch(next)
);

router.post('/login',
  authLimiter,
  validateLogin,
  (req, res, next) => auth.login(req, res).catch(next)
);

router.post('/refresh',
  authLimiter,
  (req, res, next) => auth.refresh(req, res).catch(next)
);

router.post('/logout',
  AuthMiddleware.protect,
  (req, res, next) => auth.logout(req, res).catch(next)
);



router.get('/google',
  authLimiter,
  passport.authenticate('google', {
    scope:   ['profile', 'email'],
    session: false
  })
);


router.get('/google/callback',
  passport.authenticate('google', {
    session:      false,
    failureRedirect: '/?error=google_auth_failed'
  }),
  (req, res, next) => auth.googleCallback(req, res).catch(next)
);


router.get('/me',
  AuthMiddleware.protect,
  (req, res, next) => auth.getMe(req, res).catch(next)
);

router.put('/change-password',
  AuthMiddleware.protect,
  sensitiveActionLimiter,
  validateChangePassword,
  (req, res, next) => auth.changePassword(req, res).catch(next)
);

module.exports = router;
