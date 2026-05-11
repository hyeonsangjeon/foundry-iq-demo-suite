'use client'

import { Suspense } from 'react'
import { FabricIqKsLanding } from '@/components/fabric-iq-ks/fabric-iq-ks-landing'

export default function FabricIqKsPage() {
  return (
    <Suspense>
      <FabricIqKsLanding />
    </Suspense>
  )
}
