const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');

router.get('/support', supportController.getSupport);

module.exports = router;