import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { encrypt, decrypt } from '@/lib/encryption';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const envVariables = await prisma.envVariable.findMany({
      where: { projectId: id },
      orderBy: [{ environment: 'asc' }, { key: 'asc' }],
    });

    // Decrypt values
    const decryptedEnvVariables = envVariables.map((env) => ({
      ...env,
      value: decrypt(env.value),
    }));

    return NextResponse.json(decryptedEnvVariables);
  } catch (error) {
    console.error('Error fetching env variables:', error);
    return NextResponse.json({ error: 'Failed to fetch env variables' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const data = await request.json();

    const envVariable = await prisma.envVariable.create({
      data: {
        projectId: id,
        environment: data.environment,
        key: data.key,
        value: encrypt(data.value),
      },
    });

    return NextResponse.json({
      ...envVariable,
      value: data.value,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating env variable:', error);
    return NextResponse.json({ error: 'Failed to create env variable' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();

    const envVariable = await prisma.envVariable.update({
      where: { id: data.id },
      data: {
        environment: data.environment,
        key: data.key,
        value: encrypt(data.value),
      },
    });

    return NextResponse.json({
      ...envVariable,
      value: data.value,
    });
  } catch (error) {
    console.error('Error updating env variable:', error);
    return NextResponse.json({ error: 'Failed to update env variable' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const envId = searchParams.get('envId');

    if (!envId) {
      return NextResponse.json({ error: 'Env variable ID required' }, { status: 400 });
    }

    await prisma.envVariable.delete({
      where: { id: envId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting env variable:', error);
    return NextResponse.json({ error: 'Failed to delete env variable' }, { status: 500 });
  }
}
