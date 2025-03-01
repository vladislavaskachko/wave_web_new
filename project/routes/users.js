const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/add', userController.addUser);
router.get('/', userController.getUsers);
router.delete('/:id', userController.deleteUser);
router.get('/', userController.getUserDetails);

module.exports = router;