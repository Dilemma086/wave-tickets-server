const crypto = require('crypto');
const SECRET_KEY = crypto.randomBytes(32).toString('base64');

module.exports = {
    SECRET_KEY
};
