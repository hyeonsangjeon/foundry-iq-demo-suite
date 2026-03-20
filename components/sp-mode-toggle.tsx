'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { SP_LIVE_SECRET } from '@/lib/sp-config'

interface SPModeToggleProps {
  isLiveMode: boolean
  isLiveAvailable: boolean
  onToggle: (live: boolean) => void
}

export function SPModeToggle({ isLiveMode, isLiveAvailable, onToggle }: SPModeToggleProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  const tooltipTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current)
    }
  }, [])

  const handleLiveClick = () => {
    if (!isLiveAvailable) {
      setShowTooltip(true)
      if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current)
      tooltipTimeout.current = setTimeout(() => setShowTooltip(false), 2500)
      return
    }

    // sessionStorage에 인증이 있으면 모달 없이 바로 전환
    if (typeof window !== 'undefined' && sessionStorage.getItem('sp-live-auth') === 'true') {
      onToggle(true)
      return
    }

    setShowPasswordModal(true)
  }

  const handlePasswordSubmit = () => {
    if (passwordInput === SP_LIVE_SECRET) {
      sessionStorage.setItem('sp-live-auth', 'true')
      setShowPasswordModal(false)
      setPasswordInput('')
      setPasswordError(false)
      onToggle(true)
    } else {
      setPasswordError(true)
    }
  }

  return (
    <div className="relative flex items-center">
      <div className="flex items-center rounded-full border border-glass-border bg-glass-surface/50 p-0.5 gap-0.5">
        {/* Simulated (Mock) */}
        <button
          onClick={() => {
            sessionStorage.removeItem('sp-live-auth')
            onToggle(false)
          }}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200',
            !isLiveMode
              ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
              : 'text-fg-subtle hover:text-fg-muted'
          )}
        >
          <span className={cn(
            'w-1.5 h-1.5 rounded-full',
            !isLiveMode ? 'bg-blue-500' : 'bg-fg-subtle/40'
          )} />
          <span className="hidden sm:inline">Simulated</span>
        </button>

        {/* Live */}
        <button
          onClick={handleLiveClick}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200',
            isLiveMode
              ? 'bg-green-500/20 text-green-600 dark:text-green-400'
              : isLiveAvailable
                ? 'text-fg-subtle hover:text-fg-muted'
                : 'text-fg-subtle/40 cursor-not-allowed'
          )}
        >
          <span className={cn(
            'w-1.5 h-1.5 rounded-full',
            isLiveMode ? 'bg-green-500' : 'bg-fg-subtle/30'
          )} />
          <span className="hidden sm:inline">Live</span>
        </button>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full right-0 mt-2 z-50 w-52 rounded-lg border border-glass-border bg-bg-elevated p-2.5 text-[11px] text-fg-muted shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
          Coming soon — requires SharePoint tenant connection
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowPasswordModal(false); setPasswordInput(''); setPasswordError(false) }}
          />
          <div className="relative z-10 w-80 rounded-2xl border border-glass-border bg-bg-elevated p-6 shadow-2xl">
            <h3 className="text-sm font-semibold text-fg-default mb-1">Live Mode Authentication</h3>
            <p className="text-xs text-fg-muted mb-4">Enter password to enable live SharePoint API calls.</p>

            <input
              type="password"
              value={passwordInput}
              onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false) }}
              onKeyDown={(e) => { if (e.key === 'Enter') handlePasswordSubmit() }}
              placeholder="Password"
              autoFocus
              className={cn(
                'w-full h-10 px-3 rounded-lg border bg-bg-subtle text-sm text-fg-default placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-accent/50',
                passwordError ? 'border-red-500/50' : 'border-glass-border'
              )}
            />

            {passwordError && (
              <p className="text-xs text-red-500 mt-1.5">Incorrect password</p>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setShowPasswordModal(false); setPasswordInput(''); setPasswordError(false) }}
                className="flex-1 h-9 rounded-lg border border-stroke-divider bg-bg-subtle text-xs font-medium text-fg-muted hover:bg-bg-elevated transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordSubmit}
                className="flex-1 h-9 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-semibold transition-colors"
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
