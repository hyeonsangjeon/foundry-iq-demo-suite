'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export function useTypingEffect(text: string, speed: number = 20, startDelay: number = 500) {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const indexRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setDisplayedText('')
    setIsComplete(false)
    indexRef.current = 0

    const delayTimer = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        if (indexRef.current < text.length) {
          indexRef.current++
          setDisplayedText(text.slice(0, indexRef.current))
        } else {
          setIsComplete(true)
          if (intervalRef.current) clearInterval(intervalRef.current)
        }
      }, speed)
    }, startDelay)

    return () => {
      clearTimeout(delayTimer)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [text, speed, startDelay])

  return { displayedText, isComplete }
}

interface TypingTextProps {
  text: string
  speed?: number
  startDelay?: number
  onComplete?: () => void
  className?: string
}

export function TypingText({ text, speed = 20, startDelay = 500, onComplete, className = '' }: TypingTextProps) {
  const { displayedText, isComplete } = useTypingEffect(text, speed, startDelay)

  useEffect(() => {
    if (isComplete && onComplete) onComplete()
  }, [isComplete, onComplete])

  return (
    <span className={className}>
      {displayedText}
      {!isComplete && (
        <span className="inline-block w-0.5 h-[1.1em] bg-accent align-text-bottom animate-pulse ml-0.5" />
      )}
    </span>
  )
}
