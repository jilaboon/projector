import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { encrypt, decrypt } from '@/lib/encryption';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const credentials = await prisma.credential.findMany({
      where: { projectId: id },
    });

    // Decrypt sensitive fields
    const decryptedCredentials = credentials.map((cred) => ({
      ...cred,
      username: cred.username ? decrypt(cred.username) : null,
      password: cred.password ? decrypt(cred.password) : null,
      notes: cred.notes ? decrypt(cred.notes) : null,
    }));

    return NextResponse.json(decryptedCredentials);
  } catch (error) {
    console.error('Error fetching credentials:', error);
    return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const data = await request.json();

    const credential = await prisma.credential.create({
      data: {
        projectId: id,
        label: data.label,
        username: data.username ? encrypt(data.username) : null,
        password: data.password ? encrypt(data.password) : null,
        url: data.url,
        notes: data.notes ? encrypt(data.notes) : null,
      },
    });

    return NextResponse.json({
      ...credential,
      username: data.username,
      password: data.password,
      notes: data.notes,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating credential:', error);
    return NextResponse.json({ error: 'Failed to create credential' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();

    const credential = await prisma.credential.update({
      where: { id: data.id },
      data: {
        label: data.label,
        username: data.username ? encrypt(data.username) : null,
        password: data.password ? encrypt(data.password) : null,
        url: data.url,
        notes: data.notes ? encrypt(data.notes) : null,
      },
    });

    return NextResponse.json({
      ...credential,
      username: data.username,
      password: data.password,
      notes: data.notes,
    });
  } catch (error) {
    console.error('Error updating credential:', error);
    return NextResponse.json({ error: 'Failed to update credential' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const credentialId = searchParams.get('credentialId');

    if (!credentialId) {
      return NextResponse.json({ error: 'Credential ID required' }, { status: 400 });
    }

    await prisma.credential.delete({
      where: { id: credentialId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting credential:', error);
    return NextResponse.json({ error: 'Failed to delete credential' }, { status: 500 });
  }
}
