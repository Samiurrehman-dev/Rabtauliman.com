# 🧪 Testing Guide - Donor Portal

## Quick Test Checklist

Use this guide to verify all features are working correctly.

---

## ✅ Pre-Testing Setup

### 1. Environment Check
```bash
# Verify MongoDB is running
mongosh --eval "db.version()"

# Expected: MongoDB version number
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Clear Browser Data (Optional but Recommended)
- Clear cookies and local storage
- Open incognito/private window

---

## 🧪 Test Scenarios

### Scenario 1: Donor Registration & Login

**Test 1.1: Create New Donor Account**
1. Navigate to `http://localhost:3000/donor/signup`
2. Fill in the form:
   - Name: `Test Donor`
   - Username: `testdonor` (lowercase only)
   - Phone: `03001234567`
   - WhatsApp: `03001234567`
   - Password: `test123`
   - Confirm Password: `test123`
3. Click "Create Account"
4. ✅ Should redirect to login page with success indication

**Test 1.2: Login with New Account**
1. Navigate to `http://localhost:3000/donor/login`
2. Enter:
   - Username: `testdonor`
   - Password: `test123`
3. Click "Sign In"
4. ✅ Should redirect to donor dashboard

**Test 1.3: Invalid Login**
1. Try logging in with wrong password
2. ✅ Should show error message "Invalid username or password"

**Test 1.4: Duplicate Username**
1. Try to register with username `testdonor` again
2. ✅ Should show error "Username already exists"

---

### Scenario 2: Donor Dashboard

**Test 2.1: View Initial Dashboard**
1. Login as donor
2. ✅ Should see:
   - Stats cards showing "PKR 0" and "0" pending
   - Empty "My Recent Activity" table
   - Empty "Public Ledger" or existing approved donations

**Test 2.2: Navigation**
1. Click "Profile" button
2. ✅ Should navigate to profile page
3. Click "Back to Dashboard"
4. ✅ Should return to dashboard

**Test 2.3: Logout**
1. Click "Logout" button
2. ✅ Should redirect to login page
3. Try accessing `/donor/dashboard` directly
4. ✅ Should redirect to login page

---

### Scenario 3: Invoice Creation (Complete Flow)

**Test 3.1: Step 1 - Create Invoice (Public)**
1. Login as donor
2. Click "Create New Invoice"
3. Enter:
   - Amount: `5000`
   - Privacy: OFF (public)
   - Notes: `Test donation for mosque`
4. Click "Continue"
5. ✅ Should move to Step 2

**Test 3.2: Step 2 - View Payment Instructions**
1. ✅ Should see:
   - Invoice summary with amount
   - Privacy badge showing "Public"
   - Bank account details
   - EasyPaisa account
   - Payment instructions
2. Click "I've Made the Payment"
3. ✅ Should move to Step 3

**Test 3.3: Step 3 - Upload Screenshot**
1. Enter screenshot URL: `https://via.placeholder.com/400x600/047857/FFFFFF?text=Payment+Screenshot`
2. Click "Submit for Verification"
3. ✅ Should redirect to dashboard
4. ✅ Should see new transaction in "My Recent Activity"
5. ✅ Status should be "Pending" (yellow badge)

**Test 3.4: Create Private Invoice**
1. Click "Create New Invoice" again
2. Enter:
   - Amount: `10000`
   - Privacy: ON (private - toggle switch)
   - Notes: `Private donation`
3. Complete all three steps with screenshot URL
4. ✅ Dashboard should show both transactions
5. ✅ Private transaction should have "Private" badge

---

### Scenario 4: Admin Verification

**Test 4.1: Admin Login**
1. Open new incognito window
2. Navigate to `http://localhost:3000/admin/login`
3. Enter:
   - Username: `admin`
   - Password: `admin123`
4. Click "Sign In"
5. ✅ Should see admin dashboard with pending transactions

**Test 4.2: View Screenshot**
1. Find the test transaction in the table
2. Click the "View" button (eye icon)
3. ✅ Should open dialog showing the screenshot

**Test 4.3: Approve Transaction**
1. Find the first test transaction (PKR 5,000)
2. Click "Approve" (green checkmark)
3. ✅ Transaction should move from pending to approved section
4. ✅ Total Approved Funds should update to PKR 5,000

**Test 4.4: Reject Transaction**
1. Find another pending transaction
2. Click "Reject" (red X)
3. ✅ Status should change to "Rejected"

---

### Scenario 5: Donor Dashboard Updates

**Test 5.1: View Updated Stats**
1. Switch back to donor session (or login again)
2. ✅ Should see:
   - Total Donations: PKR 5,000 (only approved)
   - Pending Pledges: 0 or 1 (if you have remaining pending)

**Test 5.2: Check Public Ledger**
1. Scroll to "Public Ledger" section
2. ✅ Should see approved transaction (PKR 5,000)
3. ✅ Donor name should show "Test Donor" (public donation)
4. If private donation was approved:
   - ✅ Should show "Anonymous Donor" instead of name

**Test 5.3: Verify Transaction History**
1. Check "My Recent Activity"
2. ✅ Should see:
   - Approved transaction (green "Approved" badge)
   - Rejected transaction (red "Rejected" badge)
   - Pending transactions (yellow "Pending" badge)

---

### Scenario 6: Profile Management

**Test 6.1: View Profile**
1. Click "Profile" button from dashboard
2. ✅ Should see:
   - Name field (editable)
   - Username (read-only)
   - Phone (read-only)
   - WhatsApp (editable)
   - Password change section

**Test 6.2: Update Name and WhatsApp**
1. Change name to: `Updated Test Donor`
2. Change WhatsApp to: `03009876543`
3. Click "Save Changes"
4. ✅ Should show success message
5. Go back to dashboard
6. ✅ User info should show updated name

**Test 6.3: Change Password**
1. Go to profile page
2. Fill in:
   - Current Password: `test123`
   - New Password: `newpass123`
   - Confirm Password: `newpass123`
3. Click "Save Changes"
4. ✅ Should show success message
5. Logout and try logging in with new password
6. ✅ Should login successfully

**Test 6.4: Invalid Password Change**
1. Try changing password with wrong current password
2. ✅ Should show error "Current password is incorrect"

---

### Scenario 7: Access Control

**Test 7.1: Donor Cannot Access Admin**
1. Login as donor
2. Try navigating to `http://localhost:3000/admin/dashboard`
3. ✅ Should be denied/redirected

**Test 7.2: Admin Cannot Access Donor Area**
1. Login as admin
2. Try navigating to `http://localhost:3000/donor/dashboard`
3. ✅ Should be denied/redirected

**Test 7.3: Unauthenticated Access**
1. Logout completely
2. Try accessing protected routes directly:
   - `/donor/dashboard`
   - `/donor/create-invoice`
   - `/donor/profile`
   - `/admin/dashboard`
3. ✅ All should redirect to respective login pages

---

### Scenario 8: Multiple Donors

**Test 8.1: Create Second Donor**
1. Logout from first donor
2. Register new donor:
   - Name: `Second Donor`
   - Username: `donor2`
   - Password: `test123`
3. ✅ Should create successfully

**Test 8.2: Create Invoice as Second Donor**
1. Login as `donor2`
2. Create and complete an invoice for PKR 3,000
3. ✅ Dashboard should show this transaction only

**Test 8.3: Admin Approves Second Donor**
1. Login as admin
2. Approve the second donor's transaction
3. ✅ Should update successfully

**Test 8.4: Verify Public Ledger**
1. Login as first donor
2. Check Public Ledger
3. ✅ Should see both donors' approved donations
   - Test Donor: PKR 5,000
   - Second Donor: PKR 3,000

---

## 🐛 Common Issues & Solutions

### Issue 1: MongoDB Connection Error
```bash
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:**
```bash
# Start MongoDB
brew services start mongodb-community
# or
sudo systemctl start mongod
```

### Issue 2: Session Not Persisting
**Solution:**
- Check NEXTAUTH_SECRET in `.env.local`
- Clear browser cookies
- Restart dev server

### Issue 3: Transaction Not Showing
**Solution:**
- Check browser console for errors
- Verify MongoDB connection
- Refresh the page
- Check if userId is being set correctly

### Issue 4: Image Not Loading in Dialog
**Solution:**
- Verify screenshot URL is valid
- Check if URL is accessible
- Try a different image hosting service

---

## 📊 Expected Results Summary

After completing all tests, you should have:

### Database State
- ✅ 2-3 donor users
- ✅ 3-5 transactions in various states
- ✅ At least 2 approved transactions
- ✅ At least 1 private transaction

### Dashboard Views
**Donor 1:**
- Total Donations: PKR 5,000+
- Pending Pledges: varies
- Recent Activity: all their transactions
- Public Ledger: all approved (with privacy filtering)

**Admin:**
- Total Approved Funds: PKR 8,000+
- Pending Count: varies
- Total Transactions: 3-5
- All transactions visible with actions

---

## 🎯 Performance Checks

### Page Load Times (should be < 2 seconds)
- [ ] Login page loads quickly
- [ ] Dashboard loads quickly
- [ ] Invoice creation is smooth
- [ ] Profile page is responsive

### Interactions (should be instant)
- [ ] Button clicks are responsive
- [ ] Form submissions are quick
- [ ] Status updates reflect immediately
- [ ] Navigation is smooth

---

## 📝 Test Report Template

```
Date: ___________
Tester: __________

✅ Passed Tests: ___/30
❌ Failed Tests: ___/30

Issues Found:
1. ________________________________
2. ________________________________
3. ________________________________

Notes:
_____________________________________
_____________________________________
_____________________________________
```

---

## 🚀 Next: Production Testing

Before deploying to production:

1. **Security Audit**
   - Test SQL injection attempts
   - Test XSS attacks
   - Verify password hashing
   - Check session security

2. **Load Testing**
   - Test with 100+ concurrent users
   - Test with large datasets
   - Monitor memory usage
   - Check database performance

3. **Cross-Browser Testing**
   - Chrome
   - Firefox
   - Safari
   - Edge
   - Mobile browsers

4. **Accessibility Testing**
   - Keyboard navigation
   - Screen reader compatibility
   - Color contrast
   - ARIA labels

---

**Happy Testing! 🎉**

All features should work smoothly. If you encounter any issues, check the console logs and MongoDB connection first.
