const Mongoose = require('mongoose');
const crypto = require('crypto');

function generateNoteId() {
    return crypto.randomBytes(4).toString('hex');
}

module.exports = Mongoose.model(
    'Notes',
    new Mongoose.Schema({
        guild: { type: String, required: true, index: true, immutable: true },
        user: { type: String, required: true, index: true, immutable: true },
        noteId: {
            type: String,
            required: true,
            unique: true,
            index: true,
            default: generateNoteId,
        },
        content: { type: String, required: true },
        author: { type: String, required: true, index: true, immutable: true },
        time: { type: Number, default: Date.now },
    })
);
