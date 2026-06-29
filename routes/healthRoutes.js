const express        = require('express');
const router         = express.Router();
const ctrl           = require('../controllers/healthController');
const AuthMiddleware = require('../middleware/authMiddleware');

router.use(AuthMiddleware.protect);

router.get('/score', (req, res, next) => ctrl.getScore(req, res).catch(next));

module.exports = router;
