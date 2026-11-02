const path = require('path');
const app = require('./app');
const connectDatabase = require('./config/database');
const cloudinary = require('cloudinary');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, 'config', '.env') });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
    api_key: process.env.CLOUDINARY_API_KEY || '',
    api_secret: process.env.CLOUDINARY_API_SECRET || ''
});

const port = process.env.PORT || 4001;

const startServer = async () => {
    await connectDatabase();
    app.listen(port, () => {
        console.log(`Server started on port: ${port} in ${process.env.NODE_ENV || 'development'} mode`);
    });
};

startServer().catch((error) => {
    console.error('Server startup failed:', error.message);
    process.exit(1);
});