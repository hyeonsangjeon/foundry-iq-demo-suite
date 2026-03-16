import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { SP_DEMO_MODE } from '@/lib/sp-config'

export async function GET() {
  if (SP_DEMO_MODE) {
    const filePath = path.join(process.cwd(), 'public', 'mock', 'sp-documents.json')
    const data = JSON.parse(await readFile(filePath, 'utf-8'))
    return NextResponse.json(data)
  }
  return NextResponse.json({ error: 'Live mode not implemented' }, { status: 501 })
}
