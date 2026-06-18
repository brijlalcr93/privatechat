import { Schema, model, Types } from 'mongoose';

const chatSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['one-to-one', 'group'],
      required: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    groupName: {
      type: String,
      trim: true,
      default: '',
    },
    groupAvatar: {
      type: String, // Base64 encoded avatar image
      default: '',
    },
    groupDescription: {
      type: String,
      trim: true,
      default: '',
    },
    groupAdmin: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const Chat = model('Chat', chatSchema);
