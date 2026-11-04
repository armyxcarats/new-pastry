
const express = require('express');
const path = require('path');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');

const products = require('./routes/product');
const auth = require('./routes/auth');
const order = require('./routes/order');
const catalog = require('./routes/catalog');
const cart = require('./routes/cart');

// Allowed frontend origins
const allowedOrigins = [
    'https://new-pastry.vercel.app',
    'https://new-pastry-ernq5i35z-pastry1.vercel.app',

    ...(process.env.FRONTEND_URL || '')
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean)
];

const corsOptions = {
    origin: (origin, callback) => {

        // Allow requests without an origin (Postman, server-to-server, etc.)
        if (!origin) {
            return callback(null, true);
        }

        // Allow configured frontend URLs and localhost
        const isAllowed =
            allowedOrigins.includes(origin) ||
            /^http:\/\/localhost:\d+$/.test(origin) ||
            /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);

        if (isAllowed) {
            return callback(null, true);
        }

        console.log('CORS blocked:', origin);
        return callback(new Error('Not allowed by CORS'));
    },

    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options(/.*/, cors(corsOptions));

app.use(cookieParser());

app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({
    limit: '50mb',
    extended: true
}));

app.use('/api/v1', products);
app.use('/api/v1', auth);
app.use('/api/v1', order);
app.use('/api/v1', catalog);
app.use('/api/v1', cart);

module.exports = app;
