import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: Request) {
  try {
    const { text, targetLanguage } = await request.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_KIMI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.moonshot.cn/v1',
    });

    const completion = await openai.chat.completions.create({
      model: 'moonshot-v1-128k',
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
    });

    const translatedText = completion.choices[0]?.message?.content;
    if (!translatedText) {
      return NextResponse.json(
        { error: 'No translation result' },
        { status: 500 }
      );
    }

    return NextResponse.json({ translatedText });
  } catch (error: any) {
    console.error('Kimi translation error:', error);
    return NextResponse.json(
      { error: error.message || 'Translation failed' },
      { status: 500 }
    );
  }
} 