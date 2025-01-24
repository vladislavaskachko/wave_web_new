var express = require('express');
var path = require('path');  
var router = express.Router();
var authController = require('../controllers/authController');
var notificationController = require('../controllers/notificationController'); 

router.post('/auth/login', authController.login);

router.get('/api/notifications', notificationController.getNotifications);


router.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

router.use(express.static(path.join(__dirname, '..', 'public'))); 

module.exports = router;