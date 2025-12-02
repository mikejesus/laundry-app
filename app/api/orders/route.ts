import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateOrderNumber, validateOrderItems, calculateOrderTotal } from '@/lib/utils/orders';

// GET /api/orders - List orders with filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const search = searchParams.get('search') || '';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build where clause
    const whereClause: any = {
      userId: session.user.id,
    };

    // Filter by status
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    // Filter by customer
    if (customerId) {
      whereClause.customerId = customerId;
    }

    // Search by order number or customer name
    if (search) {
      whereClause.OR = [
        { orderNumber: { contains: search } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) {
        whereClause.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = endDate;
      }
    }

    // Fetch orders
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        customer: true,
        items: true,
        payments: true,
        _count: {
          select: { items: true, payments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const {
      customerId,
      serviceType,
      items,
      dueDate,
      notes,
      paymentAmount,
      paymentMethod,
    } = body;

    // Validation
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer is required' },
        { status: 400 }
      );
    }

    if (!serviceType) {
      return NextResponse.json(
        { error: 'Service type is required' },
        { status: 400 }
      );
    }

    if (!dueDate) {
      return NextResponse.json(
        { error: 'Due date is required' },
        { status: 400 }
      );
    }

    // Validate items
    const itemsValidation = validateOrderItems(items);
    if (!itemsValidation.valid) {
      return NextResponse.json(
        { error: itemsValidation.error },
        { status: 400 }
      );
    }

    // Verify customer exists and belongs to user
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        userId: session.user.id,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Calculate total amount
    const totalAmount = calculateOrderTotal(items);

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Create order with items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          serviceType,
          totalAmount,
          paidAmount: 0,
          status: 'received',
          dueDate: new Date(dueDate),
          notes: notes || null,
          customerId,
          userId: session.user.id,
          items: {
            create: items.map((item: any) => ({
              itemType: item.itemType,
              quantity: item.quantity,
              price: item.price,
              notes: item.notes || null,
            })),
          },
        },
        include: {
          items: true,
          customer: true,
        },
      });

      // Create payment if amount provided
      if (paymentAmount && paymentAmount > 0 && paymentMethod) {
        await tx.payment.create({
          data: {
            amount: paymentAmount,
            method: paymentMethod,
            orderId: newOrder.id,
            userId: session.user.id,
          },
        });

        // Update order paid amount
        await tx.order.update({
          where: { id: newOrder.id },
          data: { paidAmount: paymentAmount },
        });
      }

      return newOrder;
    });

    return NextResponse.json(
      { order, message: 'Order created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
