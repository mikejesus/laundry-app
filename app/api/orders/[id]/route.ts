import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { isValidStatusTransition } from '@/lib/utils/orders';

// GET /api/orders/[id] - Get order details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const orderId = params.id;

    // Fetch order
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: user.id,
      },
      include: {
        customer: true,
        items: true,
        payments: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PUT /api/orders/[id] - Update order
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const orderId = params.id;

    // Check if order exists and belongs to user
    const existingOrder = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: user.id,
      },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { status, notes, paymentAmount, paymentMethod } = body;

    // If updating status, validate transition
    if (status && status !== existingOrder.status) {
      if (!isValidStatusTransition(existingOrder.status, status)) {
        return NextResponse.json(
          { error: `Cannot change status from ${existingOrder.status} to ${status}` },
          { status: 400 }
        );
      }
    }

    // Update order in a transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update order
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          ...(status && { status }),
          ...(notes !== undefined && { notes }),
        },
        include: {
          customer: true,
          items: true,
          payments: true,
        },
      });

      // Add payment if provided
      if (paymentAmount && paymentAmount > 0 && paymentMethod) {
        await tx.payment.create({
          data: {
            amount: paymentAmount,
            method: paymentMethod,
            orderId: order.id,
            userId: user.id,
          },
        });

        // Update paid amount
        const newPaidAmount = order.paidAmount + paymentAmount;
        await tx.order.update({
          where: { id: orderId },
          data: { paidAmount: newPaidAmount },
        });

        order.paidAmount = newPaidAmount;
      }

      return order;
    });

    return NextResponse.json(
      { order: updatedOrder, message: 'Order updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/[id] - Delete order
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const orderId = params.id;

    // Check if order exists and belongs to user
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: user.id,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Prevent deletion of delivered orders
    if (order.status === 'delivered') {
      return NextResponse.json(
        { error: 'Cannot delete delivered orders' },
        { status: 400 }
      );
    }

    // Delete order (cascade will delete items and payments)
    await prisma.order.delete({
      where: { id: orderId },
    });

    return NextResponse.json(
      { message: 'Order deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}
