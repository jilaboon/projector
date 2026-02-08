import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        credentials: true,
        envVariables: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const now = new Date();

    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const [total, open, inProgress, blocked, overdue, lastActivity] =
          await Promise.all([
            prisma.task.count({ where: { projectId: project.id } }),
            prisma.task.count({
              where: { projectId: project.id, status: { not: 'DONE' } },
            }),
            prisma.task.count({
              where: { projectId: project.id, status: 'IN_PROGRESS' },
            }),
            prisma.task.count({
              where: { projectId: project.id, status: 'BLOCKED' },
            }),
            prisma.task.count({
              where: {
                projectId: project.id,
                status: { not: 'DONE' },
                dueDate: { lt: now },
              },
            }),
            prisma.taskActivityLog.findFirst({
              where: { task: { projectId: project.id } },
              orderBy: { timestamp: 'desc' },
              select: { timestamp: true },
            }),
          ]);

        return {
          ...project,
          _taskCounts: {
            total,
            open,
            inProgress,
            blocked,
            overdue,
            lastActivityAt: lastActivity?.timestamp?.toISOString() ?? null,
          },
        };
      })
    );

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
