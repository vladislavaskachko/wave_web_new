const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');

router.get('/groups', groupController.getGroups);
router.post('/groups', groupController.addGroup);
router.put('/groups', groupController.updateGroup);
router.delete('/groups/:group_id', groupController.deleteGroup);

module.exports = router;