'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function PlaygroundPage() {
  const { agentId } = useParams<{ agentId: string }>()
  const router = useRouter()

  useEffect(() => {
    // Store the selected agent ID in localStorage for the playground to pick up
    if (agentId) {
      localStorage.setItem('selectedAgentId', agentId)
    }
    router.replace('/playground')
  }, [agentId, router])

  return null
}
