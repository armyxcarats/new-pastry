const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    orderType: {
        type: String,
        enum: ['pickup', 'delivery']
    },
    preferredDate: {
        type: Date
    },
    preferredTime: {
        type: String
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'gcash', 'cod']
    },
    shippingInfo: {
        fullName: {
            type: String,
            default: ''
        },
        address: {
            type: String,
            default: ''
        },
        city: {
            type: String,
            default: ''
        },
        phoneNo: {
            type: String,
            default: ''
        },
        postalCode: {
            type: String,
            default: ''
        },
        country: {
            type: String,
            default: 'Philippines'
        }
    },
    orderItems: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'Product'
            },
            name: {
                type: String,
                required: true
            },
            image: {
                type: String,
                default: ''
            },
            quantity: {
                type: Number,
                required: true,
                default: 1
            },
            unitPrice: {
                type: Number,
                required: true,
                default: 0.0
            },
            selectedOptions: {
                size: String,
                flavor: String,
                filling: String,
                addOns: [String],
                customMessage: {
                    type: String,
                    maxlength: 200
                },
                customizations: [
                    {
                        name: String,
                        type: {
                            type: String,
                            enum: ['size', 'flavor', 'filling', 'message']
                        },
                        label: String,
                        priceAdjustment: {
                            type: Number,
                            default: 0
                        }
                    }
                ]
            },
            addOns: [
                {
                    name: {
                        type: String,
                        required: true
                    },
                    price: {
                        type: Number,
                        required: true,
                        min: 0
                    },
                    quantity: {
                        type: Number,
                        required: true,
                        min: 1,
                        default: 1
                    }
                }
            ],
            subtotal: {
                type: Number,
                required: true,
                default: 0.0
            }
        }
    ],
    paymentInfo: {
        id: {
            type: String,
            default: ''
        },
        status: {
            type: String,
            default: 'pending'
        }
    },
    subtotal: {
        type: Number,
        required: true,
        default: 0.0
    },
    taxPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    shippingFee: {
        type: Number,
        required: true,
        default: 0.0
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    orderStatus: {
        type: String,
        required: true,
        enum: ['Pending', 'Confirmed', 'Baking', 'Ready', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    notes: {
        type: String,
        default: ''
    },
    paidAt: {
        type: Date
    },
    deliveredAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', orderSchema);