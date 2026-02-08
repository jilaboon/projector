import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const now = new Date();

    // Single parallel fetch: projects + all task stats in 3 queries (not 120)
    const [projects, taskCountsByProject, overdueCountsByProject, lastActivityByProject] =
      await Promise.all([
        prisma.project.findMany({
          include: {
            credentials: { select: { id: true } },
            envVariables: { select: { id: true } },
          },
          orderBy: { updatedAt: 'desc' },
        }),
        // One query: count tasks grouped by projectId and status
        prisma.task.groupBy({
          by: ['projectId', 'status'],
          _count: { id: true },
        }),
        // One query: count overdue tasks grouped by projectId
        prisma.task.groupBy({
          by: ['projectId'],
          where: { status: { not: 'DONE' }, dueDate: { lt: now } },
          _count: { id: true },
        }),
        // One query: latest activity per project using raw SQL
        prisma.$queryRaw<{ projectId: string; lastActivityAt: Date }[]>`
          SELECT t."projectId", MAX(a."timestamp") as "lastActivityAt"
          FROM "TaskActivityLog" a
          JOIN "Task" t ON a."taskId" = t."id"
          GROUP BY t."projectId"
        `,
      ]);

    // Build lookup maps
    const taskMap: Record<string, { total: number; open: number; inProgress: number; blocked: number }> = {};
    for (const row of taskCountsByProject) {
      if (!taskMap[row.projectId]) {
        taskMap[row.projectId] = { total: 0, open: 0, inProgress: 0, blocked: 0 };
      }
      const count = row._count.id;
      taskMap[row.projectId].total += count;
      if (row.status !== 'DONE') taskMap[row.projectId].open += count;
      if (row.status === 'IN_PROGRESS') taskMap[row.projectId].inProgress += count;
      if (row.status === 'BLOCKED') taskMap[row.projectId].blocked += count;
    }

    const overdueMap: Record<string, number> = {};
    for (const row of overdueCountsByProject) {
      overdueMap[row.projectId] = row._count.id;
    }

    const activityMap: Record<string, string> = {};
    for (const row of lastActivityByProject) {
      activityMap[row.projectId] = row.lastActivityAt.toISOString();
    }

    // Merge into response
    const projectsWithCounts = projects.map((project) => ({
      ...project,
      _taskCounts: {
        total: taskMap[project.id]?.total ?? 0,
        open: taskMap[project.id]?.open ?? 0,
        inProgress: taskMap[project.id]?.inProgress ?? 0,
        blocked: taskMap[project.id]?.blocked ?? 0,
        overdue: overdueMap[project.id] ?? 0,
        lastActivityAt: activityMap[project.id] ?? null,
      },
    }));

    return NextResponse.json(projectsWithCounts);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        productionUrl: data.productionUrl,
        stagingUrl: data.stagingUrl,
        vercelProjectUrl: data.vercelProjectUrl,
        githubRepoUrl: data.githubRepoUrl,
        readme: data.readme,
        architecture: data.architecture,
        notes: data.notes,
        techStack: data.techStack ? JSON.stringify(data.techStack) : null,
        status: data.status || 'active',
        tags: data.tags ? JSON.stringify(data.tags) : null,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
