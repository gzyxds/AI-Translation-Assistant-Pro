import { NextResponse } from 'next/server'

const KIMI_API_KEY = process.env.NEXT_PUBLIC_KIMI_API_KEY
const KIMI_API_URL = 'https://api.moonshot.cn/v1'

// 增加超时时间
const TIMEOUT = {
  UPLOAD: 30000,    // 30秒
  CONTENT: 45000,   // 45秒
  PROCESS: 60000    // 60秒
}

// 带超时的 fetch
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(id)
    
    // 检查响应状态
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: '请求失败' } }))
      throw new Error(error.error?.message || `请求失败: ${response.status}`)
    }
    
    return response
  } catch (error: any) {
    clearTimeout(id)
    if (error.name === 'AbortError') {
      throw new Error('请求超时，请重试')
    }
    throw error
  }
}

// 分步上传文件
async function uploadFile(file: string, filename: string) {
  try {
    const formData = new FormData()
    const fileBlob = new Blob([Buffer.from(file, 'base64')], { type: 'application/pdf' })
    const pdfFile = new File([fileBlob], filename, { type: 'application/pdf' })
    formData.append('file', pdfFile)
    formData.append('purpose', 'file-extract')

    const uploadResponse = await fetchWithTimeout(`${KIMI_API_URL}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KIMI_API_KEY}`
      },
      body: formData
    }, TIMEOUT.UPLOAD)

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json().catch(() => ({ error: { message: '文件上传失败' } }))
      console.error('KIMI文件上传错误:', error)
      throw new Error(error.error?.message || '文件上传失败')
    }

    return await uploadResponse.json()
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('文件上传超时')
    }
    throw error
  }
}

// 获取文件内容
async function getFileContent(fileId: string) {
  try {
    const contentResponse = await fetchWithTimeout(`${KIMI_API_URL}/files/${fileId}/content`, {
      headers: {
        'Authorization': `Bearer ${KIMI_API_KEY}`
      }
    }, TIMEOUT.CONTENT)

    if (!contentResponse.ok) {
      const error = await contentResponse.json().catch(() => ({ error: { message: '文件内容获取失败' } }))
      console.error('KIMI文件内容获取错误:', error)
      throw new Error(error.error?.message || '文件内容获取失败')
    }

    return await contentResponse.text()
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('文件内容获取超时')
    }
    throw error
  }
}

// 处理文件内容
async function processContent(content: string) {
  try {
    const messages = [
      {
        role: 'system',
        content: '你是 Kimi，由 Moonshot AI 提供的人工智能助手。请提取文件中的所有文字内容，保持原文的格式和换行，不需要总结或解释。'
      },
      {
        role: 'system',
        content
      },
      {
        role: 'user',
        content: '请直接返回文件的原始内容，保持格式，不要添加任何解释或总结。'
      }
    ]

    const chatResponse = await fetchWithTimeout(`${KIMI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIMI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'moonshot-v1-32k',
        messages,
        temperature: 0.3
      })
    }, TIMEOUT.PROCESS)

    if (!chatResponse.ok) {
      const error = await chatResponse.json().catch(() => ({ error: { message: 'API请求失败' } }))
      console.error('KIMI API错误:', error)
      throw new Error(error.error?.message || 'API请求失败')
    }

    const data = await chatResponse.json()
    if (!data.choices?.[0]?.message?.content) {
      console.error('KIMI API响应格式错误:', data)
      throw new Error('API返回格式错误')
    }

    return data.choices[0].message.content.trim()
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('内容处理超时')
    }
    throw error
  }
}

export async function POST(request: Request) {
  try {
    const { file, filename, service } = await request.json()

    if (!file) {
      return NextResponse.json(
        { error: '未提供文件' },
        { status: 400 }
      )
    }

    // 检查文件大小
    const base64Size = file.length * 0.75 // base64到字节的近似转换
    if (base64Size > 5 * 1024 * 1024) { // 5MB
      return NextResponse.json(
        { error: '文件大小超过限制' },
        { status: 400 }
      )
    }

    if (service !== 'kimi') {
      return NextResponse.json(
        { error: '不支持的服务' },
        { status: 400 }
      )
    }

    if (!KIMI_API_KEY) {
      return NextResponse.json(
        { error: '未配置Kimi API密钥' },
        { status: 500 }
      )
    }

    // 分步处理
    try {
      // 步骤1：上传文件
      console.log('开始上传文件...')
      const fileObject = await uploadFile(file, filename)
      
      // 步骤2：获取文件内容
      console.log('开始获取文件内容...')
      const fileContent = await getFileContent(fileObject.id)
      
      // 步骤3：处理内容
      console.log('开始处理文件内容...')
      const result = await processContent(fileContent)

      // 检查响应大小
      if (result.length > 5 * 1024 * 1024) { // 5MB
        throw new Error('响应内容过大')
      }

      return NextResponse.json({ text: result })
    } catch (error: any) {
      console.error('处理步骤错误:', error)
      if (error.name === 'AbortError' || error.message.includes('超时')) {
        return NextResponse.json(
          { error: '处理超时，请稍后重试' },
          { status: 503 }
        )
      }
      
      // 根据错误类型返回不同的状态码
      if (error.message.includes('文件大小超过限制') || error.message.includes('响应内容过大')) {
        return NextResponse.json(
          { error: error.message },
          { status: 413 }
        )
      }
      
      return NextResponse.json(
        { error: error.message || 'PDF处理失败' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('PDF处理错误:', error)
    return NextResponse.json(
      { error: error.message || 'PDF处理失败' },
      { status: error.status || 500 }
    )
  }
} 