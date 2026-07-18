import { notFound } from 'next/navigation';
import { getFlow } from '@/actions/automationFlows';
import FlowCanvasClient from './FlowCanvasClient';

export default async function FlowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const flow = await getFlow(id);
  if (!flow) notFound();

  return <FlowCanvasClient flow={flow} />;
}
