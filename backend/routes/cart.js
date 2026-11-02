const express = require('express');
const router = express.Router();
const { isAuthenticatedUser } = require('../middleware/auth');
const { getCart, saveCart } = require('../controllers/cart');

router.get('/cart', isAuthenticatedUser, getCart);
router.put('/cart', isAuthenticatedUser, saveCart);

module.exports = router;
