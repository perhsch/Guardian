import Mongoose from 'mongoose';

export interface IUser extends Mongoose.Document {
    user: string;
    guild: string;
    captcha: string | null;
    language: string;
    secretWords: string[];
}

const UserSchema = new Mongoose.Schema({
    user: { type: String, required: true, index: true, immutable: true },
    guild: { type: String, required: true, index: true, immutable: true },
    captcha: { type: String, default: null },
    language: { type: String, default: 'en' },
    secretWords: { type: [String], default: [] },
});

export default Mongoose.model<IUser>('Users', UserSchema);
