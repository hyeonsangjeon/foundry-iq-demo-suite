'use client'

import { useEffect, useState } from 'react'
import { getLocale, type Locale } from '@/lib/i18n'
import { FEATURE_STATUS_REVIEWED_AT, featureAvailability, featureAvailabilityCopy } from '@/lib/featureAvailability'

export function FeatureAvailability() {
  const [locale, setLocale] = useState<Locale>('en')
  useEffect(() => setLocale(getLocale()), [])
  const copy = featureAvailabilityCopy[locale]

  return (
    <section id="feature-status" className="rounded-lg border border-stroke-divider bg-bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-fg-default">{copy.title}</h2>
        <p className="text-xs text-fg-subtle">{copy.reviewed} {FEATURE_STATUS_REVIEWED_AT}</p>
      </div>
      <p className="mt-3 text-sm leading-6 text-fg-muted">{copy.scope}</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-stroke-divider text-fg-subtle">
            <tr><th className="py-2 pr-4 font-medium">{copy.feature}</th><th className="px-3 py-2 font-medium">{copy.status}</th><th className="py-2 pl-3 font-medium">{copy.source}</th></tr>
          </thead>
          <tbody className="divide-y divide-stroke-divider">
            {featureAvailability.map((item) => (
              <tr key={item.name}>
                <td className="py-3 pr-4 text-fg-default">{item.name}</td>
                <td className="whitespace-nowrap px-3 py-3 text-fg-muted">{item.status}</td>
                <td className="py-3 pl-3"><a href={item.source} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline" aria-label={`${item.name} — ${copy.source}`}>{copy.source} ↗</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs leading-6 text-fg-muted">{copy.apiNote}</p>
      <p className="mt-2 text-xs leading-6 text-fg-muted">{copy.demoNote}</p>
    </section>
  )
}
