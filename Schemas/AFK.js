const Mongoose = require('mongoose');

module.exports = Mongoose.model(
    'AFK',
    new Mongoose.Schema({
        user: { type: String, required: true, index: true, unique: true },
        guild: { type: String, required: true, index: true },
        reason: { type: String, default: 'No reason provided' },
        timestamp: { type: Date, default: Date.now },
    })
);
