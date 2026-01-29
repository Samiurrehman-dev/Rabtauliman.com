// Script to check database connection and create sample transactions
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://miansami123:sami1234@cluster0.q2uduko.mongodb.net/rabta-ul-iman?retryWrites=true&w=majority';

const TransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    donorName: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
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
    },
    description: {
      type: String,
      trim: true,
    },
    screenshotUrl: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
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
    },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

async function checkDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!\n');

    // Check existing transactions
    const count = await Transaction.countDocuments();
    console.log(`📊 Total transactions in database: ${count}\n`);

    if (count === 0) {
      console.log('📝 No transactions found. Creating sample data...\n');

      const sampleTransactions = [
        {
          donorName: 'Ahmed Ali',
          amount: 5000,
          screenshotUrl: 'https://via.placeholder.com/400x600.png?text=Receipt+1',
          status: 'pending',
          type: 'donation',
          description: 'Monthly donation',
        },
        {
          donorName: 'Fatima Khan',
          amount: 10000,
          screenshotUrl: 'https://via.placeholder.com/400x600.png?text=Receipt+2',
          status: 'approved',
          type: 'donation',
          description: 'Zakat contribution',
        },
        {
          donorName: 'Muhammad Hassan',
          amount: 3000,
          screenshotUrl: 'https://via.placeholder.com/400x600.png?text=Receipt+3',
          status: 'pending',
          type: 'donation',
          description: 'Sadaqah',
        },
        {
          donorName: 'Ayesha Siddique',
          amount: 7500,
          screenshotUrl: 'https://via.placeholder.com/400x600.png?text=Receipt+4',
          status: 'approved',
          type: 'donation',
          description: 'General donation',
        },
        {
          donorName: 'Omar Farooq',
          amount: 2000,
          screenshotUrl: 'https://via.placeholder.com/400x600.png?text=Receipt+5',
          status: 'rejected',
          type: 'donation',
          description: 'Invalid receipt',
        },
      ];

      const created = await Transaction.insertMany(sampleTransactions);
      console.log(`✅ Created ${created.length} sample transactions!\n`);
    }

    // Fetch and display all transactions
    const transactions = await Transaction.find().sort({ createdAt: -1 });
    console.log('📋 Current Transactions:');
    console.log('========================\n');
    
    transactions.forEach((txn, index) => {
      console.log(`${index + 1}. ${txn.donorName}`);
      console.log(`   Amount: PKR ${txn.amount.toLocaleString()}`);
      console.log(`   Status: ${txn.status}`);
      console.log(`   Date: ${txn.createdAt.toLocaleString()}`);
      console.log('');
    });

    // Calculate stats
    const approved = await Transaction.find({ status: 'approved' });
    const totalApprovedFunds = approved.reduce((sum, txn) => sum + txn.amount, 0);
    const pendingCount = await Transaction.countDocuments({ status: 'pending' });

    console.log('📊 Statistics:');
    console.log('==============');
    console.log(`Total Approved Funds: PKR ${totalApprovedFunds.toLocaleString()}`);
    console.log(`Pending Approvals: ${pendingCount}`);
    console.log(`Total Transactions: ${transactions.length}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
  }
}

checkDatabase();
