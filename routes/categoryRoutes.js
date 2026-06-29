const express        = require('express');
const router         = express.Router();
const ctrl           = require('../controllers/categoryController');
const AuthMiddleware = require('../middleware/authMiddleware');

router.use(AuthMiddleware.protect);

router.get('/',        (req, res, next) => ctrl.getAll(req, res).catch(next));
router.post('/',       (req, res, next) => ctrl.create(req, res).catch(next));
router.delete('/:id',  (req, res, next) => ctrl.delete(req, res).catch(next));

module.exports = router;
