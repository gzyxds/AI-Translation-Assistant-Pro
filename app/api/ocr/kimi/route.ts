import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const KIMI_API_KEY = process.env.NEXT_PUBLIC_KIMI_API_KEY
const KIMI_API_URL = 'https://api.moonshot.cn/v1'

export async function POST(request: Request) {
  try {
    const { image } = await request.json()
    
    if (!image) {
      return NextResponse.json(
        { error: 'No image data provided' },
        { status: 400 }
      )
    }

    if (!KIMI_API_KEY) {
      return NextResponse.json(
        { error: 'Kimi API key not found' },
        { status: 500 }
      )
    }

    // 从完整的 data URL 中提取 base64 数据
    const base64Data = image.split(';base64,').pop() || image;

    const openai = new OpenAI({
      apiKey: KIMI_API_KEY,
      baseURL: KIMI_API_URL
    })

    const response = await openai.chat.completions.create({
      model: 'moonshot-v1-32k-vision-preview',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的图片文字识别助手。请提取图片中的所有文字，保持原有格式，不要添加任何解释。'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: '请提取这张图片中的所有文字：' },
            { type: 'image_url', image_url: { url: image } }
          ]
        }
      ],
      temperature: 0.1
    })

    const extractedText = response.choices[0]?.message?.content
    if (!extractedText) {
      return NextResponse.json(
        { error: 'No text extracted' },
        { status: 400 }
      )
    }

    return NextResponse.json({ text: extractedText.trim() })
  } catch (error: any) {
    console.error('Error extracting text with Kimi:', error)
    return NextResponse.json(
      { error: error.message || '文字识别失败，请稍后重试' },
      { status: 500 }
    )
  }
} 