const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.resolve(__dirname, '..', 'config', '.env') });

const Product = require('../models/product');

const sizeOptionsBySlug = {
    'classic-chocolate-cake': [
        { label: 'Small (6-inch)', priceAdjustment: 0 },
        { label: 'Medium (8-inch)', priceAdjustment: 200 },
        { label: 'Large (10-inch)', priceAdjustment: 400 }
    ],
    'red-velvet-celebration-cake': [
        { label: 'Small (6-inch)', priceAdjustment: 0 },
        { label: 'Medium (8-inch)', priceAdjustment: 220 },
        { label: 'Large (10-inch)', priceAdjustment: 420 }
    ],
    'vanilla-cupcake-box': [
        { label: 'Small box (6 cupcakes)', priceAdjustment: 0 },
        { label: 'Medium box (12 cupcakes)', priceAdjustment: 220 },
        { label: 'Large box (24 cupcakes)', priceAdjustment: 480 }
    ],
    'cheese-bread': [
        { label: 'Small loaf', priceAdjustment: 0 },
        { label: 'Medium loaf', priceAdjustment: 30 },
        { label: 'Large loaf', priceAdjustment: 60 }
    ],
    'butter-cookies': [
        { label: 'Small box (6 cookies)', priceAdjustment: 0 },
        { label: 'Medium box (12 cookies)', priceAdjustment: 100 },
        { label: 'Large box (24 cookies)', priceAdjustment: 220 }
    ]
};

const updateProductSizes = async () => {
    const dbUri = process.env.DB_URI || 'mongodb://127.0.0.1:27017/pastry_shop';
    await mongoose.connect(dbUri, { serverSelectionTimeoutMS: 5000 });

    let updatedCount = 0;
    for (const [slug, values] of Object.entries(sizeOptionsBySlug)) {
        const product = await Product.findOne({ slug });
        if (!product) continue;

        const options = product.customizationOptions.filter((option) => option.type !== 'size');
        options.unshift({ name: 'Size', type: 'size', values });
        product.customizationOptions = options;
        await product.save();
        updatedCount += 1;
    }

    console.log(`Updated product-specific small, medium, and large sizes for ${updatedCount} products.`);
};

updateProductSizes()
    .catch((error) => {
        console.error('Could not update product size options:', error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
