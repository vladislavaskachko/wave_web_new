const express = require('express');
const router = express.Router();
const courseController = require('../controllers/coursesController');

router.get('/courses', courseController.getCourses);
router.get('/courses-with-groups', courseController.getCoursesWithGroups);
router.post('/courses', courseController.addCourse);
router.put('/courses/:id', courseController.updateCourse);
router.delete('/courses/:id', courseController.deleteCourse);

module.exports = router;