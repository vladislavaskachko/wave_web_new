var express = require('express');
var path = require('path');
var router = express.Router();
var authController = require('../controllers/authController');
var notificationController = require('../controllers/notificationController');
var supportController = require('../controllers/supportController');
var attendanceController = require('../controllers/attendanceController');
var attTeacherController = require('../controllers/attTeacherController');
var attParentController = require('../controllers/attParentController');
var scheduleDirectorController = require('../controllers/scheduleDirectorController');
var scheduleStudentController = require('../controllers/scheduleStudentController');
var scheduleParentController = require('../controllers/scheduleParentController');
var gradeStudentConroller = require('../controllers/gradeStudentController');
var settingsController = require('../controllers/settingsController');
const coursesController = require('../controllers/coursesController');
var groupsController = require('../controllers/groupsController');
var teacherController = require('../controllers/teacherController');
var studentController = require('../controllers/studentController');
var gradeTeacherController = require('../controllers/gradeTeacherController');
var gradeParentController = require('../controllers/gradeParentController');
var scheduleTeacherController = require('../controllers/scheduleTeacherController')
var userController = require('../controllers/userController')
const parentsController = require('../controllers/parentsController');
const paymentController = require('../controllers/paymentController');
const { group } = require('console');

router.post('/auth/login', authController.login);
router.post('/auth/getRoles', authController.getRoles);

router.get('/api/notifications', notificationController.getNotifications);

router.post('/api/notifications', notificationController.addNotification);

router.get('/api/support', supportController.getSupport);

router.get('/api/attendance', attendanceController.getAttendance);
router.get('/api/parent/attendance', attParentController.getChildAttendance);

router.get('/api/teacher/groups', attTeacherController.getTeacherGroups);
router.get('/api/teacher/attendance', attTeacherController.getAttendance);
router.post('/api/teacher/updateAttendance', attTeacherController.updateAttendance);
router.post('/api/teacher/addLessonDate', attTeacherController.addLessonDate);
router.get('/api/teacher/lessons', attTeacherController.getLessonsByGroup);
router.post('/api/teacher/deleteLessonDate', attTeacherController.deleteLessonDate);

router.get('/api/teacher/schLessons', scheduleTeacherController.getLessonsForTeacher);

router.get('/api/director/days', scheduleDirectorController.getDays);
router.get('/api/director/rooms', scheduleDirectorController.getRooms);
router.get('/api/director/groups', scheduleDirectorController.getGroups);
router.post('/api/lessons', scheduleDirectorController.addLesson);
router.get('/api/lessons', scheduleDirectorController.getLessons);
router.delete('/api/lessons/:id', scheduleDirectorController.deleteLesson);

router.get('/api/student/lessons', scheduleStudentController.getLessons);

router.get('/api/parent/children', scheduleParentController.getChildren);
router.get('/api/parent/lessons', scheduleParentController.getLessons);

router.get('/api/parent/grades', gradeParentController.getGrades);

router.get('/api/student/grades', gradeStudentConroller.getGrades);
router.get('/api/teacher/tests', gradeTeacherController.getTestsByGroup);
router.get('/api/teacher/grades', gradeTeacherController.getGrades);
router.get('/api/teacher/students', gradeTeacherController.getStudents);
router.delete('/api/teacher/deleteTests', gradeTeacherController.deleteTest);
router.post('/api/teacher/createTest', gradeTeacherController.createTest);
router.post('/api/teacher/visitMarks', gradeTeacherController.addTestVisit);

router.get('/api/settings/schemes', settingsController.getSchemes);
router.post('/api/settings/add-scheme', settingsController.addScheme);
router.get('/api/settings/delete-scheme/:scheme_id', settingsController.deleteScheme);
router.get('/api/settings/sizes', settingsController.getSizes);
router.post('/api/settings/add-size', settingsController.addSize);
router.get('/api/settings/delete-size/:size_id', settingsController.deleteSize);

router.get('/api/courses', coursesController.getCourses);
router.post('/api/courses', coursesController.addCourse);
router.put('/api/courses', coursesController.updateCourse);
router.delete('/api/courses/:course_id', coursesController.deleteCourse);

router.get('/api/groups', groupsController.getGroups);
router.post('/api/groups', groupsController.addGroup);
router.put('/api/groups', groupsController.updateGroup);
router.delete('/api/groups/:group_id', groupsController.deleteGroup);

router.get('/api/teachers', teacherController.getTeachers);

router.get('/api/students', studentController.getStudents);
router.get('/api/students/by-group', studentController.getStudentsByGroup);

router.get('/api/parents', parentsController.getParents);

router.get('/api/users', userController.getUsers);
router.post('/api/users/add', userController.addUser);
router.post('/api/users/:id/archive', userController.archiveUser);
router.post('/api/users/:id/restore', userController.restoreUser);
router.get('/api/users/:id', userController.getUserDetails);
router.get('/api/users/get-archived', userController.getArchivedUsers);
router.get('/api/users/get-active', userController.getActiveUsers);

router.get('/api/courses-with-groups', coursesController.getCoursesWithGroups);

router.post('/api/payment', paymentController.addPayment);

router.get('/api/export/:groupName', paymentController.exportPayments);

router.get('/api/course-info/:studentName/:studentSurname', paymentController.getCourseAndPaymentsInfo);

router.get('/api/payments/:studentName/:studentSurname', paymentController.getStudentPayments);

router.post('/api/groups/add-child', groupsController.addChildToGroup);

router.get('/api/group-name-by-id', groupsController.getGroupNameById);



router.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '..', 'public', 'mainPage.html'));
});

router.use(express.static(path.join(__dirname, '..', 'public')));

module.exports = router;