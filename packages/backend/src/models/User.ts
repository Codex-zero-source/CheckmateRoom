import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  walletAddress: string;
  username: string;
  createdAt: Date;
  lastLogin: Date;
}

const UserSchema: Schema = new Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    index: true,
    lowercase: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 20,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
});

// Update lastLogin on each save
UserSchema.pre<IUser>('save', function (this: IUser, next) {
  if (this.isModified('walletAddress') && !this.isNew) {
    return next(new Error('Cannot change wallet address.'));
  }
  this.lastLogin = new Date();
  next();
});

export default mongoose.model<IUser>('User', UserSchema); 