import React from 'react';
import { getInboxDeals } from '@/actions/inbox';
import { InboxClientView } from './InboxClientView';

export default async function InboxPage() {
  const deals = await getInboxDeals();

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a]">
      
      <div className="flex-1 min-h-0">
        <InboxClientView initialDeals={deals} />
      </div>
    </div>
  );
}
