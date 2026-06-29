const express = require('express');
const router = express.Router();
const {register, Login} = require('../services/authService');

router.post('/register', register);
router.post('/login', Login);

module.exports = router;