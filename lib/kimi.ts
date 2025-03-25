import { encode } from 'base64-arraybuffer'

// 图片文字识别函数
export async function extractTextWithKimi(image: string): Promise<string> {
  try {
    // 确保图片数据格式正确
    let imageData = image;
    if (!image.includes(';base64,')) {
      // 如果是纯base64字符串，添加正确的MIME类型前缀
      if (image.startsWith('/9j/')) {
        imageData = `data:image/jpeg;base64,${image}`;
      } else if (image.startsWith('iVBOR')) {
        imageData = `data:image/png;base64,${image}`;
      } else {
        // 默认假设为JPEG
        imageData = `data:image/jpeg;base64,${image}`;
      }
    }

    const response = await fetch('/api/ocr/kimi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: imageData }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Kimi OCR error response:', errorData);
      throw new Error(`OCR request failed: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    return data.text;
  } catch (error: any) {
    console.error('Error extracting text with Kimi:', error);
    throw error;
  }
}

// 重试函数
async function retryWithDelay<T>(
  fn: () => Promise<T>,
  retries = 5,
  delay = 2000,
  backoff = 1.5,
  onRetry?: (retriesLeft: number, error: Error) => void
): Promise<T> {
  try {
    return await fn()
  } catch (error: any) {
    if (retries === 0 || error.message.includes('API密钥') || error.message.includes('大小超过限制')) {
      throw error
    }
    
    if (onRetry) {
      onRetry(retries, error)
    }
    await new Promise(resolve => setTimeout(resolve, delay))
    return retryWithDelay(fn, retries - 1, delay * backoff, backoff, onRetry)
  }
}

// 通用PDF处理函数，支持选择服务商
export async function extractPDFContent(
  file: File,
  service: 'kimi' | 'mistral' = 'mistral', // 默认使用Mistral OCR
  onProgress?: (status: string) => void
): Promise<string> {
  try {
    // 检查文件大小（限制为5MB，适应服务器限制）
    const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('文件大小不能超过5MB')
    }

    // 检查文件类型
    if (!file.type.includes('pdf')) {
      throw new Error('请上传PDF文件')
    }

    // 压缩和转换文件
    const compressedFile = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        try {
          const base64 = reader.result as string
          const base64Data = base64.split(',')[1]
          // 如果base64字符串太长，可能需要分片处理
          if (base64Data.length > 5 * 1024 * 1024) { // 5MB in base64
            reject(new Error('文件太大，请上传更小的文件'))
            return
          }
          resolve(base64Data)
        } catch (err) {
          reject(new Error('文件处理失败'))
        }
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsDataURL(file)
    })

    // 使用重试机制发送请求
    return await retryWithDelay(
      async () => {
        if (onProgress) {
          onProgress(`正在使用${service === 'mistral' ? 'Mistral OCR' : 'Kimi'}处理文件...`)
        }

        const response = await fetch('/api/file/extract', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file: compressedFile,
            filename: file.name,
            service: service
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          if (response.status === 503) {
            throw new Error(error.error || '服务暂时不可用，正在重试...')
          }
          throw new Error(error.error || '文件处理失败')
        }

        const data = await response.json()
        
        // 增强对 API 响应的处理
        if (!data.text || data.text.trim() === '') {
          console.warn('API 返回的数据中没有有效的 text 字段:', data)
          
          // 尝试从其他可能的字段中获取文本
          if (data.content) {
            return typeof data.content === 'string' ? data.content : JSON.stringify(data.content)
          }
          
          if (data.result) {
            return typeof data.result === 'string' ? data.result : JSON.stringify(data.result)
          }
          
          if (data.extracted_text) {
            return data.extracted_text
          }
          
          // 如果找不到任何文本内容，返回一个友好的错误消息
          return '无法从文件中提取文本。请尝试使用其他服务或上传不同的文件。'
        }

        return data.text
      },
      2, // 减少重试次数从 5 次改为 2 次
      3000, // 增加初始延迟时间，从 2000 改为 3000
      1.5,
      (retriesLeft, error) => {
        if (onProgress) {
          if (error.message.includes('上传超时')) {
            onProgress(`文件上传超时，正在重试...（剩余${retriesLeft}次）`)
          } else if (error.message.includes('内容获取超时')) {
            onProgress(`文件内容获取超时，正在重试...（剩余${retriesLeft}次）`)
          } else if (error.message.includes('处理超时')) {
            onProgress(`内容处理超时，正在重试...（剩余${retriesLeft}次）`)
          } else {
            onProgress(`处理失败，正在重试...（剩余${retriesLeft}次）`)
          }
        }
      }
    )
  } catch (error: any) {
    console.error('文件处理错误:', error)
    throw error
  }
}

// 保留原有函数以保持兼容性
export async function extractPDFWithKimi(
  file: File,
  onProgress?: (status: string) => void
): Promise<string> {
  return extractPDFContent(file, 'kimi', onProgress)
}