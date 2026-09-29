const { Router } = require('express');
const controller = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/authJwt');

const router = Router();

router.post('/login', controller.login);
router.post('/logout', verifyToken, controller.logout);
router.get('/userinfo', verifyToken, controller.userinfo);

module.exports = router;
