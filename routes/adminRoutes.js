const {adminAuthReg, adminAuthLogin} = require('../services/adminAuthService');
const express = require('express');
const router = express.Router();

router.post('/register', adminAuthReg);
router.post('/login', adminAuthLogin);

module.exports = router;