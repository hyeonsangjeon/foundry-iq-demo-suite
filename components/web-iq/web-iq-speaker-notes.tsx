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
  return (
    <details className="rounded-xl border border-stroke-divider p-5 text-sm">
      <summary className="cursor-pointer font-medium">{ko ? '발표 대본 · 한국어 / 영어' : 'Speaker notes · Korean / English'}</summary>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label htmlFor="web-iq-script-stage" className="text-xs text-fg-muted">{ko ? '발표 단계 선택' : 'Select presentation stage'}</label>
        <select id="web-iq-script-stage" value={stageIndex} onChange={event => onSelectStage(Number(event.target.value))}
          className="max-w-full rounded-lg border border-stroke-divider bg-bg-card p-2.5 text-sm text-fg-default">
          {WEB_IQ_PRESENTATION_STAGES.map((stage, index) => <option key={stage.id} value={index}>{stage.id}. {stage.label[language]}</option>)}
        </select>
      </div>
      <p className="mt-3 text-xs leading-5 text-fg-subtle">{ko ? '단계를 선택하면 화면과 대본이 함께 바뀌고 자동 재생은 멈춥니다. 아래에서 여섯 단계의 한영 대본을 모두 볼 수 있습니다.' : 'Selecting a stage updates the walkthrough and pauses playback. All six Korean and English scripts are available below.'}</p>
      <ol className="mt-4 space-y-4" aria-label={ko ? '여섯 단계 발표 대본' : 'Six-stage speaker notes'}>
        {WEB_IQ_PRESENTATION_STAGES.map((stage, index) => (
          <li key={stage.id} className={cn('rounded-lg border p-4', index === stageIndex ? 'border-accent bg-accent/5' : 'border-stroke-divider')}>
            <button type="button" onClick={() => onSelectStage(index)} aria-current={index === stageIndex ? 'step' : undefined}
              className="rounded text-left font-semibold text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              {stage.id}. {stage.label[language]}
            </button>
            <p lang="ko" className="mt-3 break-keep leading-7 text-fg-muted"><span className="mb-1 block text-xs font-medium text-fg-subtle">한국어</span>{stage.narration.ko}</p>
            <p lang="en" className="mt-3 leading-7 text-fg-muted"><span className="mb-1 block text-xs font-medium text-fg-subtle">English</span>{stage.narration.en}</p>
          </li>
        ))}
      </ol>
    </details>
  );
}
