const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');
const {
    getCatalogManagement,
    createCategory,
    updateCategory,
    setCategoryActive,
    createAddOn,
    updateAddOn,
    setAddOnActive
} = require('../controllers/catalog');

router.use('/admin/catalog-management', isAuthenticatedUser, authorizeRoles('admin'));
router.get('/admin/catalog-management', getCatalogManagement);
router.post('/admin/categories', isAuthenticatedUser, authorizeRoles('admin'), createCategory);
router.put('/admin/categories/:id', isAuthenticatedUser, authorizeRoles('admin'), updateCategory);
router.patch('/admin/categories/:id/active', isAuthenticatedUser, authorizeRoles('admin'), setCategoryActive);
router.post('/admin/addons', isAuthenticatedUser, authorizeRoles('admin'), createAddOn);
router.put('/admin/addons/:id', isAuthenticatedUser, authorizeRoles('admin'), updateAddOn);
router.patch('/admin/addons/:id/active', isAuthenticatedUser, authorizeRoles('admin'), setAddOnActive);

module.exports = router;
