const express = require('express');
const router = express.Router();
const upload = require("../utils/multer");

const {
    newProduct,
    getSingleProduct,
    getProductReviewEligibility,
    getProducts,
    updateProduct,
    deleteProducts,
    deleteProduct,
    getAdminProducts,
    getProductOptions,
    createProductReview,
    updateProductReview,
    getProductReviews,
    deleteReview,
    deleteOwnReview,
    productSales,



} = require('../controllers/product');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth')


router.post('/admin/product/new', isAuthenticatedUser, authorizeRoles('admin'), upload.array('images', 10), newProduct);
router.get('/product/:id/review-eligibility', isAuthenticatedUser, getProductReviewEligibility);
router.get('/product/:id', getSingleProduct)
router.get('/products', getProducts)
router.put('/admin/product/:id', isAuthenticatedUser, authorizeRoles('admin'), upload.array('images', 10), updateProduct);
router.delete('/admin/products', isAuthenticatedUser, authorizeRoles('admin'), deleteProducts);
router.delete('/admin/product/:id', isAuthenticatedUser, authorizeRoles('admin'), deleteProduct);
router.get('/admin/products', isAuthenticatedUser, authorizeRoles('admin'), getAdminProducts)
router.get('/admin/product-options', isAuthenticatedUser, authorizeRoles('admin'), getProductOptions)
router.post('/review', isAuthenticatedUser, createProductReview);
router.put('/review/:id', isAuthenticatedUser, updateProductReview);
router.delete('/review/:id', isAuthenticatedUser, deleteOwnReview);
router.get('/reviews', isAuthenticatedUser, authorizeRoles('admin'), getProductReviews)
router.delete('/reviews', isAuthenticatedUser, authorizeRoles('admin'), deleteReview)
router.get('/admin/product-sales', productSales);
module.exports = router