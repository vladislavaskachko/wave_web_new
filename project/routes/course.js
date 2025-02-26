const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

router.get('/courses', courseController.getCourses);
router.post('/courses', courseController.addCourse);
router.put('/courses', courseController.updateCourse);
router.delete('/courses/:course_id', courseController.deleteCourse);

module.exports = router;
