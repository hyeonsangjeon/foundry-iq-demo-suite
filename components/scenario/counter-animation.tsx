'use client'

import { useEffect, useRef, useState } from 'react'

interface CounterAnimationProps {
  target: string
  duration?: number
  className?: string
}

export function CounterAnimation({ target, duration = 1500, className = '' }: CounterAnimationProps) {
  const [display, setDisplay] = useState('0')
  const suffixRef = useRef('')
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (hasAnimated.current) return
    hasAnimated.current = true

    const match = target.match(/^([\d,.]+)(.*)$/)
    if (!match) {
      setDisplay(target)
      return
    }

    const numStr = match[1].replace(/,/g, '')
    const numTarget = parseFloat(numStr)
    suffixRef.current = match[2]
    const hasComma = match[1].includes(',')
    const isDecimal = numStr.includes('.')

    if (isNaN(numTarget)) {
      setDisplay(target)
      return
    }

    const start = performance.now()

    function step(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = numTarget * eased

      if (isDecimal) {
        setDisplay(current.toFixed(1))
      } else if (hasComma) {
        setDisplay(Math.round(current).toLocaleString())
      } else {
        setDisplay(String(Math.round(current)))
      }

      if (progress < 1) {
        requestAnimationFrame(step)
      }
    }

    requestAnimationFrame(step)
  }, [target, duration])

  return (
    <span className={className}>
      {display}{suffixRef.current}
    </span>
  )
}
