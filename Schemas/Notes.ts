import Mongoose from 'mongoose';
import crypto from 'crypto';

export interface INote extends Mongoose.Document {
    guild: string;
    user: string;
    noteId: string;
    content: string;
    author: string;
    time: number;
}

function generateNoteId(): string {
    return crypto.randomBytes(4).toString('hex');
}

const NoteSchema = new Mongoose.Schema({
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
});

export default Mongoose.model<INote>('Notes', NoteSchema);
