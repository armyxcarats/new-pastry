const mongoose = require('mongoose');

const addonSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter add-on name'],
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Please select add-on category'],
        enum: ['cake', 'pastry', 'cookies', 'drinks', 'party']
    },
    description: {
        type: String,
        default: ''
    },
    price: {
        type: Number,
        required: true,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('AddOn', addonSchema);
