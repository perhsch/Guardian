import Mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITicketMessage {
    user: string;
    message: string;
    time: number;
    images: string[];
}

export interface ITicket extends Document {
    guild: string;
    user: string;
    channel: string;
    messages: ITicketMessage[];
    active: boolean;
}

const TicketSchema = new Schema<ITicket>({
    guild: { type: String, required: true, index: true, immutable: true },
    user: { type: String, required: true, index: true, immutable: true },
    channel: { type: String, required: true, index: true, immutable: true },
    messages: {
        type: [
            {
                user: { type: String, required: true },
                message: { type: String, required: true },
                time: { type: Number, default: Date.now },
                images: { type: [String], default: [] },
            },
        ],
        default: [],
    },
    active: { type: Boolean, default: true },
});

const Tickets: Model<ITicket> = Mongoose.models.Tickets || Mongoose.model<ITicket>('Tickets', TicketSchema);

export default Tickets;
