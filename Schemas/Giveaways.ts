import Mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGiveaway extends Document {
    giveaway: string;
    guild: string;
    channel: string;
    entries: string[];
    winners: number;
    description: string | null;
    active: boolean;
    time: number;
    duration: number;
    expires: number;
    permanent: boolean;
}

const GiveawaySchema = new Schema<IGiveaway>(
    {
        giveaway: { type: String, required: true, index: true, immutable: true },
        guild: { type: String, required: true, index: true, immutable: true },
        channel: { type: String, required: true, immutable: true },
        entries: { type: [String], default: [] },
        winners: { type: Number, required: true },
        description: { type: String, default: null },
        active: { type: Boolean, default: true },
        time: { type: Number, default: Date.now },
        duration: { type: Number, default: Infinity, required: true },
        expires: {
            type: Number,
            default: function (this: IGiveaway) {
                return this.time + this.duration;
            },
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

GiveawaySchema.virtual('permanent').get(function (this: IGiveaway) {
    return !isFinite(this.duration);
});

const Giveaways: Model<IGiveaway> =
    Mongoose.models.Giveaways || Mongoose.model<IGiveaway>('Giveaways', GiveawaySchema);

export default Giveaways;
