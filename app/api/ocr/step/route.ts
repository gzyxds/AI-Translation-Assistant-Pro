import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// 设置较长的超时时间
export const maxDuration = 60; // 设置为60秒

export async function POST(request: Request) {
  const apiKey = process.env.NEXT_PUBLIC_STEP_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const image = formData.get('image');
    
    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.stepfun.com/v1',
      dangerouslyAllowBrowser: true,
      timeout: 30000 // 30秒超时
    });

    // 最多重试3次
    let retries = 3;
    let lastError;

    while (retries > 0) {
      try {
        const response = await openai.chat.completions.create({
          model: 'step-1v-32k',
          messages: [
            {
              role: 'system',
              content: 'You are an OCR assistant. Extract text from the provided image accurately.'
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Please extract text from this image:' },
                { type: 'image_url', image_url: { url: image instanceof File ? URL.createObjectURL(image) : image.toString() } }
              ]
            }
          ]
        });

        const extractedText = response.choices[0]?.message?.content;
        if (!extractedText) {
          throw new Error('No text extracted');
        }

        return NextResponse.json({ text: extractedText });
      } catch (error: any) {
        lastError = error;
        if (error.status === 504) {
          retries--;
          if (retries > 0) {
            // 等待1秒后重试
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        }
        break;
      }
    }

    console.error('Step OCR error after retries:', lastError);
    return NextResponse.json(
      { error: lastError?.message || 'OCR failed after retries' },
      { status: lastError?.status || 500 }
    );
  } catch (error: any) {
    console.error('Step OCR error:', error);
    return NextResponse.json(
      { error: error.message || 'OCR failed' },
      { status: error.status || 500 }
    );
  }
} 