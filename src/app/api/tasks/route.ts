import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { TASK_STATUSES, TASK_PRIORITIES } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: Record<string, unknown> = {};

    if (projectId) {
      where.projectId = projectId;
    }

    if (status && TASK_STATUSES.includes(status as typeof TASK_STATUSES[number])) {
      where.status = status;
    }

    if (priority && TASK_PRIORITIES.includes(priority as typeof TASK_PRIORITIES[number])) {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const allowedSortFields = ['createdAt', 'updatedAt', 'priority', 'dueDate', 'title'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const orderDir = sortOrder === 'asc' ? 'asc' : 'desc';

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: { [orderField]: orderDir },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.projectId || !data.title) {
      return NextResponse.json(
        { error: 'projectId and title are required' },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        projectId: data.projectId,
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
