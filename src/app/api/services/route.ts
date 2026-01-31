import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const service = await prisma.service.create({
      data: {
        name: data.name,
        category: data.category,
        price: parseFloat(data.price) || 0,
        currency: data.currency || 'USD',
        billingCycle: data.billingCycle || 'monthly',
        autoRenew: data.autoRenew ?? true,
        remindBeforeRenew: data.remindBeforeRenew ?? false,
        startDate: data.startDate ? new Date(data.startDate) : null,
        nextBillingDate: data.nextBillingDate ? new Date(data.nextBillingDate) : null,
        status: data.status || 'active',
        url: data.url,
        accountEmail: data.accountEmail,
        notes: data.notes,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}
