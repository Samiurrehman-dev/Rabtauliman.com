# Rabta-ul-Iman - Complete Routes Map

## 🗺️ Application Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Rabta-ul-Iman Platform                   │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
           ┌────────▼────────┐  ┌──────▼──────┐
           │  DONOR PORTAL   │  │ ADMIN PANEL │
           └────────┬────────┘  └──────┬──────┘
                    │                   │
         ┌──────────┼──────────┐       │
         │          │          │       │
    ┌────▼───┐ ┌───▼────┐ ┌──▼───┐ ┌─▼────┐
    │ Public │ │  Auth  │ │ User │ │ Mgmt │
    │        │ │        │ │ Area │ │      │
    └────────┘ └────────┘ └──────┘ └──────┘
```

---

## 📍 Frontend Routes

### Donor Portal (Public)
```
/donor/login              🔓 Login page
/donor/signup             🔓 Registration page
```

### Donor Portal (Protected - Requires Donor Auth)
```
/donor/dashboard          🔒 Main dashboard with stats and ledger
/donor/create-invoice     🔒 3-step invoice creation flow
/donor/profile            🔒 Profile management & password change
```

### Admin Panel (Public)
```
/admin/login              🔓 Admin login page
```

### Admin Panel (Protected - Requires Admin Auth)
```
/admin/dashboard          🔒 Transaction management dashboard
```

---

## 🔌 API Routes

### Authentication
```
POST   /api/auth/register          Create new donor account
POST   /api/auth/[...nextauth]     NextAuth authentication handler
```

### Donor Operations
```
GET    /api/donor/transactions     Fetch personal stats + public ledger
POST   /api/donor/transactions     Create new invoice (pledge)
PUT    /api/donor/transactions     Upload payment screenshot

GET    /api/donor/profile          Fetch donor profile
PUT    /api/donor/profile          Update profile (name, whatsapp, password)
```

### Admin Operations
```
GET    /api/admin/transactions     Fetch all transactions + stats
POST   /api/admin/transactions     Create transaction (manual)
PATCH  /api/admin/transactions/:id Update transaction status
```

---

## 🔐 Authentication Flow

```
┌──────────────┐
│   Landing    │
│     Page     │
└──────┬───────┘
       │
       ├──────────────┬──────────────┐
       │              │              │
┌──────▼───────┐ ┌───▼────────┐ ┌──▼──────────┐
│ Donor Signup │ │ Donor Login│ │ Admin Login │
└──────┬───────┘ └───┬────────┘ └──┬──────────┘
       │              │              │
       └──────┬───────┴──────────────┘
              │
       ┌──────▼───────┐
       │  NextAuth    │
       │  Validation  │
       └──────┬───────┘
              │
       ┌──────┴───────┐
       │              │
┌──────▼───────┐ ┌───▼──────────┐
│    Donor     │ │    Admin     │
│  Dashboard   │ │  Dashboard   │
└──────────────┘ └──────────────┘
```

---

## 💳 Invoice Creation Flow

```
Step 1: Form Input
┌─────────────────────────┐
│  Enter Amount           │
│  Toggle Privacy         │
│  Add Notes (optional)   │
└───────────┬─────────────┘
            │
            │ POST /api/donor/transactions
            │
            ▼
Step 2: Pledge State
┌─────────────────────────┐
│  Invoice Summary        │
│  Payment Instructions   │
│  Bank & EasyPaisa Info  │
└───────────┬─────────────┘
            │
            │ User makes payment externally
            │
            ▼
Step 3: Upload Proof
┌─────────────────────────┐
│  Screenshot URL Input   │
│  Upload Instructions    │
└───────────┬─────────────┘
            │
            │ PUT /api/donor/transactions
            │
            ▼
┌─────────────────────────┐
│  Awaiting Verification  │
│  (Admin Dashboard)      │
└─────────────────────────┘
            │
            │ Admin approves/rejects
            │
            ▼
┌─────────────────────────┐
│  Status Updated         │
│  (Donor Dashboard)      │
└─────────────────────────┘
```

---

## 🗄️ Database Collections

### Users
```javascript
{
  _id: ObjectId
  name: String
  username: String (unique, indexed)
  phone: String
  whatsapp: String
  password: String (hashed)
  role: "donor" | "admin"
  createdAt: Date
  updatedAt: Date
}
```

### Transactions
```javascript
{
  _id: ObjectId
  userId: ObjectId → Users._id
  donorName: String
  amount: Number
  screenshotUrl: String
  status: "pending" | "approved" | "rejected"
  isPrivate: Boolean (default: false)
  notes: String (optional)
  createdAt: Date (indexed)
  updatedAt: Date
}
```

---

## 🎯 Access Control Matrix

| Route/Resource              | Public | Donor | Admin |
|----------------------------|--------|-------|-------|
| `/donor/login`              | ✅     | ❌*   | ❌*   |
| `/donor/signup`             | ✅     | ❌*   | ❌*   |
| `/donor/dashboard`          | ❌     | ✅    | ❌    |
| `/donor/create-invoice`     | ❌     | ✅    | ❌    |
| `/donor/profile`            | ❌     | ✅    | ❌    |
| `/admin/login`              | ✅     | ❌*   | ❌*   |
| `/admin/dashboard`          | ❌     | ❌    | ✅    |
| `POST /api/auth/register`   | ✅     | ✅    | ✅    |
| `GET /api/donor/*`          | ❌     | ✅    | ❌    |
| `POST /api/donor/*`         | ❌     | ✅    | ❌    |
| `PUT /api/donor/*`          | ❌     | ✅    | ❌    |
| `GET /api/admin/*`          | ❌     | ❌    | ✅    |
| `PATCH /api/admin/*`        | ❌     | ❌    | ✅    |

*Redirects to respective dashboard if already logged in

---

## 🔄 Data Flow

### Donor Dashboard
```
User → GET /api/donor/transactions
     ↓
[Auth Middleware]
     ↓
MongoDB Query:
  - Personal transactions (userId match)
  - Personal stats (approved total, pending count)
  - Public ledger (all approved, privacy-filtered)
     ↓
Transform:
  - Hide private donor names → "Anonymous Donor"
  - Hide private screenshots
     ↓
Response → Dashboard UI
```

### Admin Dashboard
```
Admin → GET /api/admin/transactions
      ↓
[Auth Middleware - Admin only]
      ↓
MongoDB Query:
  - All transactions
  - Stats (total approved, pending count, total count)
      ↓
Response → Dashboard UI
      ↓
Admin Action: Approve/Reject
      ↓
PATCH /api/admin/transactions/:id
      ↓
Update status in MongoDB
      ↓
Refresh dashboard
```

---

## 🚦 Status Flow

```
┌──────────┐
│ PENDING  │ ← Initial state after invoice creation
└────┬─────┘
     │
     │ Donor uploads screenshot
     │
┌────▼─────┐
│ PENDING  │ ← Awaiting admin verification
└────┬─────┘
     │
     ├──────────────┬──────────────┐
     │              │              │
┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐
│ APPROVED │  │ REJECTED │  │ PENDING  │
└──────────┘  └──────────┘  └──────────┘
     │              │              │
     │              │              └─→ Can be updated again
     │              │
     └──────────────┴──────────────┐
                                   │
                        ┌──────────▼──────────┐
                        │  Shown in Public    │
                        │  Ledger (approved)  │
                        └─────────────────────┘
```

---

## 📦 Component Hierarchy

### Donor Dashboard
```
DonorDashboard
├── Header
│   ├── Logo
│   ├── User Info Badge
│   ├── Profile Button
│   ├── Refresh Button
│   └── Logout Button
├── Stats Section
│   ├── Total Donations Card
│   └── Pending Pledges Card
├── Create Invoice Button
├── My Recent Activity Card
│   └── Transactions Table
│       ├── Date
│       ├── Amount
│       ├── Status Badge
│       ├── Privacy Badge
│       └── Notes
└── Public Ledger Card
    └── Transactions Table
        ├── Donor Name (or "Anonymous")
        ├── Amount
        └── Date
```

### Create Invoice Flow
```
CreateInvoice
├── Progress Indicator
├── Step 1: Form
│   ├── Amount Input
│   ├── Privacy Toggle
│   ├── Notes Textarea
│   └── Action Buttons
├── Step 2: Pledge
│   ├── Invoice Summary
│   ├── Payment Details
│   ├── Instructions
│   └── Continue Button
└── Step 3: Upload
    ├── Screenshot URL Input
    ├── Upload Instructions
    └── Submit Button
```

---

## 🎨 Design System

### Colors
- **Primary**: Emerald-700 (#047857)
- **Secondary**: Slate-900 (#0f172a)
- **Background**: Slate-50 to Slate-100 gradient
- **Success**: Emerald-600
- **Warning**: Yellow-600
- **Error**: Red-600
- **Info**: Blue-600

### Components
- Cards with border-emerald-200
- Buttons with emerald-700 background
- Badges for status (emerald/yellow/red)
- Tables with hover effects
- Input fields with emerald-700 focus ring

### Typography
- Headings: Font-bold, Slate-900
- Body: Slate-600/700
- Labels: Slate-700, font-medium

---

**🎉 Complete Implementation**

All routes, flows, and components fully implemented and integrated!
