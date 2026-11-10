import { Suspense } from 'react';
import type { Metadata } from 'next';
import { WebIqDemo } from '@/components/web-iq/web-iq-demo';

export const metadata: Metadata = {
  title: 'Web IQ | Foundry IQ Demo Suite',
  description: 'One supply-chain question, two views: executive decisions and the evidence behind them.',
};

export default function WebIqPage() {
  return (
    <Suspense fallback={<p className="p-6 text-fg-muted">Loading Web IQ…</p>}>
      <WebIqDemo />
    </Suspense>
  );
}
