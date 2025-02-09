var express = require('express');
var path = require('path');  
var router = express.Router();
var authController = require('../controllers/authController');
var notificationController = require('../controllers/notificationController'); 
var supportController = require('../controllers/supportController');
var attendanceController = require('../controllers/attendanceController');
var paymentController = require('../controllers/paymentController');

router.post('/auth/login', authController.login);

router.get('/api/notifications', notificationController.getNotifications);

router.post('/api/notifications', notificationController.addNotification);

router.get('/api/support', supportController.getSupport);
router.get('/api/groups', paymentController.getGroups);
router.get('/api/students/:groupName', paymentController.getStudentsByGroup);
router.post('/api/payments/add-payment', paymentController.addPayment);
router.get('/api/payments/export/:groupName', paymentController.exportPaymentsToExcel); 
router.get('/api/payments/:studentId', paymentController.getPaymentsForStudent);


router.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

router.use(express.static(path.join(__dirname, '..', 'public'))); 

module.exports = router;