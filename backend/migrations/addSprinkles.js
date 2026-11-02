const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.resolve(__dirname, '..', 'config', '.env') });

const AddOn = require('../models/addon');
const Category = require('../models/category');
const Product = require('../models/product');

const ensureAddOn = async (addOn) => {
    const existing = await AddOn.findOne({ name: addOn.name });
    return existing || AddOn.create(addOn);
};

const addOnsToCakesAndCupcakes = async () => {
    const dbUri = process.env.DB_URI || 'mongodb://127.0.0.1:27017/pastry_shop';
    await mongoose.connect(dbUri, { serverSelectionTimeoutMS: 5000 });

    const addOns = await Promise.all([
        ensureAddOn({
            name: 'Colorful Sprinkles',
            category: 'party',
            description: 'A cheerful sprinkle topping for cakes and cupcakes',
            price: 35
        }),
        ensureAddOn({
            name: 'Chocolate Kisses',
            category: 'cake',
            description: 'Chocolate kisses for decorating cakes and cupcakes',
            price: 45
        }),
        ensureAddOn({
            name: 'Cookies and Cream',
            category: 'cake',
            description: 'Crushed cookies and cream topping',
            price: 50
        }),
        ensureAddOn({
            name: 'Candle',
            category: 'party',
            description: 'Birthday candle for celebration cakes',
            price: 40
        }),
        ensureAddOn({
            name: 'Ribbon',
            category: 'party',
            description: 'Decorative ribbon for your cake box',
            price: 30
        }),
        ensureAddOn({
            name: 'Extra Frosting',
            category: 'cake',
            description: 'Extra frosting layer for a richer finish',
            price: 120
        }),
        ensureAddOn({
            name: 'Cake Topper',
            category: 'cake',
            description: 'Decorative topper for your celebration cake',
            price: 90
        })
    ]);

    const categories = await Category.find({ slug: { $in: ['cakes', 'cupcakes'] } }).select('_id');
    if (categories.length) {
        const result = await Product.updateMany(
            { category: { $in: categories.map((category) => category._id) } },
            { $addToSet: { addOns: { $each: addOns.map((addOn) => addOn._id) } } }
        );
        console.log(`Seven add-ons are available on cake and cupcake products (${result.modifiedCount} products updated).`);
    } else {
        console.log('The add-ons were created. No cake or cupcake categories exist yet.');
    }
};

addOnsToCakesAndCupcakes()
    .catch((error) => {
        console.error('Could not add product add-ons to the catalog:', error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
