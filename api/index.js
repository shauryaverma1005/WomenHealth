const app = require('../backend/src/app.js');
const connectDB = require('../backend/src/config/db.js');

let isConnected = false;

module.exports = async (req, res) => {
    // Ensure DB connection is established
    if (!isConnected) {
        await connectDB();
        isConnected = true;
    }
    return app(req, res);
};
