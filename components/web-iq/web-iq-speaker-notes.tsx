'use client';

import { cn } from '@/lib/utils';
import type { WebIqLanguage } from '@/lib/webIqScenario';
import { WEB_IQ_PRESENTATION_STAGES } from '@/components/web-iq/web-iq-presentation';

interface WebIqSpeakerNotesProps {
  language: WebIqLanguage;
  stageIndex: number;
  onSelectStage: (index: number) => void;
}

export function WebIqSpeakerNotes({ language, stageIndex, onSelectStage }: WebIqSpeakerNotesProps) {
  const ko = language === 'ko';
  const selectedStage = WEB_IQ_PRESENTATION_STAGES[stageIndex];
  return (
    <details className="rounded-xl border border-stroke-divider p-5 text-sm">
      <summary className="cursor-pointer font-medium">{ko ? '발표 대본 · 한국어 / 영어' : 'Speaker notes · Korean / English'}</summary>
      <div className="mt-4 grid grid-cols-6 gap-2" role="group" aria-label={ko ? '발표 단계 선택' : 'Select presentation stage'}>
        {WEB_IQ_PRESENTATION_STAGES.map((stage, index) => (
          <button key={stage.id} type="button" onClick={() => onSelectStage(index)} aria-pressed={index === stageIndex}
            aria-label={`${stage.id}. ${stage.label[language]}`} aria-controls="web-iq-selected-script" title={stage.label[language]}
            className={cn('min-h-11 rounded-lg border px-2 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent', index === stageIndex ? 'border-accent bg-accent/10 text-accent' : 'border-stroke-divider text-fg-muted hover:bg-bg-hover')}>
            {stage.id}
          </button>
        ))}
      </div>
      <section id="web-iq-selected-script" className="mt-4" aria-label={ko ? '선택한 단계 대본' : 'Selected stage script'}>
        <h3 className="font-semibold text-accent">{selectedStage.id}. {selectedStage.label[language]}</h3>
        <p lang="ko" className="mt-3 break-keep leading-7 text-fg-muted"><span className="mb-1 block text-xs font-medium text-fg-subtle">한국어</span>{selectedStage.narration.ko}</p>
        <p lang="en" className="mt-3 leading-7 text-fg-muted"><span className="mb-1 block text-xs font-medium text-fg-subtle">English</span>{selectedStage.narration.en}</p>
      </section>
    </details>
  );
}
