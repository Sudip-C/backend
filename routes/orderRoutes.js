const express = require('express');
const router = express.Router();
const orderController = require('../controller/orderController');

router.get('/pending_orders', orderController.getPendingOrders);

router.get('/completed_orders', orderController.getCompletedOrders);

router.post('/orders', orderController.addOrder);

module.exports = router;
