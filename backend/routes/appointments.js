const express = require('express');
const { requestAppointment, getAppointments, updateStatus } = require('../controllers/appointmentController');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, requestAppointment);
router.get('/', auth, getAppointments);
router.patch('/:id', auth, authorize(['secretary', 'leadership']), updateStatus);

module.exports = router;
