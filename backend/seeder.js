const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

dotenv.config({ path: path.resolve(__dirname, 'config', '.env') });

const Category = require('./models/category');
const AddOn = require('./models/addon');
const Product = require('./models/product');
const User = require('./models/user');

const connectToDatabase = async () => {
    const mongoUri = process.env.DB_URI || 'mongodb://127.0.0.1:27017/pastry_shop';

    try {
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            autoIndex: true
        });
        console.log('Connected to MongoDB for seeding');
    } catch (error) {
        const isLocalDb = mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost');

        if (!isLocalDb) {
            throw error;
        }

        const memoryServer = await MongoMemoryServer.create();
        await mongoose.connect(memoryServer.getUri(), { autoIndex: true });
        console.log('Connected to in-memory MongoDB for seeding');
    }
};

const seedDatabase = async ({ useCurrentConnection = false } = {}) => {
    try {
        if (!useCurrentConnection) {
            await connectToDatabase();
        }

        await Category.deleteMany({});
        await AddOn.deleteMany({});
        await Product.deleteMany({});
        await User.deleteMany({ email: /^admin@pastryshop/i });

        const cakeCategory = await Category.create({
            name: 'Cakes',
            slug: 'cakes',
            description: 'Custom cakes and celebration desserts',
            isActive: true
        });

        const cupcakeCategory = await Category.create({
            name: 'Cupcakes',
            slug: 'cupcakes',
            description: 'Bite-size cupcakes for events and everyday treats',
            isActive: true
        });

        const breadCategory = await Category.create({
            name: 'Breads',
            slug: 'breads',
            description: 'Fresh breads and pastries',
            isActive: true
        });

        const cookieCategory = await Category.create({
            name: 'Cookies',
            slug: 'cookies',
            description: 'Cookie favorites and dessert bites',
            isActive: true
        });

        const extraFrosting = await AddOn.create({
            name: 'Extra Frosting',
            category: 'cake',
            description: 'Extra frosting layer for a richer finish',
            price: 120
        });

        const candleAddon = await AddOn.create({
            name: 'Candle',
            category: 'party',
            description: 'Birthday candle for celebration cakes',
            price: 40
        });

        const sprinklesAddon = await AddOn.create({
            name: 'Colorful Sprinkles',
            category: 'party',
            description: 'A cheerful sprinkle topping for cakes and cupcakes',
            price: 35
        });

        const toppersAddon = await AddOn.create({
            name: 'Cake Topper',
            category: 'cake',
            description: 'Custom topper decoration',
            price: 90
        });

        const chocolateKissesAddon = await AddOn.create({
            name: 'Chocolate Kisses',
            category: 'cake',
            description: 'Chocolate kisses for decorating cakes and cupcakes',
            price: 45
        });

        const cookiesAndCreamAddon = await AddOn.create({
            name: 'Cookies and Cream',
            category: 'cake',
            description: 'Crushed cookies and cream topping',
            price: 50
        });

        const ribbonAddon = await AddOn.create({
            name: 'Ribbon',
            category: 'party',
            description: 'Decorative ribbon for your cake box',
            price: 30
        });

        const boxAddon = await AddOn.create({
            name: 'Gift Box',
            category: 'cake',
            description: 'Premium gift box packaging',
            price: 60
        });

        const adminUser = await User.create({
            name: 'shyr',
            email: 'admin@pastryshop.local',
            password: 'admin123',
            role: 'admin',
            phoneNumber: '09171234567',
            deliveryAddress: 'Pastry Shop Main Branch',
            isVerified: true
        });

        const products = [
            {
                name: 'Classic Chocolate Cake',
                slug: 'classic-chocolate-cake',
                description: 'Rich chocolate sponge layered with ganache and smooth buttercream.',
                price: 850,
                stock: 12,
                category: cakeCategory._id,
                ingredients: ['Chocolate flour', 'Cocoa powder', 'Butter', 'Cream'],
                allergens: ['Milk', 'Wheat', 'Eggs'],
                images: [{ url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80' }],
                isAvailable: true,
                customizationOptions: [
                    {
                        name: 'Size',
                        type: 'size',
                        values: [
                            { label: 'Small (6-inch)', priceAdjustment: 0 },
                            { label: 'Medium (8-inch)', priceAdjustment: 200 },
                            { label: 'Large (10-inch)', priceAdjustment: 400 }
                        ]
                    },
                    {
                        name: 'Flavor',
                        type: 'flavor',
                        values: [
                            { label: 'Chocolate', priceAdjustment: 0 },
                            { label: 'Vanilla', priceAdjustment: 50 },
                            { label: 'Strawberry', priceAdjustment: 75 }
                        ]
                    }
                ],
                addOns: [
                    extraFrosting._id,
                    chocolateKissesAddon._id,
                    cookiesAndCreamAddon._id,
                    candleAddon._id,
                    ribbonAddon._id,
                    sprinklesAddon._id,
                    toppersAddon._id
                ],
                user: adminUser._id
            },
            {
                name: 'Red Velvet Celebration Cake',
                slug: 'red-velvet-celebration-cake',
                description: 'Velvety red sponge topped with cream cheese frosting and elegant finishing.',
                price: 980,
                stock: 8,
                category: cakeCategory._id,
                ingredients: ['Cocoa', 'Red food color', 'Cream cheese', 'Butter'],
                allergens: ['Milk', 'Wheat', 'Eggs'],
                images: [{ url: 'https://images.unsplash.com/photo-1559386484-97c5befc9f6d?auto=format&fit=crop&w=900&q=80' }],
                isAvailable: true,
                customizationOptions: [
                    {
                        name: 'Size',
                        type: 'size',
                        values: [
                            { label: 'Small (6-inch)', priceAdjustment: 0 },
                            { label: 'Medium (8-inch)', priceAdjustment: 220 },
                            { label: 'Large (10-inch)', priceAdjustment: 420 }
                        ]
                    },
                    {
                        name: 'Filling',
                        type: 'filling',
                        values: [
                            { label: 'Cream Cheese', priceAdjustment: 0 },
                            { label: 'Berry Jam', priceAdjustment: 80 }
                        ]
                    }
                ],
                addOns: [
                    extraFrosting._id,
                    chocolateKissesAddon._id,
                    cookiesAndCreamAddon._id,
                    candleAddon._id,
                    ribbonAddon._id,
                    sprinklesAddon._id,
                    toppersAddon._id
                ],
                user: adminUser._id
            },
            {
                name: 'Vanilla Cupcake Box',
                slug: 'vanilla-cupcake-box',
                description: 'Soft vanilla cupcakes finished with buttery frosting and colorful toppings.',
                price: 260,
                stock: 30,
                category: cupcakeCategory._id,
                ingredients: ['Flour', 'Vanilla', 'Butter', 'Frosting'],
                allergens: ['Milk', 'Wheat', 'Eggs'],
                images: [{ url: 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=900&q=80' }],
                isAvailable: true,
                customizationOptions: [
                    {
                        name: 'Size',
                        type: 'size',
                        values: [
                            { label: 'Small box (6 cupcakes)', priceAdjustment: 0 },
                            { label: 'Medium box (12 cupcakes)', priceAdjustment: 220 },
                            { label: 'Large box (24 cupcakes)', priceAdjustment: 480 }
                        ]
                    },
                    {
                        name: 'Flavor',
                        type: 'flavor',
                        values: [
                            { label: 'Vanilla', priceAdjustment: 0 },
                            { label: 'Chocolate', priceAdjustment: 20 },
                            { label: 'Strawberry', priceAdjustment: 20 }
                        ]
                    }
                ],
                addOns: [
                    extraFrosting._id,
                    chocolateKissesAddon._id,
                    cookiesAndCreamAddon._id,
                    candleAddon._id,
                    ribbonAddon._id,
                    sprinklesAddon._id,
                    toppersAddon._id
                ],
                user: adminUser._id
            },
            {
                name: 'Cheese Bread',
                slug: 'cheese-bread',
                description: 'Warm and soft bread topped with melted cheese and a slightly toasted finish.',
                price: 180,
                stock: 18,
                category: breadCategory._id,
                ingredients: ['Bread dough', 'Cheese', 'Butter'],
                allergens: ['Milk', 'Wheat'],
                images: [{ url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80' }],
                isAvailable: true,
                customizationOptions: [
                    {
                        name: 'Size',
                        type: 'size',
                        values: [
                            { label: 'Small loaf', priceAdjustment: 0 },
                            { label: 'Medium loaf', priceAdjustment: 30 },
                            { label: 'Large loaf', priceAdjustment: 60 }
                        ]
                    }
                ],
                addOns: [boxAddon._id],
                user: adminUser._id
            },
            {
                name: 'Butter Cookies',
                slug: 'butter-cookies',
                description: 'Buttery and crumbly cookies that are simple, comforting, and crowd-pleasing.',
                price: 220,
                stock: 25,
                category: cookieCategory._id,
                ingredients: ['Butter', 'Flour', 'Sugar', 'Egg'],
                allergens: ['Milk', 'Wheat', 'Eggs'],
                images: [{ url: 'https://images.unsplash.com/photo-1499636136210-6d847e0f8f17?auto=format&fit=crop&w=900&q=80' }],
                isAvailable: true,
                customizationOptions: [
                    {
                        name: 'Size',
                        type: 'size',
                        values: [
                            { label: 'Small box (6 cookies)', priceAdjustment: 0 },
                            { label: 'Medium box (12 cookies)', priceAdjustment: 100 },
                            { label: 'Large box (24 cookies)', priceAdjustment: 220 }
                        ]
                    },
                    {
                        name: 'Flavor',
                        type: 'flavor',
                        values: [
                            { label: 'Original', priceAdjustment: 0 },
                            { label: 'Choco Chips', priceAdjustment: 30 }
                        ]
                    }
                ],
                addOns: [boxAddon._id],
                user: adminUser._id
            }
        ];

        await Product.insertMany(products);

        console.log('Database seeded successfully');
        console.log('Admin user created: shyr (admin@pastryshop.local) / admin123');
    } catch (error) {
        console.error('Seeding failed:', error.message);
        throw error;
    } finally {
        if (!useCurrentConnection) {
            await mongoose.disconnect();
        }
    }
};

if (require.main === module) {
    seedDatabase().catch(() => {
        process.exitCode = 1;
    });
}

module.exports = { seedDatabase };
