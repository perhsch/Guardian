import Mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInfraction extends Document {
    guild: string;
    user: string;
    issuer: string;
    type: 'ban' | 'kick' | 'warning' | 'timeout' | 'block' | 'voice_kick';
    active: boolean;
    reason: string;
    time: number;
    duration: number;
    expires: number;
    permanent: boolean;
}

const InfractionSchema = new Schema<IInfraction>(
    {
        guild: { type: String, required: true, index: true, immutable: true },
        user: { type: String, required: true, index: true, immutable: true },
        issuer: { type: String, required: true, index: true, immutable: true },
        type: {
            type: String,
            index: true,
            required: true,
            immutable: true,
            lowercase: true,
            enum: ['ban', 'kick', 'warning', 'timeout', 'block', 'voice_kick'],
        },
        active: { type: Boolean, default: true },
        reason: { type: String, default: 'Unspecified reason.' },
        time: { type: number, default: Date.now },
        duration: { type: Number, default: Infinity, required: true },
        expires: {
            type: Number,
            default: function (this: IInfraction) {
                return this.time + this.duration;
            },
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

InfractionSchema.virtual('permanent').get(function (this: IInfraction) {
    return !isFinite(this.duration);
});

const Infractions: Model<IInfraction> = Mongoose.models.Infractions || Mongoose.model<IInfraction>('Infractions', InfractionSchema);

export default Infractions;
