import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateNigerianPhone, formatNigerianPhone, validateEmail } from '@/lib/utils/validation';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/customers - List all customers with search
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get search query from URL params
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';

    // Build where clause for search
    const whereClause = {
      userId: session.user.id,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    // Fetch customers with aggregated data
    const customers = await prisma.customer.findMany({
      where: whereClause,
      include: {
        orders: {
          select: {
            totalAmount: true,
            paidAmount: true,
          },
        },
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate totals for each customer
    const customersWithTotals = customers.map((customer) => {
      const totalSpent = customer.orders.reduce(
        (sum, order) => sum + order.totalAmount,
        0
      );
      const totalPaid = customer.orders.reduce(
        (sum, order) => sum + order.paidAmount,
        0
      );
      const outstandingBalance = totalSpent - totalPaid;

      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        notes: customer.notes,
        createdAt: customer.createdAt,
        totalOrders: customer._count.orders,
        totalSpent,
        outstandingBalance,
      };
    });

    return NextResponse.json({ customers: customersWithTotals }, { status: 200 });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create new customer
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { name, phone, email, address, notes } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Customer name is required' },
        { status: 400 }
      );
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Validate phone number
    const phoneValidation = validateNigerianPhone(phone);
    if (!phoneValidation.valid) {
      return NextResponse.json(
        { error: phoneValidation.message },
        { status: 400 }
      );
    }

    // Format phone number
    const formattedPhone = formatNigerianPhone(phone);

    // Validate email if provided
    if (email && email.trim()) {
      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        return NextResponse.json(
          { error: emailValidation.message },
          { status: 400 }
        );
      }
    }

    // Check if customer with same phone already exists
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        userId: session.user.id,
        phone: formattedPhone,
      },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'A customer with this phone number already exists' },
        { status: 400 }
      );
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        phone: formattedPhone,
        email: email?.trim() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(
      { customer, message: 'Customer created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}
