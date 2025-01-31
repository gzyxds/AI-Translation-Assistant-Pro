import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(req: Request) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_STEP_API_KEY;
    if (!apiKey) {
      return new NextResponse('API key not configured', { status: 500 })
    }

    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.stepfun.com/v1'
    })

    const { text, targetLanguage } = await req.json()

    if (!text) {
      return new NextResponse('Text is required', { status: 400 })
    }

    if (!targetLanguage) {
      return new NextResponse('Target language is required', { status: 400 })
    }

    const completion = await openai.chat.completions.create({
      model: 'step-2-16k',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the following text to ${targetLanguage}. Keep the original format and style.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })

    const translation = completion.choices[0]?.message?.content || ''
    if (!translation) {
      return new NextResponse('No translation result', { status: 500 })
    }

    return NextResponse.json({ translation })
  } catch (error: any) {
    console.error('Translation error:', error)
    return new NextResponse(error.message || 'Internal Server Error', {
      status: error.status || 500,
    })
  }
} 