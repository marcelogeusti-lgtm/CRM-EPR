import React from 'react';
import PipelineClient from './pipeline-client';
import { getLeads } from '../actions/pipeline';

export const dynamic = 'force-dynamic';

export default async function PipelinePage() {
  const result = await getLeads();
  const leads = result.success && result.data ? result.data : [];

  return (
    <PipelineClient initialLeads={leads} />
  );
}
