import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { SP_DEMO_MODE } from '@/lib/sp-config'

export async function GET() {
  if (SP_DEMO_MODE) {
    const filePath = path.join(process.cwd(), 'public', 'mock', 'sp-connection.json')
    const data = JSON.parse(await readFile(filePath, 'utf-8'))
    return NextResponse.json(data)
  }
  // Live mode placeholder
  return NextResponse.json({ error: 'Live mode not implemented' }, { status: 501 })
}
