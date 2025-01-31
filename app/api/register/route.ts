import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'

const sql = neon(process.env.DATABASE_URL!)

export async function POST(req: Request) {
  try {
    console.log('开始处理注册请求')
    const { email, password } = await req.json()
    console.log('收到注册数据:', { email, hasPassword: !!password })

    // 验证输入
    if (!email || !password) {
      console.log('输入验证失败')
      return NextResponse.json(
        { error: '请输入邮箱和密码' },
        { status: 400 }
      )
    }

    // 检查邮箱是否已存在
    console.log('检查邮箱是否存在:', email)
    const existingUser = await sql`
      SELECT id FROM auth_users WHERE email = ${email}
    `
    console.log('查询结果:', existingUser)
    
    if (existingUser.length > 0) {
      console.log('邮箱已存在')
      return NextResponse.json(
        { error: '该邮箱已被注册' },
        { status: 400 }
      )
    }

    // 加密密码
    console.log('开始加密密码')
    const hashedPassword = await bcrypt.hash(password, 10)

    // 创建用户
    console.log('开始创建用户')
    const result = await sql`
      INSERT INTO auth_users (
        email, 
        password_hash,
        text_quota,
        image_quota,
        pdf_quota,
        speech_quota,
        video_quota
      )
      VALUES (
        ${email}, 
        ${hashedPassword},
        -1,
        10,
        8,
        5,
        2
      )
      RETURNING *
    `
    console.log('创建的用户数据:', result[0])

    return NextResponse.json(
      { 
        message: '注册成功',
        user: {
          id: result[0].id,
          email: result[0].email
        }
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('注册错误:', error)
    console.error('错误堆栈:', error.stack)
    return NextResponse.json(
      { error: error.message || '注册失败' },
      { status: 500 }
    )
  }
} 