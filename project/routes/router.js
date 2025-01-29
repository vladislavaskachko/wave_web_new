var express = require('express');
var path = require('path');  
var router = express.Router();
var authController = require('../controllers/authController');
var notificationController = require('../controllers/notificationController'); 
var supportController = require('../controllers/supportController');
var attendanceController = require('../controllers/attendanceController');

router.post('/auth/login', authController.login);

router.get('/api/notifications', notificationController.getNotifications);

router.get('/api/support', supportController.getSupport);

router.get('/api/attendance', attendanceController.getAttendance);


router.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

router.use(express.static(path.join(__dirname, '..', 'public'))); 

module.exports = router;