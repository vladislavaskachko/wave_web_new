const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupsController');

router.get('/groups', groupController.getGroups);
router.get('/groups/course/:courseId', groupController.getGroupsByCourse);
router.post('/groups', groupController.addGroup);
router.put('/groups/:id', groupController.updateGroup);
router.delete('/groups/:id', groupController.deleteGroup);

module.exports = router;
;