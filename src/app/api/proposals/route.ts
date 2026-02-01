import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const proposals = await prisma.proposal.findMany({
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
    });

    return NextResponse.json(proposals);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const proposal = await prisma.proposal.create({
      data: {
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        customerCompany: data.customerCompany,
        title: data.title,
        requirements: data.requirements,
        notes: data.notes,
        estimatedPrice: data.estimatedPrice ? parseFloat(data.estimatedPrice) : null,
        currency: data.currency || 'ILS',
        status: data.status || 'draft',
        sentAt: data.sentAt ? new Date(data.sentAt) : null,
        respondedAt: data.respondedAt ? new Date(data.respondedAt) : null,
        deadline: data.deadline ? new Date(data.deadline) : null,
      },
    });

    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    console.error('Error creating proposal:', error);
    return NextResponse.json({ error: 'Failed to create proposal' }, { status: 500 });
  }
}
