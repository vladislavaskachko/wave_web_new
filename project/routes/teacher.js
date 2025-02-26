const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');

router.get('/teachers', teacherController.getTeachers);

module.exports = router;