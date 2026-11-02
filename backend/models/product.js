const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter product name'],
        trim: true,
        maxLength: [100, 'Product name cannot exceed 100 characters']
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please enter product description']
    },
    price: {
        type: Number,
        required: [true, 'Please enter product price'],
        default: 0.0
    },
    stock: {
        type: Number,
        required: [true, 'Please enter product stock'],
        default: 0
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    subCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    ingredients: [
        {
            type: String,
            trim: true
        }
    ],
    allergens: [
        {
            type: String,
            trim: true
        }
    ],
    images: [
        {
            public_id: {
                type: String,
                default: ''
            },
            url: {
                type: String,
                required: true
            }
        }
    ],
    rating: {
        type: Number,
        default: 0
    },
    numOfReviews: {
        type: Number,
        default: 0
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    customizationOptions: [
        {
            name: {
                type: String,
                required: true
            },
            type: {
                type: String,
                enum: ['size', 'flavor', 'filling', 'message'],
                required: true
            },
            values: [
                {
                    label: String,
                    priceAdjustment: {
                        type: Number,
                        default: 0
                    }
                }
            ]
        }
    ],
    addOns: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AddOn'
        }
    ],
    reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Review'
        }
    ],
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Product', productSchema);