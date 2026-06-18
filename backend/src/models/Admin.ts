import { Schema, model } from 'mongoose';

const adminSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['superadmin', 'admin'],
      default: 'admin',
    },
  },
  {
    timestamps: true,
  }
);

export const Admin = model('Admin', adminSchema);
