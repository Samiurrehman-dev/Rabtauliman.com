# Database Management Scripts

This directory contains utility scripts for managing the database.

## Available Scripts

### 1. Check Database (`check-db.js`)
Checks database connection and creates sample transaction data if needed.

```bash
node scripts/check-db.js
```

**What it does:**
- Connects to MongoDB
- Checks for existing transactions
- Creates 5 sample transactions if none exist
- Displays all transactions and statistics

---

### 2. Create Admin (`create-admin.js`)
Creates the admin user in the database.

```bash
node scripts/create-admin.js
```

**What it does:**
- Creates admin user with username: `admin` and password: `admin123`
- Hashes the password using bcrypt
- Checks if admin already exists before creating

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin123`
- Role: `admin`
- Phone: `+923001234567`

---

### 3. Verify Admin (`verify-admin.js`)
Verifies admin user exists and tests the password.

```bash
node scripts/verify-admin.js
```

**What it does:**
- Checks if admin user exists
- Tests if password "admin123" works
- Resets password if needed
- Creates admin if it doesn't exist

---

## Quick Setup

To set up a fresh database:

```bash
# 1. Create admin user
node scripts/verify-admin.js

# 2. Add sample transactions
node scripts/check-db.js
```

---

## Login URLs

- **Admin Dashboard**: http://localhost:3000/admin/login
  - Username: `admin`
  - Password: `admin123`

- **Donor Portal**: http://localhost:3000/donor/login
  - Use registered donor credentials

---

## Database Info

**MongoDB Connection String:**
```
mongodb+srv://miansami123:sami1234@cluster0.q2uduko.mongodb.net/rabta-ul-iman?retryWrites=true&w=majority
```

**Collections:**
- `users` - Admin and donor users
- `transactions` - Donation transactions

---

## Troubleshooting

### Admin can't login
Run: `node scripts/verify-admin.js`

### No transactions showing
Run: `node scripts/check-db.js`

### Connection errors
Check `.env.local` for correct `MONGODB_URI`
