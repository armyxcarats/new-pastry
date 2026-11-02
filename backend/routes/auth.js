const express = require('express');
const router = express.Router();
const upload = require("../utils/multer");
const User = require('../models/user');
const sendToken = require('../utils/jwtToken');
const { getFirebaseAdminAuth } = require('../config/firebaseAdmin');
const {
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword,
    getUserProfile,
    updateProfile,
    updatePassword,
    allUsers,
    getUserDetails,
    deleteUser,
    updateUser,
    logout,

} = require('../controllers/auth');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth')

router.post('/register', upload.single("avatar"), registerUser);
router.post('/login', loginUser);
router.post('/social-login', async (req, res) => {
    const { provider, idToken } = req.body || {};
    const normalizedProvider = String(provider || '').trim().toLowerCase();
    const providerIds = {
        google: 'google.com',
        facebook: 'facebook.com'
    };

    if (!providerIds[normalizedProvider] || !idToken) {
        return res.status(400).json({
            success: false,
            message: 'A supported provider and sign-in token are required.'
        });
    }

    try {
        const decodedToken = await getFirebaseAdminAuth().verifyIdToken(idToken, true);
        const email = String(decodedToken.email || '').trim().toLowerCase();

        if (decodedToken.firebase?.sign_in_provider !== providerIds[normalizedProvider] || !decodedToken.uid || !email) {
            return res.status(401).json({
                success: false,
                message: 'The social sign-in token is invalid for this provider or has no email.'
            });
        }

        let user = await User.findOne({ firebaseUid: decodedToken.uid }).select('+firebaseUid');

        if (!user) {
            user = await User.findOne({ email }).select('+firebaseUid');

            if (user) {
                if (!decodedToken.email_verified) {
                    return res.status(409).json({
                        success: false,
                        message: 'This email already has an account. Sign in with its password before linking social sign-in.'
                    });
                }

                if (user.firebaseUid && user.firebaseUid !== decodedToken.uid) {
                    return res.status(409).json({
                        success: false,
                        message: 'This account is already linked to a different social identity.'
                    });
                }

                user.firebaseUid = decodedToken.uid;
                await user.save();
            } else {
                user = await User.create({
                    name: decodedToken.name || `${normalizedProvider[0].toUpperCase()}${normalizedProvider.slice(1)} User`,
                    email,
                    firebaseUid: decodedToken.uid,
                    password: require('crypto').randomBytes(24).toString('hex'),
                    avatar: decodedToken.picture ? {
                        public_id: `${normalizedProvider}-${decodedToken.uid}`,
                        url: decodedToken.picture
                    } : undefined,
                    isVerified: decodedToken.email_verified === true
                });
            }
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'This account has been deactivated. Please contact an administrator.'
            });
        }

        sendToken(user, 200, res);
    } catch (error) {
        console.error('Social login failed:', error.message);

        if (error.code === 'firebase-admin/not-configured') {
            return res.status(503).json({
                success: false,
                message: 'Social sign-in is not configured on the server.'
            });
        }

        if (error.code?.startsWith('auth/')) {
            return res.status(401).json({
                success: false,
                message: 'The social sign-in token is invalid or expired. Please try again.'
            });
        }

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'This account could not be linked safely. Sign in with your existing account.'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Unable to complete social sign-in right now.'
        });
    }
});
router.post('/password/forgot', forgotPassword);
router.put('/password/reset/:token', resetPassword);
router.get('/me', isAuthenticatedUser, getUserProfile)
router.put('/me/update', isAuthenticatedUser, upload.single("avatar"), updateProfile)
router.put('/password/update', isAuthenticatedUser, updatePassword)
router.get('/admin/users', isAuthenticatedUser, authorizeRoles('admin'), allUsers)

router.route('/admin/user/:id')
    .get(isAuthenticatedUser, authorizeRoles('admin'), getUserDetails)
    .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteUser)
    .put(isAuthenticatedUser, authorizeRoles('admin'), updateUser)
router.get('/logout', logout);
module.exports = router;