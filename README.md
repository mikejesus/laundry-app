# Laundry Management System

A comprehensive fullstack Next.js 14+ application for managing laundry business operations.

## Features

- 📋 Order Management - Track orders from pickup to delivery
- 👥 Customer Management - Manage customer information and history
- 📦 Inventory Tracking - Monitor supplies and stock levels
- 💰 Expense Tracking - Record and categorize business expenses
- 🚚 Supplier Management - Manage supplier contacts and purchases
- 👨‍💼 Staff Management - Track staff information and payroll
- 💳 Payment Processing - Record and track payments
- 📊 Dashboard Analytics - Business overview and statistics
- 🔐 Clerk Authentication - Secure user authentication

## Tech Stack

- **Framework:** Next.js 14+ with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** SQLite with Prisma ORM
- **Authentication:** Clerk
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js 18.x or higher (Note: Latest versions may require Node 20+)
- npm or yarn package manager
- A Clerk account (free tier available at https://clerk.com)

### Installation

1. **Install Dependencies**

```bash
npm install
```

2. **Set Up Environment Variables**

Create a `.env` file in the root directory (or copy from `.env.example`):

```bash
cp .env.example .env
```

Then update the `.env` file with your Clerk credentials:

```env
# Get these from your Clerk dashboard (https://dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here

# Clerk URLs (these can stay as-is)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Database (this can stay as-is for SQLite)
DATABASE_URL="file:./dev.db"

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Getting Clerk Credentials

1. Go to https://clerk.com and sign up for a free account
2. Create a new application
3. In your Clerk dashboard, go to "API Keys"
4. Copy the "Publishable Key" to `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
5. Copy the "Secret Key" to `CLERK_SECRET_KEY`

### Database Setup

1. **Generate Prisma Client**

```bash
npx prisma generate
```

2. **Create Initial Migration**

```bash
npx prisma migrate dev --name init
```

3. **Seed the Database (Optional)**

```bash
npm run prisma:seed
```

This will create sample data including customers, orders, inventory, etc.

Note: The seed script uses a demo user with `clerkId: 'demo_user_clerk_id'`. After you sign up with Clerk, you can either:
- Update the seed script with your actual Clerk user ID
- Or manually create data through the UI after signing in

### Running the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
laundry-app/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication routes
│   │   ├── sign-in/         # Sign in page
│   │   └── sign-up/         # Sign up page
│   ├── dashboard/           # Protected dashboard routes
│   │   ├── customers/       # Customer management
│   │   ├── orders/          # Order management
│   │   ├── inventory/       # Inventory tracking
│   │   ├── expenses/        # Expense tracking
│   │   ├── suppliers/       # Supplier management
│   │   ├── staff/           # Staff management
│   │   ├── payments/        # Payment tracking
│   │   ├── layout.tsx       # Dashboard layout with navbar
│   │   └── page.tsx         # Dashboard home page
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/              # Reusable components
│   └── Navbar.tsx          # Navigation component
├── lib/                     # Utility functions
│   ├── prisma.ts           # Prisma client instance
│   └── auth.ts             # Auth helper functions
├── prisma/                  # Database
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed data script
├── middleware.ts            # Clerk authentication middleware
└── package.json            # Dependencies and scripts
```

## Database Schema

The application includes the following models:

- **User** - Linked to Clerk userId
- **Customer** - Customer information and contact details
- **Order** - Order tracking with status and dates
- **OrderItem** - Individual items in an order
- **Expense** - Business expense tracking
- **Supplier** - Supplier contact information
- **Inventory** - Inventory items with stock levels
- **Staff** - Employee management
- **Payment** - Payment records

## Available Scripts

```bash
# Development
npm run dev          # Start development server

# Building
npm run build        # Build for production
npm start            # Start production server

# Database
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio (database GUI)
npm run prisma:seed      # Seed database with sample data

# Linting
npm run lint        # Run ESLint
```

## Features Overview

### Dashboard
- Quick statistics overview
- Total orders, customers, revenue
- Pending payments and low stock alerts
- Quick action buttons

### Orders
- View all orders with status
- Filter by status (pending, in_progress, ready, completed)
- Track order items and payments
- Due date monitoring

### Customers
- Customer database with contact info
- Order history per customer
- Notes and preferences

### Inventory
- Stock level tracking
- Low stock alerts
- Category organization
- Minimum stock level warnings

### Expenses
- Expense categorization
- Supplier linking
- Date-based tracking
- Total expense calculations

### Suppliers
- Supplier contact management
- Category-based organization
- Notes and details

### Staff
- Employee information
- Role assignment
- Salary tracking
- Status management (active/inactive)

### Payments
- Payment history
- Multiple payment methods
- Order linkage
- Transaction tracking

## Customization

### Adding New Features

1. Create a new route in `app/dashboard/[feature]`
2. Update the navigation in `components/Navbar.tsx`
3. Add necessary API routes if needed
4. Update Prisma schema if database changes are required

### Styling

The application uses Tailwind CSS. You can customize:
- Colors in `tailwind.config.ts`
- Global styles in `app/globals.css`
- Component-specific styles inline with Tailwind classes

## Troubleshooting

### Node Version Issues

If you encounter errors about Node version:
```bash
# Check your Node version
node --version

# If you need to upgrade, use nvm (Node Version Manager)
nvm install 20
nvm use 20
```

### Prisma Issues

If Prisma commands fail:
```bash
# Regenerate Prisma Client
npx prisma generate

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

### Clerk Authentication Issues

- Make sure your Clerk keys are correctly set in `.env`
- Check that the Clerk application is active in your dashboard
- Verify that the callback URLs match your application URLs

## Production Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

Note: For production, consider using PostgreSQL instead of SQLite. Update `DATABASE_URL` and change the provider in `prisma/schema.prisma` from `sqlite` to `postgresql`.

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- Render
- DigitalOcean App Platform

## License

MIT

## Support

For issues and questions:
- Create an issue in the repository
- Check the Next.js documentation: https://nextjs.org/docs
- Check the Prisma documentation: https://www.prisma.io/docs
- Check the Clerk documentation: https://clerk.com/docs
