const express = require('express');
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/authSession');

const router = express.Router();

router.post('/login', authController.login);
router.post('/logout', requireAuth, authController.logout);
router.get('/profile', requireAuth, authController.profile);

module.exports = router;
