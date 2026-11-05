const Product = require('../models/product')
const Order = require('../models/order')
const Category = require('../models/category')
const AddOn = require('../models/addon')
const Review = require('../models/review')
const APIFeatures = require('../utils/apiFeatures');
const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');
const { Filter } = require('bad-words');

const badWordsFilter = new Filter();

const sanitizeReviewComment = (comment) => badWordsFilter.clean(comment || '');

const saveProductImages = async (images, req) => Promise.all(images.map(async (image) => {
    if (typeof image !== 'string') {
        const error = new Error('Each product image must be an image URL or image file.');
        error.statusCode = 400;
        throw error;
    }
    if (/^https?:\/\/\S+$/i.test(image)) {
        return { public_id: '', url: image };
    }
    const dataUrlMatch = image.match(/^data:image\/(png|jpeg|webp|gif);base64,([a-z0-9+/]+=*)$/i);
    if (!dataUrlMatch) {
        const error = new Error('Product images must be valid image URLs or image files.');
        error.statusCode = 400;
        throw error;
    }

    const extension = dataUrlMatch[1].toLowerCase() === 'jpeg'
        ? 'jpg'
        : dataUrlMatch[1].toLowerCase();
    const fileName = `${randomUUID()}.${extension}`;
    const uploadDirectory = path.resolve(__dirname, '..', 'uploads', 'products');
    await fs.mkdir(uploadDirectory, { recursive: true });
    await fs.writeFile(
        path.join(uploadDirectory, fileName),
        Buffer.from(dataUrlMatch[2], 'base64')
    );

    return {
        public_id: fileName,
        url: `${req.protocol}://${req.get('host')}/uploads/products/${fileName}`
    };
}));

const validateCustomizationOptions = (options) => {
    if (options == null) return null;
    if (!Array.isArray(options) || options.length > 3) {
        return 'Add up to three product options.';
    }
    const supportedTypes = new Set(['size', 'flavor', 'filling']);
    const types = new Set();
    for (const option of options) {
        if (!option || !supportedTypes.has(option.type) || types.has(option.type)
            || !String(option.name || '').trim() || !Array.isArray(option.values)
            || option.values.length === 0) {
            return 'Each product option needs a unique type, display name, and at least one choice.';
        }
        types.add(option.type);
        for (const value of option.values) {
            if (!String(value.label || '').trim() || String(value.label).length > 80
                || !Number.isFinite(Number(value.priceAdjustment || 0))) {
                return 'Each product option choice needs a label and a valid price adjustment.';
            }
        }
    }
    return null;
};

exports.newProduct = async (req, res, next) => {
    try {
        const body = { ...req.body };
        const images = body.images == null
            ? []
            : Array.isArray(body.images) ? body.images : [body.images];
        const addOns = body.addOns == null
            ? []
            : Array.isArray(body.addOns)
                ? body.addOns
                : JSON.parse(body.addOns);

        const imagesLinks = await saveProductImages(images, req);

        body.slug = body.slug || body.name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        body.addOns = addOns;
        body.images = imagesLinks;
        const invalidOptions = validateCustomizationOptions(body.customizationOptions);
        if (invalidOptions) {
            return res.status(400).json({ success: false, message: invalidOptions });
        }
        if (body.subCategory) {
            const subCategory = await Category.findOne({
                _id: body.subCategory,
                parentCategory: body.category,
                isActive: true
            });
            if (!subCategory) {
                return res.status(400).json({ success: false, message: 'Choose a subcategory belonging to the selected category.' });
            }
        } else {
            body.subCategory = null;
        }

        const product = await Product.create(body);
        return res.status(201).json({ success: true, product });
    } catch (error) {
        if (error.name === 'SyntaxError') {
            return res.status(400).json({ success: false, message: 'Invalid add-ons selection.' });
        }
        if (error.name === 'ValidationError' || error.code === 11000) {
            return res.status(400).json({ success: false, message: error.message });
        }
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        return next(error);
    }
}

exports.getSingleProduct = async (req, res, next) => {
    const product = await Product.findById(req.params.id)
        .populate({ path: 'category', select: 'name slug', model: Category })
        .populate({ path: 'subCategory', select: 'name slug', model: Category })
        .populate({ path: 'addOns', model: AddOn })
        .populate({
            path: 'reviews',
            select: 'rating comment user createdAt',
            model: Review,
            populate: { path: 'user', select: 'name' }
        });
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        })
    }
    return res.status(200).json({
        success: true,
        product
    })
}

exports.getProductReviewEligibility = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id).select('_id');
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        const hasCompletedPurchase = await Order.exists({
            user: req.user._id,
            orderStatus: 'Completed',
            'orderItems.product': product._id
        });

        return res.status(200).json({
            success: true,
            eligible: Boolean(hasCompletedPurchase)
        });
    } catch (error) {
        return next(error);
    }
}

exports.getProducts = async (req, res) => {

    const resPerPage = 8;
    const productsCount = await Product.countDocuments();

    // const products = await Product.find()
    const apiFeatures = new APIFeatures(
        Product.find()
            .populate({ path: 'category', select: 'name slug', model: Category })
            .populate({ path: 'subCategory', select: 'name slug', model: Category }),
        req.query
    ).search().filter().sort()
    // .filter()

    apiFeatures.pagination(resPerPage);
    const products = await apiFeatures.query;
    let filteredProductsCount = products.length;
    // const products = await apiFeatures.query;

    if (!products)
        return res.status(400).json({ message: 'error loading products' })
    return res.status(200).json({
        success: true,
        products,
        filteredProductsCount,
        resPerPage,
        productsCount,

    })
    // if (!products)
    //     return res.status(400).json({ message: 'error loading products' })

    // return res.status(200).json({
    //     success: true,
    //     products,
    //     resPerPage,
    //     productsCount,

    // })
}

exports.updateProduct = async (req, res, next) => {
    let product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        })
    }
    try {
        const body = { ...req.body };
        if (body.customizationOptions !== undefined) {
            const invalidOptions = validateCustomizationOptions(body.customizationOptions);
            if (invalidOptions) {
                return res.status(400).json({ success: false, message: invalidOptions });
            }
        }
        if (typeof body.addOns === 'string') {
            body.addOns = JSON.parse(body.addOns);
        }
        if (body.name) {
            body.slug = body.name
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
        }
        if (body.subCategory !== undefined && body.subCategory) {
            const selectedCategory = body.category || product.category;
            const subCategory = await Category.findOne({
                _id: body.subCategory,
                parentCategory: selectedCategory
            });
            if (!subCategory) {
                return res.status(400).json({ success: false, message: 'Choose a subcategory belonging to the selected category.' });
            }
        } else if (body.subCategory === '' || body.subCategory === null) {
            body.subCategory = null;
        }
        if (body.images != null) {
            const images = Array.isArray(body.images) ? body.images : [body.images];
            body.images = await saveProductImages(images, req);
        }

        product = await Product.findByIdAndUpdate(req.params.id, body, {
            new: true,
            runValidators: true
        });
        return res.status(200).json({ success: true, product });
    } catch (error) {
        if (error.name === 'SyntaxError') {
            return res.status(400).json({ success: false, message: 'Invalid add-ons selection.' });
        }
        if (error.name === 'ValidationError' || error.code === 11000) {
            return res.status(400).json({ success: false, message: error.message });
        }
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        return next(error);
    }
}

exports.deleteProducts = async (req, res, next) => {
    try {
        const rawIds = Array.isArray(req.body?.ids)
            ? req.body.ids
            : Array.isArray(req.query?.ids)
                ? req.query.ids
                : typeof req.body?.ids === 'string'
                    ? req.body.ids.split(',')
                    : typeof req.query?.ids === 'string'
                        ? req.query.ids.split(',')
                        : [];

        const normalizedIds = rawIds
            .map((id) => String(id).trim())
            .filter(Boolean);

        if (!normalizedIds.length) {
            return res.status(400).json({
                success: false,
                message: 'Select at least one product to delete.'
            });
        }

        const products = await Product.find({ _id: { $in: normalizedIds } }).select('_id');
        if (!products.length) {
            return res.status(404).json({
                success: false,
                message: 'No matching products were found.'
            });
        }

        const productIds = products.map((product) => product._id);
        await Promise.all([
            Product.deleteMany({ _id: { $in: productIds } }),
            Review.deleteMany({ product: { $in: productIds } })
        ]);

        return res.status(200).json({
            success: true,
            deletedCount: productIds.length,
            message: 'Products deleted successfully.'
        });
    } catch (error) {
        return next(error);
    }
};

exports.deleteProduct = async (req, res, next) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        })
    }
    await Review.deleteMany({ product: product._id });

    return res.status(200).json({
        success: true,
        message: 'Product deleted'
    })
}

exports.getAdminProducts = async (req, res, next) => {

    const products = await Product.find()
        .populate({ path: 'category', select: 'name slug', model: Category })
        .populate({ path: 'subCategory', select: 'name slug', model: Category })
        .populate({ path: 'addOns', select: 'name price isActive', model: AddOn })
        .select('name price stock images category subCategory addOns isAvailable');
    if (!products) {
        return res.status(404).json({
            success: false,
            message: 'Products not found'
        })
    }

    return res.status(200).json({
        success: true,
        products
    })

}

exports.getProductOptions = async (req, res) => {
    const [categories, addOns] = await Promise.all([
        Category.find({ isActive: true }).select('name slug parentCategory').sort({ name: 1 }),
        AddOn.find({ isActive: true }).select('name category price').sort({ name: 1 })
    ]);

    return res.status(200).json({
        success: true,
        categories,
        addOns
    });
}

const updateProductReviewStats = async (product) => {
    const reviews = await Review.find({ product: product._id }).select('rating');
    product.reviews = reviews.map((review) => review._id);
    product.numOfReviews = reviews.length;
    product.rating = reviews.length
        ? reviews.reduce((total, current) => total + current.rating, 0) / reviews.length
        : 0;
    await product.save();
};

const validateReviewInput = (rating, comment) => {
    const normalizedRating = Number(rating);
    if (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5
        || typeof comment !== 'string' || !comment.trim() || comment.trim().length > 2000) {
        return null;
    }
    return { rating: normalizedRating, comment: sanitizeReviewComment(comment.trim()) };
};

const hasCompletedPurchase = (userId, productId) => Order.exists({
    user: userId,
    orderStatus: 'Completed',
    'orderItems.product': productId
});

exports.createProductReview = async (req, res, next) => {
    try {
        const { rating, comment, productId } = req.body;
        const reviewInput = validateReviewInput(rating, comment);
        if (!reviewInput) {
            return res.status(400).json({
                success: false,
                message: 'Provide a 1–5 star rating and a review comment under 2,000 characters.'
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }
        if (!await hasCompletedPurchase(req.user._id, product._id)) {
            return res.status(403).json({
                success: false,
                message: 'You can review this product after one of your orders is marked Completed.'
            });
        }

        const review = await Review.create({
            product: product._id,
            user: req.user._id,
            rating: reviewInput.rating,
            comment: reviewInput.comment
        });
        await updateProductReviewStats(product);

        return res.status(201).json({ success: true, review });
    } catch (error) {
        return next(error);
    }
}

exports.updateProductReview = async (req, res, next) => {
    try {
        const reviewInput = validateReviewInput(req.body.rating, req.body.comment);
        if (!reviewInput) {
            return res.status(400).json({
                success: false,
                message: 'Provide a 1–5 star rating and a review comment under 2,000 characters.'
            });
        }

        const review = await Review.findOne({
            _id: req.params.id,
            user: req.user._id
        });
        if (!review) {
            return res.status(404).json({ success: false, message: 'Your review was not found.' });
        }
        if (!await hasCompletedPurchase(req.user._id, review.product)) {
            return res.status(403).json({
                success: false,
                message: 'You can edit this review after an order containing the product is marked Completed.'
            });
        }

        review.rating = reviewInput.rating;
        review.comment = reviewInput.comment;
        await review.save();

        const product = await Product.findById(review.product);
        if (product) await updateProductReviewStats(product);

        return res.status(200).json({ success: true, review });
    } catch (error) {
        return next(error);
    }
}

exports.deleteOwnReview = async (req, res, next) => {
    try {
        const review = await Review.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });
        if (!review) {
            return res.status(404).json({ success: false, message: 'Your review was not found.' });
        }

        const product = await Product.findById(review.product);
        if (product) await updateProductReviewStats(product);

        return res.status(200).json({ success: true });
    } catch (error) {
        return next(error);
    }
}

exports.getProductReviews = async (req, res, next) => {
    try {
        const filter = {};
        if (req.query.id) {
            const product = await Product.findById(req.query.id).select('_id');
            if (!product) {
                return res.status(404).json({ success: false, message: 'Product not found.' });
            }
            filter.product = product._id;
        }

        const reviews = await Review.find(filter)
            .populate('user', 'name')
            .populate('product', 'name')
            .sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            reviews
        });
    } catch (error) {
        return next(error);
    }
}

exports.deleteReview = async (req, res, next) => {
    const product = await Product.findById(req.query.productId);
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    const review = await Review.findOneAndDelete({
        _id: req.query.id,
        product: product._id
    });
    if (!review) {
        return res.status(404).json({ success: false, message: 'Review not found.' });
    }
    await updateProductReviewStats(product);
    return res.status(200).json({ success: true });
}

exports.productSales = async (req, res, next) => {
    const totalSales = await Order.aggregate([
        {
            $group: {
                _id: null,
                total: { $sum: "$itemsPrice" }

            },

        },
    ])
    console.log(totalSales)
    const sales = await Order.aggregate([
        { $project: { _id: 0, "orderItems": 1, totalPrice: true } },
        { $unwind: "$orderItems" },

        {
            $group: {
                _id: { product: "$orderItems.name" },
                total: { $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] } }
            },
        },
    ])
    console.log(sales)

    if (!totalSales) {
        return res.status(404).json({
            message: 'error sales'
        })

    }
    if (!sales) {
        return res.status(404).json({
            message: 'error sales'
        })

    }

    let totalPercentage = {}
    totalPercentage = sales.map(item => {

        // console.log( ((item.total/totalSales[0].total) * 100).toFixed(2))
        percent = Number(((item.total / totalSales[0].total) * 100).toFixed(2))
        total = {
            name: item._id.product,
            percent
        }
        return total
    })
    console.log(totalPercentage)
    res.status(200).json({
        success: true,
        totalPercentage,
        sales,
        totalSales
    })

}