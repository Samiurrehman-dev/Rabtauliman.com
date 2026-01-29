import mongoose, { Schema, Model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'donor' | 'admin';

export interface IUser extends Document {
  name: string;
  username: string;
  phone: string;
  whatsapp: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [50, 'Username cannot exceed 50 characters'],
      match: [/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^(\+92|0)?[0-9]{10}$/, 'Please provide a valid Pakistani phone number'],
    },
    whatsapp: {
      type: String,
      required: [true, 'WhatsApp number is required'],
      trim: true,
      match: [/^(\+92|0)?[0-9]{10}$/, 'Please provide a valid WhatsApp number'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: {
        values: ['donor', 'admin'],
        message: '{VALUE} is not a valid role',
      },
      default: 'donor',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret) {
        const transformed = ret as any;
        transformed.id = transformed._id.toString();
        delete transformed._id;
        delete transformed.__v;
        delete transformed.password; // Never expose password in JSON
        return transformed;
      },
    },
  }
);

// Add indexes for better query performance
UserSchema.index({ role: 1 });

// Hash password before saving
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Prevent model overwrite during hot reload in development
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
