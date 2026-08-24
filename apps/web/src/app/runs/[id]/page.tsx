import { prisma } from '@novaqa/database';
import { notFound } from 'next/navigation';
import { LiveRunViewer } from './live-run-viewer';

export const dynamic = 'force-dynamic';

export default async function TestRunDetailPage({ params }: { params: { id: string } }) {
  const run = await prisma.testRun.findUnique({
    where: { id: params.id },
    include: {
      project: true,
      suite: {
        include: {
          testCases: {
            include: { steps: { orderBy: { order: 'asc' } } }
          }
        }
      },
      environment: true,
      results: {
        include: {
          testCase: { include: { steps: { orderBy: { order: 'asc' } } } },
          artifacts: true,
          findings: true
        }
      },
      findings: true,
      artifacts: true
    }
  });

  if (!run) {
    notFound();
  }

  return (
    <div className="w-full min-h-[calc(100vh-4rem)]">
      <LiveRunViewer initialRun={run as any} />
    </div>
  );
}
