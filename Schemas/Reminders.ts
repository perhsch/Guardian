import Mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReminder extends Document {
    user: string;
    reminder: string;
    repeating: boolean;
    time: number;
    duration: number;
    expires: number;
    permanent: boolean;
}

const ReminderSchema = new Schema<IReminder>(
    {
        user: { type: String, required: true, index: true, immutable: true },
        reminder: { type: String, required: true },
        repeating: { type: Boolean, default: false, required: true },
        time: { type: Number, default: Date.now },
        duration: { type: Number, default: Infinity, required: true },
        expires: {
            type: Number,
            default: function (this: IReminder) {
                return this.time + this.duration;
            },
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

ReminderSchema.virtual('permanent').get(function (this: IReminder) {
    return !isFinite(this.duration);
});

const Reminders: Model<IReminder> = Mongoose.models.Reminders || Mongoose.model<IReminder>('Reminders', ReminderSchema);

export default Reminders;
