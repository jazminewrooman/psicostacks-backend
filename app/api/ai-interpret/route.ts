import { NextResponse } from 'next/server'
import { Mistral } from '@mistralai/mistralai'
import { createCredential } from '@/lib/credentials'

// CORS headers to allow requests from frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Initialize Mistral AI client
const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY || '',
})

// Handler for preflight requests
export async function OPTIONS(req: Request) {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(req: Request) {
  const contentType = req.headers.get('content-type') || ''
  
  // Case 1: FormData with PDF file
  if (contentType.includes('multipart/form-data')) {
    try {
      const formData = await req.formData()
      const file = formData.get('file') as File
      const email = formData.get('email') as string
      
      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400, headers: corsHeaders }
        )
      }
      
      if (!email || !email.includes('@')) {
        return NextResponse.json(
          { error: 'Valid email is required' },
          { status: 400, headers: corsHeaders }
        )
      }
      
      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      // Use require for CommonJS module (pdf-parse v1.x)
      // @ts-ignore - pdf-parse is a CommonJS module loaded as external
      const pdf = require('pdf-parse')
      
      // Extract text from PDF (v1.x has simple functional API)
      const data = await pdf(buffer)
      const rawText = data.text
      
      if (!rawText || rawText.trim().length === 0) {
        return NextResponse.json(
          { error: 'No text could be extracted from PDF' },
          { status: 400, headers: corsHeaders }
        )
      }
      
      console.log('Extracted PDF text (first 500 chars):', rawText.substring(0, 500))
      
      // Process text with Mistral AI
      const prompt = `You are an expert in interpreting psychometric assessment reports. Analyze the following report and extract:

1. An overall classification (band A, B, or C) where:
   - A = High performance/potential
   - B = Medium/solid performance
   - C = Needs development/improvement areas

2. 3 key points (bullets) about the candidate's strengths, opportunity areas, or main characteristics.

Respond ONLY with a valid JSON object with this structure:
{
  "band": "A" | "B" | "C",
  "bullets": ["point 1", "point 2", "point 3"]
}

Report text:
${rawText}

JSON:`

      const chatResponse = await mistral.chat.complete({
        model: 'mistral-small-latest',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        maxTokens: 500,
      })

      const aiContent = chatResponse.choices?.[0]?.message?.content
      
      // Convert to string if needed
      const contentStr = typeof aiContent === 'string' 
        ? aiContent 
        : JSON.stringify(aiContent || {})
      
      // Attempt to parse JSON response
      let interpretation
      try {
        // Extract JSON if it comes with markdown code blocks
        const jsonMatch = contentStr.match(/\{[\s\S]*\}/)
        const jsonStr = jsonMatch ? jsonMatch[0] : contentStr
        interpretation = JSON.parse(jsonStr)
      } catch (error) {
        console.error('Error parsing AI response:', aiContent)
        interpretation = {
          band: 'B',
          bullets: [
            'PDF processed successfully',
            `Extracted ${data.numpages} pages with ${rawText.length} characters`,
            'Error interpreting content with AI'
          ]
        }
      }
      
      // Create verifiable credential
      const reportJson = {
        fileName: file.name,
        numPages: data.numpages,
        rawTextLength: rawText.length,
        extractedAt: new Date().toISOString(),
        interpretation: {
          band: interpretation.band || 'B',
          bullets: interpretation.bullets || []
        },
        metadata: {
          pdfParser: 'pdf-parse@1.1.1',
          aiModel: 'mistral-small-latest',
          schemaVersion: 'psicostacks:v1'
        }
      }

      const summary = {
        band: interpretation.band || 'B',
        bullets: interpretation.bullets || []
      }

      // Create credential using shared function
      const credential = await createCredential({
        email,
        reportJson,
        summary,
        schemaId: 'psicostacks:v1',
      })

      return NextResponse.json({ 
        band: interpretation.band || 'B',
        bullets: interpretation.bullets || [],
        credential: {
          id: credential.id,
          commitmentHash: credential.commitmentHash,
          expiryAt: credential.expiryAt,
          status: credential.status, // 'pending' - needs blockchain mint
        },
        metadata: {
          fileName: file.name,
          numPages: data.numpages,
          rawTextLength: rawText.length
        }
      }, { headers: corsHeaders })
      
    } catch (error) {
      console.error('Error processing PDF:', error)
      return NextResponse.json({ 
        error: 'Failed to process PDF file' 
      }, { status: 500, headers: corsHeaders })
    }
  }
  
  // Case 2: JSON with scores (original format)
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
  return NextResponse.json({ band, bullets }, { headers: corsHeaders })
}
