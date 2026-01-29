# 🎉 Donor Portal - Quick Start Guide

## What's Been Implemented

✅ **Complete Donor Portal** for Rabta-ul-Iman with:
- User authentication (signup/login)
- Personal dashboard with donation stats
- Public ledger (shows all donations with privacy control)
- Multi-step invoice creation flow
- Payment proof upload
- Profile management

## 🚀 Quick Start

### 1. Run Setup Script
```bash
./setup-donor-portal.sh
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Access the Application

**Donor Portal:**
- Signup: http://localhost:3000/donor/signup
- Login: http://localhost:3000/donor/login
- Dashboard: http://localhost:3000/donor/dashboard

**Admin Portal:**
- Login: http://localhost:3000/admin/login
- Credentials: `admin` / `admin123`

## 📁 New Files Created

### Models
- `src/models/User.ts` - User authentication model
- `src/models/Transaction.ts` - Updated with userId, isPrivate, notes

### API Routes
- `src/app/api/auth/register/route.ts` - Donor registration
- `src/app/api/donor/transactions/route.ts` - Invoice management
- `src/app/api/donor/profile/route.ts` - Profile management

### Frontend Pages
- `src/app/donor/login/page.tsx` - Login page
- `src/app/donor/signup/page.tsx` - Registration page
- `src/app/donor/dashboard/page.tsx` - Main dashboard
- `src/app/donor/create-invoice/page.tsx` - Invoice creation flow
- `src/app/donor/profile/page.tsx` - Profile management

### Configuration
- `src/lib/auth.config.ts` - Updated for dual authentication (admin + donor)

## 🎨 Features

### 1. Authentication System
- Secure password hashing with bcrypt
- Role-based access (admin/donor)
- Protected routes
- Session management

### 2. Donor Dashboard
**Stats Cards:**
- Total Approved Donations
- Pending Pledges

**My Recent Activity:**
- Personal transaction history
- Status tracking (Pending/Approved/Rejected)
- Privacy indicators

**Public Ledger:**
- All approved donations
- Anonymous mode for private donations
- Real-time updates

### 3. Invoice Creation (3-Step Process)
**Step 1 - Form:**
- Enter donation amount
- Toggle privacy ("Hide my name")
- Add optional notes

**Step 2 - Pledge State:**
- View invoice summary
- See admin payment details (Bank/EasyPaisa)
- Payment instructions

**Step 3 - Upload:**
- Submit payment screenshot
- Awaiting admin verification

### 4. Profile Management
- Update name and WhatsApp
- Change password securely
- View account information

## 🔒 Security Features

- **Password Hashing:** bcrypt with 10 salt rounds
- **Role-Based Access:** Separate admin and donor routes
- **Privacy Controls:** Anonymous donation option
- **Session Security:** NextAuth v5 with secure tokens
- **Input Validation:** Server-side and client-side

## 📊 Database Schema

### Users Collection
```javascript
{
  name: String,
  username: String (unique, lowercase),
  phone: String,
  whatsapp: String,
  password: String (hashed),
  role: 'donor' | 'admin',
  createdAt: Date,
  updatedAt: Date
}
```

### Transactions Collection (Updated)
```javascript
{
  userId: ObjectId (ref: User),
  donorName: String,
  amount: Number,
  screenshotUrl: String,
  status: 'pending' | 'approved' | 'rejected',
  isPrivate: Boolean (default: false),
  notes: String (optional),
  createdAt: Date,
  updatedAt: Date
}
```

## 🎨 UI/UX Highlights

**Color Scheme:**
- Primary: Emerald-700 (#047857)
- Background: Slate gradient
- Success: Emerald
- Warning: Yellow-600
- Error: Red-600

**Components Used:**
- Shadcn UI (Card, Button, Badge, Table)
- Lucide React icons
- Custom toggle switches
- Responsive design

## 📝 Usage Flow

### For Donors

1. **Sign Up** at `/donor/signup`
   - Provide: name, username, phone, WhatsApp, password
   
2. **Login** at `/donor/login`
   - Enter username and password
   
3. **Create Invoice** from dashboard
   - Enter amount
   - Choose privacy setting
   - Add notes (optional)
   
4. **Make Payment**
   - View admin payment details
   - Transfer money via Bank/EasyPaisa
   
5. **Upload Proof**
   - Upload screenshot to hosting service
   - Submit URL for verification
   
6. **Wait for Approval**
   - Admin verifies payment
   - Status updates in dashboard

### For Admins

1. **Login** at `/admin/login` (admin/admin123)
2. **View Transactions** in admin dashboard
3. **Verify Screenshots** - Click to view full image
4. **Approve/Reject** - Update transaction status
5. **Monitor** - View stats and recent approvals

## 🔧 Configuration

### Update Payment Details
Edit `src/app/donor/create-invoice/page.tsx` around line 395:
```typescript
// Replace with actual account details
<p className="font-mono font-medium">XXXX-XXXX-XXXX-1234</p>
<p className="font-mono font-medium">03XX-XXXXXXX</p>
```

### Change Admin Credentials
Update `.env.local`:
```bash
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD_HASH=your_bcrypt_hash
```

## 🐛 Troubleshooting

**MongoDB Connection Error:**
```bash
# Start MongoDB
brew services start mongodb-community
# or
mongod --dbpath /path/to/your/db
```

**Build Errors:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

**Session Issues:**
```bash
# Generate new secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Update NEXTAUTH_SECRET in .env.local
```

## 📚 Documentation

- **Full Implementation:** `DONOR_PORTAL_IMPLEMENTATION.md`
- **Admin Dashboard:** `ADMIN_DASHBOARD_README.md`
- **Setup Guide:** This file

## 🎯 Next Steps (Optional)

1. **File Upload Integration**
   - Add Cloudinary/AWS S3 for direct uploads
   - Remove manual URL input

2. **Notifications**
   - Email confirmations
   - SMS alerts for status changes

3. **Analytics**
   - Donation charts
   - Monthly trends
   - Donor statistics

4. **Mobile App**
   - React Native version
   - Push notifications

## 🤝 Support

Need help?
1. Check console for error messages
2. Verify MongoDB is running
3. Ensure `.env.local` is configured
4. Review implementation docs

---

**🎉 Implementation Complete!**

All features working with consistent UI, secure authentication, and complete donor workflow.
