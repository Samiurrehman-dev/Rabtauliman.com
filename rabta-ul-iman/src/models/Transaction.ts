import mongoose, { Schema, Model, Document } from 'mongoose';

export type TransactionStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface ITransaction extends Document {
  userId?: mongoose.Types.ObjectId | string;
  donorId?: mongoose.Types.ObjectId | string;
  donorName: string;
  amount: number;
  date: Date;
  type: string;
  description?: string;
  screenshotUrl?: string;
  status: TransactionStatus;
  isPrivate: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    donorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    donorName: {
      type: String,
      required: [true, 'Donor name is required'],
      trim: true,
      maxlength: [100, 'Donor name cannot exceed 100 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be at least 1'],
      validate: {
        validator: function (value: number) {
          return value > 0;
        },
        message: 'Amount must be a positive number',
      },
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    type: {
      type: String,
      default: 'donation',
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    screenshotUrl: {
      type: String,
      required: false, // Not required initially (pledge state)
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected', 'completed'],
        message: '{VALUE} is not a valid status',
      },
      default: 'pending',
      required: true,
    },
    isPrivate: {
      type: Boolean,
      default: false,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true, // Automatically creates createdAt and updatedAt fields
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret) {
        const transformed = ret as any;
        transformed.id = transformed._id.toString();
        delete transformed._id;
        delete transformed.__v;
        return transformed;
      },
    },
  }
);

// Add indexes for better query performance
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ donorId: 1, date: -1 });
TransactionSchema.index({ status: 1, createdAt: -1 });
TransactionSchema.index({ createdAt: -1 });
TransactionSchema.index({ date: -1 });

// Prevent model overwrite during hot reload in development
const Transaction: Model<ITransaction> =
  mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;
