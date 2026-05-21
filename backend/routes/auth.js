const express = require('express');
const { register, login, getLeaders } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/leaders', auth, getLeaders);

module.exports = router;
