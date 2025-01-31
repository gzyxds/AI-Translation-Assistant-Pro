import { NextResponse } from 'next/server'
import RPCClient from '@alicloud/pop-core'

interface VideoOCRResult {
  OcrResults?: Array<{
    DetailInfo: Array<{
      Text: string
      TimeStamp: number
    }>
    StartTime: number
    EndTime: number
  }>
  VideoOcrResults?: Array<{
    DetailInfo: Array<{
      Text: string
    }>
    StartTime: number
    EndTime: number
  }>
  SubtitlesResults?: Array<{
    SubtitlesAllResults?: Record<string, string>
    SubtitlesChineseResults?: Record<string, string>
    SubtitlesEnglishResults?: Record<string, string>
    SubtitlesAllResultsUrl?: string
    SubtitlesChineseResultsUrl?: string
    SubtitlesEnglishResultsUrl?: string
  }>
}

interface AsyncJobQueryResult {
  RequestId: string
  Data: {
    Status: string
    Result: string
    JobId: string
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { taskId } = body

    if (!taskId) {
      return NextResponse.json(
        { message: '缺少任务ID' },
        { status: 400 }
      )
    }

    // 创建视频识别客户端
    const client = new RPCClient({
      accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID || '',
      accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET || '',
      endpoint: 'https://videorecog.cn-shanghai.aliyuncs.com',
      apiVersion: '2020-03-20',
      opts: {
        method: 'POST',
        timeout: 60000
      }
    })

    try {
      // 查询任务结果
      console.log('开始查询任务结果, taskId:', taskId)
      const params = {
        JobId: taskId
      }

      // 发送请求
      const result = await client.request<AsyncJobQueryResult>('GetAsyncJobResult', params, {
        method: 'POST',
        formatParams: true,
        headers: {
          'content-type': 'application/x-www-form-urlencoded'
        }
      })
      
      console.log('原始查询结果:', JSON.stringify(result, null, 2))

      // 检查结果格式
      if (!result || !result.Data) {
        console.log('未获取到Data字段:', result)
        throw new Error('查询任务失败：未获取到任务结果')
      }

      console.log('任务状态:', result.Data.Status)

      // 处理不同的任务状态
      switch (result.Data.Status) {
        case 'PROCESS_RUNNING':
          console.log('任务正在处理中...')
          return NextResponse.json({
            success: true,
            status: 'running',
            message: '任务正在处理中'
          }, { status: 202 })

        case 'PROCESS_FAILED':
          console.log('任务处理失败:', result.Data)
          return NextResponse.json({
            success: false,
            status: 'failed',
            message: '任务处理失败',
            data: result.Data
          }, { status: 500 })

        case 'PROCESS_SUCCESS':
          console.log('任务处理成功，开始解析结果')
          let ocrResult: VideoOCRResult | null = null
          
          try {
            // 尝试解析结果
            if (result.Data.Result) {
              console.log('解析字符串结果:', result.Data.Result)
              if (typeof result.Data.Result === 'string') {
                ocrResult = JSON.parse(result.Data.Result)
              } else {
                ocrResult = result.Data.Result as VideoOCRResult
              }
            }

            // 提取所有文本内容
            const textContents: string[] = []
            
            // 处理 OcrResults
            if (ocrResult?.OcrResults) {
              ocrResult.OcrResults.forEach(result => {
                result.DetailInfo.forEach(detail => {
                  if (detail.Text) {
                    textContents.push(detail.Text)
                  }
                })
              })
            }

            // 处理 VideoOcrResults
            if (ocrResult?.VideoOcrResults) {
              ocrResult.VideoOcrResults.forEach(result => {
                result.DetailInfo.forEach(detail => {
                  if (detail.Text) {
                    textContents.push(detail.Text)
                  }
                })
              })
            }

            // 处理字幕结果
            if (ocrResult?.SubtitlesResults?.[0]) {
              const subtitles = ocrResult.SubtitlesResults[0]
              if (subtitles.SubtitlesChineseResults) {
                Object.values(subtitles.SubtitlesChineseResults).forEach(text => {
                  textContents.push(text)
                })
              }
              return NextResponse.json({
                success: true,
                status: 'success',
                data: {
                  text: textContents.join('\n'),
                  subtitles: {
                    all: subtitles.SubtitlesAllResults,
                    chinese: subtitles.SubtitlesChineseResults,
                    english: subtitles.SubtitlesEnglishResults,
                    allUrl: subtitles.SubtitlesAllResultsUrl,
                    chineseUrl: subtitles.SubtitlesChineseResultsUrl,
                    englishUrl: subtitles.SubtitlesEnglishResultsUrl
                  },
                  raw: ocrResult
                }
              })
            }

            // 如果没有字幕结果，返回文本内容
            return NextResponse.json({
              success: true,
              status: 'success',
              data: {
                text: textContents.join('\n'),
                raw: ocrResult
              }
            })

          } catch (e) {
            console.error('解析OCR结果失败:', e)
            console.log('返回原始结果')
            return NextResponse.json({
              success: true,
              status: 'success',
              data: {
                text: result.Data.Result,
                raw: result.Data.Result
              }
            })
          }

        case 'PROCESS_PENDING':
          console.log('任务等待处理中...')
          return NextResponse.json({
            success: true,
            status: 'pending',
            message: '任务等待处理中'
          }, { status: 202 })

        default:
          console.log('收到未知任务状态:', result.Data.Status, '完整结果:', result.Data)
          return NextResponse.json({
            success: true,
            status: result.Data.Status,
            message: '任务状态未知，请继续轮询',
            data: result.Data
          }, { status: 202 })
      }

    } catch (queryError: any) {
      console.error('查询任务错误详情:', {
        name: queryError.name,
        message: queryError.message,
        code: queryError.code,
        requestId: queryError.RequestId,
        stack: queryError.stack
      })
      throw new Error(`查询视频识别任务失败: ${queryError.message}`)
    }

  } catch (error: any) {
    console.error('处理请求错误:', error)
    return NextResponse.json(
      { message: error.message || '查询视频识别任务失败' },
      { status: 500 }
    )
  }
} 