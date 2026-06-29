const express        = require('express');
const router         = express.Router();
const ctrl           = require('../controllers/summaryController');
const AuthMiddleware = require('../middleware/authMiddleware');

router.use(AuthMiddleware.protect);


router.get('/',       (req, res, next) => ctrl.getMonthly(req, res).catch(next));
router.get('/chart',  (req, res, next) => ctrl.getChartData(req, res).catch(next));

module.exports = router;
