const express = require('express');
const router = express.Router();
const supportController = require('../controllers/attTeacherController');

router.get('/attTeacher', attTeacherController.getSupport);

module.exports = router;