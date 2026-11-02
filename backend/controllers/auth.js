const User = require('../models/user');
const crypto = require('crypto')
const cloudinary = require('cloudinary')
const sendEmail = require('../utils/sendEmail')
const sendToken = require('../utils/jwtToken');
const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');

const saveAvatarImage = async (dataUrl, req) => {
    const match = typeof dataUrl === 'string'
        ? dataUrl.match(/^data:image\/(png|jpeg|webp|gif);base64,([a-z0-9+/]+=*)$/i)
        : null;
    if (!match) {
        const error = new Error('Choose a valid PNG, JPEG, WEBP, or GIF profile image.');
        error.statusCode = 400;
        throw error;
    }

    const imageBuffer = Buffer.from(match[2], 'base64');
    if (!imageBuffer.length || imageBuffer.length > 5 * 1024 * 1024) {
        const error = new Error('Profile images must be smaller than 5 MB.');
        error.statusCode = 400;
        throw error;
    }

    const extension = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
    const fileName = `${randomUUID()}.${extension}`;
    const uploadDirectory = path.resolve(__dirname, '..', 'uploads', 'avatars');
    await fs.mkdir(uploadDirectory, { recursive: true });
    await fs.writeFile(path.join(uploadDirectory, fileName), imageBuffer);

    return {
        public_id: fileName,
        url: `${req.protocol}://${req.get('host')}/uploads/avatars/${fileName}`
    };
};

const removeLocalAvatar = async (avatar) => {
    if (!avatar?.public_id || !avatar.url?.includes('/uploads/avatars/')) return;

    const uploadDirectory = path.resolve(__dirname, '..', 'uploads', 'avatars');
    const filePath = path.resolve(uploadDirectory, path.basename(avatar.public_id));
    if (path.dirname(filePath) !== uploadDirectory) return;
    await fs.unlink(filePath).catch((error) => {
        if (error.code !== 'ENOENT') throw error;
    });
};

const normalizeAllergies = (value) => {
    const entries = Array.isArray(value) ? value : String(value || '').split(/[,\n]/);
    return [...new Set(entries.map((allergy) => String(allergy).trim()).filter(Boolean))];
};

exports.registerUser = async (req, res, next) => {
    const { name, email, password } = req.body;
    let avatar;
    let avatarUploadWarning = false;

    if (req.body.avatar) {
        if (cloudinary.config().cloud_name) {
            try {
                const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
                    folder: 'avatars',
                    width: 150,
                    crop: 'scale'
                });
                avatar = {
                    public_id: result.public_id,
                    url: result.secure_url
                };
            } catch (error) {
                console.error('Registration avatar upload failed:', error.message);
                avatarUploadWarning = true;
            }
        } else {
            avatarUploadWarning = true;
        }
    }

    try {
        const user = await User.create({
            name,
            email,
            password,
            ...(avatar && { avatar })
        });

        return res.status(201).json({
            success: true,
            user,
            token: user.getJwtToken(),
            avatarUploadWarning
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists.'
            });
        }

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        console.error('User registration failed:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Unable to create your account right now. Please try again.'
        });
    }
}

exports.loginUser = async (req, res, next) => {
    const { email, password } = req.body;

    // Checks if email and password is entered by user
    if (!email || !password) {
        return res.status(400).json({ error: 'Please enter email & password' })
    }


    // Finding user in database

    let user = await User.findOne({ email }).select('+password')
    if (!user) {
        return res.status(401).json({ message: 'Invalid Email or Password' })
    }

    if (!user.isActive) {
        return res.status(403).json({ message: 'This account has been deactivated. Please contact an administrator.' })
    }

    // Checks if password is correct or not
    const isPasswordMatched = await user.comparePassword(password);


    if (!isPasswordMatched) {
        return res.status(401).json({ message: 'Invalid Email or Password' })
    }
    const token = user.getJwtToken();

    // res.status(201).json({
    //     success: true,
    //     token,
    //     user
    // });
    user = await User.findOne({ email })
    sendToken(user, 200, res)
}

exports.forgotPassword = async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return res.status(404).json({ error: 'User not found with this email' })

    }
    // Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });
    // Create reset password url
    const requestOrigin = req.get('origin');
    const frontendOrigin = /^http:\/\/(?:localhost|127\.0\.0\.1):\d+$/.test(requestOrigin || '')
        ? requestOrigin
        : 'http://localhost:5173';
    const resetUrl = `${frontendOrigin}/password/reset/${resetToken}`;
    const message = `Your password reset token is as follow:\n\n${resetUrl}\n\nIf you have not requested this email, then ignore it.`
    try {
        await sendEmail({
            email: user.email,
            subject: 'ShopIT Password Recovery',
            message
        })

        res.status(200).json({
            success: true,
            message: `Email sent to: ${user.email}`
        })

    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.warn('Password reset email unavailable in development:', error.message);
            return res.status(200).json({
                success: true,
                message: 'Email could not be sent in development. Use the local reset link below; it expires in 30 minutes.',
                developmentResetUrl: resetUrl
            });
        }

        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        if (error.statusCode === 503) {
            return res.status(503).json({ error: error.message });
        }
        console.error('Password reset email delivery failed:', error.message);
        return res.status(500).json({
            error: 'Unable to send the password reset email. Please try again later.'
        });

    }
}

exports.resetPassword = async (req, res, next) => {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    })
    if (!user) {
        return res.status(400).json({ message: 'Password reset token is invalid or has been expired' })

    }

    if (req.body.password !== req.body.confirmPassword) {
        return res.status(400).json({ message: 'Password does not match' })

    }

    // Setup new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    const token = user.getJwtToken();
    return res.status(201).json({
        success: true,
        token,
        user
    });

}

exports.getUserProfile = async (req, res, next) => {
    const user = await User.findById(req.user.id);
    console.log(user)

    return res.status(200).json({
        success: true,
        user
    })
}

exports.updateProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        user.name = req.body.name;
        user.email = req.body.email;
        user.phoneNumber = req.body.phoneNumber || '';
        user.deliveryAddress = req.body.deliveryAddress || '';
        if (req.body.hasAllergies !== undefined) {
            user.hasAllergies = req.body.hasAllergies === true || req.body.hasAllergies === 'true';
            user.allergies = user.hasAllergies ? normalizeAllergies(req.body.allergies) : [];
            if (user.hasAllergies && !user.allergies.length) {
                return res.status(400).json({
                    success: false,
                    message: 'Please list at least one allergy, or choose "No allergies".'
                });
            }
            if (user.allergies.some((allergy) => allergy.length > 80) || user.allergies.length > 20) {
                return res.status(400).json({
                    success: false,
                    message: 'List up to 20 allergies, with each entry no longer than 80 characters.'
                });
            }
        }

        let newAvatar;
        if (req.body.avatar) {
            newAvatar = await saveAvatarImage(req.body.avatar, req);
        }

        const previousAvatar = user.avatar?.toObject?.() || user.avatar;
        if (newAvatar) user.avatar = newAvatar;

        try {
            await user.save();
        } catch (error) {
            if (newAvatar) {
                await removeLocalAvatar(newAvatar).catch((cleanupError) => {
                    console.error('Failed to clean up an unsaved profile image:', cleanupError.message);
                });
            }
            throw error;
        }

        if (newAvatar) {
            await removeLocalAvatar(previousAvatar).catch((error) => {
                console.error('Failed to remove the previous local profile image:', error.message);
            });
        }

        return res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error('Profile update failed:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to update your profile right now.' });
    }
}

exports.updatePassword = async (req, res, next) => {
    console.log(req.body.password)
    const user = await User.findById(req.user.id).select('+password');
    // Check previous user password
    const isMatched = await user.comparePassword(req.body.oldPassword)
    if (!isMatched) {
        return res.status(400).json({ message: 'Old password is incorrect' })
    }
    user.password = req.body.password;
    await user.save();
    const token = user.getJwtToken();

    return res.status(201).json({
        success: true,
        user,
        token
    });

}

exports.allUsers = async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({
        success: true,
        users
    })
}

exports.deleteUser = async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({ message: `User not found with id: ${req.params.id}` })
    }

    if (user._id.equals(req.user._id)) {
        return res.status(400).json({ message: 'You cannot delete your own account from user management.' });
    }

    if (user.role === 'admin' && user.isActive) {
        const activeAdmins = await User.countDocuments({
            role: 'admin',
            $or: [{ isActive: true }, { isActive: { $exists: false } }]
        });
        if (activeAdmins <= 1) {
            return res.status(400).json({ message: 'The last active admin account cannot be deleted.' });
        }
    }

    if (user.avatar?.public_id && cloudinary.config().cloud_name) {
        await cloudinary.v2.uploader.destroy(user.avatar.public_id);
    }
    await User.findByIdAndDelete(req.params.id);
    return res.status(200).json({
        success: true,
    })
}

exports.getUserDetails = async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(400).json({ message: `User does not found with id: ${req.params.id}` })
        // return next(new ErrorHandler(`User does not found with id: ${req.params.id}`))
    }

    res.status(200).json({
        success: true,
        user
    })
}

exports.updateUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const nextRole = req.body.role ?? user.role;
        const nextIsActive = req.body.isActive ?? user.isActive;
        const isSelf = user._id.equals(req.user._id);

        if (isSelf && (nextRole !== 'admin' || nextIsActive !== true)) {
            return res.status(400).json({ success: false, message: 'You cannot remove your own admin access or deactivate your account.' });
        }

        if (user.role === 'admin' && user.isActive && (nextRole !== 'admin' || !nextIsActive)) {
            const activeAdmins = await User.countDocuments({
                role: 'admin',
                $or: [{ isActive: true }, { isActive: { $exists: false } }]
            });
            if (activeAdmins <= 1) {
                return res.status(400).json({ success: false, message: 'The last active admin account cannot be demoted or deactivated.' });
            }
        }

        if (req.body.name !== undefined) user.name = req.body.name;
        if (req.body.email !== undefined) user.email = req.body.email;
        if (req.body.phoneNumber !== undefined) user.phoneNumber = req.body.phoneNumber;
        if (req.body.deliveryAddress !== undefined) user.deliveryAddress = req.body.deliveryAddress;
        if (req.body.hasAllergies !== undefined) {
            user.hasAllergies = req.body.hasAllergies === true || req.body.hasAllergies === 'true';
            user.allergies = user.hasAllergies ? normalizeAllergies(req.body.allergies) : [];
            if (user.hasAllergies && !user.allergies.length) {
                return res.status(400).json({
                    success: false,
                    message: 'Please list at least one allergy, or choose "No allergies".'
                });
            }
            if (user.allergies.some((allergy) => allergy.length > 80) || user.allergies.length > 20) {
                return res.status(400).json({
                    success: false,
                    message: 'List up to 20 allergies, with each entry no longer than 80 characters.'
                });
            }
        }
        user.role = nextRole;
        user.isActive = nextIsActive;

        await user.save();

        return res.status(200).json({ success: true, user });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error('Admin user update failed:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to update this user right now.' });
    }
}

exports.logout = async (req, res, next) => {
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('token', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax'
    })

    return res.status(200).json({
        success: true,
        message: 'Logged out'
    })
}