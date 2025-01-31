"use client"

interface VideoOCRResponse {
  RequestId: string
  Data: {
    Status: string
    Results: Array<{
      Text: string
      Timestamp: number
    }>
  }
}

export async function extractVideoTextWithAliyun(videoUrl: string): Promise<string> {
  try {
    // 创建视频OCR任务
    const createResponse = await fetch('/api/aliyun/video-ocr/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoUrl,
      }),
    })

    if (!createResponse.ok) {
      const error = await createResponse.json()
      throw new Error(error.message || '创建视频识别任务失败')
    }

    const createData = await createResponse.json()
    const taskId = createData.TaskId

    // 轮询任务状态
    let result = ''
    while (true) {
      const statusResponse = await fetch('/api/aliyun/video-ocr/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
        }),
      })

      if (!statusResponse.ok) {
        const error = await statusResponse.json()
        throw new Error(error.message || '查询任务状态失败')
      }

      const statusData: VideoOCRResponse = await statusResponse.json()
      
      if (statusData.Data.Status === 'FAILED') {
        throw new Error('视频识别失败')
      }
      
      if (statusData.Data.Status === 'FINISHED') {
        // 按时间戳排序并合并文本
        const sortedResults = statusData.Data.Results.sort((a, b) => a.Timestamp - b.Timestamp)
        result = sortedResults.map(item => item.Text).join('\n')
        break
      }

      // 等待1秒后继续查询
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return result
  } catch (error: any) {
    console.error('阿里云视频OCR错误:', error)
    throw new Error(error.message || '视频识别失败')
  }
} 