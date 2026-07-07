const express = require('express');
const router = express.Router();
const {register, Login, allUser,  passwordResetToken, passwordReset} = require('../services/authService');
const regmiddleware = require('../middelware/registerValidator')

router.post('/register', regmiddleware,register);
router.post('/login', Login);
router.get('/allUser', allUser);
router.post('/password-reset', passwordReset);
router.post('/get-reset-token', passwordResetToken);


module.exports = router;