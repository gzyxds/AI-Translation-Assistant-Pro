import { NextResponse } from 'next/server'
import OSS from 'ali-oss'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { message: '缺少文件' },
        { status: 400 }
      )
    }

    console.log('文件信息:', {
      name: file.name,
      type: file.type,
      size: file.size
    })

    // 创建 OSS 客户端
    const ossClient = new OSS({
      region: 'oss-cn-shanghai',
      accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID || '',
      accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET || '',
      bucket: process.env.ALIYUN_OSS_BUCKET || ''
    })

    try {
      // 将文件转换为 Buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // 上传到 OSS
      const ext = file.name.split('.').pop()
      const fileName = `videos/${uuidv4()}.${ext}`
      console.log('开始上传文件到 OSS...')
      
      // 使用 Promise 包装 put 方法
      const uploadResult = await new Promise((resolve, reject) => {
        try {
          // @ts-ignore
          ossClient.put(fileName, buffer).then(result => {
            resolve(result)
          }).catch(err => {
            reject(err)
          })
        } catch (err) {
          reject(err)
        }
      })

      console.log('文件上传成功:', uploadResult)

      return NextResponse.json({
        success: true,
        url: (uploadResult as any).url
      })
    } catch (uploadError: any) {
      console.error('OSS上传错误:', {
        name: uploadError.name,
        message: uploadError.message,
        code: uploadError.code,
        requestId: uploadError.requestId,
        stack: uploadError.stack
      })
      throw new Error(`文件上传失败: ${uploadError.message}`)
    }

  } catch (error: any) {
    console.error('处理请求错误:', error)
    return NextResponse.json(
      { message: error.message || '文件上传失败' },
      { status: 500 }
    )
  }
} 