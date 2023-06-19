let { APS_CLIENT_ID, APS_CLIENT_SECRET, APS_CALLBACK_URL, APS_STORAGE_BUCKET, SERVER_SESSION_SECRET, PORT } = process.env;
if (!APS_CLIENT_ID || !APS_CLIENT_SECRET || !APS_CALLBACK_URL || !SERVER_SESSION_SECRET) {
    console.warn('Missing some of the environment variables.');
    process.exit(1);
}

APS_STORAGE_BUCKET = APS_STORAGE_BUCKET || APS_CLIENT_ID.toLowerCase() + '-shares';
PORT = PORT || 3000;

module.exports = {
    APS_CLIENT_ID,
    APS_CLIENT_SECRET,
    APS_CALLBACK_URL,
    APS_STORAGE_BUCKET,
    SERVER_SESSION_SECRET,
    PORT
};
