import { NextResponse } from 'next/server'
import RPCClient from '@alicloud/pop-core'

interface AsyncJobResult {
  RequestId: string
  Message: string
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { videoUrl } = body

    if (!videoUrl) {
      return NextResponse.json(
        { message: '缺少视频URL' },
        { status: 400 }
      )
    }

    // 创建视频识别客户端
    const client = new RPCClient({
      accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID || '',
      accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET || '',
      endpoint: 'https://videorecog.cn-shanghai.aliyuncs.com',
      apiVersion: '2020-03-20'
    })

    try {
      // 创建视频识别任务
      console.log('开始创建视频识别任务...')
      const params = {
        VideoUrl: videoUrl,
        Params: JSON.stringify([{
          Type: 'subtitles'
        }])
      }

      // 发送请求
      const result = await client.request<AsyncJobResult>('RecognizeVideoCastCrewList', params, {
        method: 'POST',
        formatParams: false,
        headers: {
          'content-type': 'application/json'
        }
      })
      
      console.log('创建任务结果:', result)

      if (!result.RequestId) {
        throw new Error('创建任务失败：未获取到任务ID')
      }

      return NextResponse.json({
        success: true,
        taskId: result.RequestId,
        message: result.Message
      })
    } catch (createError: any) {
      console.error('创建任务错误详情:', {
        name: createError.name,
        message: createError.message,
        code: createError.code,
        requestId: createError.RequestId,
        stack: createError.stack
      })
      throw new Error(`创建视频识别任务失败: ${createError.message}`)
    }

  } catch (error: any) {
    console.error('处理请求错误:', error)
    return NextResponse.json(
      { message: error.message || '创建视频识别任务失败' },
      { status: 500 }
    )
  }
} 