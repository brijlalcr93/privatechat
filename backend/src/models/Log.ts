import { Schema, model } from 'mongoose';

const logSchema = new Schema(
  {
    action: {
      type: String,
      required: true,
    },
    details: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    username: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Log = model('Log', logSchema);
