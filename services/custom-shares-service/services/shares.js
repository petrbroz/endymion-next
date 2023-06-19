const crypto = require('crypto');

const SECRET_BYTE_LENGTH = 16;

function generateSecret() {
    const secret = crypto.randomBytes(SECRET_BYTE_LENGTH).toString('base64');
    return secret.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

module.exports = {
    generateSecret
};
