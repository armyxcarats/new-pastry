const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
const fs = require('fs');
const Product = require('../models/product');
const Category = require('../models/category');
const AddOn = require('../models/addon');
const User = require('../models/user');

const resetFallbackMongoDb = (dbPath) => {
    const staleLockFiles = ['mongod.lock', 'WiredTiger.lock'];

    fs.mkdirSync(dbPath, { recursive: true });

    for (const fileName of staleLockFiles) {
        const filePath = path.join(dbPath, fileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

    const tempDirs = ['_tmp'];
    for (const dirName of tempDirs) {
        const dirPath = path.join(dbPath, dirName);
        if (fs.existsSync(dirPath)) {
            fs.rmSync(dirPath, { recursive: true, force: true });
        }
    }
};

const connectDatabase = async () => {
    const dbUri = process.env.DB_URI || 'mongodb://127.0.0.1:27017/pastry_shop';

    try {
        const connection = await mongoose.connect(dbUri, {
            serverSelectionTimeoutMS: 5000,
            autoIndex: true
        });

        console.log(`MongoDB Database connected with HOST: ${connection.connection.host}`);
        if (process.env.NODE_ENV !== 'production') {
            await ensureDemoCatalog();
        }
    } catch (error) {
        const shouldFallbackToMemory = process.env.NODE_ENV !== 'production';

        if (shouldFallbackToMemory) {
            try {
                console.error(`Configured MongoDB is unavailable: ${error.message}`);
                console.warn('Starting persistent local development MongoDB. This is separate from the configured database.');
                const dbPath = path.resolve(__dirname, '..', '.local-mongodb');
                resetFallbackMongoDb(dbPath);
                const mongoMemoryServer = await MongoMemoryServer.create({
                    instance: {
                        dbPath
                    }
                });
                const memoryUri = mongoMemoryServer.getUri();
                const connection = await mongoose.connect(memoryUri, { autoIndex: true });
                console.log(`Persistent local development MongoDB connected with HOST: ${connection.connection.host}`);
                await initializeEmptyDevelopmentDatabase();
                await ensureDemoCatalog();
                return;
            } catch (memoryError) {
                console.error('MongoDB Memory Server failed:', memoryError.message);
                process.exit(1);
            }
        }

        console.error('MongoDB connection failed:', error.message);
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
};

const ensureDemoCatalog = async () => {
    const cakes = await Category.findOne({ slug: 'cakes' });
    const admin = await User.findOne({ role: 'admin' }).select('_id');
    const image = (photoId) => `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1000&q=85`;
    const galleries = {
        'classic-chocolate-cake': [
            image('photo-1578985545062-69928b1d9587'),
            image('photo-1578985545062-69928b1d9587'),
            image('photo-1606890737304-57a1ca8a5b62')
        ],
        'red-velvet-celebration-cake': [
            image('photo-1559386484-97c5befc9f6d'),
            image('photo-1464349095431-e9a21285b5f3'),
            image('photo-1578985545062-69928b1d9587')
        ],
        'vanilla-cupcake-box': [
            image('photo-1486427944299-d1955d23e34d'),
            image('photo-1519869325930-281384150729'),
            image('photo-1576618148400-f54bed99fcfd')
        ],
        'cheese-bread': [
            image('photo-1509440159596-0249088772ff'),
            image('photo-1549931319-a545dcf3bc73'),
            image('photo-1585478259715-876acc5be8eb')
        ],
        'butter-cookies': [
            image('photo-1499636136210-6f4ee915583e'),
            image('photo-1558961363-fa8fdf82db35'),
            image('photo-1499636136210-6f4ee915583e')
        ]
    };

    for (const [slug, urls] of Object.entries(galleries)) {
        const product = await Product.findOne({ slug });
        if (product && product.images.length < 2) {
            const primaryImage = product.images[0]?.url || urls[0];
            product.images = [
                { public_id: '', url: primaryImage },
                ...urls.slice(1).map((url) => ({ public_id: '', url }))
            ];
            await product.save();
        }
    }

    const [pastries, muffins] = await Promise.all([
        Category.findOneAndUpdate(
            { slug: 'pastries' },
            { $setOnInsert: { name: 'Pastries', slug: 'pastries', description: 'Flaky pastries and baked favorites', isActive: true } },
            { upsert: true, new: true }
        ),
        Category.findOneAndUpdate(
            { slug: 'muffins' },
            { $setOnInsert: { name: 'Muffins', slug: 'muffins', description: 'Freshly baked muffins in classic flavors', isActive: true } },
            { upsert: true, new: true }
        )
    ]);

    const products = [
        {
            name: 'Strawberry Shortcake',
            slug: 'strawberry-shortcake',
            description: 'Soft vanilla sponge layered with whipped cream and fresh strawberries.',
            price: 920,
            stock: 10,
            category: cakes?._id,
            ingredients: ['Wheat flour', 'Eggs', 'Cream', 'Strawberries', 'Sugar'],
            allergens: ['Wheat', 'Eggs', 'Milk'],
            images: ['photo-1464349095431-e9a21285b5f3', 'photo-1565958011703-44f9829ba187', 'photo-1578985545062-69928b1d9587'],
            customizationOptions: [{
                name: 'Size',
                type: 'size',
                values: [
                    { label: 'Small (6-inch)', priceAdjustment: 0 },
                    { label: 'Medium (8-inch)', priceAdjustment: 220 },
                    { label: 'Large (10-inch)', priceAdjustment: 420 }
                ]
            }]
        },
        {
            name: 'Cinnamon Swirl Rolls',
            slug: 'cinnamon-swirl-rolls',
            description: 'A box of soft cinnamon rolls finished with a sweet vanilla glaze.',
            price: 320,
            stock: 20,
            category: pastries._id,
            ingredients: ['Wheat flour', 'Milk', 'Butter', 'Cinnamon', 'Sugar'],
            allergens: ['Wheat', 'Milk'],
            images: ['photo-1509365465985-25d11c17e812', 'photo-1530610476181-d83430b64dcd', 'photo-1549931319-a545dcf3bc73'],
            customizationOptions: [{
                name: 'Box size',
                type: 'size',
                values: [
                    { label: 'Small box (4 rolls)', priceAdjustment: 0 },
                    { label: 'Medium box (8 rolls)', priceAdjustment: 260 },
                    { label: 'Large box (12 rolls)', priceAdjustment: 520 }
                ]
            }]
        },
        {
            name: 'Blueberry Muffin Box',
            slug: 'blueberry-muffin-box',
            description: 'Golden, tender muffins filled with juicy blueberries and a light sugar top.',
            price: 280,
            stock: 24,
            category: muffins._id,
            ingredients: ['Wheat flour', 'Blueberries', 'Eggs', 'Milk', 'Sugar'],
            allergens: ['Wheat', 'Eggs', 'Milk'],
            images: ['photo-1607958996333-41aef7caefaa', 'photo-1558961363-fa8fdf82db35', 'photo-1486427944299-d1955d23e34d'],
            customizationOptions: [{
                name: 'Box size',
                type: 'size',
                values: [
                    { label: 'Small box (4 muffins)', priceAdjustment: 0 },
                    { label: 'Medium box (8 muffins)', priceAdjustment: 240 },
                    { label: 'Large box (12 muffins)', priceAdjustment: 480 }
                ]
            }]
        },
        {
            name: 'Lemon Berry Tart',
            slug: 'lemon-berry-tart',
            description: 'Buttery tart shell filled with bright lemon cream and finished with berries.',
            price: 480,
            stock: 12,
            category: pastries._id,
            ingredients: ['Wheat flour', 'Butter', 'Eggs', 'Lemon', 'Berries'],
            allergens: ['Wheat', 'Eggs', 'Milk'],
            images: ['photo-1488477181946-6428a0291777', 'photo-1464305795204-6f5bbfc7fb81', 'photo-1565958011703-44f9829ba187'],
            customizationOptions: [{
                name: 'Size',
                type: 'size',
                values: [
                    { label: 'Small tart', priceAdjustment: 0 },
                    { label: 'Medium tart', priceAdjustment: 180 },
                    { label: 'Large tart', priceAdjustment: 360 }
                ]
            }]
        }
    ].filter((product) => product.category);

    await Promise.all(products.map(({ images, ...product }) => Product.updateOne(
        { slug: product.slug },
        {
            $setOnInsert: {
                ...product,
                stock: product.stock,
                isAvailable: true,
                addOns: [],
                user: admin?._id,
                images: images.map((photoId) => ({ public_id: '', url: image(photoId) }))
            }
        },
        { upsert: true }
    )));
    console.log('Development catalog checked: sample products and galleries are available.');
};

const initializeEmptyDevelopmentDatabase = async () => {
    const markers = mongoose.connection.collection('developmentBootstrapMarkers');
    const marker = await markers.findOne({ _id: 'catalog-seeded-v1' });
    if (marker) return;

    const [productCount, categoryCount, addOnCount, userCount] = await Promise.all([
        Product.countDocuments(),
        Category.countDocuments(),
        AddOn.countDocuments(),
        User.countDocuments()
    ]);
    if (productCount || categoryCount || addOnCount || userCount) {
        console.warn('Local development database contains existing records; bootstrap skipped to preserve them.');
        return;
    }

    const { seedDatabase } = require('../seeder');
    await seedDatabase({ useCurrentConnection: true });
    await markers.insertOne({ _id: 'catalog-seeded-v1', createdAt: new Date() });
    console.log('Local development catalog initialized with sample products and admin account.');
};

module.exports = connectDatabase;