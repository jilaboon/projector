import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        activityLog: { orderBy: { timestamp: 'desc' } },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const data = await request.json();

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.labels !== undefined) {
      updateData.labels = data.labels ? JSON.stringify(data.labels) : null;
    }
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }
    if (data.estimateHours !== undefined) updateData.estimateHours = data.estimateHours;
    if (data.blockedReason !== undefined) updateData.blockedReason = data.blockedReason;

    // Handle status changes with DONE/REOPEN logic
    if (data.status !== undefined) {
      updateData.status = data.status;

      if (data.status === 'DONE' && existing.status !== 'DONE') {
        updateData.completedAt = new Date();
      } else if (data.status !== 'DONE' && existing.status === 'DONE') {
        updateData.completedAt = null;
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true } },
        activityLog: { orderBy: { timestamp: 'desc' } },
      },
    });

    // Create activity log entries
    if (data.status !== undefined && data.status !== existing.status) {
      if (data.status === 'DONE') {
        await prisma.taskActivityLog.create({
          data: {
            taskId: id,
            eventType: 'COMPLETED',
            payload: JSON.stringify({ from: existing.status, to: 'DONE' }),
          },
        });
      } else if (existing.status === 'DONE') {
        await prisma.taskActivityLog.create({
          data: {
            taskId: id,
            eventType: 'REOPENED',
            payload: JSON.stringify({ from: 'DONE', to: data.status }),
          },
        });
      } else {
        await prisma.taskActivityLog.create({
          data: {
            taskId: id,
            eventType: 'STATUS_CHANGED',
            payload: JSON.stringify({ from: existing.status, to: data.status }),
          },
        });
      }
    }

    if (data.description !== undefined && data.description !== existing.description) {
      await prisma.taskActivityLog.create({
        data: {
          taskId: id,
          eventType: 'DESCRIPTION_UPDATED',
          payload: null,
        },
      });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
