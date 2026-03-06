import Mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAFK extends Document {
    user: string;
    guild: string;
    reason: string;
    timestamp: Date;
}

const AFKSchema = new Schema<IAFK>({
    user: { type: String, required: true, index: true, unique: true },
    guild: { type: String, required: true, index: true },
    reason: { type: String, default: 'No reason provided' },
    timestamp: { type: Date, default: Date.now },
});

const AFK: Model<IAFK> = Mongoose.models.AFK || Mongoose.model<IAFK>('AFK', AFKSchema);

export default AFK;
