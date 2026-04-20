'use client'

import { cn } from '@/lib/utils'

const STEP_LABELS = ['Intro', 'S1', 'T1', 'S2', 'T2', 'Fabric', 'S3', 'T3', 'S3b', 'T4', 'Summary']

interface ScenarioStepperProps {
  currentStep: number
  totalSteps?: number
}

export function ScenarioStepper({ currentStep, totalSteps = 11 }: ScenarioStepperProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      {/* Dots — hidden on very small screens */}
      <div className="hidden sm:flex items-center gap-1.5">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-300',
                i < currentStep
                  ? i === 5 ? 'bg-emerald-500' : 'bg-accent'
                  : i === currentStep
                  ? i === 5
                    ? 'bg-emerald-500 ring-2 ring-emerald-500/30 ring-offset-1 ring-offset-transparent'
                    : 'bg-accent ring-2 ring-accent/30 ring-offset-1 ring-offset-transparent'
                  : 'bg-white/15'
              )}
              title={label}
            />
            {i < STEP_LABELS.length - 1 && (
              <div
                className={cn(
                  'w-3 h-px transition-colors duration-300',
                  i < currentStep ? 'bg-accent/50' : 'bg-white/10'
                )}
              />
            )}
          </div>
        ))}
      </div>
      {/* Progress bar */}
      <div className="w-32 sm:w-40 h-1 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  )
}
