'use client';

import { useEffect, useRef, useState } from 'react';
import { retrieveFromKnowledgeBase } from '@/lib/api';
import { buildKbRetrieveRequest } from '@/lib/kbWebAnswer';
import { requestWebIqAnswer, WebIqComparisonController, type ComparisonRun, type ComparisonSelection } from '@/lib/webIqComparison';

/** The same source/request adapters are used by the existing KB playground. */
export function useWebIqComparison() {
  const [run, setRun] = useState<ComparisonRun | null>(null);
  const controller = useRef<WebIqComparisonController | null>(null);
  if (!controller.current) controller.current = new WebIqComparisonController({
    onChange: setRun,
    answer: requestWebIqAnswer,
    retrieve: async (selection, signal) => {
      const request = buildKbRetrieveRequest(selection.query,
        [{ role: 'user' as const, content: [{ type: 'text', text: selection.query }] }], selection.settings);
      return retrieveFromKnowledgeBase(selection.kbId, request.messages, request.params, signal);
    },
  });
  useEffect(() => () => controller.current?.invalidate(), []);
  return {
    run,
    startComparison: (selection: ComparisonSelection, token: string) => controller.current!.startComparison(selection, token),
    retryWeb: (runId: string, token: string, selection: ComparisonSelection) => controller.current!.retryWeb(runId, token, selection),
    cancel: () => controller.current!.cancel(),
    clear: () => controller.current!.invalidate(),
  };
}
