# Quick Setup Guide

Your Next.js 14+ Laundry Management Application is ready! Here's how to get started:

## ✅ Completed Setup

- ✅ Next.js 14+ with TypeScript and Tailwind CSS
- ✅ All dependencies installed (418 packages)
- ✅ Prisma Client generated
- ✅ Database schema created with 9 models
- ✅ Initial migration applied
- ✅ Clerk authentication configured
- ✅ All dashboard pages created

## 🚀 Next Steps to Run the Application

### 1. Get Clerk Authentication Keys

1. Go to https://clerk.com and create a free account
2. Create a new application
3. Go to "API Keys" in your dashboard
4. Copy your keys and update the `.env` file:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
```

### 2. (Optional) Seed the Database

To add sample data for testing:

```bash
npm run prisma:seed
```

This will create:
- 2 sample customers
- 3 sample orders with items and payments
- 2 suppliers
- 4 inventory items
- 3 staff members
- 4 expense records

**Note:** The seed uses a demo Clerk user ID. After you sign up with Clerk, the app will automatically create your user in the database when you first sign in.

### 3. Start the Development Server

```bash
npm run dev
```

Then open http://localhost:3000 in your browser.

### 4. Sign Up and Explore

1. Click "Get Started" on the landing page
2. Sign up with your email
3. You'll be redirected to the dashboard
4. Explore all the features!

## 📂 Application Structure

### Dashboard Pages
- `/dashboard` - Main dashboard with statistics
- `/dashboard/orders` - Order management
- `/dashboard/customers` - Customer database
- `/dashboard/inventory` - Inventory tracking with low stock alerts
- `/dashboard/expenses` - Expense tracking
- `/dashboard/suppliers` - Supplier management
- `/dashboard/staff` - Staff and payroll management
- `/dashboard/payments` - Payment history

## 🎨 Features Included

### Order Management
- Track order status (pending, in_progress, ready, completed)
- Link orders to customers
- Multiple order items per order
- Due date tracking
- Service type categorization

### Customer Management
- Store customer contact information
- Track order history per customer
- Notes and preferences

### Inventory Management
- Track stock levels
- Low stock alerts (visual warnings)
- Category organization
- Minimum stock level settings

### Financial Tracking
- Expense categorization
- Supplier linking for expenses
- Payment method tracking
- Revenue and pending payment calculations

### Staff Management
- Employee database
- Role assignment
- Salary tracking
- Status management (active/inactive)
- Hire date tracking

## 🛠️ Useful Commands

```bash
# Development
npm run dev              # Start dev server

# Database
npm run prisma:studio    # Open Prisma Studio (GUI)
npm run prisma:migrate   # Create new migration
npm run prisma:seed      # Seed database

# Build
npm run build            # Build for production
npm start                # Start production server
```

## 🎯 Database Models

Your database includes these models:

1. **User** - Synced with Clerk authentication
2. **Customer** - name, phone, address, email, notes
3. **Order** - orderNumber, serviceType, amounts, status, dates
4. **OrderItem** - itemType, quantity, price (linked to orders)
5. **Expense** - category, amount, description, date, receipt
6. **Supplier** - name, phone, email, category
7. **Inventory** - name, quantity, unit, minStockLevel, category
8. **Staff** - name, phone, role, salary, status
9. **Payment** - amount, method, date, transactionId (linked to orders)

## 🔒 Authentication

The app uses Clerk for authentication:
- Secure sign-up/sign-in flows
- User management handled by Clerk
- Automatic user creation in your database
- Protected routes (all `/dashboard` routes require authentication)

## 📝 Important Notes

1. **Environment Variables**: Make sure to add your real Clerk keys to `.env` before running
2. **SQLite Database**: Currently using SQLite (`dev.db`). For production, consider PostgreSQL
3. **Seed Data**: The seed script creates a demo user - your real user will be created when you sign up
4. **Node Version**: You're on Node 18.20.8. The app works but you may see warnings. Consider upgrading to Node 20+ for full compatibility

## 🐛 Troubleshooting

### If the app won't start:
1. Make sure you've added your Clerk keys to `.env`
2. Try deleting `node_modules` and running `npm install` again
3. Run `npx prisma generate` to regenerate the Prisma Client

### If you see database errors:
1. Delete `prisma/dev.db`
2. Run `npx prisma migrate dev --name init` again

### If authentication isn't working:
1. Verify your Clerk keys are correct in `.env`
2. Make sure you're using `NEXT_PUBLIC_` prefix for the publishable key
3. Check that your Clerk app is active in the dashboard

## 🎉 You're All Set!

Your laundry management application is ready to use. Just add your Clerk keys and start the dev server!

For more details, see the main [README.md](./README.md) file.
