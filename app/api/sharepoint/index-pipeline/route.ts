import { NextResponse } from 'next/server'
import { SP_DEMO_MODE } from '@/lib/sp-config'

export async function POST() {
  if (SP_DEMO_MODE) {
    return NextResponse.json({ status: 'started', startedAt: Date.now() })
  }
  return NextResponse.json({ error: 'Live mode not implemented' }, { status: 501 })
}
