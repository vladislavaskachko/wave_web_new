var express = require('express');
var path = require('path');  
var router = express.Router();
var authController = require('../controllers/authController');
var notificationController = require('../controllers/notificationController'); 
var supportController = require('../controllers/supportController');
var attendanceController = require('../controllers/attendanceController');
var attTeacherController = require('../controllers/attTeacherController');
var paymentController = require('../controllers/paymentController');
var scheduleDirectorController = require('../controllers/scheduleDirectorController');
var scheduleStudentController = require('../controllers/scheduleStudentController');
var scheduleParentController = require('../controllers/scheduleParentController');
var settingsController = require('../controllers/settingsController');


router.post('/auth/login', authController.login);

router.get('/api/notifications', notificationController.getNotifications);

router.post('/api/notifications', notificationController.addNotification);

router.get('/api/support', supportController.getSupport);
router.get('/api/groups', paymentController.getGroups);
router.get('/api/students/:groupName', paymentController.getStudentsByGroup);
router.post('/api/payments/add-payment', paymentController.addPayment);
router.get('/api/payments/export/:groupName', paymentController.exportPaymentsToExcel); 
router.get('/api/payments/:studentId', paymentController.getPaymentsForStudent);

router.get('/api/teacher/groups', attTeacherController.getTeacherGroups);
router.get('/api/teacher/attendance', attTeacherController.getAttendance);
router.post('/api/teacher/updateAttendance', attTeacherController.updateAttendance);
router.post('/api/teacher/addLessonDate', attTeacherController.addLessonDate);
router.get('/api/teacher/lessons', attTeacherController.getLessonsByGroup);
router.post('/api/teacher/deleteLessonDate', attTeacherController.deleteLessonDate);

router.get('/api/director/days', scheduleDirectorController.getDays);
router.get('/api/director/rooms', scheduleDirectorController.getRooms);
router.get('/api/director/groups', scheduleDirectorController.getGroups);
router.post('/api/lessons', scheduleDirectorController.addLesson);
router.get('/api/lessons', scheduleDirectorController.getLessons);
router.delete('/api/lessons/:id', scheduleDirectorController.deleteLesson);

router.get('/api/student/lessons', scheduleStudentController.getLessons);

router.get('/api/parent/children', scheduleParentController.getChildren);
router.get('/api/parent/lessons', scheduleParentController.getLessons);
/*router.get('/api/parent/schedule', scheduleParentController.getParentSchedule);*/

router.get('/api/settings/schemes', settingsController.getSchemes);
router.post('/api/settings/add-scheme', settingsController.addScheme);
router.get('/api/settings/delete-scheme/:scheme_id', settingsController.deleteScheme);
router.get('/api/settings/sizes', settingsController.getSizes);
router.post('/api/settings/add-size', settingsController.addSize);
router.get('/api/settings/delete-size/:size_id', settingsController.deleteSize);

router.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

router.use(express.static(path.join(__dirname, '..', 'public'))); 

module.exports = router;