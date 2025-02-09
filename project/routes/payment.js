const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.get('/groups', paymentController.getGroups);
router.get('/students/:groupName', paymentController.getStudentsByGroup);
router.post('/payments', paymentController.addPayment);
router.get('/payments/export/:groupName', paymentController.exportPaymentsToExcel);
router.get('/payments', paymentController.getPaymentsForStudent)

module.exports = router;