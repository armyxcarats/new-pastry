const { cert, getApps, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const getFirebaseAdminAuth = () => {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
        const error = new Error('Firebase Admin credentials are not configured.');
        error.code = 'firebase-admin/not-configured';
        throw error;
    }

    const appName = 'pastry-social-auth';
    const app = getApps().find((firebaseApp) => firebaseApp.name === appName)
        || initializeApp({
            credential: cert({ projectId, clientEmail, privateKey })
        }, appName);

    return getAuth(app);
};

module.exports = { getFirebaseAdminAuth };