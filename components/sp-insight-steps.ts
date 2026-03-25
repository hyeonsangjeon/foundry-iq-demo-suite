import { InsightStep } from '@/components/insight-popup'
import { getLocale } from '@/lib/i18n'
import { t } from '@/lib/i18n/translations'

export function getSpInsightSteps(): InsightStep[] {
  const locale = getLocale()
  const steps = t.spInsight[locale]?.steps ?? t.spInsight.en.steps
  return steps.map((s, i) => ({ id: i + 1, ...s }))
}

// Legacy export for SSR compatibility — falls back to English
export const SP_INSIGHT_STEPS: InsightStep[] = t.spInsight.en.steps.map((s, i) => ({ id: i + 1, ...s }))
