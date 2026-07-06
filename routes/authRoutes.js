const express = require('express');
const router = express.Router();
const {register, Login, allUser} = require('../services/authService');
const regmiddleware = require('../middelware/registerValidator')

router.post('/register', regmiddleware,register);
router.post('/login', Login);
router.get('/allUser', allUser);


module.exports = router;