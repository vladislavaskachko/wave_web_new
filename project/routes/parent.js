const express = require('express');
const router = express.Router();
const parentsController = require('../controllers/parentsController');

router.get('/', parentsController.getParents);

module.exports = router;