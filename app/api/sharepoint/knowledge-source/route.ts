import { NextResponse } from 'next/server'
import { SP_DEMO_MODE } from '@/lib/sp-config'

export async function PUT() {
  if (SP_DEMO_MODE) {
    return NextResponse.json({
      kbName: 'finance-knowledge-base',
      displayName: 'SharePoint Finance KB',
      status: 'connected'
    })
  }
  return NextResponse.json({ error: 'Live mode not implemented' }, { status: 501 })
}
