import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const scores = body?.scores || {}
  const vals = Object.values(scores).map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n))
  const avg = vals.length ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : 0
  const band = avg >= 75 ? 'A' : avg >= 60 ? 'B' : 'C'
  const bullets = [
    band === 'A' ? 'Strong overall performance on short tasks' : band === 'B' ? 'Solid baseline with room to grow' : 'Foundational skills; thrives with structure',
    scores.reaction ? `Reaction speed: ${scores.reaction} ms` : 'Consistent attention across rounds',
    body?.hints?.length ? `Role signals: ${body.hints.slice(0,2).join(', ')}` : 'Good task hygiene (few errors)'
  ]
  return NextResponse.json({ band, bullets })
}
