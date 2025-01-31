import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const sql = neon(process.env.DATABASE_URL!)
  
  try {
    const { email, password, name } = await req.json()

    if (!email || !password) {
      return new NextResponse('Missing email or password', { status: 400 })
    }

    // 检查邮箱是否已被注册
    const existingUser = await sql`
      SELECT * FROM users WHERE email = ${email}
    `

    if (existingUser.length > 0) {
      return new NextResponse('Email already exists', { status: 400 })
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10)

    // 创建用户
    await sql`
      INSERT INTO users (email, password)
      VALUES (${email}, ${hashedPassword})
    `

    return new NextResponse('User created successfully', { status: 201 })
  } catch (error: any) {
    console.error('注册失败:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 