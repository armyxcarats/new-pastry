const express = require('express');
const path = require('path');
const app = express();
const cors = require('cors')
const cookieParser = require('cookie-parser')
const products = require('./routes/product');
const auth = require('./routes/auth');
const order = require('./routes/order');
const catalog = require('./routes/catalog');
const cart = require('./routes/cart');

const allowedOrigins = [
    /^http:\/\/localhost:\d+$/,
    /^http:\/\/127\.0\.0\.1:\d+$/
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.some((pattern) => pattern.test(origin))) {
            callback(null, true);
            return;
        }

        callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cookieParser());
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use('/api/v1', products);
app.use('/api/v1', auth);
app.use('/api/v1', order);
app.use('/api/v1', catalog);
app.use('/api/v1', cart);

module.exports = app