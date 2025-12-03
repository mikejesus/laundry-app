import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateNigerianPhone, formatNigerianPhone, validateEmail } from '@/lib/utils/validation';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/customers/[id] - Get customer details with order history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customerId = params.id;

    // Fetch customer with orders
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        userId: session.user.id,
      },
      include: {
        orders: {
          include: {
            items: true,
            payments: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Calculate totals
    const totalSpent = customer.orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );
    const totalPaid = customer.orders.reduce(
      (sum, order) => sum + order.paidAmount,
      0
    );
    const outstandingBalance = totalSpent - totalPaid;

    const customerWithStats = {
      ...customer,
      totalOrders: customer.orders.length,
      totalSpent,
      totalPaid,
      outstandingBalance,
    };

    return NextResponse.json({ customer: customerWithStats }, { status: 200 });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

// PUT /api/customers/[id] - Update customer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customerId = params.id;

    // Check if customer exists and belongs to user
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        userId: session.user.id,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
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

    // Check if another customer with same phone exists
    const duplicateCustomer = await prisma.customer.findFirst({
      where: {
        userId: session.user.id,
        phone: formattedPhone,
        id: { not: customerId },
      },
    });

    if (duplicateCustomer) {
      return NextResponse.json(
        { error: 'Another customer with this phone number already exists' },
        { status: 400 }
      );
    }

    // Update customer
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        name: name.trim(),
        phone: formattedPhone,
        email: email?.trim() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json(
      { customer: updatedCustomer, message: 'Customer updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/[id] - Delete customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customerId = params.id;

    // Check if customer exists and belongs to user
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        userId: session.user.id,
      },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Check if customer has orders
    if (customer._count.orders > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete customer with existing orders. This customer has ${customer._count.orders} order(s).`,
        },
        { status: 400 }
      );
    }

    // Delete customer
    await prisma.customer.delete({
      where: { id: customerId },
    });

    return NextResponse.json(
      { message: 'Customer deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
