const { cert, getApps, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { createPrivateKey } = require('crypto');

const getPrivateKey = () => {
    const configuredValue = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim();
    if (!configuredValue) return '';

    let privateKey = configuredValue.replace(/^(['"])([\s\S]*)\1$/, '$2');
    if (privateKey.startsWith('{')) {
        try {
            privateKey = JSON.parse(privateKey).private_key || '';
        } catch {
            const error = new Error('FIREBASE_ADMIN_PRIVATE_KEY must contain a PEM key or Firebase service-account JSON.');
            error.code = 'firebase-admin/invalid-private-key';
            throw error;
        }
    }

    privateKey = privateKey
        .trim()
        .replace(/^(['"])([\s\S]*)\1$/, '$2')
        .replace(/\\r?\\n/g, '\n')
        .replace(/\r\n/g, '\n');

    try {
        createPrivateKey(privateKey);
    } catch (cause) {
        const error = new Error(
            'FIREBASE_ADMIN_PRIVATE_KEY is not a valid PEM private key. Copy the complete private_key value from Firebase service-account JSON.',
            { cause }
        );
        error.code = 'firebase-admin/invalid-private-key';
        throw error;
    }

    return privateKey;
};

const getFirebaseAdminAuth = () => {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = getPrivateKey();

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