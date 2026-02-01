import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const proposal = await prisma.proposal.findUnique({
      where: { id },
    });

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    return NextResponse.json(proposal);
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return NextResponse.json({ error: 'Failed to fetch proposal' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const data = await request.json();

    const proposal = await prisma.proposal.update({
      where: { id },
      data: {
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        customerCompany: data.customerCompany,
        title: data.title,
        requirements: data.requirements,
        notes: data.notes,
        estimatedPrice: data.estimatedPrice !== undefined ? (data.estimatedPrice ? parseFloat(data.estimatedPrice) : null) : undefined,
        currency: data.currency,
        status: data.status,
        sentAt: data.sentAt ? new Date(data.sentAt) : undefined,
        respondedAt: data.respondedAt ? new Date(data.respondedAt) : undefined,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
      },
    });

    return NextResponse.json(proposal);
  } catch (error) {
    console.error('Error updating proposal:', error);
    return NextResponse.json({ error: 'Failed to update proposal' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    await prisma.proposal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting proposal:', error);
    return NextResponse.json({ error: 'Failed to delete proposal' }, { status: 500 });
  }
}
