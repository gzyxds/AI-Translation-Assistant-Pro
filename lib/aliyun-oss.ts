"use client"

export async function uploadToOSS(file: File): Promise<string> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/aliyun/oss/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || '上传失败')
    }

    const result = await response.json()
    return result.url
  } catch (error: any) {
    console.error('阿里云OSS上传错误:', error)
    throw new Error(error.message || '文件上传失败')
  }
} 