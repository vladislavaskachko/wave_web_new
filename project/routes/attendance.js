var express = require('express');
var router = express.Router();
var attendanceController = require('../controllers/attendanceController');

router.get('/attendance', attendanceController.getAttendance);

module.exports = router;