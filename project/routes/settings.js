const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

router.get('/', settingsController.getSchemes);

router.post('/add-scheme', settingsController.addScheme);

router.get('/delete-scheme/:scheme_id', settingsController.deleteScheme);

router.get('/sizes', settingsController.getSizes);

router.post('/add-size', settingsController.addSize);

router.get('/delete-size/:size_id', settingsController.deleteSize);

module.exports = router;