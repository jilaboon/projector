import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const data = await request.json();

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!data.title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        projectId: id,
        title: data.title,
        description: data.description || null,
        status: data.status || 'TODO',
        priority: data.priority || 'MEDIUM',
        labels: data.labels ? JSON.stringify(data.labels) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        estimateHours: data.estimateHours || null,
      },
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    await prisma.taskActivityLog.create({
      data: {
        taskId: task.id,
        eventType: 'TASK_CREATED',
        payload: JSON.stringify({
          title: task.title,
          status: task.status,
          priority: task.priority,
        }),
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    const where: Record<string, unknown> = { projectId: id };
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching project tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch project tasks' }, { status: 500 });
  }
}
