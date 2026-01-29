# Rabta-ul-Iman - Admin Dashboard Setup Guide

## 🚀 Quick Start

### 1. Set Up MongoDB

#### Option A: MongoDB Atlas (Cloud - Recommended)
1. Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account and cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password

#### Option B: Local MongoDB
```bash
# Install MongoDB locally (macOS)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Your connection string will be:
mongodb://localhost:27017/rabta-ul-iman
```

### 2. Configure Environment Variables

```bash
# Copy the example file
cp .env.local.example .env.local

# Edit .env.local and add your MongoDB connection string
# MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/rabta-ul-iman
```

### 3. Run the Development Server

```bash
npm run dev
```

Visit: **http://localhost:3000/admin/dashboard**

---

## 📁 Project Structure

```
rabta-ul-iman/
├── src/
│   ├── lib/
│   │   └── db.ts                    # MongoDB connection utility
│   ├── models/
│   │   └── Transaction.ts           # Mongoose Transaction schema
│   └── app/
│       ├── api/
│       │   └── admin/
│       │       └── transactions/
│       │           ├── route.ts     # GET all transactions
│       │           └── [id]/
│       │               └── route.ts # PATCH transaction status
│       └── admin/
│           └── dashboard/
│               └── page.tsx         # Admin Dashboard UI
├── components/
│   └── ui/                          # Shadcn UI components
├── .env.local                       # Your environment variables
└── .env.local.example               # Example environment file
```

---

## 🔌 API Endpoints

### GET `/api/admin/transactions`
Fetch all transactions sorted by newest first.

**Optional Query Parameters:**
- `status` - Filter by status: `pending`, `approved`, or `rejected`

**Example:**
```bash
curl http://localhost:3000/api/admin/transactions?status=pending
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "stats": {
    "totalApprovedFunds": 150000,
    "pendingCount": 5,
    "totalTransactions": 25
  },
  "count": 25
}
```

### PATCH `/api/admin/transactions/[id]`
Update transaction status.

**Request Body:**
```json
{
  "status": "approved" // or "rejected" or "pending"
}
```

**Example:**
```bash
curl -X PATCH http://localhost:3000/api/admin/transactions/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}'
```

### POST `/api/admin/transactions` (Testing Only)
Create a new transaction for testing purposes.

**Request Body:**
```json
{
  "donorName": "Ahmed Ali",
  "amount": 5000,
  "screenshotUrl": "https://example.com/screenshot.jpg"
}
```

---

## 🎨 Dashboard Features

### 1. **Stats Section**
- **Total Approved Funds**: Sum of all approved donations
- **Pending Approvals**: Count of transactions awaiting verification
- **Recent Donors**: Last 5 approved donors

### 2. **Management Table**
Displays all transactions with:
- Donor Name
- Amount (PKR format)
- Date & Time
- Status Badge (Color-coded)
- Action Buttons

### 3. **Actions**
- **View Receipt**: Opens screenshot in a modal dialog
- **Approve**: Changes status to "approved"
- **Reject**: Changes status to "rejected"

### 4. **Real-time Updates**
- Auto-refresh with status updates
- No page reload needed
- Loading states for better UX

---

## 🧪 Testing the Application

### Create Test Transactions

```bash
# Test Transaction 1
curl -X POST http://localhost:3000/api/admin/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "donorName": "Muhammad Hassan",
    "amount": 10000,
    "screenshotUrl": "https://picsum.photos/800/600?random=1"
  }'

# Test Transaction 2
curl -X POST http://localhost:3000/api/admin/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "donorName": "Fatima Ahmed",
    "amount": 5000,
    "screenshotUrl": "https://picsum.photos/800/600?random=2"
  }'

# Test Transaction 3
curl -X POST http://localhost:3000/api/admin/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "donorName": "Ali Raza",
    "amount": 15000,
    "screenshotUrl": "https://picsum.photos/800/600?random=3"
  }'
```

---

## 🎨 Design Theme

The dashboard follows an **Islamic/Village identity** with:
- **Primary Color**: Emerald-700 (Green) - representing prosperity and Islamic tradition
- **Background**: Slate-900/50 gradient - clean and professional
- **Accents**: Yellow for pending, Red for rejected, Green for approved

---

## 🔐 Security Recommendations

### Add Authentication (Next Steps)
The current dashboard is open. For production, add authentication:

1. **Install NextAuth.js**
```bash
npm install next-auth
```

2. **Protect API Routes**
```typescript
import { getServerSession } from "next-auth";
// Add authentication check in API routes
```

3. **Protect Dashboard Page**
```typescript
import { redirect } from "next/navigation";
// Check authentication in page.tsx
```

---

## 📦 Dependencies

- **Next.js 14+** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn UI** - UI components
- **Mongoose** - MongoDB ODM
- **Lucide React** - Icons

---

## 🐛 Troubleshooting

### MongoDB Connection Issues
```
Error: MONGODB_URI is not defined
```
**Solution**: Create `.env.local` and add your MongoDB connection string.

### Component Not Found
```
Module not found: Can't resolve '@/components/ui/button'
```
**Solution**: Reinstall Shadcn components:
```bash
npx shadcn@latest add button card table dialog badge
```

### Module Resolution Issues
```
Module not found: Can't resolve '@/src/lib/db'
```
**Solution**: Check your `tsconfig.json` paths configuration.

---

## 📝 Next Steps

1. ✅ Set up MongoDB connection
2. ✅ Test the dashboard with sample data
3. 🔲 Add authentication (NextAuth.js)
4. 🔲 Deploy to Vercel
5. 🔲 Set up donor submission form
6. 🔲 Add email notifications
7. 🔲 Implement export to Excel/PDF

---

## 📧 Support

For issues or questions, refer to:
- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Shadcn UI Documentation](https://ui.shadcn.com/)

---

**Built with ❤️ for Rabta-ul-Iman Village Funding Initiative**
