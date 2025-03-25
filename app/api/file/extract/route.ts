import { NextResponse } from 'next/server'
import { Mistral } from '@mistralai/mistralai';

const KIMI_API_KEY = process.env.NEXT_PUBLIC_KIMI_API_KEY
const KIMI_API_URL = 'https://api.moonshot.cn/v1'
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY

// 增加超时时间
const TIMEOUT = {
  UPLOAD: 20000,    // 20秒
  CONTENT: 30000,   // 30秒
  PROCESS: 45000    // 45秒
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

// 使用 Mistral OCR API 处理 PDF
async function processPdfWithMistral(file: string, filename: string) {
  try {
    console.log('开始使用 Mistral OCR 处理 PDF...')
    
    // 创建 Mistral 客户端
    const client = new Mistral({ apiKey: MISTRAL_API_KEY || '' });
    
    // 将 base64 转换为 Buffer
    const fileBuffer = Buffer.from(file, 'base64');
    
    // 上传文件到 Mistral
    console.log('上传文件到 Mistral...')
    let uploadData;
    try {
      uploadData = await client.files.upload({
        file: {
          fileName: filename,
          content: fileBuffer,
        },
        purpose: "ocr"
      });
      console.log('文件上传成功，ID:', uploadData.id);
    } catch (uploadError: any) {
      console.error('Mistral 文件上传错误:', uploadError);
      throw new Error(uploadError.message || 'Mistral 文件上传失败');
    }
    
    // 获取签名 URL
    console.log('获取签名 URL...');
    let signedUrlData;
    try {
      signedUrlData = await client.files.getSignedUrl({
        fileId: uploadData.id,
      });
      console.log('获取签名 URL 成功');
    } catch (signedUrlError: any) {
      console.error('获取签名 URL 错误:', signedUrlError);
      throw new Error(signedUrlError.message || '获取签名 URL 失败');
    }
    
    // 使用 OCR 处理文件
    console.log('开始 OCR 处理...');
    let ocrData: any;
    try {
      ocrData = await client.ocr.process({
        model: "mistral-ocr-latest",
        document: {
          type: "document_url",
          documentUrl: signedUrlData.url,
        }
      });
      console.log('OCR 处理完成，响应数据类型:', typeof ocrData);
      if (typeof ocrData === 'object' && ocrData !== null) {
        console.log('OCR 响应数据结构:', Object.keys(ocrData).join(', '));
        // 输出更详细的响应结构
        for (const key of Object.keys(ocrData)) {
          console.log(`OCR 响应字段 ${key} 类型:`, typeof ocrData[key]);
          if (key === 'pages' && Array.isArray(ocrData.pages)) {
            console.log('pages 数组长度:', ocrData.pages.length);
            if (ocrData.pages.length > 0) {
              console.log('第一页结构:', Object.keys(ocrData.pages[0]).join(', '));
            }
          }
        }
      }
      console.log('OCR 响应数据片段:', typeof ocrData === 'string' ? ocrData.substring(0, 500) : JSON.stringify(ocrData).substring(0, 500) + '...');
    } catch (ocrError: any) {
      console.error('Mistral OCR 错误:', ocrError);
      throw new Error(ocrError.message || 'OCR 处理失败');
    }
    
    // 提取文本内容
    let extractedText = '';
    
    // 检查响应格式并记录详细信息
    if (!ocrData) {
      console.error('Mistral OCR 返回空响应');
      throw new Error('OCR 返回空响应');
    }
    
    // 处理 Markdown 格式的响应
    if (typeof ocrData === 'string') {
      console.log('OCR 返回 Markdown 格式的文本');
      // 直接返回 Markdown 文本，不需要额外处理
      return ocrData.trim();
    }
    
    // 检查响应对象中的各种可能字段
    if (ocrData.markdown) {
      console.log('从 markdown 字段提取文本');
      return String(ocrData.markdown).trim();
    }
    
    // 检查各种可能的文本字段
    if (ocrData.text) {
      console.log('从 text 字段提取文本');
      return String(ocrData.text).trim();
    }
    
    if (ocrData.content) {
      console.log('从 content 字段提取文本');
      return typeof ocrData.content === 'string' ? ocrData.content.trim() : JSON.stringify(ocrData.content);
    }
    
    // 检查是否有结果字段
    if (ocrData.result) {
      console.log('从 result 字段提取文本');
      if (typeof ocrData.result === 'string') {
        return ocrData.result.trim();
      } else if (typeof ocrData.result === 'object' && ocrData.result !== null) {
        // 检查result对象中的可能字段
        if (ocrData.result.text) {
          return String(ocrData.result.text).trim();
        } else if (ocrData.result.content) {
          return typeof ocrData.result.content === 'string' ? ocrData.result.content.trim() : JSON.stringify(ocrData.result.content);
        } else {
          return JSON.stringify(ocrData.result);
        }
      }
    }
    
    // 检查 ocrData 是否有 pages 属性
    if (ocrData.pages) {
      console.log(`发现 pages 字段，包含 ${Array.isArray(ocrData.pages) ? ocrData.pages.length : '未知数量'} 页`);
      
      // 正常处理 pages 数组
      if (Array.isArray(ocrData.pages)) {
        console.log(`提取 ${ocrData.pages.length} 页的文本`);
        
        extractedText = ocrData.pages.map((page: any, index: number) => {
          if (!page) {
            console.log(`第 ${index + 1} 页为空`);
            return '';
          }
          
          // 首先检查markdown字段，这是Mistral OCR的主要输出格式
          if (page.markdown) {
            console.log(`从第 ${index + 1} 页的markdown字段提取文本`);
            return page.markdown;
          } else if (page.text) {
            return page.text;
          } else if (page.content) {
            return typeof page.content === 'string' ? page.content : JSON.stringify(page.content);
          } else {
            console.log(`第 ${index + 1} 页没有文本内容:`, page);
            return '';
          }
        }).join('\n\n');
      } else {
        console.error('Mistral OCR 响应中 pages 不是数组:', ocrData.pages);
        // 尝试将 pages 作为文本返回
        if (typeof ocrData.pages === 'string') {
          return ocrData.pages.trim();
        } else {
          return JSON.stringify(ocrData.pages);
        }
      }
    } else {
      console.log('OCR 响应中没有找到 pages 字段，尝试从整个响应中提取文本');
      // 如果找不到任何已知字段，尝试将整个响应作为文本返回
      return JSON.stringify(ocrData);
    }
    
    console.log(`提取的文本长度: ${extractedText.length} 字符`);
    
    // 确保返回非空文本
    if (!extractedText || extractedText.trim() === '') {
      console.log('提取的文本为空，返回默认消息');
      return '无法从PDF中提取文本。这可能是因为PDF包含扫描图像或其他不可提取的内容。请尝试使用其他服务或上传不同的文件。';
    }
    
    return extractedText.trim();
  } catch (error: any) {
    console.error('Mistral OCR 处理错误:', error);
    if (error.name === 'AbortError') {
      throw new Error('Mistral OCR 处理超时');
    }
    throw error;
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

    if (service !== 'kimi' && service !== 'mistral') {
      return NextResponse.json(
        { error: '不支持的服务' },
        { status: 400 }
      )
    }

    if (service === 'kimi' && !KIMI_API_KEY) {
      return NextResponse.json(
        { error: '未配置Kimi API密钥' },
        { status: 500 }
      )
    }

    if (service === 'mistral' && !MISTRAL_API_KEY) {
      return NextResponse.json(
        { error: '未配置Mistral API密钥' },
        { status: 500 }
      )
    }

    // 分步处理
    try {
      let result = ''
      
      if (service === 'kimi') {
        // 使用 Kimi API 处理
        console.log('开始使用 Kimi API 处理...')
        // 步骤1：上传文件
        console.log('开始上传文件...')
        const fileObject = await uploadFile(file, filename)
        
        // 步骤2：获取文件内容
        console.log('开始获取文件内容...')
        const fileContent = await getFileContent(fileObject.id)
        
        // 步骤3：处理内容
        console.log('开始处理文件内容...')
        result = await processContent(fileContent)
      } else if (service === 'mistral') {
        // 使用 Mistral OCR API 处理
        console.log('开始使用 Mistral OCR API 处理...')
        result = await processPdfWithMistral(file, filename)
      }

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